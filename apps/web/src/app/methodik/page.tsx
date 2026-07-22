import fs from "node:fs";
import path from "node:path";
import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import { renderMarkdown } from "@/lib/markdown";
import { Formula } from "@/lib/formulas";
import { METHODOLOGY_REFERENCES } from "@/lib/protocol-export";

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
      <a href="/app" style={backLinkStyle}>
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

      <FormulaReference />
    </div>
  );
}

/**
 * Formel-Referenz: dokumentiert exakt die Berechnungen aus packages/engine.
 * Jede Karte verweist auf die Quelldatei/-funktion, die sie beschreibt — bei
 * Zweifeln gilt immer der dort implementierte Code, nicht dieser Text.
 */
function FormulaReference() {
  return (
    <section style={formulaSectionStyle}>
      <h2 style={h2Style}>Formeln &amp; Definitionen (exakt wie implementiert)</h2>
      <p style={introStyle}>
        Die folgenden Definitionen entsprechen wörtlich der Implementierung in{" "}
        <span className="mono">packages/engine</span>. Sie dienen als exakte
        Referenz für die Formeln, die openQCA tatsächlich berechnet — nicht als
        allgemeine Einführung (dafür siehe den Primer oben).
      </p>

      {FORMULA_CARDS.map((card) => (
        <FormulaCard key={card.id} card={card} />
      ))}

      <div style={literatureStyle}>
        <h3 style={h3Style}>Literatur</h3>
        <ul style={literatureListStyle}>
          <li>
            Ragin, C. C. (2006). Set Relations in Social Research: Evaluating
            Their Consistency and Coverage. <em>Political Analysis</em>, 14(3),
            291–310.
          </li>
          <li>
            Ragin, C. C. (2008). <em>Redesigning Social Inquiry: Fuzzy Sets and
            Beyond</em>. University of Chicago Press.
          </li>
          <li>
            Ragin, C. C., &amp; Sonnett, J. (2005). Between Complexity and
            Parsimony: Limited Diversity, Counterfactual Cases, and
            Comparative Analysis. In S. Kropp &amp; M. Minkenberg (Hrsg.),{" "}
            <em>Vergleichen in der Politikwissenschaft</em>. VS Verlag.
          </li>
          <li>
            Schneider, C. Q., &amp; Wagemann, C. (2012).{" "}
            <em>Set-Theoretic Methods for the Social Sciences: A Guide to
            Qualitative Comparative Analysis</em>. Cambridge University Press.
          </li>
          <li>
            Dușa, A. (2019). <em>QCA with R: A Comprehensive Resource</em>.
            Springer.
          </li>
        </ul>
        <h3 style={{ ...h3Style, marginTop: 24 }}>Verifizierte Referenzen für Kalibrierung und Robustheit</h3>
        <ul style={literatureListStyle}>
          {METHODOLOGY_REFERENCES.map((reference) => (
            <li key={reference.id}>
              {reference.citation}
              {reference.pages ? `, S. ${reference.pages}` : ""}.{" "}
              {reference.scope}.{" "}
              <a href={reference.url} target="_blank" rel="noreferrer">
                {reference.doi ? `DOI: ${reference.doi}` : reference.url}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

interface FormulaCardData {
  id: string;
  title: string;
  formulas: string[];
  body: ReactNode;
  source: string;
  code: string;
}

function FormulaCard({ card }: { card: FormulaCardData }) {
  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>{card.title}</h3>
      {card.formulas.map((tex, i) => (
        <Formula key={i} tex={tex} display />
      ))}
      <div style={cardBodyStyle}>{card.body}</div>
      <p style={cardMetaStyle}>
        Quelle: {card.source}
        <br />
        Implementiert in <span className="mono">{card.code}</span>
      </p>
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

const formulaSectionStyle: CSSProperties = {
  marginTop: 40,
  maxWidth: 760,
};

const h2Style: CSSProperties = {
  fontSize: 20,
  fontWeight: 650,
  letterSpacing: "-0.005em",
  color: "var(--ink)",
  margin: "0 0 12px",
  paddingBottom: 6,
  borderBottom: "1px solid var(--line)",
};

const h3Style: CSSProperties = {
  fontSize: 15.5,
  fontWeight: 650,
  color: "var(--ink)",
  margin: "0 0 10px",
};

const introStyle: CSSProperties = {
  margin: "0 0 22px",
  color: "var(--ink-2)",
  lineHeight: 1.7,
  fontSize: 14.5,
};

const cardStyle: CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 12,
  padding: "18px 20px",
  marginBottom: 18,
};

const cardTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 650,
  color: "var(--ink)",
  margin: "0 0 10px",
};

const cardBodyStyle: CSSProperties = {
  marginTop: 4,
};

const cardTextStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "var(--ink-2)",
  lineHeight: 1.7,
  fontSize: 14.5,
};

const cardMetaStyle: CSSProperties = {
  margin: "12px 0 0",
  paddingTop: 10,
  borderTop: "1px solid var(--line-soft)",
  color: "var(--muted)",
  fontSize: 13.5,
  lineHeight: 1.6,
};

const literatureStyle: CSSProperties = {
  marginTop: 28,
};

const literatureListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 22,
  color: "var(--ink-2)",
  lineHeight: 1.7,
  fontSize: 14,
};

const FORMULA_CARDS: FormulaCardData[] = [
  {
    id: "calibration-direct",
    title: "Direkte Kalibrierung (logistisch)",
    formulas: [
      String.raw`l(x) = \begin{cases} \dfrac{3(x-c)}{i-c} & x \ge c \\[6pt] \dfrac{3(x-c)}{c-e} & x < c \end{cases}`,
      String.raw`m(x) = \dfrac{1}{1+e^{-l(x)}}`,
    ],
    body: (
      <>
        <p style={cardTextStyle}>
          Wandelt einen Rohwert x anhand dreier Anker in eine Fuzzy-Set-
          Zugehörigkeit m(x) ∈ [0, 1] um: e (voll draußen), c (Kreuzungspunkt,
          0,5-Grenze) und i (voll drinnen), mit e &lt; c &lt; i. Zunächst wird
          ein log-odds-Wert l(x) linear zum Abstand von c berechnet — mit
          unterschiedlicher Steigung ober- und unterhalb des Kreuzungspunkts —,
          anschließend liefert die logistische Funktion die Zugehörigkeit.
        </p>
        <p style={cardTextStyle}>
          Daraus ergeben sich exakte Fixpunkte: m(c) = 0,5, m(i) = 1/(1+e⁻³) ≈
          0,9526 und m(e) = 1/(1+e³) ≈ 0,0474. Diese drei Werte sind ein guter
          Test, ob eine Kalibrierung korrekt implementiert ist.
        </p>
      </>
    ),
    source: "Ragin (2008), Kap. 5.",
    code: "packages/engine/src/calibrate.ts (calibrateDirect)",
  },
  {
    id: "calibration-linear",
    title: "Lineare Fuzzy-Kalibrierung (stückweise)",
    formulas: [
      String.raw`m(x) = \begin{cases} 0 & x \le e \\[2pt] \dfrac{1}{2}\dfrac{x-e}{c-e} & e < x < c \\[6pt] \dfrac{1}{2}+\dfrac{1}{2}\dfrac{x-c}{i-c} & c \le x < i \\[6pt] 1 & x \ge i \end{cases}`,
    ],
    body: (
      <p style={cardTextStyle}>
        Verbindet dieselben drei qualitativen Anker — e (voll draußen), c
        (Kreuzungspunkt, 0,5) und i (voll drinnen) — mit zwei linearen
        Teilstücken. Werte außerhalb der Anker werden auf 0 bzw. 1 begrenzt;
        bei c ergibt sich exakt 0,5. Das ist die stückweise-lineare Variante
        von <span className="mono">QCA::calibrate(logistic = FALSE)</span>, nicht
        eine automatische Wahl der Anker aus der Datenverteilung.
      </p>
    ),
    source: "Dusa (2019), QCA with R; R-Paket QCA::calibrate(logistic = FALSE).",
    code: "packages/engine/src/calibrate.ts (calibrateLinear)",
  },
  {
    id: "fuzzy-operations",
    title: "Fuzzy-Operationen (Zadeh)",
    formulas: [
      String.raw`\neg x = 1-x \qquad x \wedge y = \min(x,y) \qquad x \vee y = \max(x,y)`,
      String.raw`m_T(u) = \min_{j \in T} \ell_j(u) \qquad\qquad m_S(u) = \max_{T \in S} m_T(u)`,
    ],
    body: (
      <p style={cardTextStyle}>
        Negation, UND und ODER folgen der Zadeh&apos;schen Fuzzy-Logik: Negation
        ist 1 − x, UND ist das Minimum, ODER das Maximum der beteiligten
        Zugehörigkeiten. Die Zugehörigkeit eines Terms (einer Konjunktion von
        Bedingungen/Negationen, „Pfad&quot;) zu einem Fall u ist das Minimum über
        seine literalen Bedingungen ℓⱼ; eliminierte (don&apos;t-care) Bedingungen
        tragen nicht zum Minimum bei. Die Zugehörigkeit einer gesamten Lösung
        ist das Maximum über alle ihre Terme (Pfade).
      </p>
    ),
    source: "Zadeh-Fuzzy-Logik, Standard in Ragin (2008).",
    code: "packages/engine/src/solutions.ts (termMembership, membershipOf)",
  },
  {
    id: "consistency",
    title: "Konsistenz der Hinreichendheit",
    formulas: [String.raw`\mathrm{incl}(X \to Y) = \dfrac{\displaystyle\sum_i \min(X_i, Y_i)}{\displaystyle\sum_i X_i}`],
    body: (
      <p style={cardTextStyle}>
        Misst, in welchem Ausmaß die Fälle, die X (eine Bedingung, einen Pfad
        oder eine Truth-Table-Konfiguration) erfüllen, auch das Outcome Y
        erfüllen — also wie gut die Teilmengenbeziehung X ⊆ Y empirisch
        eingehalten wird. Werte nahe 1 bedeuten fast perfekte Hinreichendheit;
        in der Praxis gilt oft ≥ 0,75 (teils ≥ 0,8) als Mindestschwelle für
        eine als hinreichend akzeptierte Konfiguration.
      </p>
    ),
    source: "Ragin (2006).",
    code: "packages/engine/src/measures.ts (inclusionConsistency); auch in truthTable.ts und solutions.ts verwendet",
  },
  {
    id: "coverage",
    title: "Coverage der Hinreichendheit (Raw & Unique)",
    formulas: [
      String.raw`\mathrm{cov}(X \to Y) = \dfrac{\displaystyle\sum_i \min(X_i, Y_i)}{\displaystyle\sum_i Y_i}`,
      String.raw`\mathrm{cov}_U(P) = \dfrac{\displaystyle\sum_i \min(S_i,Y_i) - \sum_i \min(S^-_i,Y_i)}{\displaystyle\sum_i Y_i}`,
    ],
    body: (
      <p style={cardTextStyle}>
        Coverage zeigt, welcher Anteil der Fälle mit Outcome Y durch X erklärt
        wird — die empirische Relevanz eines hinreichenden Pfades. Raw Coverage
        wird je Pfad mit dessen Zugehörigkeit als X berechnet. Unique Coverage
        isoliert den Beitrag, der ausschließlich diesem Pfad zuzuschreiben ist:
        S ist die Zugehörigkeit zur gesamten Lösung (Maximum über alle Pfade),
        S⁻ dieselbe Zugehörigkeit ohne den betrachteten Pfad — die Differenz
        ergibt dessen Alleinstellungs-Beitrag zur Gesamtcoverage.
      </p>
    ),
    source: "Ragin (2006).",
    code: "packages/engine/src/measures.ts (rawCoverage); packages/engine/src/solutions.ts (computeModel)",
  },
  {
    id: "pri",
    title: "PRI (Proportional Reduction in Inconsistency)",
    formulas: [
      String.raw`\mathrm{PRI} = \dfrac{\displaystyle\sum_i \min(X_i,Y_i) - \sum_i \min(X_i,Y_i,1-Y_i)}{\displaystyle\sum_i X_i - \sum_i \min(X_i,Y_i,1-Y_i)}`,
    ],
    body: (
      <p style={cardTextStyle}>
        PRI deckt auf, ob X gleichzeitig eine Teilmenge von Y UND eine
        Teilmenge von dessen Komplement ~Y ist — ein Fall, den die einfache
        Konsistenz übersehen kann, weil ein hoher Rohwert trotzdem mit
        substanzieller Übereinstimmung mit ~Y einhergehen kann (simultane
        Subset-Beziehung). Fällt PRI deutlich niedriger aus als die
        Rohkonsistenz, ist das ein Warnsignal für eine solche Ambiguität und ein
        Grund, die Konfiguration genauer zu prüfen.
      </p>
    ),
    source: "Schneider & Wagemann (2012); Ragin (2008).",
    code: "packages/engine/src/measures.ts (priConsistency); auch in truthTable.ts (Zeilen-PRI)",
  },
  {
    id: "necessity",
    title: "Notwendigkeit",
    formulas: [
      String.raw`\mathrm{incl}_{\text{nec}}(Y \to X) = \dfrac{\displaystyle\sum_i \min(X_i,Y_i)}{\displaystyle\sum_i Y_i}`,
      String.raw`\mathrm{cov}_{\text{nec}}(Y \to X) = \dfrac{\displaystyle\sum_i \min(X_i,Y_i)}{\displaystyle\sum_i X_i}`,
    ],
    body: (
      <p style={cardTextStyle}>
        Prüft die umgekehrte Teilmengenbeziehung Y ⊆ X: ist eine Bedingung
        notwendig für das Outcome? Die Notwendigkeits-Konsistenz misst, wie gut
        X die Fälle mit Y abdeckt; konventionell gilt ein Wert ≥ 0,90 als
        Kandidat für eine notwendige Bedingung. Die Notwendigkeits-Coverage
        (ein Relevanz-Hinweis) zeigt, wie trivial ein hoher Konsistenzwert sein
        kann — ist X selbst schon fast immer erfüllt, sagt hohe Konsistenz
        wenig aus. Die Implementierung prüft dies für jede Bedingung und ihre
        Negation.
      </p>
    ),
    source: "Ragin (2006); Schneider & Wagemann (2012).",
    code: "packages/engine/src/measures.ts (necessityConsistency, necessityCoverage); packages/engine/src/solutions.ts (necessityAnalysis)",
  },
  {
    id: "truth-table",
    title: "Truth-Table-Zuordnung",
    formulas: [
      String.raw`m_i = \min_j \ell_j(x_{ij}), \qquad \ell_j = \begin{cases} x_{ij} & \text{Bit}_j = 1 \\ 1-x_{ij} & \text{Bit}_j = 0 \end{cases}`,
    ],
    body: (
      <>
        <p style={cardTextStyle}>
          Für jede der 2ᵏ logisch möglichen Konfigurationen erhält jeder Fall
          eine kontinuierliche Zugehörigkeit mᵢ (Minimum über die literalen
          Bedingungen). Formal einer Konfiguration zugeordnet wird ein Fall
          aber nur, wenn er in jeder Bedingung strikt auf der passenden Seite
          von 0,5 liegt (x &gt; 0,5, wenn die Bedingung im Bit vorhanden ist;
          x ≤ 0,5, wenn sie negiert ist) UND zusätzlich mᵢ &gt; 0,5 gilt. Fälle
          mit exakt 0,5 in mindestens einer Bedingung werden separat vermerkt —
          das klassische „0,5-Problem&quot;, bei dem eine eindeutige Zuordnung
          nicht möglich ist.
        </p>
        <p style={cardTextStyle}>
          Zeilen-Konsistenz und Zeilen-PRI werden dagegen über alle Fälle mit
          ihrer kontinuierlichen Zugehörigkeit mᵢ berechnet — analog zu Konsistenz
          und PRI oben, mit X = mᵢ.
        </p>
      </>
    ),
    source: "Ragin (2008); Schneider & Wagemann (2012).",
    code: "packages/engine/src/truthTable.ts (buildTruthTable)",
  },
  {
    id: "solution-types",
    title: "Lösungstypen: konservativ, sparsam, intermediär",
    formulas: [],
    body: (
      <p style={cardTextStyle}>
        Die konservative (komplexe) Lösung minimiert ausschließlich anhand
        beobachteter, positiver Konfigurationen — keine Remainder (unbeobachtete
        Kombinationen) werden als Vereinfachungsannahme zugelassen, was zu
        einer wenig reduzierten, aber „sicheren&quot; Lösung führt. Die sparsame
        Lösung lässt umgekehrt alle Remainder als Vereinfachungsannahmen zu,
        unabhängig von inhaltlicher Plausibilität, und liefert die kürzestmögliche
        Lösung. Die intermediäre Lösung (Enhanced Standard Analysis) liegt
        dazwischen: Nur Remainder, die den vorab festgelegten Richtungserwartungen
        je Bedingung entsprechen („easy counterfactuals&quot;), werden als
        Vereinfachungsannahme zugelassen.
      </p>
    ),
    source: "Ragin & Sonnett (2005).",
    code: "packages/engine/src/solutions.ts (complexSolution, parsimoniousSolution, intermediateSolution)",
  },
];
