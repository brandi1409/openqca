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
    <section style={{ ...sectionStyle, paddingTop: 64, paddingBottom: 20, textAlign: "center" }}>
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
    </section>
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
