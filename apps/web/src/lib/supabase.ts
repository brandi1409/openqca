import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey, cloudEnabled } from "./config";

let browserClient: SupabaseClient | null = null;

/** Browser-Client (nur wenn Cloud konfiguriert ist), sonst null → local-first. */
export function getSupabase(): SupabaseClient | null {
  if (!cloudEnabled) return null;
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return browserClient;
}

/** Server-Client mit Service-Role (nur in Route-Handlern verwenden, nie im Browser). */
export function getServiceSupabase(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
