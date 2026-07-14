"use client";

import { useState } from "react";
import { generateReportHtml, type ReportInput } from "@/lib/report";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

export function ReportButton({ getInput }: { getInput: () => ReportInput | null }) {
  const [locale] = useLocale();
  const [msg, setMsg] = useState<string | null>(null);

  function handleClick() {
    const input = getInput();
    if (!input) {
      setMsg(t(locale, "report.missingData"));
      return;
    }
    setMsg(null);
    const html = generateReportHtml(input);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <button
        onClick={handleClick}
        style={{
          font: "inherit",
          fontWeight: 600,
          fontSize: 14,
          borderRadius: 7,
          padding: "7px 15px",
          cursor: "pointer",
          border: "1px solid var(--line)",
          background: "var(--panel)",
          color: "var(--ink)",
        }}
      >
        {t(locale, "report.generateBtn")}
      </button>
      {msg && <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{msg}</span>}
    </div>
  );
}
