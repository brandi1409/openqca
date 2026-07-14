"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

type AssistTask = "anchors" | "skew" | "methods";

/**
 * KI-Assistent-Schaltfläche. Ruft /api/ai/assist. Ohne konfigurierten Schlüssel
 * antwortet die Route mit 501 → hier als „Cloud-Tarif"-Hinweis dargestellt.
 */
export function AiAssist({
  task,
  label,
  getData,
  needsContext,
}: {
  task: AssistTask;
  label: string;
  getData: () => Record<string, unknown>;
  needsContext?: boolean;
}) {
  const [locale] = useLocale();
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setResult(null);
    setNote(null);
    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, context, data: getData() }),
      });
      const json = await res.json();
      if (res.ok) setResult(json.text as string);
      else setNote((json.error as string) ?? t(locale, "ai.unavailable"));
    } catch {
      setNote(t(locale, "ai.networkError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      {needsContext && (
        <input
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={t(locale, "ai.contextPlaceholder")}
          style={{
            width: "100%",
            font: "inherit",
            fontSize: 13,
            border: "1px solid var(--line)",
            borderRadius: 7,
            padding: "6px 9px",
            background: "var(--panel-2)",
            color: "var(--ink)",
            marginBottom: 6,
          }}
        />
      )}
      <button
        onClick={run}
        disabled={busy}
        style={{
          font: "inherit",
          fontSize: 13,
          fontWeight: 600,
          borderRadius: 8,
          padding: "7px 12px",
          cursor: busy ? "default" : "pointer",
          border: "1px solid color-mix(in srgb, #6a4bd6 30%, transparent)",
          background: "color-mix(in srgb, #6a4bd6 8%, transparent)",
          color: "var(--ink)",
        }}
      >
        ✦ {busy ? "…" : label}
      </button>
      {note && (
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 0" }}>{note}</p>
      )}
      {result && (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--ink-2)",
            background: "var(--panel-2)",
            border: "1px solid var(--line)",
            borderLeft: "3px solid #6a4bd6",
            borderRadius: 8,
            padding: "11px 13px",
            whiteSpace: "pre-wrap",
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}
