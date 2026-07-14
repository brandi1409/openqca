import fs from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Datenschutz — openQCA",
  description:
    "Datenschutzerklärung (Entwurf/Muster) von openQCA: local-first, Verarbeitung personenbezogener Daten nach DSGVO.",
};

/**
 * Liest die Datenschutzerklärung zur Serverzeit ein. Der Next-Prozess läuft in
 * apps/web, die Rechtstexte liegen im Repo-Wurzelverzeichnis unter legal/
 * (also zwei Ebenen über process.cwd()). Bei Fehlern wird null zurückgegeben,
 * damit die Seite nicht abstürzt.
 */
function loadDatenschutz(): string | null {
  try {
    const file = path.join(process.cwd(), "..", "..", "legal", "datenschutz.md");
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

export default function DatenschutzPage() {
  const content = loadDatenschutz();

  return (
    <div style={pageStyle}>
      <a href="/" style={backLinkStyle}>
        ← zurück zur App
      </a>

      {content ? (
        <article style={articleStyle}>{renderMarkdown(content)}</article>
      ) : (
        <p style={noticeStyle}>
          Die Datenschutzerklärung konnte gerade nicht geladen werden (erwartet
          unter <span className="mono">legal/datenschutz.md</span>). Bitte
          versuche es später erneut.
        </p>
      )}
    </div>
  );
}

const pageStyle: CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "32px 26px 96px",
};

const backLinkStyle: CSSProperties = {
  display: "inline-block",
  fontSize: 13,
  color: "var(--accent-deep)",
  textDecoration: "none",
  marginBottom: 18,
};

const articleStyle: CSSProperties = {
  color: "var(--ink)",
};

const noticeStyle: CSSProperties = {
  marginTop: 24,
  padding: "14px 16px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "var(--panel-2)",
  color: "var(--ink-2)",
  fontSize: 14,
};
