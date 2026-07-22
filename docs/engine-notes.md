# @openqca/engine – API-Notizen

Diese Notizen dokumentieren die **tatsächlich exportierte** öffentliche
Schnittstelle des Rechenkerns `@openqca/engine`. Dokumentiert ist nur, was in den
Quellen unter `packages/engine/src/` wirklich existiert:

- `calibrate.ts` – Kalibrierung
- `measures.ts` – Konsistenz-/Coverage-Maße
- `truthTable.ts` – Truth Table
- `minimize.ts` – boolesche Minimierung (Quine-McCluskey)
- `solutions.ts` – Standard-Analyse (komplexe/sparsame Lösung, Notwendigkeit)

Alle Symbole werden über `src/index.ts` re-exportiert; Import daher zentral:

```ts
import {
  calibrateDirect,
  buildTruthTable,
  complexSolution,
  // ...
} from "@openqca/engine";
```

Das Paket ist **abhängigkeitsfrei**, `"type": "module"` (ESM). Konventionen: Werte
sind Zahlen; Set-Zugehörigkeit liegt in `[0, 1]`. Nicht berechenbare Kennzahlen
(z. B. Division durch 0) werden als **`NaN`** zurückgegeben – im aufrufenden Code
darauf prüfen. Für die inhaltliche Bedeutung der Begriffe siehe
[`qca-primer.md`](./qca-primer.md).

---

## 1. Kalibrierung (`calibrate.ts`)

```ts
type CalibrationMethod = "direct" | "linear" | "crisp" | "fourValue";
```

| Funktion | Signatur | Zweck |
|---|---|---|
| `calibrateDirect` | `(x, fullOut, crossover, fullIn) => number` | Direkte Methode, **logistisch** (Ragin 2008) |
| `calibrateLinear` | `(x, fullOut, crossover, fullIn) => number` | Direkte Methode, **linear**; Kreuzung bleibt 0,5 |
| `calibrateCrisp` | `(x, threshold) => number` | Eine Schwelle → `0` oder `1` |
| `calibrateFourValue` | `(x, t1, t2, t3) => number` | Drei Schwellen → `0 / 0.33 / 0.67 / 1` |
| `calibrate` | `(x, method, thresholds: number[]) => number` | Einheitlicher Dispatch über alle Methoden |

**Fixpunkte der direkten Methode:** `crossover → 0.5` (exakt),
`fullIn → 1/(1+e^-3) ≈ 0.9526`, `fullOut → 1/(1+e^3) ≈ 0.0474`.

**Wichtig:** Bei `direct`, `linear` und `fourValue` müssen die Anker/Schwellen
**streng aufsteigend** sein, sonst wird ein `Error` geworfen
(`fullOut < crossover < fullIn` bzw. `t1 < t2 < t3`).
Bei invertierten Crisp-Sets verwendet `calibrateValue` mit
`crispInclusive: true` die inklusive Regel `raw <= threshold → 1`; die
normale Inversion von `calibrateCrisp` wäre an der Gleichheit strikt draußen.

`thresholds` bei `calibrate`: `direct`/`linear` erwarten `[fullOut, crossover,
fullIn]`, `crisp` erwartet `[threshold]`, `fourValue` erwartet `[t1, t2, t3]`.

```ts
import { calibrateDirect, calibrate } from "@openqca/engine";

// BIP pro Kopf → Zugehörigkeit zur Menge "wohlhabend"
calibrateDirect(900, 300, 600, 1000); // ≈ 0.905
calibrateDirect(600, 300, 600, 1000); // = 0.5  (Kreuzungspunkt)

// gleiche Rechnung über den Dispatcher:
calibrate(900, "direct", [300, 600, 1000]); // ≈ 0.905
calibrate(1, "crisp", [0.5]);               // = 1

// ganze Rohwert-Spalte kalibrieren:
const roh = [1150, 900, 620, 320];
const fuzzy = roh.map((x) => calibrateDirect(x, 300, 600, 1000));
```

---

## 2. Maße (`measures.ts`)

Alle Funktionen erwarten zwei **gleich lange** Zahl-Arrays `X` (Bedingung/
Konfiguration) und `Y` (Outcome); bei ungleicher Länge wird ein `Error` geworfen.
Rückgabe `NaN`, wenn der jeweilige Nenner 0 ist.

| Funktion | Formel | Bedeutung |
|---|---|---|
| `inclusionConsistency(X, Y)` | `Σ min(X,Y) / Σ X` | Konsistenz der **Hinreichendheit** (X ⊆ Y) |
| `rawCoverage(X, Y)` | `Σ min(X,Y) / Σ Y` | **Coverage** der Hinreichendheit |
| `priConsistency(X, Y)` | `(Σ min(X,Y) − Σ min(X,Y,1−Y)) / (Σ X − Σ min(X,Y,1−Y))` | **PRI** |
| `necessityConsistency(X, Y)` | `Σ min(X,Y) / Σ Y` | Konsistenz der **Notwendigkeit** (Y ⊆ X); identisch zu `rawCoverage` |
| `necessityCoverage(X, Y)` | `Σ min(X,Y) / Σ X` | **Relevanz** der Notwendigkeit; identisch zu `inclusionConsistency` |

```ts
import { inclusionConsistency, rawCoverage, priConsistency } from "@openqca/engine";

const X = [0.9, 0.8, 0.2, 0.1]; // Bedingung
const Y = [0.85, 0.9, 0.15, 0.1]; // Outcome
inclusionConsistency(X, Y); // Hinreichendheits-Konsistenz
rawCoverage(X, Y);          // Coverage
priConsistency(X, Y);       // PRI (strenger)
```

> Hinweis: `necessityConsistency`/`necessityCoverage` sind bewusst benannte Aliase
> von `rawCoverage`/`inclusionConsistency` – nur Zähler/Nenner tauschen bei
> Notwendigkeit ihre Rolle.

---

## 3. Truth Table (`truthTable.ts`)

### Typen

```ts
interface QcaCase {
  label: string;
  values: Record<string, number>; // Zugehörigkeiten je Bedingung + Outcome
}

interface TruthTableRow {
  index: number;
  bits: string;         // z. B. "1011"  (1 = Bedingung anwesend, 0 = negiert)
  n: number;            // Fälle mit Zugehörigkeit > 0.5 in dieser Konfiguration
  cases: string[];      // deren Labels
  consistency: number;  // Inclusion: Σ min(m,Y) / Σ m
  pri: number;          // Proportional Reduction in Inconsistency
  output: 0 | 1 | "?";  // "?" = Remainder (unbeobachtet / unter Frequenz-Cutoff)
  atCrossover: string[];// Fälle mit exakt 0.5 in mind. einer Bedingung (0,5-Problem)
}

interface TruthTableResult {
  conditions: string[];
  outcome: string;
  freqCut: number;
  consCut: number;
  rows: TruthTableRow[];      // genau 2^k Zeilen
  assignedCaseCount: number;  // einer beobachteten Konfiguration zugeordnete Fälle
  totalCaseCount: number;
}
```

### Funktion

```ts
function buildTruthTable(params: {
  cases: QcaCase[];
  conditions: string[]; // 1..12 Bedingungen
  outcome: string;
  freqCut: number;      // Mindest-Fallzahl je Zeile
  consCut: number;      // Konsistenzschwelle für Output = 1
}): TruthTableResult;
```

Erzeugt alle `2^k` Konfigurationen (`k` = Anzahl Bedingungen, **1 ≤ k ≤ 12**,
sonst `Error`). Output-Regel je Zeile: `n < freqCut → "?"`, sonst
`consistency >= consCut ? 1 : 0`. `bits` liest sich von links nach rechts in der
Reihenfolge von `conditions`.

Prüfe nach dem Bau das Feld `atCrossover` (Fälle exakt auf 0,5 – siehe
[`qca-primer.md`](./qca-primer.md), Abschnitt 2) sowie
`assignedCaseCount` vs. `totalCaseCount`.

```ts
import { buildTruthTable, type QcaCase } from "@openqca/engine";

const cases: QcaCase[] = [
  { label: "Fall_01", values: { WOHLSTAND: 0.9, BILDUNG: 0.8, STAATSKAPAZITAET: 0.2, DEMOKRATIE: 0.85 } },
  // ...
];

const tt = buildTruthTable({
  cases,
  conditions: ["WOHLSTAND", "BILDUNG", "STAATSKAPAZITAET"],
  outcome: "DEMOKRATIE",
  freqCut: 1,
  consCut: 0.85,
});

const positives = tt.rows.filter((r) => r.output === 1);
```

---

## 4. Minimierung (`minimize.ts`)

Terme sind Strings über `{"0","1","-"}`; `"-"` markiert eine eliminierte
Bedingung.

| Funktion | Signatur | Zweck |
|---|---|---|
| `primeImplicants` | `(minterms: string[], dontCares?: string[]) => string[]` | Alle Primimplikanten (Remainder als `dontCares`) |
| `termCovers` | `(term: string, minterm: string) => boolean` | Deckt `term` den `minterm` ab? (`"-"` passt auf beides) |
| `minimalCovers` | `(primes: string[], minterms: string[]) => string[][]` | Minimale Überdeckungen; kann **mehrere** gleichwertige Lösungen liefern |
| `termToExpression` | `(term: string, conditions: string[]) => string` | Lesbare Notation, z. B. `"WOHLSTAND*~URBAN"`; leerer Term → `"1"` |

`minimalCovers` sucht zuerst essenzielle Primimplikanten und dann erschöpfend die
kleinsten Kombinationen für den Rest (Sicherheitsgrenze: 500 000 Kombinationen).

```ts
import { primeImplicants, minimalCovers, termToExpression } from "@openqca/engine";

const minterms = ["110", "111", "001"];
const primes = primeImplicants(minterms);        // z. B. ["11-", "001"]
const covers = minimalCovers(primes, minterms);  // string[][]
covers[0].map((t) => termToExpression(t, ["W", "B", "S"]));
// z. B. ["W*B", "~W*~B*S"]
```

Für die sparsame Lösung werden Remainder als `dontCares` übergeben:
`primeImplicants(positives, remainders)`.

---

## 5. Standard-Analyse (`solutions.ts`)

### Typen

```ts
interface PathParams {
  term: string;
  expression: string;      // via termToExpression
  rawCoverage: number;
  uniqueCoverage: number;
  consistency: number;
}

interface SolutionModel {
  terms: string[];
  paths: PathParams[];
  solutionConsistency: number;
  solutionCoverage: number;
}

interface Solution {
  type: "complex" | "parsimonious";
  models: SolutionModel[]; // mehrere, wenn die Überdeckung nicht eindeutig ist
}

interface NecessityEntry {
  condition: string;   // z. B. "WOHLSTAND" oder "~WOHLSTAND"
  consistency: number; // Notwendigkeits-Konsistenz: Σ min(X,Y) / Σ Y
  coverage: number;    // Relevanz: Σ min(X,Y) / Σ X
  isCandidate: boolean;// consistency >= 0.9
}
```

### Funktionen

```ts
function complexSolution(tt: TruthTableResult, cases: QcaCase[]): Solution;
function parsimoniousSolution(tt: TruthTableResult, cases: QcaCase[]): Solution;
function necessityAnalysis(
  conditions: string[],
  outcome: string,
  cases: QcaCase[],
): NecessityEntry[];
```

- `complexSolution` nutzt **nur** positive (Output = 1) Ecken – **konservativ**.
- `parsimoniousSolution` lässt zusätzlich die Remainder (`output === "?"`) als
  vereinfachende Annahmen zu – **sparsam**.
- `necessityAnalysis` prüft **jede** Bedingung **und ihre Negation** einzeln und
  markiert Kandidaten ab Konsistenz `≥ 0.9` (`isCandidate`).

> **Nicht vorhanden:** Eine Funktion für die **intermediäre** Lösung existiert im
> Rechenkern derzeit nicht. Verfügbar sind nur die komplexe und die sparsame
> Lösung. (Konzept der intermediären Lösung: siehe `qca-primer.md`, Abschnitt 6.)

```ts
import {
  buildTruthTable,
  complexSolution,
  parsimoniousSolution,
  necessityAnalysis,
} from "@openqca/engine";

const conditions = ["WOHLSTAND", "BILDUNG", "STAATSKAPAZITAET"];
const tt = buildTruthTable({ cases, conditions, outcome: "DEMOKRATIE", freqCut: 1, consCut: 0.85 });

const complex = complexSolution(tt, cases);
const pars = parsimoniousSolution(tt, cases);

// sparsame Lösung als Formel ausgeben:
pars.models[0].paths.map((p) => p.expression).join(" + ");
// -> "STAATSKAPAZITAET + WOHLSTAND*BILDUNG"

pars.models[0].solutionCoverage;    // ≈ 0.95
pars.models[0].solutionConsistency; // ≈ 0.99

const nec = necessityAnalysis(conditions, "DEMOKRATIE", cases);
const kandidaten = nec.filter((n) => n.isCandidate);
```

---

## 6. Kompletter Minimalablauf

```ts
import {
  calibrateDirect,
  buildTruthTable,
  complexSolution,
  parsimoniousSolution,
  necessityAnalysis,
  type QcaCase,
} from "@openqca/engine";

// 1) Rohwerte -> Fuzzy-Sets (hier nur eine Bedingung beispielhaft)
const rohBIP = [1150, 900, 620, 320];
const wohlstand = rohBIP.map((x) => calibrateDirect(x, 300, 600, 1000));

// 2) Fälle zusammenstellen (bereits kalibrierte Werte)
const cases: QcaCase[] = [/* { label, values: { ...Bedingungen, DEMOKRATIE } } */];
const conditions = ["WOHLSTAND", "BILDUNG", "STAATSKAPAZITAET"];

// 3) Notwendigkeit
const nec = necessityAnalysis(conditions, "DEMOKRATIE", cases);

// 4) Truth Table
const tt = buildTruthTable({ cases, conditions, outcome: "DEMOKRATIE", freqCut: 1, consCut: 0.85 });

// 5) Minimierung
const complex = complexSolution(tt, cases);
const pars = parsimoniousSolution(tt, cases);
```

Die Beispieldatensätze unter `../datasets/` (siehe `datasets/README.md`) lassen
sich direkt so einlesen; die dort genannten Ergebnisse wurden mit genau diesen
Funktionen reproduziert.
