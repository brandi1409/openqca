"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { calibrateDirect, buildTruthTable, intermediateSolution } from "@openqca/engine";
import { DEMO } from "@/lib/demo";
import { useLocale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";
import { LanguageToggle } from "@/components/LanguageToggle";

/**
 * Öffentliche Landing-Page (Route „/"). Zweisprachig über `useLocale` + `t`.
 *
 * Designidee: Die Seite beweist statt zu behaupten. Der Hero zeigt die echte
 * Ableitung Rohdaten → Kalibrierung → Truth Table → Lösungsformel — und zwar
 * nicht als Dekoration, sondern LIVE mit der Engine gerechnet (Modul-Scope,
 * Demo-Datensatz). Die Zahlen auf der Landing können damit nie von der App
 * abweichen. Typografie: Serif-Display (Journal-Anmutung, reiner System-Stack)
 * + Mono für Formeln/Zahlen; Farben bleiben die Tokens aus globals.css.
 *
 * Die Landing unterliegt bewusst NICHT der strengen A4-Skala (QUALITY-SPEC:
 * nur /app, /preise, /download, /konto) — sie nutzt eine eigene Display-Typo.
 */

const DISPLAY_FONT = 'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif';
const MONO_FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

/* ---------- Hero-Daten: echte Zahlen, live aus der Engine ---------- */

const HERO_CONDS = ["wohlstand", "urban", "bildung", "stabil"] as const;
const HERO_OUTCOME = "demo_ueberleben";

function computeHeroData() {
  const cases = DEMO.rows.map((r) => {
    const values: Record<string, number> = {};
    for (const c of [...HERO_CONDS, HERO_OUTCOME]) {
      const [fullOut, crossover, fullIn] = DEMO.anchors[c];
      values[c] = calibrateDirect(Number(r[c]), fullOut, crossover, fullIn);
    }
    return { label: String(r[DEMO.caseCol]), values };
  });
  const tt = buildTruthTable({
    cases,
    conditions: [...HERO_CONDS],
    outcome: HERO_OUTCOME,
    freqCut: 1,
    consCut: 0.8,
  });
  const inter = intermediateSolution(tt, cases, {
    wohlstand: "present",
    urban: "present",
    bildung: "present",
    stabil: "present",
  });
  const model = inter.models[0] ?? null;
  // Truth-Table-Ausschnitt: die beiden positiven Zeilen + eine widersprüchliche als Kontrast.
  const shown = tt.rows
    .filter((r) => r.n > 0)
    .sort((a, b) => b.consistency - a.consistency)
    .slice(0, 3);
  const rawW = DEMO.rows.map((r) => Number(r.wohlstand));
  const calW = cases.map((c) => c.values.wohlstand);
  return { model, shown, rawW, calW, anchorsW: DEMO.anchors.wohlstand };
}

const HERO = computeHeroData();

/** Bits eines Terms („1-11") → Literale in Anzeigeform (WOHLSTAND, ~URBAN …). */
function termToText(bits: string): string {
  const parts: string[] = [];
  bits.split("").forEach((b, i) => {
    if (b === "1") parts.push(HERO_CONDS[i].toUpperCase());
    else if (b === "0") parts.push("~" + HERO_CONDS[i].toUpperCase());
  });
  return parts.join("·");
}

const HERO_FORMULA = HERO.model ? HERO.model.terms.map(termToText).join(" + ") + " → DEMOKRATIE" : "";

/** Zahl im deutschen Format mit 3 Dezimalen (0,972). */
function fmt3(x: number): string {
  return x.toFixed(3).replace(".", ",");
}

export function Landing() {
  const [locale] = useLocale();
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <Deliverables />
        <Rigor />
        <Compare />
        <FeatureList />
        <Steps />
        <Privacy />
        <PricingTeaser />
        <DownloadTeaser />
        <CtaBand />
      </main>
      <span style={{ display: "none" }} aria-hidden>
        {locale}
      </span>
    </>
  );
}

/* ---------- Nav (sticky) ---------- */

function LandingNav() {
  const [locale] = useLocale();
  return (
    <nav
      aria-label={t(locale, "landing.nav.ariaPrimary")}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "color-mix(in srgb, var(--bg) 82%, transparent)",
        backdropFilter: "saturate(180%) blur(10px)",
        WebkitBackdropFilter: "saturate(180%) blur(10px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 26px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: "var(--ink)", textDecoration: "none" }}>
          open<span style={{ color: "var(--brand)" }}>QCA</span>
        </Link>
        <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <NavLink href="#funktionen">{t(locale, "landing.nav.funktionen")}</NavLink>
          <NavLink href="/methodik">{t(locale, "landing.nav.methodik")}</NavLink>
          <NavLink href="/preise">{t(locale, "landing.nav.tarife")}</NavLink>
          <NavLink href="/download">{t(locale, "landing.nav.download")}</NavLink>
          <LanguageToggle />
          <CtaButton href="/app" primary>{t(locale, "landing.nav.startApp")}</CtaButton>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} style={{ fontSize: 14, color: "var(--ink-2)", textDecoration: "none", fontWeight: 500 }}>
      {children}
    </a>
  );
}

/* ---------- Hero: These + Beweis-Streifen ---------- */

function Hero() {
  const [locale] = useLocale();
  return (
    <section style={{ ...sectionStyle, paddingTop: 58, paddingBottom: 28 }}>
      <style>{`
        @keyframes oq-draw { from { stroke-dashoffset: 240; } to { stroke-dashoffset: 0; } }
        @keyframes oq-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
        .oq-anim-curve { stroke-dasharray: 240; animation: oq-draw 900ms ease-out 250ms both; }
        .oq-anim-dot { animation: oq-fade 400ms ease-out both; }
        .oq-anim-late { animation: oq-fade 600ms ease-out 1000ms both; }
        @media (prefers-reduced-motion: reduce) {
          .oq-anim-curve, .oq-anim-dot, .oq-anim-late { animation: none; }
        }
        .oq-strip { display: flex; align-items: stretch; gap: 0; }
        .oq-strip-svg { display: block; width: 100%; max-width: 220px; height: auto; }
        /* Unterhalb Desktop-Breite umbrechen statt scrollen — die Lösungsformel
           (die Pointe des Streifens) muss immer ohne Scrollen sichtbar sein. */
        @media (max-width: 1020px) {
          .oq-strip { flex-wrap: wrap; gap: 18px 26px; }
          .oq-arrow { display: none; }
        }
      `}</style>

      <p style={{ fontFamily: MONO_FONT, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--brand)", fontWeight: 600, margin: 0 }}>
        {t(locale, "landing.h.eyebrow")}
      </p>
      <h1
        style={{
          fontFamily: DISPLAY_FONT,
          fontSize: "clamp(34px, 5.4vw, 52px)",
          lineHeight: 1.08,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          margin: "14px 0 0",
          maxWidth: "22ch",
        }}
      >
        {t(locale, "landing.h.title")}
      </h1>
      <p style={{ color: "var(--ink-2)", fontSize: 17, lineHeight: 1.6, maxWidth: "62ch", margin: "16px 0 0" }}>
        {t(locale, "landing.h.sub")}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <CtaButton href="/app?demo=1" primary large>{t(locale, "landing.h.ctaDemo")}</CtaButton>
        <CtaButton href="/app" large>{t(locale, "landing.h.ctaOwn")}</CtaButton>
      </div>

      <ProofStrip />

      <p style={{ fontFamily: MONO_FONT, fontSize: 12, lineHeight: 1.7, color: "var(--muted)", margin: "14px 0 0" }}>
        {t(locale, "landing.h.proof")}
      </p>
    </section>
  );
}

/**
 * Der Beweis-Streifen: vier Stationen der echten Demo-Analyse. Alle Zahlen
 * stammen aus `computeHeroData()` (Engine, Modul-Scope) — nichts ist gemalt.
 */
function ProofStrip() {
  const [locale] = useLocale();
  return (
    <figure
      aria-label={t(locale, "landing.h.stripAria")}
      style={{
        margin: "30px 0 0",
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 10px 28px rgba(0,0,0,0.06)",
        padding: "16px 18px 12px",
      }}
    >
      <div className="oq-strip">
        <StripPanel label={t(locale, "landing.h.s1")}>
          <RawDots />
        </StripPanel>
        <StripArrow />
        <StripPanel label={t(locale, "landing.h.s2")}>
          <CalibCurve />
        </StripPanel>
        <StripArrow />
        <StripPanel label={t(locale, "landing.h.s3")}>
          <TruthRows />
        </StripPanel>
        <StripArrow />
        <StripPanel label={t(locale, "landing.h.s4")} grow>
          <div className="oq-anim-late" style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", gap: 8 }}>
            <div style={{ fontFamily: MONO_FONT, fontSize: "clamp(14px, 1.8vw, 17px)", fontWeight: 600, color: "var(--ink)", lineHeight: 1.5, overflowWrap: "anywhere" }}>
              {HERO_FORMULA}
            </div>
            {HERO.model && (
              <div style={{ fontFamily: MONO_FONT, fontSize: 12, color: "var(--muted)" }}>
                {t(locale, "landing.h.consistency")} {fmt3(HERO.model.solutionConsistency)} · {t(locale, "landing.h.coverage")} {fmt3(HERO.model.solutionCoverage)}
              </div>
            )}
          </div>
        </StripPanel>
      </div>
      <figcaption style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.55, marginTop: 12, borderTop: "1px solid var(--line-soft)", paddingTop: 10 }}>
        {t(locale, "landing.h.stripCaption")}
      </figcaption>
    </figure>
  );
}

function StripPanel({ label, grow, children }: { label: string; grow?: boolean; children: ReactNode }) {
  return (
    <div style={{ flex: grow ? "2 1 250px" : "1 1 172px", minWidth: grow ? 240 : 150, display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: MONO_FONT, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>
        {label}
      </span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function StripArrow() {
  return (
    <span aria-hidden className="oq-arrow" style={{ alignSelf: "center", color: "var(--muted)", fontSize: 16, padding: "0 12px", flex: "none" }}>
      →
    </span>
  );
}

/** Station 1 — die 18 rohen Wohlstandswerte auf einer Achse. */
function RawDots() {
  const min = 260;
  const max = 1160;
  return (
    <svg viewBox="0 0 172 84" className="oq-strip-svg" aria-hidden>
      <line x1={6} y1={70} x2={166} y2={70} stroke="var(--line)" />
      {HERO.rawW.map((v, i) => (
        <circle
          key={i}
          className="oq-anim-dot"
          style={{ animationDelay: `${i * 30}ms` }}
          cx={6 + ((v - min) / (max - min)) * 160}
          cy={62 - (i % 4) * 11}
          r={3.4}
          fill="var(--ink-2)"
          opacity={0.75}
        />
      ))}
      <text x={6} y={82} fontSize={9} fill="var(--muted)" fontFamily={MONO_FONT}>320</text>
      <text x={166} y={82} fontSize={9} fill="var(--muted)" textAnchor="end" fontFamily={MONO_FONT}>1098</text>
    </svg>
  );
}

/** Station 2 — die echte Kalibrierkurve (Anker 400/550/900) mit den 18 Fällen. */
function CalibCurve() {
  const [fullOut, crossover, fullIn] = HERO.anchorsW;
  const xMin = 260;
  const xMax = 1160;
  const px = (v: number) => 6 + ((v - xMin) / (xMax - xMin)) * 160;
  const py = (m: number) => 70 - m * 60;
  let d = "";
  for (let k = 0; k <= 60; k++) {
    const v = xMin + (k / 60) * (xMax - xMin);
    d += (k ? "L" : "M") + px(v).toFixed(1) + " " + py(calibrateDirect(v, fullOut, crossover, fullIn)).toFixed(1);
  }
  return (
    <svg viewBox="0 0 172 84" className="oq-strip-svg" aria-hidden>
      <line x1={6} y1={70} x2={166} y2={70} stroke="var(--line)" />
      <line x1={6} y1={py(0.5)} x2={166} y2={py(0.5)} stroke="var(--line-soft)" strokeDasharray="3 4" />
      <text x={166} y={py(0.5) - 3} fontSize={9} fill="var(--muted)" textAnchor="end" fontFamily={MONO_FONT}>0,5</text>
      <path className="oq-anim-curve" d={d} pathLength={240} fill="none" stroke="var(--accent)" strokeWidth={2.2} />
      {HERO.rawW.map((v, i) => {
        const m = HERO.calW[i];
        return (
          <circle
            key={i}
            className="oq-anim-dot"
            style={{ animationDelay: `${300 + i * 30}ms` }}
            cx={px(v)}
            cy={py(m)}
            r={3.2}
            fill={Math.abs(m - 0.5) < 0.1 ? "var(--warn-text)" : "var(--accent)"}
          />
        );
      })}
    </svg>
  );
}

/** Station 3 — echte Truth-Table-Zeilen (Konsistenz, Fallzahl, Cutoff-Entscheid). */
function TruthRows() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, justifyContent: "center", height: "100%" }} aria-hidden>
      <div style={{ fontFamily: MONO_FONT, fontSize: 10.5, color: "var(--muted)", display: "flex", gap: 10 }}>
        <span style={{ width: 46 }}>{HERO_CONDS.map((c) => c[0].toUpperCase()).join(" ")}</span>
        <span style={{ width: 14, textAlign: "right" }}>n</span>
        <span style={{ width: 38, textAlign: "right" }}>incl.</span>
      </div>
      {HERO.shown.map((row) => {
        const pass = row.output === 1;
        return (
          <div key={row.bits} style={{ fontFamily: MONO_FONT, fontSize: 12, display: "flex", gap: 10, color: "var(--ink-2)" }}>
            <span style={{ width: 46, letterSpacing: "0.22em" }}>{row.bits}</span>
            <span style={{ width: 14, textAlign: "right" }}>{row.n}</span>
            <span style={{ width: 38, textAlign: "right" }}>{fmt3(row.consistency)}</span>
            <span style={{ color: pass ? "var(--good-text)" : "var(--muted)", fontWeight: 600 }}>{pass ? "✓" : "✗"}</span>
          </div>
        );
      })}
      <div style={{ fontFamily: MONO_FONT, fontSize: 10.5, color: "var(--muted)" }}>incl. ≥ 0,80 →</div>
    </div>
  );
}

/* ---------- Das nehmen Sie mit ---------- */

function Deliverables() {
  const [locale] = useLocale();
  const items: [string, DictKey, DictKey][] = [
    ["BERICHT.PDF", "landing.deliver.pdf.title", "landing.deliver.pdf.desc"],
    ["ANALYSE.R", "landing.deliver.r.title", "landing.deliver.r.desc"],
    ["PROTOKOLL.JSON", "landing.deliver.json.title", "landing.deliver.json.desc"],
  ];
  return (
    <section style={sectionStyle}>
      <SectionHeading>{t(locale, "landing.deliver.title")}</SectionHeading>
      <p style={{ color: "var(--ink-2)", fontSize: 15, maxWidth: "62ch", margin: "10px 0 0" }}>
        {t(locale, "landing.deliver.sub")}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginTop: 22 }}>
        {items.map(([tag, title, desc]) => (
          <div key={tag} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 20px" }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: MONO_FONT,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                color: "var(--brand)",
                background: "var(--brand-wash)",
                border: "1px solid var(--line)",
                borderRadius: 999,
                padding: "3px 10px",
              }}
            >
              {tag}
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 650, margin: "12px 0 6px" }}>{t(locale, title)}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", margin: 0 }}>{t(locale, desc)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Methodenstrenge ---------- */

function Rigor() {
  const [locale] = useLocale();
  const rows: [string, DictKey][] = [
    ["12/12", "landing.rigor.r1"],
    ["m(c) = 0,500", "landing.rigor.r2"],
    ["3", "landing.rigor.r3"],
    ["MIT", "landing.rigor.r4"],
  ];
  return (
    <section style={sectionStyle}>
      <SectionHeading>{t(locale, "landing.rigor.title")}</SectionHeading>
      <div style={{ marginTop: 18, borderTop: "1px solid var(--line)" }}>
        {rows.map(([value, textKey]) => (
          <div
            key={value}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(120px, 160px) 1fr",
              gap: 18,
              alignItems: "baseline",
              padding: "14px 2px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <span style={{ fontFamily: MONO_FONT, fontSize: 17, fontWeight: 600, color: "var(--brand)", whiteSpace: "nowrap" }}>{value}</span>
            <span style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-2)" }}>{t(locale, textKey)}</span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 14, fontSize: 14.5 }}>
        <a href="/methodik" style={{ ...inlineLinkStyle, fontWeight: 600 }}>{t(locale, "landing.rigor.linkMethodik")} →</a>
        <span style={{ color: "var(--muted)" }}>{"  ·  "}</span>
        <a href="https://github.com/brandi1409/openqca" target="_blank" rel="noreferrer" style={{ ...inlineLinkStyle, fontWeight: 600 }}>
          {t(locale, "landing.rigor.linkCode")} →
        </a>
      </p>
    </section>
  );
}

/* ---------- Vergleich ---------- */

function Compare() {
  const [locale] = useLocale();
  const head = ["", "openQCA", "fsQCA 4", t(locale, "landing.compare.colR")];
  const rows: [DictKey, string, string, string][] = [
    ["landing.compare.install", t(locale, "landing.compare.install.a"), t(locale, "landing.compare.install.b"), t(locale, "landing.compare.install.c")],
    ["landing.compare.coach", "✓", "—", "—"],
    ["landing.compare.calib", t(locale, "landing.compare.calib.a"), "✓", t(locale, "landing.compare.calib.c")],
    ["landing.compare.esa", "✓", "✓", "✓"],
    ["landing.compare.export", t(locale, "landing.compare.export.a"), "—", t(locale, "landing.compare.export.c")],
    ["landing.compare.oss", "MIT", t(locale, "landing.compare.oss.b"), "GPL"],
  ];
  const cellStyle: CSSProperties = { padding: "10px 14px", fontSize: 14, lineHeight: 1.5, color: "var(--ink-2)", borderBottom: "1px solid var(--line)", textAlign: "left", verticalAlign: "top" };
  return (
    <section style={sectionStyle}>
      <SectionHeading>{t(locale, "landing.compare.title")}</SectionHeading>
      <div style={{ marginTop: 18, overflowX: "auto", border: "1px solid var(--line)", borderRadius: 12, background: "var(--panel)" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={i} scope="col" style={{ ...cellStyle, fontWeight: 700, color: i === 1 ? "var(--brand)" : "var(--ink)", background: "var(--panel-2)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([labelKey, a, b, c]) => (
              <tr key={labelKey}>
                <th scope="row" style={{ ...cellStyle, fontWeight: 600, color: "var(--ink)" }}>{t(locale, labelKey)}</th>
                <td style={{ ...cellStyle, fontWeight: 600, color: "var(--ink)" }}>{a}</td>
                <td style={cellStyle}>{b}</td>
                <td style={cellStyle}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 12, maxWidth: "70ch" }}>
        {t(locale, "landing.compare.note")}
      </p>
    </section>
  );
}

/* ---------- Funktionsliste (kompakt) ---------- */

function FeatureList() {
  const [locale] = useLocale();
  const items: DictKey[] = [
    "landing.fl.i1",
    "landing.fl.i2",
    "landing.fl.i3",
    "landing.fl.i4",
    "landing.fl.i5",
    "landing.fl.i6",
    "landing.fl.i7",
    "landing.fl.i8",
  ];
  return (
    <section id="funktionen" style={sectionStyle}>
      <SectionHeading>{t(locale, "landing.fl.title")}</SectionHeading>
      <ul
        style={{
          listStyle: "none",
          margin: "18px 0 0",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "10px 26px",
        }}
      >
        {items.map((key) => (
          <li key={key} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
            <span aria-hidden style={{ color: "var(--good-text)", fontWeight: 700 }}>✓</span>
            <span>{t(locale, key)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- In drei Schritten ---------- */

function Steps() {
  const [locale] = useLocale();
  const steps: [string, DictKey, DictKey][] = [
    ["1", "landing.steps.step1.title", "landing.steps.step1.desc"],
    ["2", "landing.steps.step2.title", "landing.steps.step2.desc"],
    ["3", "landing.steps.step3.title", "landing.steps.step3.desc"],
  ];
  return (
    <section style={sectionStyle}>
      <SectionHeading>{t(locale, "landing.steps.title")}</SectionHeading>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 22 }}>
        {steps.map(([n, title, desc]) => (
          <div key={n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span
              aria-hidden
              style={{
                flex: "none",
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "var(--brand)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {n}
            </span>
            <div>
              <h3 style={{ fontSize: 15.5, fontWeight: 650, margin: "4px 0 4px" }}>{t(locale, title)}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-2)", margin: 0 }}>{t(locale, desc)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Local-first ---------- */

function Privacy() {
  const [locale] = useLocale();
  return (
    <section style={sectionStyle}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 26, alignItems: "start", background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, padding: "24px 24px" }}>
        <div>
          <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 700, letterSpacing: "-0.005em", margin: "0 0 12px" }}>
            {t(locale, "landing.privacy.title")}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)", margin: 0 }}>
            {t(locale, "landing.privacy.body")}
          </p>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <PrivacyItem>{t(locale, "landing.privacy.li1")}</PrivacyItem>
          <PrivacyItem>{t(locale, "landing.privacy.li2")}</PrivacyItem>
          <PrivacyItem>
            {t(locale, "landing.privacy.li3.pre")}
            <a href="/rechtliches/impressum" style={inlineLinkStyle}>{t(locale, "landing.privacy.li3.impressum")}</a>
            {" · "}
            <a href="/rechtliches/datenschutz" style={inlineLinkStyle}>{t(locale, "landing.privacy.li3.datenschutz")}</a>
          </PrivacyItem>
        </ul>
      </div>
    </section>
  );
}

function PrivacyItem({ children }: { children: ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 14.5, color: "var(--ink-2)" }}>
      <span aria-hidden style={{ color: "var(--good-text)", fontWeight: 700, lineHeight: 1.5 }}>✓</span>
      <span>{children}</span>
    </li>
  );
}

/* ---------- Tarif-Teaser ---------- */

function PricingTeaser() {
  const [locale] = useLocale();
  return (
    <section style={sectionStyle}>
      <SectionHeading>{t(locale, "landing.pricing.title")}</SectionHeading>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 22 }}>
        <MiniCard name={t(locale, "landing.pricing.free.name")} desc={t(locale, "landing.pricing.free.desc")} />
        <MiniCard name={t(locale, "landing.pricing.cloud.name")} desc={t(locale, "landing.pricing.cloud.desc")} />
      </div>
      <p style={{ marginTop: 16 }}>
        <a href="/preise" style={{ ...inlineLinkStyle, fontSize: 14.5, fontWeight: 600 }}>
          {t(locale, "landing.pricing.allDetails")} →
        </a>
      </p>
    </section>
  );
}

function MiniCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 20px" }}>
      <h3 style={{ fontSize: 17, fontWeight: 650, margin: "0 0 8px" }}>{name}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-2)", margin: 0 }}>{desc}</p>
    </div>
  );
}

/* ---------- Download-Teaser ---------- */

function DownloadTeaser() {
  const [locale] = useLocale();
  return (
    <section style={sectionStyle}>
      <div style={{ background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 14, padding: "24px 24px", display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ maxWidth: "56ch" }}>
          <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 22, fontWeight: 700, letterSpacing: "-0.005em", margin: "0 0 8px" }}>
            {t(locale, "landing.download.title")}
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)", margin: 0 }}>
            {t(locale, "landing.download.body")}
          </p>
        </div>
        <CtaButton href="/download" primary>{t(locale, "landing.download.cta")}</CtaButton>
      </div>
    </section>
  );
}

/* ---------- CTA-Band ---------- */

function CtaBand() {
  const [locale] = useLocale();
  return (
    <section style={{ background: "var(--brand-wash)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", marginTop: 20 }}>
      <div style={{ ...sectionStyle, paddingTop: 48, paddingBottom: 48, textAlign: "center" }}>
        <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 30, fontWeight: 700, letterSpacing: "-0.008em", margin: "0 auto", maxWidth: "26ch" }}>
          {t(locale, "landing.cta.title")}
        </h2>
        <div style={{ marginTop: 22 }}>
          <CtaButton href="/app?demo=1" primary large>{t(locale, "landing.h.ctaDemo")}</CtaButton>
        </div>
      </div>
    </section>
  );
}

/* ---------- Bausteine ---------- */

const sectionStyle: CSSProperties = { maxWidth: 1080, margin: "0 auto", padding: "44px 26px" };

const inlineLinkStyle: CSSProperties = { color: "var(--accent-deep)", textDecoration: "none" };

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 28, fontWeight: 700, letterSpacing: "-0.008em", margin: 0 }}>
      {children}
    </h2>
  );
}

function CtaButton({ href, children, primary, large }: { href: string; children: ReactNode; primary?: boolean; large?: boolean }) {
  return (
    <a
      href={href}
      style={{
        display: "inline-block",
        font: "inherit",
        fontWeight: 600,
        fontSize: large ? 15.5 : 14,
        textDecoration: "none",
        borderRadius: 8,
        padding: large ? "11px 22px" : "8px 15px",
        border: primary ? "1px solid var(--accent)" : "1px solid var(--line)",
        background: primary ? "var(--accent)" : "var(--panel)",
        color: primary ? "#fff" : "var(--ink)",
      }}
    >
      {children}
    </a>
  );
}
