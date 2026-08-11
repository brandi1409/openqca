"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale";
import { getSupabase } from "@/lib/supabase";
import { isAdoptableDraft, reviewedPayloadPreview } from "@/lib/ai-reviewed-summary";
import { parseAiAssistRequest, parseReviewedSummary, type AiAssistRequest, type ReviewedSummary } from "@/lib/ai-contract";

type Result = { summary: ReviewedSummary; model: string; provider: string };
function copy(locale: "de" | "en") { return locale === "en" ? {
  review: "Review the exact payload before sending. No data leaves this device until you explicitly send it.", preview: "Reviewed payload", send: "Send reviewed payload", busy: "Requesting structured review…", adopt: "Use draft in this field", status: "Status", uncertainty: "Uncertainty", evidence: "Evidence needed", limitations: "Limitations", provider: "Provider", network: "The request could not be sent.", invalid: "The service returned an invalid response.", missing: "Complete every required field and keep each entry within 2,000 characters before preparing an AI review.",
} : {
  review: "Prüfen Sie die exakte Nutzlast vor dem Senden. Erst der ausdrückliche Versand verlässt dieses Gerät.", preview: "Geprüfte Nutzlast", send: "Geprüfte Nutzlast senden", busy: "Strukturierte Prüfung wird angefordert…", adopt: "Entwurf in dieses Feld übernehmen", status: "Status", uncertainty: "Unsicherheit", evidence: "Benötigte Evidenz", limitations: "Grenzen", provider: "Anbieter", network: "Die Anfrage konnte nicht gesendet werden.", invalid: "Der Dienst hat keine gültige Antwort geliefert.", missing: "Füllen Sie alle erforderlichen Felder aus und begrenzen Sie jeden Eintrag auf 2.000 Zeichen, bevor Sie eine KI-Prüfung vorbereiten.",
}; }
function list(items: string[]) { return <ul>{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>; }

export function AiAssist({ request, label, onAdopt }: { request: () => AiAssistRequest; label: string; onAdopt?: (draft: string) => void }) {
  const [locale] = useLocale(); const text = copy(locale);
  const [prepared, setPrepared] = useState<AiAssistRequest | null>(null);
  const [busy, setBusy] = useState(false); const [result, setResult] = useState<Result | null>(null); const [note, setNote] = useState<string | null>(null); const [invalidPayload, setInvalidPayload] = useState(false);
  function prepare() {
    const candidate = parseAiAssistRequest(request());
    setResult(null);
    if (!candidate) {
      setPrepared(null);
      setNote(null);
      setInvalidPayload(true);
      return;
    }
    setPrepared(candidate);
    setNote(null);
    setInvalidPayload(false);
  }
  async function send() {
    if (!prepared) return; setBusy(true); setResult(null); setNote(null);
    try {
      const sb = getSupabase(); const { data } = (await sb?.auth.getSession()) ?? { data: null };
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (data?.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
      const response = await fetch("/api/ai/assist", { method: "POST", headers, body: JSON.stringify(prepared) });
      const json = await response.json().catch(() => null) as { summary?: unknown; model?: unknown; provider?: unknown; error?: { message?: unknown } } | null;
      const summary = parseReviewedSummary(json?.summary);
      if (response.ok && summary && typeof json?.model === "string" && typeof json.provider === "string") setResult({ summary, model: json.model, provider: json.provider });
      else setNote(typeof json?.error?.message === "string" ? json.error.message : text.invalid);
    } catch { setNote(text.network); } finally { setBusy(false); }
  }
  const status = result?.summary.status === "ok" ? (locale === "en" ? "ready for review" : "zur Prüfung bereit") : result?.summary.status === "incomplete" ? (locale === "en" ? "incomplete" : "unvollständig") : (locale === "en" ? "refused" : "abgelehnt");
  return <section className="oq-ai-assist" aria-label={label}>
    <button type="button" className="oq-btn oq-ai-assist__trigger" onClick={prepare} disabled={busy}>{label}</button>
    {prepared && <div className="oq-ai-assist__preview"><strong>{text.preview}</strong><p>{text.review}</p><dl>{reviewedPayloadPreview(prepared).map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl><button type="button" className="oq-btn oq-btn--primary" onClick={() => void send()} disabled={busy}>{busy ? text.busy : text.send}</button></div>}
    <p className="oq-ai-assist__note" role="status" aria-live="polite">{invalidPayload ? text.missing : note}</p>
    {result && <div className="oq-ai-assist__result"><p><strong>{text.status}:</strong> {status}</p>{result.summary.draft && <div className="oq-ai-assist__text">{result.summary.draft}</div>}{result.summary.uncertainty.length > 0 && <><strong>{text.uncertainty}</strong>{list(result.summary.uncertainty)}</>}{result.summary.evidenceNeeds.length > 0 && <><strong>{text.evidence}</strong>{list(result.summary.evidenceNeeds)}</>}{result.summary.limitations.length > 0 && <><strong>{text.limitations}</strong>{list(result.summary.limitations)}</>}<p><strong>{text.provider}:</strong> {result.provider} · {result.model}</p>{onAdopt && isAdoptableDraft(result.summary) && <button type="button" className="oq-btn" onClick={() => onAdopt(result.summary.draft)}>{text.adopt}</button>}</div>}
  </section>;
}
