/**
 * Boolesche Minimierung (Quine-McCluskey) der positiven Konfigurationen.
 * Terme sind Strings über {"0","1","-"}, wobei "-" eine eliminierte Bedingung markiert.
 */

/** Verbindet zwei Terme, wenn sie sich in genau einer Position (0/1) unterscheiden. */
function combineTerms(a: string, b: string): string | null {
  let diff = -1;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (a[i] === "-" || b[i] === "-") return null;
    if (diff >= 0) return null;
    diff = i;
  }
  if (diff < 0) return null;
  return a.slice(0, diff) + "-" + a.slice(diff + 1);
}

/** Ermittelt alle Primimplikanten aus Mintermen (+ optionalen Don't-Cares/Remainders). */
export function primeImplicants(minterms: string[], dontCares: string[] = []): string[] {
  let current = [...new Set([...minterms, ...dontCares])];
  const primes = new Set<string>();
  while (current.length) {
    const used = new Array(current.length).fill(false);
    const next = new Set<string>();
    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const combined = combineTerms(current[i], current[j]);
        if (combined) {
          used[i] = true;
          used[j] = true;
          next.add(combined);
        }
      }
    }
    current.forEach((term, i) => {
      if (!used[i]) primes.add(term);
    });
    current = [...next];
  }
  return [...primes];
}

/** Deckt der Term den Minterm ab? ("-" passt auf beides.) */
export function termCovers(term: string, minterm: string): boolean {
  for (let i = 0; i < term.length; i++) {
    if (term[i] !== "-" && term[i] !== minterm[i]) return false;
  }
  return true;
}

/**
 * Minimale Überdeckungen der Minterme durch Primimplikanten:
 * essenzielle PIs zuerst, dann erschöpfende Suche kleinster Kombinationen für den Rest.
 * Kann bei vielen ungedeckten Mintermen mehrere gleichwertige Lösungen liefern.
 */
export function minimalCovers(primes: string[], minterms: string[]): string[][] {
  if (!minterms.length) return [];

  const essential = new Set<string>();
  for (const mt of minterms) {
    const covering = primes.filter((p) => termCovers(p, mt));
    if (covering.length === 1) essential.add(covering[0]);
  }

  const remaining = minterms.filter((mt) => ![...essential].some((p) => termCovers(p, mt)));
  if (!remaining.length) return [[...essential]];

  const rest = primes.filter((p) => !essential.has(p) && remaining.some((mt) => termCovers(p, mt)));
  const results: string[][] = [];
  const maxCombos = 500000;

  for (let size = 1; size <= rest.length && results.length === 0; size++) {
    let count = 0;
    const idx = Array.from({ length: size }, (_, i) => i);
    while (true) {
      if (++count > maxCombos) break;
      const combo = idx.map((i) => rest[i]);
      if (remaining.every((mt) => combo.some((p) => termCovers(p, mt)))) {
        results.push([...essential, ...combo]);
      }
      let i = size - 1;
      while (i >= 0 && idx[i] === rest.length - size + i) i--;
      if (i < 0) break;
      idx[i]++;
      for (let j = i + 1; j < size; j++) idx[j] = idx[j - 1] + 1;
    }
  }

  return results.length ? results : [[...essential, ...rest]];
}

/** Term als lesbare Notation, z. B. "WOHLSTAND*~URBAN". Leerer Term → "1". */
export function termToExpression(term: string, conditions: string[]): string {
  const parts: string[] = [];
  [...term].forEach((ch, i) => {
    if (ch === "1") parts.push(conditions[i]);
    else if (ch === "0") parts.push("~" + conditions[i]);
  });
  return parts.length ? parts.join("*") : "1";
}
