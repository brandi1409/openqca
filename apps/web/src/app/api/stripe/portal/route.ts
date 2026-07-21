import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceSupabase } from "@/lib/supabase";
import { siteUrl } from "@/lib/config";

export const runtime = "nodejs";

const SECRET = process.env.STRIPE_SECRET_KEY ?? "";

/** Liest den Supabase-Access-Token aus dem Authorization-Header und prüft ihn per Service-Client. */
async function requireUser(request: Request) {
  const serviceClient = getServiceSupabase();
  if (!serviceClient) {
    return {
      error: NextResponse.json({ error: "Cloud ist nicht konfiguriert." }, { status: 501 }),
    } as const;
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const { data, error } = await serviceClient.auth.getUser(token);
  if (error || !data.user) {
    return {
      error: NextResponse.json({ error: "Bitte anmelden." }, { status: 401 }),
    } as const;
  }
  return { serviceClient, user: data.user } as const;
}

export async function POST(request: Request) {
  if (!SECRET) {
    return NextResponse.json(
      { error: "Zahlungen gehören zum Cloud-Tarif und sind ohne Stripe-Schlüssel deaktiviert." },
      { status: 501 },
    );
  }

  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { serviceClient, user } = auth;

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Kein aktives Abo gefunden." }, { status: 404 });
  }

  try {
    const stripe = new Stripe(SECRET);
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/konto`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: `Portal-Aufruf fehlgeschlagen: ${detail}` }, { status: 502 });
  }
}
