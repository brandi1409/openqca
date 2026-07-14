import type { CSSProperties } from "react";

interface FooterLink {
  href: string;
  label: string;
}

const LINKS: readonly FooterLink[] = [
  { href: "/methodik", label: "Methodik" },
  { href: "/rechtliches/impressum", label: "Impressum" },
  { href: "/rechtliches/datenschutz", label: "Datenschutz" },
  { href: "/rechtliches/agb", label: "AGB" },
];

/**
 * Schlichter Seiten-Footer (Server-Komponente, kein Client-State nötig).
 * Verlinkt Methodik und die Rechtstexte und weist auf den Open-Source-Charakter
 * hin. Oben eine Trennlinie (var(--line)); gestylt ausschließlich über die
 * CSS-Variablen aus globals.css.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={footerStyle}>
      <div style={innerStyle}>
        <nav aria-label="Rechtliches und Dokumentation" style={navStyle}>
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} style={linkStyle}>
              {link.label}
            </a>
          ))}
        </nav>
        <p style={noteStyle}>
          © {year} openQCA · Open Source (MIT)
        </p>
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
