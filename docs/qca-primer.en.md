# QCA Primer — a guided introduction

This introduction is written for **beginners**. It explains the core ideas of
Qualitative Comparative Analysis (QCA) in the order in which openQCA guides an
analysis. The goal is understanding, not completeness. For the exact engine
formulas, see [`engine-notes.md`](./engine-notes.md).

---

## 1. What is QCA?

QCA studies **which combinations of conditions** lead to an interesting
**outcome**. It sits between qualitative case research and quantitative
statistics and is especially useful for **medium-sized numbers of cases**
(roughly 10–50).

Three ideas distinguish QCA from classical regression:

1. **Conjunction (combinations matter).** The isolated effect of a variable is
   not the central question. A condition may matter only *together with* B.
2. **Equifinality (multiple paths).** Different combinations can lead to the
   *same* outcome. There is often more than one path.
3. **Asymmetry.** Explaining the presence of an outcome is not simply the
   inverse of explaining its absence. The two outcomes must be analysed
   separately.

QCA uses the language of **set theory**: a case is more or less a **member** of a
set such as “wealthy countries” or “stable democracies”. Claims concern
**necessity** and **sufficiency**.

### Crisp sets and fuzzy sets

- **Crisp set (csQCA):** membership is 0 **or** 1 (out/in).
- **Fuzzy set (fsQCA):** membership is a value in **[0, 1]**. `0` means full
  non-membership, `1` full membership, and **`0.5`** maximum ambiguity: neither
  more in nor more out.

openQCA supports both. Example datasets are in `../datasets/`.

---

## 2. Calibration: from raw values to set membership

Raw data—percentages, indices, and scales—must first be translated into **set
membership**. This is called **calibration**. It is the most theory-laden step
in QCA. Set membership is not a percentage; it answers: *How much does this
case belong to the set?*

### Theory before data

Calibration is **not purely statistical**. Anchors should come from substantive
or theoretical knowledge about the set, not simply from the sample
distribution (not the mean, median, or upper quartile by default). The question
is: *At which raw value is a case substantively fully in the set?* — not: *Where
is the upper quartile?*

### Direct calibration and the three anchors

The **direct method** (Ragin 2008) requires three **anchors**:

| Anchor | Meaning | Target membership |
|---|---|---|
| **Full non-membership** (`fullOut`) | from here, clearly not in the set | ≈ 0.05 |
| **Crossover** (`crossover`) | maximum ambiguity | **exactly 0.5** |
| **Full membership** (`fullIn`) | from here, clearly in the set | ≈ 0.95 |

For an increasing set, anchors must be ordered (`fullOut < crossover < fullIn`).
The engine interpolates between them with a logistic function. openQCA maps the
crossover exactly to 0.5, the full-membership anchor to about 0.9526, and the
full-non-membership anchor to about 0.0474. These are the engine's fixed points.

**Small example.** For wealth measured as GDP per capita, use full
non-membership = 300, crossover = 600, and full membership = 1000:

- GDP 600 → membership **0.50** (exactly at crossover)
- GDP 1000 → ≈ **0.95** (full membership)
- GDP 900 → ≈ **0.91**
- GDP 300 → ≈ **0.05** (full non-membership)
- GDP 260 → ≈ **0.03**

The engine also supports a **piecewise-linear** fuzzy method with the same
three qualitative anchors, a **crisp** method with one inclusion threshold, and
a four-value engine function with three ordered thresholds. The guided workflow
currently exposes direct, piecewise-linear, crisp, and already-calibrated paths;
the four-value path remains outside the guided workflow until its independent
validation and set semantics are complete.

The piecewise-linear method maps values up to `e` to 0, rises from `e` to `c`
until 0.5, rises from `c` to `i` until 1, and stays at 1 above `i`. It matches
`QCA::calibrate(..., logistic = FALSE)`. Its anchors are still substantive
research decisions, not automatic medians or quantiles.

### The 0.5 problem

A case at **exactly 0.5** is neither more in nor more out and cannot be assigned
unambiguously to a truth-table corner. The practical rule is: **avoid placing
cases exactly at 0.5 after calibration**. openQCA flags such cases with
`atCrossover`, so anchors can be reconsidered. The `fuzzy-sets-beispiel.csv`
dataset is deliberately constructed without this problem.

### Skew

If nearly all cases have very high or very low membership, the set is **skewed**.
That may be substantively correct, but it can inflate consistency: a set in which
almost every case is fully in is easily a subset of many other sets. Always
inspect the distribution of calibrated values before interpreting results.

---

## 3. Necessary and sufficient conditions

This is the set-theoretic core of QCA. Let X be membership in a condition (or
combination) and Y membership in the outcome.

- **Sufficient:** *If X, then Y.* X is a **subset** of Y: everywhere `X ≤ Y`.
  The path is enough for the outcome, but it need not be the only path.
- **Necessary:** *Without X, no Y.* Y is a **subset** of X: everywhere `Y ≤ X`.
  Without the condition, the outcome does not occur.

Memory aid: for **sufficiency**, points in an XY plot lie above the diagonal
(`Y ≥ X`); for **necessity**, they lie below it (`X ≥ Y`).

QCA reports the two questions separately: usually necessity first, then
sufficiency through the truth table.

---

## 4. Truth table

With **k** conditions there are **2^k** logically possible combinations—the
corners of the configurational space. The truth table lists all rows and assigns
each case to the nearest corner (`> 0.5` means present, `≤ 0.5` means absent).

Each row reports:

- **n** — number of cases with membership above 0.5 in that corner;
- **consistency** — how purely sufficient the corner is;
- **PRI** — a stricter consistency measure;
- **output** — the decision `0`, `1`, or `?`.

### Two cutoffs determine the output

1. **Frequency cutoff (`freqCut`):** how many cases a corner must contain before
   it is evaluated. Rows with too few or zero cases remain **remainders** and
   receive `?`. For small datasets the cutoff is often 1.
2. **Consistency cutoff (`consCut`):** the minimum consistency for an adequately
   populated corner to be treated as sufficient (`1`); below it the output is
   `0`. Values around 0.8 or higher are common starting points, not universal
   rules.

Remainders (`?`) are logically possible but not sufficiently observed. The three
solution types differ in how they use them.

---

## 5. Consistency, coverage, and PRI

These measures assess how well a set X explains outcome Y.

### Sufficiency consistency

> Consistency = Σ min(X, Y) / Σ X

This measures how closely X is a subset of Y. `1.0` is perfect sufficiency.
Values below roughly 0.75 are often too low for a sufficiency claim, but the
substantive context matters.

### Coverage

> Raw Coverage = Σ min(X, Y) / Σ Y

Coverage measures how much of the outcome a path explains.

- **Raw coverage:** the total share covered by a path; paths may overlap.
- **Unique coverage:** the share covered only by that path, showing its distinct
  contribution.

Consistency and coverage are a trade-off, similar to precision and recall.

### PRI (Proportional Reduction in Inconsistency)

> PRI = (Σ min(X,Y) − Σ min(X,Y,1−Y)) / (Σ X − Σ min(X,Y,1−Y))

PRI protects against a configuration appearing sufficient for both the outcome
and its negation. A large gap between consistency and PRI is a warning that the
corner carries contradictory membership. PRI should not be materially below the
chosen consistency cutoff without a clear reason.

### Necessity

For necessity, numerator and denominator change roles:

> Necessity consistency = Σ min(X, Y) / Σ Y  (tests Y ⊆ X)
>
> Relevance/coverage = Σ min(X, Y) / Σ X

A consistency of **≥ 0.90** is commonly used as a candidate threshold for
necessity. Coverage guards against trivial necessity: an almost ubiquitous
condition can be formally necessary but substantively uninformative.

---

## 6. Boolean minimization and the three solutions

The positive truth-table rows are reduced to a simpler logical formula using
**Quine–McCluskey** minimization. Two configurations that differ in exactly one
condition can be combined, eliminating that condition.

> Example: `WEALTH*EDUCATION*STATE` and `WEALTH*EDUCATION*~STATE` differ only in
> `STATE` and combine to `WEALTH*EDUCATION`.

The engine uses `*` for AND, `+` for OR, and `~` for NOT.

The three solution types differ in their assumptions about remainders:

| Solution | Remainder use | Character |
|---|---|---|
| **Complex** (conservative) | no remainders | observed corners only; often long |
| **Parsimonious** | all helpful remainders | shortest formula; strongest simplifying assumptions |
| **Intermediate** | only theoretically plausible remainders | middle path based on directional expectations |

The intermediate solution uses directional expectations for conditions and should
be interpreted as a theory-guided result, not as an automatic compromise.

### Worked example

With `datasets/fuzzy-sets-beispiel.csv` (`freqCut = 1`, `consCut = 0.85`), the
engine reports approximately:

- **Parsimonious:** `STATE_CAPACITY + WEALTH*EDUCATION`
- **Complex:** `~WEALTH*~EDUCATION*STATE_CAPACITY + WEALTH*EDUCATION`

The parsimonious solution simplifies the first path by allowing unobserved
corners as assumptions; the complex solution retains the data-observed path.

---

## 7. A typical openQCA workflow

1. **Load data** (CSV with case column, conditions, and outcome).
2. **Calibrate** — choose anchors from theory; inspect crossover cases and skew.
3. **Check necessity** (often consistency ≥ 0.9, with coverage).
4. **Build the truth table**; set frequency and consistency cutoffs; inspect
   remainders and `atCrossover` cases.
5. **Minimize** — compute complex, parsimonious, and intermediate solutions.
6. **Interpret** solution/path consistency and coverage, identify typical cases,
   and connect the result back to theory.

---

## 8. Common pitfalls

- Deriving anchors from the data distribution instead of theory.
- Ignoring cases at 0.5.
- Interpreting only the parsimonious solution without disclosing its remainder
  assumptions.
- Calling an ubiquitous condition necessary without checking coverage.
- Setting the consistency cutoff too low and creating apparent paths.
- Ignoring asymmetry: the explanation of the outcome is not the inverse of the
  explanation of the non-outcome.

---

*For the concrete programming interface, see [`engine-notes.md`](./engine-notes.md).
Example data is in `../datasets/` and is illustrative only.*
