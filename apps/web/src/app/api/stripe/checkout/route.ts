import { NextResponse } from "next/server";
import Stripe from "stripe";
import { siteUrl } from "@/lib/config";

export const runtime = "nodejs";

const SECRET = process.env.STRIPE_SECRET_KEY ?? "";

export async function POST(request: Request) {
  if (!SECRET) {
    return NextResponse.json(
      { error: "Zahlungen gehören zum Cloud-Tarif und sind ohne Stripe-Schlüssel deaktiviert." },
      { status: 501 },
    );
  }
  const { plan, userId, email } = (await request.json().catch(() => ({}))) as {
    plan?: "monthly" | "institution";
    userId?: string;
    email?: string;
  };
  const priceId =
    plan === "institution" ? process.env.STRIPE_PRICE_INSTITUTION : process.env.STRIPE_PRICE_MONTHLY;
  if (!priceId) {
    return NextResponse.json({ error: "Für diesen Tarif ist keine Preis-ID konfiguriert." }, { status: 501 });
  }

  try {
    const stripe = new Stripe(SECRET);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      customer_email: email,
      success_url: `${siteUrl}/konto?checkout=success`,
      cancel_url: `${siteUrl}/preise?checkout=cancel`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: `Checkout fehlgeschlagen: ${detail}` }, { status: 502 });
  }
}
