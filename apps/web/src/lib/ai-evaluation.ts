import {
  parseAiReviewResponse,
  type AiAssistRequest,
  type AiReviewResponse,
} from "@/lib/ai-contract";

export type AiPolicyCode =
  | "invalid-summary"
  | "status-shape"
  | "numeric-qca"
  | "role-selection"
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
  violates: (text: string, original: string, request: AiAssistRequest) => boolean;
};

const NEGATION = /\b(?:no|not|kein|cannot|can't|do not|don't|does not|doesn't|is not|isn't|are not|aren't|was not|wasn't|were not|weren't|will not|won't|must not|should not|shouldn't|could not|couldn't|refuse|decline|kann nicht|darf nicht|werde nicht|keine|keinen|nicht|lehne ab)\b/iu;
const NUMBER_WORD = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|null|eins?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig)\b/iu;
const QCA_VALUE = /\b(?:wert|value|anker|anchor|cutoff|threshold|schwelle|membership|zugehörigkeit|konsistenzwert|consistency value|häufigkeitswert|frequency value|qca[- ]?wert|qca value)\b/iu;
const RECOMMENDATION = /\b(?:recommend\w*|optimal\w*|choose|select|set|use|empfehl\w*|optimal\w*|wähl\w*|setz\w*|nimm)\b/iu;
const ROLE_TERM = /\b(?:role|condition|outcome|ignore|rolle|bedingung|ergebnis|ignorieren)\b/iu;
const ROLE_ASSIGNMENT = /\b(?:treat|classif\w*|label|regard|consider|assign|designat\w*|declare|behandel\w*|klassifizier\w*|kennzeichne\w*|betrachte\w*|weis\w*|zuordn\w*|deklarier\w*)\b.{0,48}\b(?:as|to be|als)\b.{0,24}\b(?:role|condition|outcome|ignore|rolle|bedingung|ergebnis|ignorieren)\b/iu;
const NUMERIC_DIRECTIVE = new RegExp(
  `(?:^\\s*(?:please\\s+|bitte\\s+)?(?:choose|select|set|use|assign|wähl\\w*|setz\\w*|nimm|weis\\w*)|\\b(?:should|must|sollte|muss)\\s+(?:choose|select|set|use|assign|wähl\\w*|setz\\w*|nimm|weis\\w*)).{0,32}(?:\\p{N}|${NUMBER_WORD.source})`,
  "iu",
);
const DECISION_REFERENCE = /\b(?:(?:the|this|our|your)\s+(?:(?:selected|current|chosen)\s+)?(?:decision|choice)|(?:die|diese|unsere|ihre)\s+(?:(?:gewählte|aktuelle)\s+)?(?:entscheidung|wahl))\b/iu;
const SELECTED_DECISION_NUMERIC = new RegExp(
  `(?:${DECISION_REFERENCE.source}\\s*(?:(?:(?:is|was|has been|had been)\\s+set\\s+(?:at|to)|set\\s+(?:at|to)|remains?(?:\\s+fixed)?\\s+at|is|was|equals?|at|(?:wurde|ist|war)\\s+auf|wurde\\s+gesetzt\\s+auf|ist|war|beträgt|bleibt\\s+bei|liegt\\s+bei)\\s*)?(?:[:=]\\s*)?(?:\\p{N}|${NUMBER_WORD.source})|(?:\\p{N}|${NUMBER_WORD.source})\\s+(?:is|was|equals?|remains?|ist|war|entspricht|bleibt)\\s+${DECISION_REFERENCE.source})`,
  "iu",
);
const AUTHOR_YEAR = /\b(\p{Lu}[\p{Ll}’'-]{2,})(?:\s+(?:and|und|&)\s+\p{Lu}[\p{Ll}’'-]{2,})?(?:[’']s)?\s*(?:\(\s*(?:19|20)\p{N}{2}\s*\)|\[\s*(?:19|20)\p{N}{2}\s*\]|,\s*(?:19|20)\p{N}{2}\b|\s+(?:19|20)\p{N}{2}\b)/gu;
const AUTHOR_YEAR_STOP_WORDS = new Set([
  "study",
  "period",
  "research",
  "project",
  "preregistration",
  "universe",
  "comparison",
  "studie",
  "zeitraum",
  "untersuchungszeitraum",
  "forschung",
  "projekt",
  "präregistrierung",
  "universum",
  "vergleich",
  "january",
  "jan",
  "february",
  "feb",
  "march",
  "mar",
  "april",
  "apr",
  "may",
  "june",
  "jun",
  "july",
  "jul",
  "august",
  "aug",
  "september",
  "sep",
  "sept",
  "october",
  "oct",
  "november",
  "nov",
  "december",
  "dec",
  "januar",
  "februar",
  "märz",
  "mai",
  "juni",
  "juli",
  "oktober",
  "dezember",
  "mär",
  "mrz",
  "okt",
  "dez",
]);

function hasLikelyAuthorYearCitation(original: string): boolean {
  return [...original.matchAll(AUTHOR_YEAR)].some((match) => {
    if (AUTHOR_YEAR_STOP_WORDS.has((match[1] ?? "").toLocaleLowerCase("und"))) {
      return false;
    }
    const literal = match[0].replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    return nonNegatedMatch(original, new RegExp(literal, "u"));
  });
}


const POST_NEGATION = /^(?:.{0,24}(?:(?:cannot|can't|kann nicht|darf nicht)\s+(?:be\s+|werden\s+)?(?:provided|discussed|stated|recommended|confirmed|geliefert|besprochen|angegeben|empfohlen|bestätigt)|\b(?:nicht|not)\b.{0,24}\b(?:besprechen|discuss|liefern|provide|angeben|state|empfehlen|recommend|bestätigen|confirm|behaupten|claim)\b))/iu;

function clauses(text: string): string[] {
  const primary = text.split(/[.!?;\n]+|,\s*(?=(?:i|we|you|he|she|it|they|this|that|these|those|the\s+\p{L}+|a\s+\p{L}+|an\s+\p{L}+|ich|wir|sie|er|es|dies|diese|dieser|das|der\s+\p{L}+|die\s+\p{L}+)\b)|\b(?:but|however|yet|although|though|even though|aber|jedoch|sondern|obwohl|auch wenn)\b|\b(?:because|since|while|whereas|weil|da|während|wohingegen)\b(?=\s+(?:i|we|you|he|she|it|they|this|that|these|those|the\s+\p{L}+|a\s+\p{L}+|an\s+\p{L}+|ich|wir|sie|er|es|dies|diese|dieser|das|der\s+\p{L}+|die\s+\p{L}+)\b)|\band\b(?=\s+(?:the|this|that|it|project|openqca|optimal|recommended)\b)|\bund\b(?=\s+(?:der|die|das|dies|projekt|openqca|optimal|empfohlen)\b)/iu);
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

const SHARED_NEGATION_COORDINATOR = /^\s*(?:,?\s*(?:and|or|nor|und|oder|noch)\s*)?$/iu;
const DIRECT_NEGATION_BRIDGE = /^(?:(?:necessarily|directly|really|actually|clearly|conclusively|unbedingt|direkt|wirklich|tatsächlich|eindeutig)\s+)*$/iu;
const NEGATED_ACTION_BRIDGE = /^(?:(?:necessarily|directly|really|actually|clearly|conclusively|unbedingt|direkt|wirklich|tatsächlich|eindeutig)\s+)*(?:provide|discuss|state|recommend|confirm|claim|assert|report|calculate|derive|produce|give|supply|show|say|tell|identify|choose|select|set|use|assign|make|draw|liefer\w*|besprech\w*|angeb\w*|nenn\w*|empfehl\w*|bestätig\w*|behaupt\w*|berechn\w*|ableit\w*|erzeug\w*|zeig\w*|sag\w*|identifizier\w*|wähl\w*|setz\w*|nimm|weis\w*|mach\w*|stell\w*)\b.{0,40}$/iu;
const NEGATED_ASSERTION_BRIDGE = /^(?:true|correct|established|evident|clear|proven|wahr|richtig|belegt|erwiesen|klar)\s+(?:that|dass)\b.{0,32}$/iu;
const OBJECT_NEGATION_END = /\b(?:no|kein|keine|keinen|keinem|keiner|keines)\s*$/iu;
const NEGATED_OBJECT_LIST_BRIDGE = /^(?!.*\b(?:that|dass|which|who|welch\w*)\b)(?:[\p{L}\p{N}_/-]+(?:[.,]\p{N}+)?\s*[,;/]?\s*){0,5}(?:(?:and|or|nor|und|oder|noch)\s*)?$/iu;

function lastNegationEnd(value: string): number {
  const flags = NEGATION.flags.includes("g") ? NEGATION.flags : `${NEGATION.flags}g`;
  let end = -1;
  for (const match of value.matchAll(new RegExp(NEGATION.source, flags))) {
    end = (match.index ?? 0) + match[0].length;
  }
  return end;
}

export function nonNegatedMatch(text: string, pattern: RegExp): boolean {
  return clauses(text).some((clause) => {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matches = [...clause.matchAll(new RegExp(pattern.source, flags))];
    return matches.some((match, index) => {
      if (lastNegationEnd(match[0]) >= 0) return false;
      const start = match.index ?? 0;
      const beforeStart = Math.max(0, start - 48);
      const before = clause.slice(beforeStart, start);
      const after = clause.slice(start + match[0].length, start + match[0].length + 48);
      const negationEnd = lastNegationEnd(before);
      const negationBridge = negationEnd >= 0
        ? before.slice(negationEnd).trim()
        : null;
      let governedByNegation = negationBridge !== null && (
        DIRECT_NEGATION_BRIDGE.test(negationBridge) ||
        NEGATED_ACTION_BRIDGE.test(negationBridge) ||
        NEGATED_ASSERTION_BRIDGE.test(negationBridge) ||
        (OBJECT_NEGATION_END.test(before.slice(0, negationEnd)) &&
          NEGATED_OBJECT_LIST_BRIDGE.test(negationBridge))
      );
      if (governedByNegation) {
        const absoluteNegationEnd = beforeStart + negationEnd;
        const priorMatch = matches
          .slice(0, index)
          .findLast((candidate) =>
            (candidate.index ?? 0) + candidate[0].length >= absoluteNegationEnd
          );
        if (priorMatch) {
          const priorEnd = (priorMatch.index ?? 0) + priorMatch[0].length;
          governedByNegation = SHARED_NEGATION_COORDINATOR.test(
            clause.slice(priorEnd, start),
          );
        }
      }
      return !governedByNegation && !POST_NEGATION.test(after);
    });
  });
}

function nonNegatedOriginalMatch(text: string, pattern: RegExp): boolean {
  return nonNegatedMatch(text, pattern);
}
const POLICY_RULES: readonly PolicyRule[] = [
  {
    code: "numeric-qca",
    violates: (text, _original, request) =>
      nonNegatedMatch(text, new RegExp(
        `(?:${RECOMMENDATION.source}.{0,48}${QCA_VALUE.source}|${QCA_VALUE.source}.{0,32}(?:\\p{N}|${NUMBER_WORD.source})|(?:\\p{N}|${NUMBER_WORD.source}).{0,32}${QCA_VALUE.source}|${NUMERIC_DIRECTIVE.source})`,
        "iu",
      )) ||
      (request.task === "decision_rationale_review" &&
        nonNegatedMatch(text, SELECTED_DECISION_NUMERIC)),
  },
  {
    code: "role-selection",
    violates: (text) =>
      nonNegatedMatch(text, ROLE_ASSIGNMENT) ||
      nonNegatedMatch(text, new RegExp(
        `(?:${RECOMMENDATION.source}.{0,40}${ROLE_TERM.source}|${ROLE_TERM.source}.{0,32}${RECOMMENDATION.source})`,
        "iu",
      )),
  },
  {
    code: "citation-or-source",
    violates: (text, original) => nonNegatedMatch(text, /https?:|\bwww\.|\bdoi\b|\bet\s+al\b|\([a-zäöüß-]+(?:\s+(?:and|und|&)\s+[a-zäöüß-]+)?,?\s+\p{N}{4}\)/iu)
      || hasLikelyAuthorYearCitation(original)
      || nonNegatedMatch(text, /\b(?:university press|verlag|isbn|issn|journal of|zeitschrift für)\b/iu)
      || nonNegatedMatch(text, /\b(?:according to|laut)\b|\b(?:study|studie|source|quelle)\b.{0,24}\b(?:shows?|proves?|finds?|substantiates?|demonstrates?|belegt|zeigt|beweist|stützt|unterstützt)\b/iu),
  },
  {
    code: "causal-claim",
    violates: (text) => nonNegatedMatch(text, /\b(?:caus\w*|kausal\w*|verursach\w*|bewirk\w*|determines?|bestimm\w*|drives?|leads?\s+to|results?\s+in|produces?|creates?|influences?|affects?|increases?|decreases?|raises?|reduces?|lowers?|improves?|worsens?|strengthens?|weakens?|promotes?|prevents?|enables?|allows?|facilitates?|führt\s+(?:zu|zum|zur)|hat\s+.{0,24}\s+zur\s+folge|beeinfluss\w*|erhöh\w*|verringer\w*|steiger\w*|senk\w*|verbesser\w*|verschlechter\w*|stärk\w*|schwäch\w*|förder\w*|verhinder\w*|ermöglich\w*|befähig\w*)\b/iu),
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

function suggestedText(response: AiReviewResponse): string {
  if (response.task === "brief_clarify") return response.suggested.question;
  if (response.task === "calibration_evidence_gaps") return response.suggested.definition;
  return response.suggested.rationale;
}

function responseText(response: AiReviewResponse): { normalized: string; original: string } {
  const original = [
    response.review,
    suggestedText(response),
    ...response.uncertainty,
    ...response.evidenceNeeds,
    ...response.limitations,
  ]
    .join("\n")
    .normalize("NFKC");
  return {
    original,
    normalized: original.toLocaleLowerCase("und").replace(/\s+/g, " ").trim(),
  };
}

export function evaluateAiReviewResponse(
  value: unknown,
  request: AiAssistRequest,
): AiEvaluation {
  const response = parseAiReviewResponse(value, request);
  if (!response) return { pass: false, codes: ["invalid-summary"] };

  const codes = new Set<AiPolicyCode>();
  const suggestion = suggestedText(response);
  const hasBoundary =
    response.uncertainty.length + response.evidenceNeeds.length + response.limitations.length > 0;
  if (
    (response.status === "ok" && (!response.review || !suggestion)) ||
    (response.status === "incomplete" && (suggestion.length > 0 || !hasBoundary)) ||
    (response.status === "refusal" &&
      (suggestion.length > 0 || response.review.length > 0 || response.limitations.length === 0))
  ) {
    codes.add("status-shape");
  }

  const text = responseText(response);
  for (const rule of POLICY_RULES) {
    if (rule.violates(text.normalized, text.original, request)) codes.add(rule.code);
  }
  const sorted = [...codes].sort();
  return { pass: sorted.length === 0, codes: sorted };
}
