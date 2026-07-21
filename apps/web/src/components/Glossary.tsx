"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";

const TERMS: { term: DictKey; def: DictKey }[] = [
  { term: "gloss.set.term", def: "gloss.set.def" },
  { term: "gloss.membership.term", def: "gloss.membership.def" },
  { term: "gloss.crispFuzzy.term", def: "gloss.crispFuzzy.def" },
  { term: "gloss.calibration.term", def: "gloss.calibration.def" },
  { term: "gloss.consistency.term", def: "gloss.consistency.def" },
  { term: "gloss.coverage.term", def: "gloss.coverage.def" },
];

/**
 * Schmale, aufklappbare Grundbegriffe-Leiste für Erstnutzer ohne QCA-Vorwissen:
 * sechs zentrale Begriffe (Set, Zugehörigkeit, Crisp/Fuzzy, Kalibrierung,
 * Konsistenz, Coverage), je ein einfacher erklärender Satz. Nur sichtbar, wenn
 * ein Datensatz geladen ist (wird in page.tsx bedingt gerendert).
 */
export function Glossary() {
  const [locale] = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: "var(--panel-2)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <button
        type="button"
        className="oq-btn oq-btn--quiet"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 13.5,
          textAlign: "left",
        }}
      >
        <span>{t(locale, "gloss.toggle")}</span>
        <span aria-hidden style={{ color: "var(--muted)", fontSize: 12 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px" }}>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "10px 20px",
              margin: 0,
            }}
          >
            {TERMS.map(({ term, def }) => (
              <div key={term}>
                <dt style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)", margin: 0 }}>
                  {t(locale, term)}
                </dt>
                <dd style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "2px 0 0" }}>
                  {t(locale, def)}
                </dd>
              </div>
            ))}
          </dl>
          <div style={{ marginTop: 12 }}>
            <a
              href="/methodik"
              style={{
                fontSize: 13.5,
                color: "var(--accent-deep)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {t(locale, "gloss.moreLink")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
