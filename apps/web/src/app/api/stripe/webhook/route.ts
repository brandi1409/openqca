import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const SECRET = process.env.STRIPE_SECRET_KEY ?? "";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(request: Request) {
  if (!SECRET || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe-Webhook ist nicht konfiguriert." }, { status: 501 });
  }
  const signature = request.headers.get("stripe-signature") ?? "";
  const raw = await request.text();
  const stripe = new Stripe(SECRET);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Ungültige Webhook-Signatur." }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Tarif in profiles setzen (best effort — nur wenn Supabase-Service-Role vorhanden).
  if (supabase) {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId) {
        await supabase
          .from("profiles")
          .update({ tier: "cloud", stripe_customer_id: String(session.customer ?? "") })
          .eq("user_id", userId);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from("profiles").update({ tier: "free" }).eq("stripe_customer_id", String(sub.customer));
    }
  }

  return NextResponse.json({ received: true });
}
