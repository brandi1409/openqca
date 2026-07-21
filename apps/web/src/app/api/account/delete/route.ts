import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

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
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const { serviceClient, user } = auth;

  try {
    // Projekte und Profil werden per ON DELETE CASCADE mitgelöscht.
    const { error } = await serviceClient.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: `Kontolöschung fehlgeschlagen: ${detail}` }, { status: 502 });
  }
}
