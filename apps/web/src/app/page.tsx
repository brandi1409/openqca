"use client";

import { useMemo, useRef, useState } from "react";
import {
  calibrateDirect,
  buildTruthTable,
  complexSolution,
  parsimoniousSolution,
  intermediateSolution,
  necessityAnalysis,
  type QcaCase,
  type TruthTableResult,
  type Expectation,
} from "@openqca/engine";
import { DEMO, type RawDataset } from "@/lib/demo";
import { parseCsv } from "@/lib/csv";
import { AiAssist } from "@/components/AiAssist";
import { AccountButton, CloudSaveLoad } from "@/components/cloud";
import { XyPlot } from "@/components/XyPlot";
import { Descriptives } from "@/components/Descriptives";
import { Onboarding } from "@/components/Onboarding";
import { ExampleDatasets } from "@/components/ExampleDatasets";

interface SavedState {
  dataset: RawDataset;
  anchors: Anchors;
  conditions: string[];
  outcome: string;
  freqCut: number;
  consCut: number;
}

type Anchors = Record<string, [number, number, number]>;
type SolBundle = {
  complex: ReturnType<typeof complexSolution>;
  intermediate: ReturnType<typeof intermediateSolution>;
  parsimonious: ReturnType<typeof parsimoniousSolution>;
  necessity: ReturnType<typeof necessityAnalysis>;
};

const fmt = (v: number, d = 3) =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(d).replace(".", ",");

function numericCols(ds: RawDataset): string[] {
  return ds.columns.filter(
    (c) => c !== ds.caseCol && ds.rows.every((r) => typeof r[c] === "number"),
  );
}

export default function Home() {
  const [ds, setDs] = useState<RawDataset | null>(null);
  const [anchors, setAnchors] = useState<Anchors>({});
  const [focusVar, setFocusVar] = useState<string>("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<string>("");
  const [freqCut, setFreqCut] = useState(1);
  const [consCut, setConsCut] = useState(0.8);
  const [xyCond, setXyCond] = useState("");
  const [expectations, setExpectations] = useState<Record<string, Expectation>>({});

  const fileRef = useRef<HTMLInputElement>(null);

  function applyDataset(dataset: RawDataset) {
    setDs(dataset);
    setAnchors({ ...dataset.anchors });
    const raw = numericCols(dataset);
    setFocusVar(raw[0] ?? "");
    setConditions(raw.slice(0, Math.min(3, Math.max(1, raw.length - 1))).map((c) => "fs_" + c));
    setOutcome(raw.length ? "fs_" + raw[raw.length - 1] : "");
  }

  function loadDemo() {
    applyDataset(DEMO);
  }

  function importCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applyDataset(parseCsv(String(reader.result), file.name));
      } catch (e) {
        alert("CSV konnte nicht gelesen werden: " + (e instanceof Error ? e.message : "unbekannt"));
      }
    };
    reader.readAsText(file);
  }

  function currentState(): SavedState {
    return { dataset: ds!, anchors, conditions, outcome, freqCut, consCut };
  }
  function loadState(raw: unknown) {
    const s = raw as SavedState;
    if (!s?.dataset) return;
    setDs(s.dataset);
    setAnchors(s.anchors ?? {});
    setConditions(s.conditions ?? []);
    setOutcome(s.outcome ?? "");
    setFreqCut(s.freqCut ?? 1);
    setConsCut(s.consCut ?? 0.8);
    setFocusVar(numericCols(s.dataset)[0] ?? "");
  }

  const { cases, fuzzyCols } = useMemo(() => {
    if (!ds) return { cases: [] as QcaCase[], fuzzyCols: [] as string[] };
    const raw = numericCols(ds);
    const fcols = raw.map((c) => "fs_" + c);
    const cs: QcaCase[] = ds.rows.map((r) => {
      const values: Record<string, number> = {};
      raw.forEach((c) => {
        const a = anchors[c];
        values["fs_" + c] = a
          ? +calibrateDirect(Number(r[c]), a[0], a[1], a[2]).toFixed(4)
          : Number(r[c]);
      });
      return { label: String(r[ds.caseCol]), values };
    });
    return { cases: cs, fuzzyCols: fcols };
  }, [ds, anchors]);

  const tt: TruthTableResult | null = useMemo(() => {
    if (!ds || conditions.length < 1 || !outcome) return null;
    if (conditions.includes(outcome)) return null;
    try {
      return buildTruthTable({ cases, conditions, outcome, freqCut, consCut });
    } catch {
      return null;
    }
  }, [ds, cases, conditions, outcome, freqCut, consCut]);

  const sol: SolBundle | null = useMemo(() => {
    if (!tt) return null;
    const exp: Record<string, Expectation> = Object.fromEntries(
      conditions.map((c) => [c, expectations[c] ?? "present"]),
    );
    return {
      complex: complexSolution(tt, cases),
      intermediate: intermediateSolution(tt, cases, exp),
      parsimonious: parsimoniousSolution(tt, cases),
      necessity: necessityAnalysis(conditions, outcome, cases),
    };
  }, [tt, cases, conditions, outcome, expectations]);

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 26px 90px" }}>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt,.tsv"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importCsv(f);
          e.target.value = "";
        }}
      />
      <Header />
      <Onboarding />
      {!ds ? (
        <>
          <div style={{ padding: "10px 2px 22px" }}>
            <h1 style={{ fontSize: 28, fontWeight: 680, letterSpacing: "-0.015em", margin: "0 0 8px", maxWidth: "24ch" }}>
              Das offene, geführte Werkzeug für Qualitative Comparative Analysis.
            </h1>
            <p style={{ color: "var(--ink-2)", maxWidth: "62ch", margin: 0 }}>
              openQCA führt durch Kalibrierung, Truth Table und Minimierung — mit einem Coach, der
              typische Fehler abfängt, und einem Protokoll, das jede Analyse reproduzierbar macht.
              Kostenlos, Open Source (MIT), und Ihre Daten bleiben im Browser.
            </p>
          </div>
          <Card>
            <H2>Daten laden</H2>
            <p style={{ color: "var(--ink-2)", maxWidth: "60ch" }}>
              Lade den Demo-Datensatz, wähle unten ein Beispiel oder importiere eine eigene CSV-Datei.
              Alles rechnet lokal in diesem Browser; nichts wird übertragen.
            </p>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button primary onClick={loadDemo}>Demo-Datensatz laden</Button>
              <Button onClick={() => fileRef.current?.click()}>CSV importieren…</Button>
            </div>
            <p className="hint" style={hintStyle}>
              CSV: Kopfzeile + Fälle, Komma oder Semikolon. Alle Beispieldaten sind synthetisch.
            </p>
          </Card>
          <Card>
            <H2>Beispiel-Datensätze</H2>
            <ExampleDatasets onSelect={applyDataset} />
          </Card>
        </>
      ) : (
        <>
          <DataSection ds={ds} fuzzyCols={fuzzyCols} />
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, margin: "-8px 0 18px" }}>
            <Button onClick={() => fileRef.current?.click()}>Anderen Datensatz (CSV) laden</Button>
            <CloudSaveLoad getState={currentState} onLoad={loadState} />
          </div>
          {fuzzyCols.length > 0 && (
            <Card>
              <H2>Deskriptive Statistik (kalibrierte Sets)</H2>
              <Descriptives columns={fuzzyCols} cases={cases} />
            </Card>
          )}
          <CalibrationSection
            ds={ds}
            anchors={anchors}
            setAnchors={setAnchors}
            focusVar={focusVar}
            setFocusVar={setFocusVar}
            cases={cases}
          />
          <TruthTableSection
            fuzzyCols={fuzzyCols}
            conditions={conditions}
            setConditions={setConditions}
            outcome={outcome}
            setOutcome={setOutcome}
            freqCut={freqCut}
            setFreqCut={setFreqCut}
            consCut={consCut}
            setConsCut={setConsCut}
            tt={tt}
          />
          {sol && tt && (
            <SolutionSection
              tt={tt}
              sol={sol}
              expectations={expectations}
              setExpectations={setExpectations}
              conditions={conditions}
            />
          )}
          {conditions.length > 0 && outcome && (() => {
            const xc = xyCond && conditions.includes(xyCond) ? xyCond : conditions[0];
            const points = cases.map((c) => ({ label: c.label, x: c.values[xc], y: c.values[outcome] }));
            return (
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                  <H2>XY-Plot (Suffizienz)</H2>
                  <select value={xc} onChange={(e) => setXyCond(e.target.value)} style={{ ...inputStyle, marginLeft: "auto" }}>
                    {conditions.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <XyPlot xLabel={xc.replace(/^fs_/, "")} yLabel={outcome.replace(/^fs_/, "")} points={points} />
                <p className="hint" style={hintStyle}>Punkte oberhalb der Diagonale stützen „X ist hinreichend für Y". Konsistenz &amp; Coverage stehen über dem Plot.</p>
              </Card>
            );
          })()}
          <ProtocolSection ds={ds} anchors={anchors} conditions={conditions} outcome={outcome} freqCut={freqCut} consCut={consCut} />
        </>
      )}
    </div>
  );
}

/* ---------- Kalibrierung + Coach (Herzstück) ---------- */

function CalibrationSection({
  ds,
  anchors,
  setAnchors,
  focusVar,
  setFocusVar,
  cases,
}: {
  ds: RawDataset;
  anchors: Anchors;
  setAnchors: (a: Anchors) => void;
  focusVar: string;
  setFocusVar: (v: string) => void;
  cases: QcaCase[];
}) {
  const raw = numericCols(ds);
  const v = focusVar || raw[0];
  const a = anchors[v] ?? [0, 0.5, 1];
  const fsName = "fs_" + v;
  const rows = cases.map((c) => ({ label: c.label, f: c.values[fsName] }));
  const values = ds.rows.map((r) => Number(r[v]));

  const hi = rows.filter((r) => r.f > 0.5).length;
  const lo = rows.filter((r) => r.f < 0.5).length;
  const atHalf = rows.filter((r) => Math.abs(r.f - 0.5) < 1e-6);
  const nearCross = rows.filter((r) => r.f > 0.4 && r.f < 0.6 && Math.abs(r.f - 0.5) >= 1e-6);
  const ordered = a[0] < a[1] && a[1] < a[2];

  function setAnchor(i: number, val: number) {
    const next: [number, number, number] = [a[0], a[1], a[2]];
    next[i] = val;
    setAnchors({ ...anchors, [v]: next });
  }

  return (
    <Card>
      <H2>Kalibrierung, die mitdenkt</H2>
      <p style={{ color: "var(--ink-2)", maxWidth: "66ch", marginTop: 0 }}>
        Rohwerte werden zu Fuzzy-Set-Zugehörigkeit. Der Coach prüft jede Entscheidung live gegen
        deine Fälle.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {raw.map((c) => (
          <button
            key={c}
            onClick={() => setFocusVar(c)}
            style={{
              font: "inherit",
              fontSize: 13.5,
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
              border: "1px solid var(--line)",
              background: c === v ? "var(--brand)" : "var(--panel-2)",
              color: c === v ? "#fff" : "var(--ink-2)",
              fontWeight: c === v ? 600 : 400,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
        {(["Voll draußen → 0,05", "Kreuzung → 0,50", "Voll drinnen → 0,95"] as const).map((lab, i) => (
          <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>
              {lab}
            </div>
            <input
              type="number"
              step="any"
              value={a[i]}
              onChange={(e) => setAnchor(i, Number(e.target.value))}
              style={{
                width: "100%",
                font: "inherit",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--ink)",
                background: "none",
                border: "none",
                borderBottom: "2px solid var(--line)",
                padding: "4px 0",
                marginTop: 4,
              }}
            />
          </div>
        ))}
      </div>

      {ordered ? (
        <CalibrationCurve variable={v} anchors={a} values={values} rows={rows} nearCross={nearCross} atHalf={atHalf} />
      ) : (
        <Diag kind="bad">Anker müssen aufsteigend sein: voll draußen &lt; Kreuzung &lt; voll drinnen.</Diag>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        {atHalf.length ? (
          <Diag kind="bad">
            <b>{atHalf.length} Fall/Fälle liegen genau bei 0,5</b> ({atHalf.map((r) => r.label).join(", ")}) — solche
            Fälle fallen aus der Truth Table. Verschieb den Kreuzungspunkt leicht.
          </Diag>
        ) : (
          <Diag kind="ok"><b>Kein Fall liegt exakt auf 0,5.</b> Alle Fälle bleiben in der Analyse.</Diag>
        )}
        {hi / rows.length >= 0.85 || hi / rows.length <= 0.15 ? (
          <Diag kind="warn">
            <b>Stark schiefes Set.</b> {hi} von {rows.length} „drinnen“ — das Set unterscheidet kaum.
          </Diag>
        ) : (
          <Diag kind="ok"><b>Ausgewogene Verteilung.</b> {hi} drinnen / {lo} draußen.</Diag>
        )}
        {nearCross.length > 0 && (
          <Diag kind="warn">
            <b>{nearCross.length} Grenzfall/-fälle nahe 0,5:</b>{" "}
            {nearCross.map((r) => `${r.label} ${fmt(r.f, 2)}`).join(", ")} — hier lohnt eine Robustheitsprüfung.
          </Diag>
        )}
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: "#6a4bd6" }}>
            ✨ KI-Assistent
          </span>
          <span style={{ fontSize: 10.5, color: "var(--muted)" }}>Cloud-Tarif</span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <AiAssist
            task="anchors"
            label="Anker aus Beschreibung vorschlagen"
            needsContext
            getData={() => {
              const sorted = [...values].sort((a2, b2) => a2 - b2);
              return { variable: v, min: sorted[0], median: sorted[Math.floor(sorted.length / 2)], max: sorted[sorted.length - 1] };
            }}
          />
          <AiAssist task="skew" label="Verteilung erklären" getData={() => ({ total: rows.length, inside: hi, atHalf: atHalf.length })} />
          <AiAssist
            task="methods"
            label="Methoden-Absatz entwerfen"
            needsContext
            getData={() => ({ variable: v, anchors: a.map((x) => fmt(x, 0)).join(" / "), total: rows.length, inside: hi })}
          />
        </div>
      </div>
    </Card>
  );
}

function CalibrationCurve({
  variable,
  anchors,
  values,
  rows,
  nearCross,
  atHalf,
}: {
  variable: string;
  anchors: [number, number, number];
  values: number[];
  rows: { label: string; f: number }[];
  nearCross: { label: string; f: number }[];
  atHalf: { label: string; f: number }[];
}) {
  const [o, c, i] = anchors;
  const lo = Math.min(...values, o);
  const hi = Math.max(...values, i);
  const pad = (hi - lo) * 0.07 || 1;
  const W = 640, H = 280, ML = 44, MR = 16, MT = 12, MB = 40;
  const px = (val: number) => ML + ((val - (lo - pad)) / (hi + pad - (lo - pad))) * (W - ML - MR);
  const py = (val: number) => MT + (1 - val) * (H - MT - MB);
  let curve = "";
  for (let s = 0; s <= 140; s++) {
    const x = lo - pad + (s / 140) * (hi + pad - (lo - pad));
    curve += (s ? "L" : "M") + px(x).toFixed(1) + "," + py(calibrateDirect(x, o, c, i)).toFixed(1);
  }
  const anchorLines: [number, string][] = [[o, "0,05"], [c, "0,50"], [i, "0,95"]];
  const flagged = [...nearCross, ...atHalf].slice(0, 4);
  const rawByLabel = new Map(rows.map((r, idx) => [r.label, values[idx]]));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" style={{ width: "100%", maxWidth: W, height: "auto", background: "var(--panel)" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((val) => (
        <g key={val}>
          <line x1={ML} x2={W - MR} y1={py(val)} y2={py(val)} stroke="var(--grid)" />
          <text x={ML - 6} y={py(val) + 3.5} textAnchor="end" fill="var(--muted)" fontSize={10.5}>
            {val.toFixed(2).replace(".", ",")}
          </text>
        </g>
      ))}
      {anchorLines.map(([val], idx) => (
        <g key={idx}>
          <line x1={px(val)} x2={px(val)} y1={MT} y2={H - MB} stroke="var(--accent)" strokeWidth={1} strokeDasharray="3 4" opacity={0.8} />
          <text x={px(val)} y={H - MB + 15} textAnchor="middle" fill="var(--accent-deep)" fontSize={10.5} fontWeight={600}>
            {String(val).replace(".", ",")}
          </text>
        </g>
      ))}
      <path d={curve} fill="none" stroke="var(--accent)" strokeWidth={2.25} />
      {rows.map((r, idx) => {
        const flag = r.f > 0.4 && r.f < 0.6;
        return (
          <circle key={idx} cx={px(values[idx])} cy={py(r.f)} r={5} fill={flag ? "#b26a00" : "var(--accent)"} stroke="var(--panel)" strokeWidth={2}>
            <title>{`${r.label}: ${values[idx]} → ${r.f.toFixed(3)}`}</title>
          </circle>
        );
      })}
      {flagged.map((r, idx) => (
        <text key={idx} x={px(rawByLabel.get(r.label) ?? 0) + 7} y={py(r.f) - 6} fill="var(--warn-text)" fontSize={10} fontWeight={600}>
          {r.label}
        </text>
      ))}
      <text x={(ML + W - MR) / 2} y={H - 2} textAnchor="middle" fill="var(--muted)" fontSize={11}>
        {variable} (Rohwert) → Zugehörigkeit
      </text>
    </svg>
  );
}

/* ---------- Daten ---------- */

function DataSection({ ds, fuzzyCols }: { ds: RawDataset; fuzzyCols: string[] }) {
  const fs = new Set(fuzzyCols.map((c) => c.replace(/^fs_/, "")));
  return (
    <Card>
      <H2>Daten · {ds.rows.length} Fälle</H2>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
          <thead>
            <tr>
              {ds.columns.map((c) => (
                <th key={c} style={thStyle(fs.has(c))}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ds.rows.map((r, i) => (
              <tr key={i}>
                {ds.columns.map((c) => (
                  <td key={c} style={tdStyle(typeof r[c] === "number", c === ds.caseCol)}>
                    {String(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- Truth Table ---------- */

function TruthTableSection(props: {
  fuzzyCols: string[];
  conditions: string[];
  setConditions: (c: string[]) => void;
  outcome: string;
  setOutcome: (o: string) => void;
  freqCut: number;
  setFreqCut: (n: number) => void;
  consCut: number;
  setConsCut: (n: number) => void;
  tt: TruthTableResult | null;
}) {
  const { fuzzyCols, conditions, setConditions, outcome, setOutcome, freqCut, setFreqCut, consCut, setConsCut, tt } = props;
  const observed = tt
    ? tt.rows
        .filter((r) => r.n > 0)
        .sort((x, y) => Number(y.output === 1) - Number(x.output === 1) || y.consistency - x.consistency)
    : [];
  const remainders = tt ? tt.rows.length - observed.length : 0;

  function toggle(c: string) {
    setConditions(conditions.includes(c) ? conditions.filter((x) => x !== c) : [...conditions, c]);
  }

  return (
    <Card>
      <H2>Truth Table</H2>
      <div style={{ marginBottom: 12 }}>
        <Label>Bedingungen</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 4 }}>
          {fuzzyCols.map((c) => (
            <label key={c} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={conditions.includes(c) && c !== outcome} disabled={c === outcome} onChange={() => toggle(c)} />
              <span className="mono">{c}</span>
            </label>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "end" }}>
        <Field label="Outcome">
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} style={inputStyle}>
            {fuzzyCols.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </Field>
        <Field label="Frequenz-Cutoff">
          <input type="number" min={1} value={freqCut} onChange={(e) => setFreqCut(Math.max(1, Number(e.target.value) || 1))} style={{ ...inputStyle, width: 90 }} />
        </Field>
        <Field label="Konsistenz-Cutoff">
          <input type="number" min={0} max={1} step={0.01} value={consCut} onChange={(e) => setConsCut(Number(e.target.value) || 0.8)} style={{ ...inputStyle, width: 90 }} />
        </Field>
      </div>

      {tt && (
        <>
          {tt.assignedCaseCount < tt.totalCaseCount && (
            <p className="hint" style={{ ...hintStyle, color: "var(--bad)" }}>
              Achtung: {tt.totalCaseCount - tt.assignedCaseCount} Fall/Fälle nicht zugeordnet (Zugehörigkeit 0,5). Kalibrierung anpassen.
            </p>
          )}
          <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8, marginTop: 12 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  {tt.conditions.map((c) => (<th key={c} style={thStyle(false)}>{c.replace(/^fs_/, "")}</th>))}
                  <th style={thStyle(false)}>n</th>
                  <th style={thStyle(false)}>Konsistenz</th>
                  <th style={thStyle(false)}>PRI</th>
                  <th style={thStyle(false)}>OUT</th>
                  <th style={thStyle(false)}>Fälle</th>
                </tr>
              </thead>
              <tbody>
                {observed.map((r) => (
                  <tr key={r.index}>
                    {[...r.bits].map((b, i) => (<td key={i} style={tdStyle(true, false)} className="mono">{b}</td>))}
                    <td style={tdStyle(true, false)}>{r.n}</td>
                    <td style={{ ...tdStyle(true, false), color: r.consistency >= consCut ? "var(--good-text)" : undefined, fontWeight: r.consistency >= consCut ? 600 : 400 }}>{fmt(r.consistency)}</td>
                    <td style={tdStyle(true, false)}>{fmt(r.pri)}</td>
                    <td style={tdStyle(false, false)}>{chip(r.output)}</td>
                    <td style={{ ...tdStyle(false, false), whiteSpace: "normal", maxWidth: 260, color: "var(--ink-2)", fontSize: 12.5 }}>{r.cases.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint" style={hintStyle}>
            {observed.length} beobachtete Konfigurationen, {remainders} Remainder. OUT = 1, wenn n ≥ {freqCut} und Konsistenz ≥ {consCut}.
          </p>
        </>
      )}
    </Card>
  );
}

/* ---------- Lösungen ---------- */

function SolutionSection({
  tt,
  sol,
  expectations,
  setExpectations,
  conditions,
}: {
  tt: TruthTableResult;
  sol: SolBundle;
  expectations: Record<string, Expectation>;
  setExpectations: (e: Record<string, Expectation>) => void;
  conditions: string[];
}) {
  const outLabel = tt.outcome.replace(/^fs_/, "").toUpperCase();
  return (
    <>
      {(["complex", "intermediate", "parsimonious"] as const).map((kind) => {
        const s = sol[kind];
        const title =
          kind === "complex"
            ? "Komplexe (konservative) Lösung"
            : kind === "intermediate"
              ? "Intermediäre Lösung"
              : "Sparsame (parsimonious) Lösung";
        return (
          <Card key={kind}>
            <H2>{title}</H2>
            {s.models.length === 0 ? (
              <p className="hint" style={hintStyle}>Keine Konfiguration erfüllt die Cutoffs — keine Lösung.</p>
            ) : (
              s.models.map((m, mi) => (
                <div key={mi}>
                  <div className="mono" style={{ fontSize: 14.5, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "10px 14px", overflowX: "auto" }}>
                    {m.paths.map((p) => p.expression.replace(/fs_/g, "").toUpperCase()).join("  +  ")} → {outLabel}
                  </div>
                  <div style={{ display: "flex", gap: 26, margin: "12px 0" }}>
                    <Kpi v={fmt(m.solutionConsistency)} l="Lösungs-Konsistenz" />
                    <Kpi v={fmt(m.solutionCoverage)} l="Lösungs-Coverage" />
                  </div>
                  <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th style={thStyle(false)}>Pfad</th>
                          <th style={thStyle(false)}>Raw Cov.</th>
                          <th style={thStyle(false)}>Unique Cov.</th>
                          <th style={thStyle(false)}>Konsistenz</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.paths.map((p, pi) => (
                          <tr key={pi}>
                            <td style={tdStyle(false, false)} className="mono">{p.expression.replace(/fs_/g, "").toUpperCase()}</td>
                            <td style={tdStyle(true, false)}>{fmt(p.rawCoverage)}</td>
                            <td style={tdStyle(true, false)}>{fmt(p.uniqueCoverage)}</td>
                            <td style={tdStyle(true, false)}>{fmt(p.consistency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
            {kind === "intermediate" && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
                <Label>Richtungserwartungen (nur einfache Counterfactuals)</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
                  {conditions.map((c) => (
                    <label key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5 }}>
                      <span className="mono" style={{ color: "var(--ink-2)" }}>{c.replace(/^fs_/, "")}</span>
                      <select
                        value={expectations[c] ?? "present"}
                        onChange={(e) => setExpectations({ ...expectations, [c]: e.target.value as Expectation })}
                        style={{ ...inputStyle, padding: "3px 6px", fontSize: 12.5 }}
                      >
                        <option value="present">anwesend</option>
                        <option value="absent">abwesend</option>
                        <option value="either">offen</option>
                      </select>
                    </label>
                  ))}
                </div>
                <p className="hint" style={hintStyle}>
                  Zwischen komplexer und sparsamer Lösung: nur theoriekonforme (einfache) Vereinfachungsannahmen.
                </p>
              </div>
            )}
            {kind === "parsimonious" && (
              <p className="hint" style={hintStyle}>Remainder werden als Vereinfachungsannahmen zugelassen.</p>
            )}
          </Card>
        );
      })}
      <Card>
        <H2>Notwendige Bedingungen</H2>
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle(false)}>Bedingung</th>
                <th style={thStyle(false)}>Konsistenz</th>
                <th style={thStyle(false)}>Coverage</th>
                <th style={thStyle(false)}></th>
              </tr>
            </thead>
            <tbody>
              {sol.necessity.map((n) => (
                <tr key={n.condition}>
                  <td style={tdStyle(false, false)} className="mono">{n.condition.replace(/^fs_/, "")}</td>
                  <td style={tdStyle(true, false)}>{fmt(n.consistency)}</td>
                  <td style={tdStyle(true, false)}>{fmt(n.coverage)}</td>
                  <td style={tdStyle(false, false)}>{n.isCandidate ? <span style={{ color: "var(--good-text)", fontWeight: 600 }}>≥ 0,9 — Kandidat</span> : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="hint" style={hintStyle}>Konvention: Konsistenz ≥ 0,9 als Hinweis auf Notwendigkeit — mit Coverage und Fallkenntnis interpretieren.</p>
      </Card>
    </>
  );
}

/* ---------- Protokoll ---------- */

function ProtocolSection({ ds, anchors, conditions, outcome, freqCut, consCut }: { ds: RawDataset; anchors: Anchors; conditions: string[]; outcome: string; freqCut: number; consCut: number }) {
  const r = useMemo(() => {
    const lines = ["library(QCA)", "", `df <- read.csv("${ds.name}.csv")`];
    for (const [v, a] of Object.entries(anchors)) {
      lines.push(`df$fs_${v} <- calibrate(df$${v}, type = "fuzzy", thresholds = "e=${a[0]}, c=${a[1]}, i=${a[2]}")`);
    }
    if (conditions.length && outcome) {
      lines.push("", `tt <- truthTable(df, outcome = "${outcome}", conditions = "${conditions.join(", ")}",`);
      lines.push(`                 incl.cut = ${consCut}, n.cut = ${freqCut}, show.cases = TRUE)`);
      lines.push(`minimize(tt, details = TRUE)                 # komplexe Lösung`);
      lines.push(`minimize(tt, include = "?", details = TRUE)  # sparsame Lösung`);
    }
    return lines.join("\n");
  }, [ds, anchors, conditions, outcome, freqCut, consCut]);

  function download() {
    const payload = { tool: "openQCA", exportiert: new Date().toISOString(), datensatz: ds.name, kalibrierungen: anchors, bedingungen: conditions, outcome, freqCut, consCut };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "openqca-protokoll.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <Card>
      <H2>Analyseprotokoll</H2>
      <p style={{ color: "var(--ink-2)", marginTop: 0 }}>Reproduzierbar: exportierbar als JSON und als äquivalentes R-Skript für das QCA-Paket.</p>
      <Button primary onClick={download}>Protokoll als JSON herunterladen</Button>
      <pre className="mono" style={{ fontSize: 12.5, lineHeight: 1.6, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "12px 14px", overflowX: "auto", marginTop: 14 }}>
        {r}
      </pre>
    </Card>
  );
}

/* ---------- UI-Bausteine ---------- */

function Header() {
  return (
    <header style={{ display: "flex", alignItems: "baseline", gap: 13, flexWrap: "wrap", paddingBottom: 16, borderBottom: "1px solid var(--line)", marginBottom: 22 }}>
      <span style={{ fontWeight: 650, fontSize: 20, letterSpacing: "-0.01em" }}>
        open<span style={{ color: "var(--brand)" }}>QCA</span>
      </span>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>Qualitative Comparative Analysis — lokal &amp; reproduzierbar</span>
      <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 12 }}>
        <a href="/methodik" style={{ fontSize: 13, color: "var(--accent-deep)", textDecoration: "none" }}>Methodik</a>
        <a href="/preise" style={{ fontSize: 13, color: "var(--accent-deep)", textDecoration: "none" }}>Tarife</a>
        <AccountButton />
      </span>
    </header>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>{children}</div>;
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 16, fontWeight: 650, margin: "0 0 12px" }}>{children}</h2>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 11.5, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>{children}</span>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><Label>{label}</Label>{children}</div>;
}
function Button({ children, primary, onClick }: { children: React.ReactNode; primary?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ font: "inherit", fontWeight: 600, fontSize: 14, borderRadius: 7, padding: "7px 15px", cursor: "pointer", border: primary ? "1px solid var(--accent)" : "1px solid var(--line)", background: primary ? "var(--accent)" : "var(--panel)", color: primary ? "#fff" : "var(--ink)" }}>
      {children}
    </button>
  );
}
function Kpi({ v, l }: { v: string; l: string }) {
  return <div><div style={{ fontSize: 21, fontWeight: 650 }}>{v}</div><div style={{ fontSize: 11.5, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>{l}</div></div>;
}
function Diag({ kind, children }: { kind: "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const map = { ok: ["var(--good)", "rgba(12,163,12,0.09)"], warn: ["#b26a00", "var(--warn-wash)"], bad: ["var(--bad)", "var(--bad-wash)"] } as const;
  const [icon, wash] = map[kind];
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, padding: "9px 11px", borderRadius: 9, border: `1px solid ${wash}`, background: wash }}>
      <span style={{ width: 17, height: 17, borderRadius: "50%", flex: "none", marginTop: 1, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, color: "#fff", background: icon }}>
        {kind === "ok" ? "✓" : "!"}
      </span>
      <div>{children}</div>
    </div>
  );
}

const hintStyle: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)", margin: "8px 0 0" };
const inputStyle: React.CSSProperties = { font: "inherit", color: "var(--ink)", background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px" };
function thStyle(fs: boolean): React.CSSProperties {
  return { textAlign: "left", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: fs ? "var(--accent-deep)" : "var(--muted)", fontWeight: 700, padding: "8px 12px", borderBottom: "1px solid var(--line)", background: "var(--panel-2)", whiteSpace: "nowrap" };
}
function tdStyle(num: boolean, caseCol: boolean): React.CSSProperties {
  return { padding: "6px 12px", borderBottom: "1px solid var(--line-soft)", whiteSpace: "nowrap", textAlign: num ? "right" : "left", fontVariantNumeric: num ? "tabular-nums" : undefined, fontWeight: caseCol ? 600 : 400 };
}
function chip(out: 0 | 1 | "?") {
  const style: React.CSSProperties = { display: "inline-block", padding: "1px 9px", borderRadius: 20, fontSize: 12, fontWeight: 700 };
  if (out === 1) return <span style={{ ...style, background: "var(--accent-wash)", color: "var(--accent-deep)" }}>1</span>;
  if (out === 0) return <span style={{ ...style, background: "var(--line-soft)", color: "var(--ink-2)" }}>0</span>;
  return <span style={{ ...style, border: "1px dashed var(--line)", color: "var(--muted)" }}>?</span>;
}
