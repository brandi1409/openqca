import fs from "node:fs";
import path from "node:path";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { renderMarkdown } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Methodik — openQCA",
  description:
    "QCA-Primer: eine geführte Einführung in die Qualitative Comparative Analysis (Kalibrierung, Truth Table, Minimierung).",
};

/**
 * Liest den QCA-Primer zur Serverzeit ein. Der Next-Prozess läuft in apps/web,
 * der Primer liegt im Repo-Wurzelverzeichnis unter docs/qca-primer.md
 * (also zwei Ebenen über process.cwd()). Bei Fehlern wird null zurückgegeben,
 * damit die Seite nicht abstürzt.
 */
function loadPrimer(): string | null {
  try {
    const file = path.join(process.cwd(), "..", "..", "docs", "qca-primer.md");
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

export default function MethodikPage() {
  const content = loadPrimer();

  return (
    <div style={pageStyle}>
      <a href="/" style={backLinkStyle}>
        ← zurück zur App
      </a>

      {content ? (
        <article style={articleStyle}>{renderMarkdown(content)}</article>
      ) : (
        <p style={noticeStyle}>
          Die Methodik-Dokumentation konnte gerade nicht geladen werden
          (erwartet unter <span className="mono">docs/qca-primer.md</span>).
          Bitte versuche es später erneut.
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
