import type { CSSProperties, ReactNode } from "react";

/**
 * Minimaler, abhängigkeitsfreier Markdown-Renderer für den QCA-Primer.
 *
 * Es wird bewusst KEINE externe Bibliothek und KEIN dangerouslySetInnerHTML
 * verwendet: Der Text wird zeilenweise in Blöcke gruppiert und als echte
 * React-Knoten aufgebaut. Dadurch escaped React sämtlichen Inhalt automatisch.
 *
 * Unterstützt: Überschriften (# / ## / ###), Absätze, Aufzählungen (- / *),
 * nummerierte Listen (1.), Blockzitate (>), horizontale Linien (---), Tabellen
 * (| … |) sowie die Inline-Auszeichnungen `code`, **fett**, *kursiv* und
 * [Text](Ziel).
 */

// ---------------------------------------------------------------------------
// Inline-Formatierung
// ---------------------------------------------------------------------------

const INLINE_PATTERN =
  "`([^`]+)`" + // 1: code
  "|\\*\\*([^*]+)\\*\\*" + // 2: fett
  "|\\*([^*\\n]+)\\*" + // 3: kursiv
  "|\\[([^\\]]+)\\]\\(([^)]+)\\)"; // 4: Linktext, 5: Ziel

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = new RegExp(INLINE_PATTERN, "g");
  let last = 0;
  let n = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyPrefix}-i${n++}`;

    if (m[1] !== undefined) {
      out.push(
        <code key={key} className="mono" style={codeStyle}>
          {m[1]}
        </code>,
      );
    } else if (m[2] !== undefined) {
      // rekursiv, damit z. B. `code` innerhalb von **fett** erhalten bleibt
      out.push(<strong key={key}>{renderInline(m[2], key)}</strong>);
    } else if (m[3] !== undefined) {
      out.push(<em key={key}>{renderInline(m[3], key)}</em>);
    } else if (m[4] !== undefined) {
      const label = m[4].replace(/`/g, "");
      const href = m[5];
      if (/^https?:\/\//.test(href)) {
        out.push(
          <a key={key} href={href} target="_blank" rel="noreferrer" style={linkStyle}>
            {label}
          </a>,
        );
      } else {
        // Relative Verweise zeigen auf Repo-Dateien, die die App nicht ausliefert
        // – daher als hervorgehobener Text statt als toter Link darstellen.
        out.push(
          <span key={key} style={{ color: "var(--accent-deep)" }}>
            {label}
          </span>,
        );
      }
    }

    last = m.index + m[0].length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

// ---------------------------------------------------------------------------
// Block-Parser
// ---------------------------------------------------------------------------

const isBlank = (s: string): boolean => s.trim() === "";
const isHeading = (s: string): boolean => /^#{1,6}\s/.test(s);
const isHr = (s: string): boolean => /^(-{3,}|\*{3,}|_{3,})\s*$/.test(s.trim());
const isUl = (s: string): boolean => /^\s*[-*]\s+/.test(s);
const isOl = (s: string): boolean => /^\s*\d+\.\s+/.test(s);
const isQuote = (s: string): boolean => /^\s*>/.test(s);
const isTableRow = (s: string): boolean => /^\s*\|/.test(s);

const isSpecial = (s: string): boolean =>
  isHeading(s) || isHr(s) || isUl(s) || isOl(s) || isQuote(s) || isTableRow(s);

function renderTable(rows: string[], keyPrefix: string): ReactNode {
  const cells = (row: string): string[] =>
    row
      .replace(/^\s*\|/, "")
      .replace(/\|\s*$/, "")
      .split("|")
      .map((c) => c.trim());
  const isSeparator = (row: string): boolean =>
    row.includes("-") && /^\s*\|?[\s:|-]+\|?\s*$/.test(row);

  const header = cells(rows[0]);
  const bodyStart = rows[1] && isSeparator(rows[1]) ? 2 : 1;
  const body = rows.slice(bodyStart).map(cells);

  return (
    <div key={keyPrefix} style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {header.map((c, ci) => (
              <th key={ci} style={thStyle}>
                {renderInline(c, `${keyPrefix}-h${ci}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} style={tdStyle}>
                  {renderInline(c, `${keyPrefix}-r${ri}c${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function renderMarkdown(md: string): ReactNode {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;
  const nextKey = (): string => `b${keyCounter++}`;

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i++;
      continue;
    }

    // Überschriften
    if (isHeading(line)) {
      const m = /^(#{1,6})\s+(.*)$/.exec(line);
      if (m) {
        const level = Math.min(m[1].length, 3);
        const key = nextKey();
        const content = renderInline(m[2], key);
        if (level === 1) blocks.push(<h1 key={key} style={h1Style}>{content}</h1>);
        else if (level === 2) blocks.push(<h2 key={key} style={h2Style}>{content}</h2>);
        else blocks.push(<h3 key={key} style={h3Style}>{content}</h3>);
      }
      i++;
      continue;
    }

    // Horizontale Linie
    if (isHr(line)) {
      blocks.push(<hr key={nextKey()} style={hrStyle} />);
      i++;
      continue;
    }

    // Tabelle
    if (isTableRow(line)) {
      const rows: string[] = [];
      while (i < lines.length && isTableRow(lines[i]) && !isBlank(lines[i])) {
        rows.push(lines[i]);
        i++;
      }
      blocks.push(renderTable(rows, nextKey()));
      continue;
    }

    // Blockzitat
    if (isQuote(line)) {
      const parts: string[] = [];
      while (i < lines.length && isQuote(lines[i])) {
        parts.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      const key = nextKey();
      const text = parts.join(" ").trim();
      blocks.push(
        <blockquote key={key} style={quoteStyle}>
          {renderInline(text, key)}
        </blockquote>,
      );
      continue;
    }

    // Aufzählung oder nummerierte Liste
    if (isUl(line) || isOl(line)) {
      const ordered = isOl(line) && !isUl(line);
      const itemRe = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*]\s+(.*)$/;
      const items: ReactNode[] = [];

      while (i < lines.length && !isBlank(lines[i])) {
        const im = itemRe.exec(lines[i]);
        if (!im) break;
        let itemText = im[1];
        i++;
        // eingerückte Folgezeilen gehören zum selben Listenpunkt
        while (
          i < lines.length &&
          !isBlank(lines[i]) &&
          /^\s+/.test(lines[i]) &&
          !itemRe.test(lines[i]) &&
          !isSpecial(lines[i])
        ) {
          itemText += " " + lines[i].trim();
          i++;
        }
        const key = nextKey();
        items.push(
          <li key={key} style={liStyle}>
            {renderInline(itemText, key)}
          </li>,
        );
      }

      const key = nextKey();
      blocks.push(
        ordered ? (
          <ol key={key} style={listStyle}>
            {items}
          </ol>
        ) : (
          <ul key={key} style={listStyle}>
            {items}
          </ul>
        ),
      );
      continue;
    }

    // Absatz: aufeinanderfolgende „normale" Zeilen zusammenfassen
    const para: string[] = [];
    while (i < lines.length && !isBlank(lines[i]) && !isSpecial(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    const text = para.join(" ").trim();
    if (text) {
      const key = nextKey();
      blocks.push(
        <p key={key} style={pStyle}>
          {renderInline(text, key)}
        </p>,
      );
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Styles (CSS-Variablen aus globals.css)
// ---------------------------------------------------------------------------

const codeStyle: CSSProperties = {
  fontSize: "0.88em",
  background: "var(--panel-2)",
  border: "1px solid var(--line)",
  borderRadius: 5,
  padding: "1px 5px",
};

const linkStyle: CSSProperties = {
  color: "var(--accent-deep)",
  textDecoration: "none",
};

const h1Style: CSSProperties = {
  fontSize: 27,
  fontWeight: 680,
  letterSpacing: "-0.01em",
  lineHeight: 1.2,
  color: "var(--ink)",
  margin: "6px 0 16px",
};

const h2Style: CSSProperties = {
  fontSize: 20,
  fontWeight: 650,
  letterSpacing: "-0.005em",
  color: "var(--ink)",
  margin: "38px 0 12px",
  paddingBottom: 6,
  borderBottom: "1px solid var(--line)",
};

const h3Style: CSSProperties = {
  fontSize: 15.5,
  fontWeight: 650,
  color: "var(--ink)",
  margin: "26px 0 8px",
};

const pStyle: CSSProperties = {
  margin: "0 0 14px",
  color: "var(--ink-2)",
  lineHeight: 1.7,
};

const listStyle: CSSProperties = {
  margin: "0 0 16px",
  paddingLeft: 24,
  color: "var(--ink-2)",
  lineHeight: 1.7,
};

const liStyle: CSSProperties = {
  marginBottom: 6,
};

const quoteStyle: CSSProperties = {
  margin: "0 0 16px",
  padding: "10px 16px",
  borderLeft: "3px solid var(--accent)",
  background: "var(--accent-wash)",
  borderRadius: "0 8px 8px 0",
  color: "var(--ink-2)",
  lineHeight: 1.6,
};

const hrStyle: CSSProperties = {
  border: "none",
  borderTop: "1px solid var(--line)",
  margin: "30px 0",
};

const tableWrapStyle: CSSProperties = {
  overflowX: "auto",
  border: "1px solid var(--line)",
  borderRadius: 8,
  margin: "0 0 16px",
};

const tableStyle: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  fontSize: 13.5,
};

const thStyle: CSSProperties = {
  textAlign: "left",
  fontSize: 11.5,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--muted)",
  fontWeight: 700,
  padding: "9px 12px",
  borderBottom: "1px solid var(--line)",
  background: "var(--panel-2)",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--line-soft)",
  color: "var(--ink-2)",
  verticalAlign: "top",
};
