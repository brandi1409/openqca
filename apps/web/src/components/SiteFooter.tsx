"use client";

import type { CSSProperties } from "react";
import { useLocale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";
import { LanguageToggle } from "@/components/LanguageToggle";

interface FooterLink {
  href: string;
  labelKey: DictKey;
}

const LINKS: readonly FooterLink[] = [
  { href: "/methodik", labelKey: "footer.methodik" },
  { href: "/rechtliches/impressum", labelKey: "footer.impressum" },
  { href: "/rechtliches/datenschutz", labelKey: "footer.datenschutz" },
  { href: "/rechtliches/agb", labelKey: "footer.agb" },
];

/**
 * Schlichter Seiten-Footer (Client-Komponente wegen Sprachumschalter).
 * Verlinkt Methodik und die Rechtstexte, weist auf den Open-Source-Charakter
 * hin und trägt einen DE/EN-Umschalter. Die verlinkten Ziele bleiben deutsch;
 * die EN-Linktexte kennzeichnen das mit „(German)“. Oben eine Trennlinie
 * (var(--line)); gestylt ausschließlich über die CSS-Variablen aus globals.css.
 */
export function SiteFooter() {
  const [locale] = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer style={footerStyle}>
      <div style={innerStyle}>
        <nav aria-label={t(locale, "footer.navAria")} style={navStyle}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} style={linkStyle}>
              {t(locale, link.labelKey)}
            </a>
          ))}
        </nav>
        <div style={rightStyle}>
          <p style={noteStyle}>{t(locale, "footer.note", { year })}</p>
          <LanguageToggle />
        </div>
      </div>
    </footer>
  );
}

const footerStyle: CSSProperties = {
  borderTop: "1px solid var(--line)",
  background: "var(--panel-2)",
};

const innerStyle: CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "20px 26px",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const navStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 18,
};

const rightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const linkStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--accent-deep)",
  textDecoration: "none",
};

const noteStyle: CSSProperties = {
  margin: 0,
  fontSize: 12.5,
  color: "var(--muted)",
};
