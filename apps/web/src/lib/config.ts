/**
 * Zentrale Konfiguration & Feature-Flags. Ohne echte Env-Variablen sind
 * Cloud/KI/Zahlungen abgeschaltet — die App läuft dann rein local-first.
 * NEXT_PUBLIC_*-Werte werden von Next beim Build eingesetzt.
 */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const cloudEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
export const stripeEnabledClient = Boolean(stripePublishableKey);

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** KI-Modelle: Haiku für leichte Helfer, Sonnet für Textgenerierung. */
export const AI_MODELS = {
  light: "claude-haiku-4-5",
  writing: "claude-sonnet-5",
} as const;
