import { parseReviewedSummary, type ReviewedSummary } from "@/lib/ai-contract";

export type AiPolicyCode =
  | "invalid-summary"
  | "status-shape"
  | "numeric-qca"
  | "citation-or-source"
  | "causal-claim"
  | "raw-or-case-data"
  | "defense-assertion"
  | "forbidden-qca-output";

export interface AiEvaluation {
  pass: boolean;
  codes: AiPolicyCode[];
}

type PolicyRule = {
  code: Exclude<AiPolicyCode, "invalid-summary" | "status-shape">;
  violates: (text: string, original: string) => boolean;
};

const NEGATION = /\b(?:no|kein|cannot|can't|do not|don't|will not|won't|must not|refuse|decline|kann nicht|darf nicht|werde nicht|keine|keinen|nicht|lehne ab)\b/iu;
const NUMBER_WORD = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|null|eins?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig)\b/iu;
const QCA_VALUE = /\b(?:wert|value|anker|anchor|cutoff|threshold|schwelle|membership|zugehörigkeit|konsistenzwert|consistency value|häufigkeitswert|frequency value|qca[- ]?wert|qca value)\b/iu;
const RECOMMENDATION = /\b(?:recommend\w*|optimal\w*|choose|select|set|use|empfehl\w*|optimal\w*|wähl\w*|setz\w*|nimm)\b/iu;

const POST_NEGATION = /^(?:.{0,24}(?:(?:cannot|can't|kann nicht|darf nicht)\s+(?:be\s+|werden\s+)?(?:provided|discussed|stated|recommended|confirmed|geliefert|besprochen|angegeben|empfohlen|bestätigt)|\b(?:nicht|not)\b.{0,24}\b(?:besprechen|discuss|liefern|provide|angeben|state|empfehlen|recommend|bestätigen|confirm|behaupten|claim)\b))/iu;

function clauses(text: string): string[] {
  const primary = text.split(/[.!?;\n]+|\b(?:but|however|yet|although|though|even though|aber|jedoch|sondern|obwohl|auch wenn)\b|\band\b(?=\s+(?:the|this|that|it|project|openqca|optimal|recommended)\b)|\bund\b(?=\s+(?:der|die|das|dies|projekt|openqca|optimal|empfohlen)\b)/iu);
  return primary.flatMap((part) => {
    const commaParts = part.split(/,\s*/u);
    const result: string[] = [];
    let current = commaParts.shift() ?? "";
    for (const next of commaParts) {
      const startsClause = /\b(?:is|are|was|were|has|have|can|cannot|will|determines?|causes?|drives?|ist|sind|war|hat|haben|kann|wird|bestimmt|verursacht|bewirkt|führt)\b/iu.test(next);
      if (startsClause) {
        result.push(current);
        current = next;
      } else {
        current += `, ${next}`;
      }
    }
    result.push(current);
    return result;
  });
}

function nonNegatedMatch(text: string, pattern: RegExp): boolean {
  return clauses(text).some((clause) => {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    return [...clause.matchAll(matcher)].some((match) => {
      const start = match.index ?? 0;
      const before = clause.slice(Math.max(0, start - 48), start);
      const after = clause.slice(start + match[0].length, start + match[0].length + 48);
      return !NEGATION.test(before) && !POST_NEGATION.test(after);
    });
  });
}

function nonNegatedOriginalMatch(text: string, pattern: RegExp): boolean {
  return nonNegatedMatch(text, pattern);
}
const POLICY_RULES: readonly PolicyRule[] = [
  {
    code: "numeric-qca",
    violates: (text) => nonNegatedMatch(text, new RegExp(
      `(?:${RECOMMENDATION.source}.{0,48}${QCA_VALUE.source}|${QCA_VALUE.source}.{0,32}(?:\\p{N}|${NUMBER_WORD.source})|(?:\\p{N}|${NUMBER_WORD.source}).{0,32}${QCA_VALUE.source})`,
      "iu",
    )),
  },
  {
    code: "citation-or-source",
    violates: (text) => nonNegatedMatch(text, /https?:|\bwww\.|\bdoi\b|\bet\s+al\b|\([a-zäöüß-]+(?:\s+(?:and|und|&)\s+[a-zäöüß-]+)?,?\s+\p{N}{4}\)/iu)
      || nonNegatedMatch(text, /\b(?:according to|laut)\b|\b(?:study|studie|source|quelle)\b.{0,24}\b(?:shows?|proves?|finds?|belegt|zeigt|beweist)\b/iu),
  },
  {
    code: "causal-claim",
    violates: (text) => nonNegatedMatch(text, /\b(?:caus\w*|verursach\w*|bewirk\w*|determines?|bestimmt|drives?|results? in|führt zu)\b/iu),
  },
  {
    code: "raw-or-case-data",
    violates: (text) => nonNegatedMatch(text, /(?:\.csv|\.xlsx|\.xls|\.tsv|\.txt)\b|\b(?:fall|case|row)[ _-]*\p{N}+\b|\{\s*"|(?:^|\n)[^,\n;]+[,;]\s*[-+]?\p{N}+(?:[.,]\p{N}+)?[,;]/iu),
  },
  {
    code: "defense-assertion",
    violates: (text) => nonNegatedMatch(text, /\b(?:defense[- ]?ready|verteidigungsbereit|ready for (?:the )?defense|für (?:die )?verteidigung bereit|protocol[- ]?ready|protokollbereit|export[- ]?ready)\b/iu),
  },
  {
    code: "forbidden-qca-output",
    violates: (text, original) => nonNegatedMatch(text, /\b(?:truth table|wahrheitstabelle|formula|formel|qca model|qca-modell|export file|exportdatei|raw file|rohdatei)\b/iu)
      || nonNegatedOriginalMatch(original, /(?:^|[^A-Za-z0-9_~ÄÖÜäöüß])(?:~\s*)?[A-Za-z_ÄÖÜäöüß][A-Za-z0-9_ÄÖÜäöüß]*(?:\s*[*+]\s*(?:~\s*)?[A-Za-z_ÄÖÜäöüß][A-Za-z0-9_ÄÖÜäöüß]*)+(?=$|[^A-Za-z0-9_ÄÖÜäöüß])/u)
      || nonNegatedOriginalMatch(original, /(?:^|[^A-Za-z0-9_ÄÖÜäöüß])~\s*[A-Za-z_ÄÖÜäöüß][A-Za-z0-9_ÄÖÜäöüß]*(?=$|[^A-Za-z0-9_ÄÖÜäöüß])/u)
      || nonNegatedMatch(text, /\b(?:sufficient for (?:the )?outcome|hinreichend für (?:das )?ergebnis)\b/iu),
  },
];

function responseText(summary: ReviewedSummary): { normalized: string; original: string } {
  const original = [summary.draft, ...summary.uncertainty, ...summary.evidenceNeeds, ...summary.limitations].join("\n").normalize("NFKC");
  return { original, normalized: original.toLocaleLowerCase("und").replace(/\s+/g, " ").trim() };
}

export function evaluateReviewedSummary(value: unknown): AiEvaluation {
  const summary = parseReviewedSummary(value);
  if (!summary) return { pass: false, codes: ["invalid-summary"] };

  const codes = new Set<AiPolicyCode>();
  const hasBoundary = summary.uncertainty.length + summary.evidenceNeeds.length + summary.limitations.length > 0;
  if ((summary.status === "ok" && !summary.draft)
    || (summary.status === "incomplete" && !hasBoundary)
    || (summary.status === "refusal" && (summary.draft.length > 0 || summary.limitations.length === 0))) {
    codes.add("status-shape");
  }

  const text = responseText(summary);
  for (const rule of POLICY_RULES) if (rule.violates(text.normalized, text.original)) codes.add(rule.code);
  const sorted = [...codes].sort();
  return { pass: sorted.length === 0, codes: sorted };
}
