# Beiträge zu openQCA

Danke, dass du zu **openQCA** beitragen möchtest — einem quelloffenen,
reproduzierbaren Werkzeug für **Qualitative Comparative Analysis (QCA)**.
Beiträge aller Art sind willkommen: Fehlermeldungen (bug reports),
Verbesserungsvorschläge (feature requests), Dokumentation, Übersetzungen und
Code (pull requests).

Dieses Dokument beschreibt den Einstieg, die Konventionen und die
Qualitätsansprüche des Projekts.

## Verhaltenskodex

Für die Mitarbeit gilt unser [Code of Conduct](CODE_OF_CONDUCT.md)
(Contributor Covenant v2.1). Mit deinem Beitrag erklärst du dich damit
einverstanden.

## Projektstruktur

Es handelt sich um ein **Monorepo** mit npm-Workspaces:

```
openqca/
├── packages/engine/   Rechenkern (TypeScript, ohne Laufzeit-Abhängigkeiten) — getestet
├── apps/web/          Web-App (Next.js 16 + React 19) — der kostenlose Workflow
├── scripts/           Referenz-/Validierungsskripte
├── datasets/          Beispiel-Datensätze (synthetisch)
└── docs/              QCA-Primer & Engine-Doku
```

Voraussetzung: **Node.js ≥ 22** (die Referenz-Suite wird mit einer aktuellen
Node-Version ausgeführt).

## Setup

```bash
# 1. Repository klonen und in das Verzeichnis wechseln
git clone <repository-url>
cd openqca

# 2. Abhängigkeiten installieren (Monorepo, ein Aufruf genügt)
npm install

# 3. Engine-Tests ausführen (Rechenkern)
node --test
#    (aus packages/engine, oder gezielt:)
npm test --workspace @openqca/engine

# 4. Web-App im Entwicklungsmodus starten
npm run dev --workspace web
#    -> http://localhost:3000
```

## Engine-Validierung

Der QCA-Rechenkern (`packages/engine`) ist der Kern des Projekts und muss
**korrekt und reproduzierbar** bleiben. Zusätzlich zu den Unit-Tests
(`node --test`) gibt es eine eigenständige Referenz-Suite, die aus dem
Repository-Wurzelverzeichnis läuft:

```bash
node scripts/reference-check.mjs
```

Sie prüft dokumentierte Fixpunkte der Kalibrierung, den vollständigen Aufbau der
Truth Tables, die komplexen und sparsamen Lösungen sowie die
Notwendigkeitsanalyse. Details und die **Aussagegrenze** dieser Prüfung stehen
in [`VALIDATION.md`](VALIDATION.md).

**Wichtig:** Wer die Engine verändert (Kalibrierung, Truth Table, Minimierung,
Konsistenz-/Coverage-Maße, Notwendigkeit), muss

1. die betroffenen Tests anpassen bzw. neue Tests ergänzen,
2. `node --test` **und** `node scripts/reference-check.mjs` grün halten,
3. jede bewusste Änderung an einem Regressions-Snapshot in der PR-Beschreibung
   begründen (warum sich die Engine-Ausgabe ändern darf).

Änderungen an numerischen Ergebnissen ohne Begründung werden nicht
zusammengeführt (merged).

## Branch- und PR-Konventionen

- Arbeite in **Feature-Branches**, nicht direkt auf `main`.
- Namensschema: `<typ>/<kurzbeschreibung>`, z. B.
  `feat/intermediate-solution`, `fix/calibration-edge-case`,
  `docs/qca-primer`.
- **Commit-Nachrichten** folgen [Conventional Commits](https://www.conventionalcommits.org/):
  `feat: …`, `fix: …`, `docs: …`, `test: …`, `refactor: …`, `chore: …`.
  Kurze, präzise Betreffzeile im Imperativ.
- Öffne einen **Pull Request** gegen `main` mit:
  - einer klaren Beschreibung des *Was* und *Warum*,
  - Verweis auf das zugehörige Issue (falls vorhanden),
  - Nachweis, dass Tests und Referenz-Suite laufen,
  - bei UI-Änderungen: Screenshots oder eine kurze Beschreibung.
- Halte PRs **fokussiert und klein**. Ein Thema pro PR erleichtert das Review.

## Coding-Stil

- **Striktes TypeScript** (`strict` ist aktiv). Kein `any` ohne triftigen,
  kommentierten Grund; keine impliziten `any`. Bevorzuge präzise Typen und
  `readonly`, wo sinnvoll.
- Der **Rechenkern (`packages/engine`) bleibt frei von Laufzeit-Abhängigkeiten**
  (dependency-free) und lauffähig in Browser, Node und Desktop. Keine
  Node-spezifischen APIs im Engine-Code.
- **Reine Funktionen** bevorzugen: deterministisch, ohne Seiteneffekte, gut
  testbar. Jede numerische Funktion braucht einen Test.
- **Linting**: In der Web-App gilt `npm run lint --workspace web`
  (ESLint / `eslint-config-next`). Lint-Fehler bitte vor dem PR beheben.
- Aussagekräftige, deutschsprachige oder englische Bezeichner — aber
  **innerhalb einer Datei konsistent** bleiben.
- Neue oder geänderte Verhaltensweisen dokumentieren (Code-Kommentare bei
  nicht offensichtlicher Methodik, ggf. `docs/`).

## Fehlermeldungen und Vorschläge (Issues)

- Bei **Bugs**: erwartetes vs. tatsächliches Verhalten, Schritte zur
  Reproduktion, verwendeter Datensatz (möglichst synthetisch/anonymisiert),
  Node-/Browser-Version.
- Bei **Vorschlägen**: Problem und Nutzen zuerst, Lösungsidee danach.
- **Sicherheitslücken bitte nicht** als öffentliches Issue melden, sondern
  gemäß [`SECURITY.md`](SECURITY.md) vertraulich.

## Gute erste Beiträge (good first issues)

Du möchtest zum Projekt beitragen, weißt aber nicht, wo anfangen? Hier sind fünf
konkrete, realistische Einstiegspunkte, die wenig Kontext erfordern und einen
echten Unterschied machen:

### 1. Zusätzliche Beispieldatensätze mit Dokumentation

**Was:** Das Projekt hat bisher drei synthetische Beispieldatensätze
(`datasets/*.csv`). Jeder neue Datensatz sollte ein **anderes QCA-Szenario**
zeigen (z. B. Multi-Value-Bedingungen, höhere Fallzahl, reales Domänen-Beispiel).

**Wie:**
- Schreibe einen neuen Datensatz (CSV, min. 20 Fälle, realistische Fallnamen).
- Füge ein **README in `datasets/`** ein: Kontext, Interpretation, erwartete
  Lösungsmuster (2–3 Sätze pro Datensatz).
- Datei-Hinweis: `datasets/` — neue CSV-Datei + Abschnitt in `datasets/README.md`.

**Warum wichtig:** Neue Nutzer:innen profitieren von vielfältigen Beispielen; die
Engine wird dadurch gründlicher getestet.

---

### 2. Zusätzliche Testfälle für die Engine

**Was:** Der QCA-Rechenkern (`packages/engine`) hat ~26 Tests. Es gibt aber noch
Edge Cases ohne Abdeckung: z. B. leere Truth Tables, Bedingungen mit konstanten
Werten, seltene Kalibrations-Konstellationen.

**Wie:**
- Öffne `packages/engine/test/engine.test.ts` (oder ein spezialisiertes
  `*.test.ts`).
- Füge neue `test(…)` Blöcke hinzu; nutze bestehende Muster.
- Führe `node --test` aus und stelle sicher, dass alle Tests grün sind.
- Datei-Hinweis: `packages/engine/test/` — z. B.
  `packages/engine/test/edge-cases.test.ts`.

**Warum wichtig:** Mehr Test-Abdeckung = höheres Vertrauen in Korrektheit;
besonders wichtig für ein wissenschaftliches Werkzeug.

---

### 3. Englische Übersetzung der QCA-Methodik-Seite

**Was:** Der QCA-Primer (`docs/qca-primer.md`) erklärt Konzepte und Algorithmen
auf Deutsch. Eine **englische Variante** (`docs/qca-primer-en.md`) würde
internationales Publikum erreichen.

**Wie:**
- Lese `docs/qca-primer.md` und übersetze Abschnitt-für-Abschnitt ins Englische.
- Halte Fachbegriffe konsistent (z. B. "Truth Table", "inclusion consistency").
- Nutze Quellenangaben auf Englisch (Ragin 2008, etc.).
- Datei-Hinweis: `docs/qca-primer-en.md`.

**Warum wichtig:** Sprache ist oft eine Hürde für Open-Source; Englisch öffnet
neue Nutzer:innen-Gruppen.

---

### 4. Barrierefreiheits-Review der Web-Formulare

**Was:** Die Web-App (`apps/web`) hat Formulare zur Datensatz-Kalibrierung und
-Analyse. Ein Barrierefreiheits-Audit stellt sicher, dass alles via Tastatur
steuerbar ist und Screen-Reader-tauglich ist.

**Wie:**
- Starte die App: `npm run dev --workspace web`.
- Teste mit deinen Augen: Sind Beschriftungen sichtbar? Ist der Kontrast
  ausreichend? Ist Tab-Reihenfolge logisch?
- Teste mit Tab-Navigation: Kannst du alle Bedienelemente erreichen?
- Öffne Browser-DevTools → Lighthouse → Accessibility; notiere
  "Passed" und "Failed" Checks.
- Datei-Hinweis: Öffne ein Issue oder schreibe einen kurzen Accessibility-Report.

**Warum wichtig:** Barrierefreiheit ist Menschenpflicht und oft gesetzlich
verlangt (WCAG).

---

### 5. Verbesserte CSV-Fehlermeldungen und -Validierung

**Was:** Wenn Nutzer:innen eine falsch formatierte CSV hochladen, erhalten sie
manchmal kryptische Fehlertexte. Ziel: klare, konstruktive Meldungen.

**Wie:**
- Suche den CSV-Parser in `apps/web/src/` (likely:
  `apps/web/src/lib/` oder `apps/web/src/hooks/`).
- Verbessere die Fehlerbehandlung: statt "SyntaxError: unexpected token", melde
  z. B. "Spalte 'outcome' fehlt. Stellen Sie sicher, dass die erste Zeile die
  Spaltennamen enthält und nur alphanumerische Zeichen und Unterstriche nutzt."
- Schreibe Tests für häufige Fehlerfälle: missing columns, wrong data types, etc.
- Datei-Hinweis: `apps/web/src/lib/csv-parser.ts` (oder ähnlich).

**Warum wichtig:** Gute Fehlermeldungen senken Frust; neue Nutzer:innen fühlen
sich unterstützt.

---

## Lizenz der Beiträge

openQCA steht unter der **MIT-Lizenz** (siehe [`LICENSE`](LICENSE)). Mit dem
Einreichen eines Beitrags stimmst du zu, dass dein Beitrag unter denselben
Bedingungen lizenziert wird.
