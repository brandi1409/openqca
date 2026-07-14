"use client";

import { useState } from "react";
import { parseCsv } from "@/lib/csv";
import type { RawDataset } from "@/lib/demo";
import { useLocale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";

/**
 * Inline eingebettete Beispiel-Datensätze. Die App-Komponenten können zur
 * Laufzeit nicht auf den datasets/-Ordner zugreifen, daher liegt der echte
 * CSV-Inhalt hier als String-Konstante vor (1:1 aus datasets/*.csv kopiert).
 */
const ROHWERTE_CSV = `Fall,BIP_pKopf,URBANISIERUNG,ALPHABETISIERUNG,INDUSTRIEANTEIL,DEMOKRATIE_INDEX
Nordheim,1150,78,98,62,88
Westalia,1050,72,96,58,82
Kuestenland,980,68,94,55,79
Seeland,900,65,92,50,75
Alpenstaat,850,60,90,48,72
Inselstaat,760,62,85,47,70
Flusstal,700,55,82,45,68
Ebenland,620,50,78,42,60
Mittelreich,820,58,88,52,40
Ostmark,500,42,70,35,55
Bergland,480,38,65,32,48
Huegelland,420,35,60,30,35
Waldenburg,350,30,50,25,30
Sudland,320,28,45,22,25
Steppenland,280,22,38,18,18
Marschland,260,20,35,15,20
`;

const FUZZY_CSV = `Fall,WOHLSTAND,BILDUNG,STAATSKAPAZITAET,DEMOKRATIE
Fall_01,0.90,0.80,0.20,0.85
Fall_02,0.80,0.90,0.10,0.90
Fall_03,0.70,0.70,0.30,0.75
Fall_04,0.20,0.30,0.90,0.90
Fall_05,0.10,0.20,0.80,0.85
Fall_06,0.30,0.10,0.70,0.72
Fall_07,0.90,0.90,0.80,0.95
Fall_08,0.20,0.20,0.20,0.15
Fall_09,0.10,0.30,0.10,0.10
Fall_10,0.80,0.20,0.30,0.25
Fall_11,0.30,0.80,0.20,0.30
Fall_12,0.70,0.30,0.20,0.35
Fall_13,0.60,0.70,0.40,0.65
Fall_14,0.40,0.40,0.60,0.62
`;

const CRISP_CSV = `Fall,FOERDERUNG,TEAM,MARKT,KONKURRENZ,ERFOLG
Start_01,1,1,0,0,1
Start_02,1,1,1,0,1
Start_03,1,1,0,1,1
Start_04,1,0,1,0,1
Start_05,0,1,1,0,1
Start_06,0,0,1,0,1
Start_07,1,0,1,1,0
Start_08,0,0,1,1,0
Start_09,1,0,0,0,0
Start_10,0,1,0,0,0
Start_11,0,0,0,0,0
Start_12,0,0,0,1,0
Start_13,0,1,0,1,0
Start_14,1,0,0,1,0
`;

interface ExampleEntry {
  /** Dateiname, wird als Datensatz-Name an parseCsv übergeben. */
  file: string;
  /** dict-Schlüssel für den Anzeigenamen der Karte. */
  titleKey: DictKey;
  /** dict-Schlüssel für das Kurz-Etikett der Set-Art. */
  badgeKey: DictKey;
  /** dict-Schlüssel für die Ein-Zeilen-Beschreibung. */
  descKey: DictKey;
  /** Roher CSV-Inhalt. */
  csv: string;
}

const EXAMPLES: readonly ExampleEntry[] = [
  {
    file: "rohwerte-demokratie.csv",
    titleKey: "ex.rohwerte.title",
    badgeKey: "ex.rohwerte.badge",
    descKey: "ex.rohwerte.desc",
    csv: ROHWERTE_CSV,
  },
  {
    file: "fuzzy-sets-beispiel.csv",
    titleKey: "ex.fuzzy.title",
    badgeKey: "ex.fuzzy.badge",
    descKey: "ex.fuzzy.desc",
    csv: FUZZY_CSV,
  },
  {
    file: "crisp-sets-beispiel.csv",
    titleKey: "ex.crisp.title",
    badgeKey: "ex.crisp.badge",
    descKey: "ex.crisp.desc",
    csv: CRISP_CSV,
  },
];

/** Zählt Fälle und Bedingungen einer CSV für die Karten-Meta-Zeile. */
function summarize(csv: string): { cases: number; conditions: number } {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0]?.split(",") ?? [];
  // erste Spalte = Fall-Kennung, letzte Spalte = Outcome
  const conditions = Math.max(0, header.length - 2);
  return { cases: Math.max(0, lines.length - 1), conditions };
}

interface ExampleDatasetsProps {
  onSelect: (dataset: RawDataset) => void;
}

/**
 * Auswahl der drei eingebetteten Beispiel-Datensätze. Beim Klick wird der
 * inline hinterlegte CSV-Inhalt mit parseCsv geparst und über onSelect geliefert.
 */
export function ExampleDatasets({ onSelect }: ExampleDatasetsProps) {
  const [locale] = useLocale();
  const [hovered, setHovered] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function choose(entry: ExampleEntry) {
    setError(null);
    try {
      onSelect(parseCsv(entry.csv, entry.file));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t(locale, "ex.error"),
      );
    }
  }

  return (
    <div>
      <div style={gridStyle}>
        {EXAMPLES.map((entry) => {
          const { cases, conditions } = summarize(entry.csv);
          const active = hovered === entry.file;
          return (
            <button
              key={entry.file}
              type="button"
              onClick={() => choose(entry)}
              onMouseEnter={() => setHovered(entry.file)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(entry.file)}
              onBlur={() => setHovered(null)}
              style={cardStyle(active)}
            >
              <div style={cardHeadStyle}>
                <span style={titleStyle}>{t(locale, entry.titleKey)}</span>
                <span style={badgeStyle}>{t(locale, entry.badgeKey)}</span>
              </div>
              <p style={descStyle}>{t(locale, entry.descKey)}</p>
              <div style={metaRowStyle}>
                <span className="mono" style={metaStyle}>
                  {t(locale, "ex.meta", { cases, conditions })}
                </span>
                <span style={syntheticStyle}>{t(locale, "ex.synthetic")}</span>
              </div>
            </button>
          );
        })}
      </div>
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

function cardStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
    textAlign: "left",
    font: "inherit",
    cursor: "pointer",
    padding: "13px 14px",
    borderRadius: 10,
    border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
    background: active ? "var(--accent-wash)" : "var(--panel)",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
    transition: "border-color 120ms ease, background 120ms ease",
    color: "var(--ink)",
  };
}

const cardHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
};

const titleStyle: React.CSSProperties = {
  fontSize: 14.5,
  fontWeight: 700,
  color: "var(--ink)",
};

const badgeStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: "var(--brand)",
  background: "var(--brand-wash)",
  border: "1px solid color-mix(in srgb, var(--brand) 22%, transparent)",
  borderRadius: 999,
  padding: "2px 8px",
  whiteSpace: "nowrap",
};

const descStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12.5,
  lineHeight: 1.5,
  color: "var(--ink-2)",
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  marginTop: "auto",
};

const metaStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--muted)",
};

const syntheticStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  color: "var(--warn-text)",
  background: "var(--warn-wash)",
  borderRadius: 999,
  padding: "2px 8px",
  whiteSpace: "nowrap",
};

const errorStyle: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: 12.5,
  color: "var(--bad)",
};
