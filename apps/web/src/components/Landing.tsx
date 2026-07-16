"use client";

import type { CSSProperties, ReactNode } from "react";
import { useLocale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";
import { LanguageToggle } from "@/components/LanguageToggle";

/**
 * Öffentliche Landing-Page (Route „/"). Rein präsentativ, zweisprachig über
 * `useLocale` + `t`; alle Texte kommen aus den `landing.*`-Schlüsseln. Das
 * Analyse-Werkzeug lebt unter „/app". Design folgt den CSS-Variablen aus
 * globals.css, damit Light/Dark automatisch greifen.
 */
export function Landing() {
  const [locale] = useLocale();
  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <Features />
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
        <a href="/" style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: "var(--ink)", textDecoration: "none" }}>
          open<span style={{ color: "var(--brand)" }}>QCA</span>
        </a>
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

/* ---------- Hero ---------- */

function Hero() {
  const [locale] = useLocale();
  return (
    <section style={{ ...sectionStyle, paddingTop: 64, paddingBottom: 20 }}>
      <style>{`
        .hero-layout {
          display: grid;
          grid-template-columns: 1fr;
          align-items: center;
          gap: 36px;
        }
        .hero-visual-slot {
          display: flex;
          justify-content: center;
        }
        .hero-visual-slot > div {
          width: 100%;
          max-width: 380px;
        }
        @media (min-width: 900px) {
          .hero-layout {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 40px;
          }
          .hero-visual-slot {
            justify-content: flex-end;
          }
          .hero-visual-slot > div {
            max-width: 460px;
          }
        }
      `}</style>
      <div className="hero-layout">
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "var(--accent-deep)",
              background: "var(--accent-wash)",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "5px 13px",
            }}
          >
            {t(locale, "landing.hero.badge")}
          </span>
          <h1 style={{ fontSize: 40, lineHeight: 1.1, fontWeight: 720, letterSpacing: "-0.02em", margin: "20px auto 0", maxWidth: "16ch" }}>
            {t(locale, "landing.hero.title")}
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 17, lineHeight: 1.55, maxWidth: "56ch", margin: "18px auto 0" }}>
            {t(locale, "landing.hero.subline")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
            <CtaButton href="/app" primary large>{t(locale, "landing.hero.ctaPrimary")}</CtaButton>
            <CtaButton href="/app" large>{t(locale, "landing.hero.ctaSecondary")}</CtaButton>
          </div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 18 }}>
            {t(locale, "landing.hero.facts")}
          </p>
        </div>
        <div className="hero-visual-slot">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/* ---------- Hero-Produktvisual (dekorativ) ---------- */

/** Catmull-Rom → kubische Bézier-Konvertierung für eine glatte Kurve durch Punkte. */
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const segments: string[] = [`M ${points[0].x},${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    segments.push(`C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`);
  }
  return segments.join(" ");
}

type CurvePoint = { x: number; y: number; edge?: boolean };

const CURVE_POINTS: CurvePoint[] = [
  { x: 30, y: 112 },
  { x: 77.5, y: 108 },
  { x: 125, y: 98 },
  { x: 172.5, y: 78, edge: true },
  { x: 220, y: 55, edge: true },
  { x: 267.5, y: 35 },
  { x: 315, y: 20 },
  { x: 362.5, y: 14 },
  { x: 410, y: 10 },
];

const CURVE_PATH = smoothPath(CURVE_POINTS);
const ANCHOR_X = [125, 220, 315];

type TableCell = "0" | "1" | null;

const TABLE_DATA: TableCell[][] = [
  ["1", "1", "0", "1"],
  ["1", "0", "0", "1"],
  ["0", "1", "1", null],
  ["1", null, "1", null],
  [null, null, "0", "1"],
];
const TABLE_HIGHLIGHT_ROW = 1;

const TABLE_X = 24;
const TABLE_Y = 152;
const TABLE_W = 392;
const TABLE_H = 144;
const TABLE_COLS = 4;
const TABLE_ROWS = 5;
const TABLE_GAP_X = 8;
const TABLE_GAP_Y = 6;
const CELL_W = (TABLE_W - TABLE_GAP_X * (TABLE_COLS - 1)) / TABLE_COLS;
const CELL_H = (TABLE_H - TABLE_GAP_Y * (TABLE_ROWS - 1)) / TABLE_ROWS;

/**
 * Dekoratives Mini-Produktvisual: Kalibrierungs-S-Kurve, Truth-Table-Ausschnitt
 * und Lösungsformel. Rein illustrativ (aria-hidden), keine echten Daten.
 */
function HeroVisual() {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={{
        width: "100%",
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 10px 28px rgba(0,0,0,0.07)",
        padding: 20,
      }}
    >
      <svg viewBox="0 0 440 340" width="100%" height="auto" style={{ display: "block" }}>
        {/* Achsen */}
        <line x1={20} y1={122} x2={420} y2={122} stroke="var(--line)" strokeWidth={1} />
        <line x1={20} y1={8} x2={20} y2={122} stroke="var(--line)" strokeWidth={1} />

        {/* Anker-Vertikalen */}
        {ANCHOR_X.map((x) => (
          <line
            key={x}
            x1={x}
            y1={8}
            x2={x}
            y2={122}
            stroke="var(--muted)"
            strokeWidth={1}
            strokeDasharray="4 4"
            strokeOpacity={0.6}
          />
        ))}

        {/* Kalibrierungs-S-Kurve */}
        <path d={CURVE_PATH} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" />
        {CURVE_POINTS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={p.edge ? "var(--warn-text)" : "var(--accent)"} />
        ))}

        {/* Mini Truth-Table */}
        {TABLE_DATA.map((row, r) =>
          row.map((cell, c) => {
            const x = TABLE_X + c * (CELL_W + TABLE_GAP_X);
            const y = TABLE_Y + r * (CELL_H + TABLE_GAP_Y);
            const highlighted = r === TABLE_HIGHLIGHT_ROW;
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={x}
                  y={y}
                  width={CELL_W}
                  height={CELL_H}
                  rx={4}
                  fill={highlighted ? "var(--accent-wash)" : "var(--panel-2)"}
                  stroke="var(--line)"
                  strokeWidth={1}
                />
                {cell !== null && (
                  <text
                    x={x + CELL_W / 2}
                    y={y + CELL_H / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="ui-monospace, SF Mono, Menlo, Consolas, monospace"
                    fontSize={12}
                    fill="var(--ink-2)"
                  >
                    {cell}
                  </text>
                )}
              </g>
            );
          }),
        )}

        {/* Lösungsformel */}
        <text
          x={220}
          y={320}
          textAnchor="middle"
          fontFamily="ui-monospace, SF Mono, Menlo, Consolas, monospace"
          fontSize={16}
          fontWeight={600}
        >
          <tspan fill="var(--ink)">A</tspan>
          <tspan fill="var(--accent-deep)">*</tspan>
          <tspan fill="var(--ink)">B</tspan>
          <tspan fill="var(--accent-deep)"> + </tspan>
          <tspan fill="var(--accent-deep)">~</tspan>
          <tspan fill="var(--ink)">C</tspan>
          <tspan fill="var(--accent-deep)"> → </tspan>
          <tspan fill="var(--ink)">Y</tspan>
        </text>
      </svg>
    </div>
  );
}

/* ---------- Feature-Grid ---------- */

function Features() {
  const [locale] = useLocale();
  const cards: [DictKey, DictKey][] = [
    ["landing.features.calib.title", "landing.features.calib.desc"],
    ["landing.features.truth.title", "landing.features.truth.desc"],
    ["landing.features.robust.title", "landing.features.robust.desc"],
    ["landing.features.repro.title", "landing.features.repro.desc"],
    ["landing.features.report.title", "landing.features.report.desc"],
    ["landing.features.local.title", "landing.features.local.desc"],
  ];
  return (
    <section id="funktionen" style={sectionStyle}>
      <SectionHeading>{t(locale, "landing.features.title")}</SectionHeading>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginTop: 22 }}>
        {cards.map(([title, desc]) => (
          <div key={title} style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 20px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 650, margin: "0 0 8px" }}>{t(locale, title)}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink-2)", margin: 0 }}>{t(locale, desc)}</p>
          </div>
        ))}
      </div>
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
          <h2 style={{ fontSize: 24, fontWeight: 690, letterSpacing: "-0.01em", margin: "0 0 12px" }}>
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
      <span aria-hidden style={{ color: "var(--good-text)", fontWeight: 800, lineHeight: 1.5 }}>✓</span>
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
      <h3 style={{ fontSize: 17, fontWeight: 680, margin: "0 0 8px" }}>{name}</h3>
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
          <h2 style={{ fontSize: 22, fontWeight: 680, letterSpacing: "-0.01em", margin: "0 0 8px" }}>
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
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 auto", maxWidth: "22ch" }}>
          {t(locale, "landing.cta.title")}
        </h2>
        <div style={{ marginTop: 22 }}>
          <CtaButton href="/app" primary large>{t(locale, "landing.cta.button")}</CtaButton>
        </div>
      </div>
    </section>
  );
}

/* ---------- Bausteine ---------- */

const sectionStyle: CSSProperties = { maxWidth: 1080, margin: "0 auto", padding: "44px 26px" };

const inlineLinkStyle: CSSProperties = { color: "var(--accent-deep)", textDecoration: "none" };

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 style={{ fontSize: 26, fontWeight: 690, letterSpacing: "-0.015em", margin: 0 }}>{children}</h2>;
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
