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
  const toggleLabel = t(locale, "gloss.toggle").replace(/^[^\p{L}\p{N}]+/u, "");

  return (
    <div className="oq-glossary">
      <button
        type="button"
        className="oq-btn oq-btn--quiet oq-glossary__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{toggleLabel}</span>
        <span aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="oq-glossary__content">
          <dl className="oq-glossary__terms">
            {TERMS.map(({ term, def }) => (
              <div key={term}>
                <dt>{t(locale, term)}</dt>
                <dd>{t(locale, def)}</dd>
              </div>
            ))}
          </dl>
          <a href="/methodik" className="oq-glossary__more">
            {t(locale, "gloss.moreLink")}
          </a>
        </div>
      )}
    </div>
  );
}
