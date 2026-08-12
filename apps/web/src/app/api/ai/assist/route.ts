import { NextResponse } from "next/server";
import { aiProviderAvailable, completeAi } from "@/lib/ai-provider";
import { AI_CONTRACT_VERSION, parseAiAssistRequest } from "@/lib/ai-contract";
import { recordAiRequest } from "@/lib/ai-telemetry";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
const REQUIRE_CLOUD_TIER = process.env.AI_REQUIRE_CLOUD_TIER !== "false";
const WINDOW_MS = 60_000;
const MAX_BODY_BYTES = positiveInt(process.env.AI_REQUEST_BODY_BYTES, 12_000);
const MAX_PREAUTH_REQUESTS = positiveInt(process.env.AI_PREAUTH_RATE_LIMIT, 20);
const MAX_USER_REQUESTS = positiveInt(process.env.AI_USER_RATE_LIMIT, 6);
const MAX_CONCURRENT = positiveInt(process.env.AI_MAX_CONCURRENT, 2);

type Locale = "de" | "en";
type RequestEntry = { started: number[]; active: number };
const preauthRequests = new Map<string, number[]>();
const userRequests = new Map<string, RequestEntry>();

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function message(locale: Locale, code: string): string {
  const de: Record<string, string> = {
    invalid_request: "Diese KI-Anfrage entspricht nicht dem geprüften Aufgabenvertrag.",
    disabled: "KI ist auf dieser Instanz nicht konfiguriert.",
    auth_required: "Bitte anmelden. Die KI-Helfer gehören zum Cloud-Tarif.",
    plan_required: "Die KI-Helfer gehören zum Cloud-Tarif.",
    rate_limited: "Zu viele KI-Anfragen. Bitte kurz warten.",
    unavailable: "Der KI-Anbieter ist vorübergehend nicht erreichbar.",
    invalid_response: "Der KI-Anbieter hat kein prüfbares strukturiertes Ergebnis geliefert.",
  };
  const en: Record<string, string> = {
    invalid_request: "This AI request does not match the reviewed task contract.",
    disabled: "AI is not configured on this instance.",
    auth_required: "Please sign in. AI assistance is part of the Cloud plan.",
    plan_required: "AI assistance is part of the Cloud plan.",
    rate_limited: "Too many AI requests. Please wait briefly.",
    unavailable: "The AI provider is temporarily unavailable.",
    invalid_response: "The AI provider did not return a reviewable structured result.",
  };
  return (locale === "en" ? en : de)[code] ?? (locale === "en" ? en.unavailable : de.unavailable);
}

function error(locale: Locale, code: string, status: number) {
  return NextResponse.json({ error: { code, message: message(locale, code) } }, { status });
}

function requestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || "unknown";
}

function sweep(now: number): void {
  for (const [id, times] of preauthRequests) {
    const current = times.filter((time) => now - time < WINDOW_MS);
    if (current.length === 0) preauthRequests.delete(id);
    else preauthRequests.set(id, current);
  }
  for (const [id, entry] of userRequests) {
    entry.started = entry.started.filter((time) => now - time < WINDOW_MS);
    if (entry.started.length === 0 && entry.active === 0) userRequests.delete(id);
  }
}

function admitPreauth(id: string, now: number): boolean {
  const started = (preauthRequests.get(id) ?? []).filter((time) => now - time < WINDOW_MS);
  if (started.length >= MAX_PREAUTH_REQUESTS) return false;
  started.push(now);
  preauthRequests.set(id, started);
  return true;
}

async function readBoundedBody(request: Request): Promise<unknown> {
  const declaredLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return null;
  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function rawLocale(raw: unknown): Locale {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return "de";
  return (raw as Record<string, unknown>).locale === "en" ? "en" : "de";
}

async function authorize(request: Request, locale: Locale): Promise<{ id: string } | NextResponse> {
  if (!REQUIRE_CLOUD_TIER) return { id: requestIp(request) };
  const serviceClient = getServiceSupabase();
  if (!serviceClient) return error(locale, "disabled", 501);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const { data, error: authError } = await serviceClient.auth.getUser(token);
  if (authError || !data.user) return error(locale, "auth_required", 401);
  const { data: profile } = await serviceClient.from("profiles").select("tier").eq("user_id", data.user.id).single();
  if (profile?.tier !== "cloud") return error(locale, "plan_required", 402);
  return { id: data.user.id };
}

function isResponse(value: { id: string } | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}

export async function POST(request: Request) {
  const now = Date.now();
  sweep(now);
  if (!admitPreauth(requestIp(request), now)) return error("de", "rate_limited", 429);

  const raw = await readBoundedBody(request);
  const locale = rawLocale(raw);
  const body = parseAiAssistRequest(raw);
  if (!body) return error(locale, "invalid_request", 400);
  if (!aiProviderAvailable()) {
    recordAiRequest(body.task, "disabled", now);
    return error(locale, "disabled", 501);
  }

  const auth = await authorize(request, locale);
  if (isResponse(auth)) return auth;
  const entry = userRequests.get(auth.id) ?? { started: [], active: 0 };
  entry.started = entry.started.filter((time) => now - time < WINDOW_MS);
  if (entry.started.length >= MAX_USER_REQUESTS || entry.active >= MAX_CONCURRENT) {
    recordAiRequest(body.task, "rate_limited", now);
    return error(locale, "rate_limited", 429);
  }
  entry.started.push(now);
  entry.active += 1;
  userRequests.set(auth.id, entry);

  try {
    const result = await completeAi(body);
    recordAiRequest(body.task, "returned", now);
    return NextResponse.json({
      version: AI_CONTRACT_VERSION,
      ...result,
      generatedAt: new Date().toISOString(),
    });
  } catch (cause) {
    const code = cause instanceof Error && (cause.message === "AI_UNSTRUCTURED" || cause.message === "AI_POLICY_VIOLATION") ? "invalid_response" : "unavailable";
    recordAiRequest(body.task, code, now);
    return error(locale, code, 502);
  } finally {
    entry.active -= 1;
  }
}
