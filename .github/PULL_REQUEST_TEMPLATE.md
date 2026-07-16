# Pull Request

## Was und Warum / What and Why

Beschreibe kurz, was diese PR ändert und warum diese Änderung notwendig ist.

Briefly describe what this PR changes and why this change is necessary.

Closes #(issue-number, if applicable)

---

## Checkliste / Checklist

Bitte beachte folgende Punkte vor der Zusammenführung / Please ensure the following before merging:

### Tests und Validierung / Tests and validation

- [ ] `node --test` läuft grün in `packages/engine` (Engine-Änderungen)
  - `node --test` runs green in `packages/engine` (for engine changes)
- [ ] `node scripts/reference-check.mjs` läuft grün
  - `node scripts/reference-check.mjs` runs green
- [ ] `npm run build --workspace web` läuft grün (Web-App-Änderungen)
  - `npm run build --workspace web` runs green (for web-app changes)
- [ ] `npm run lint --workspace web` läuft grün (bei UI-Änderungen)
  - `npm run lint --workspace web` runs green (for UI changes)

### Code-Qualität / Code quality

- [ ] Bei Engine-Änderungen: Alle Formeln sind mit Quellen (Ragin, Literatur, oder Kommentare) belegt
  - For engine changes: All formulas are documented with sources (Ragin, literature, or comments)
- [ ] Neue Tests für neue oder geänderte Funktionen vorhanden
  - New tests for new or changed functions are included
- [ ] Kein `any` ohne dokumentierten Grund; TypeScript `strict` ist aktiv
  - No `any` without documented reason; TypeScript `strict` is enabled

### Dokumentation / Documentation

- [ ] README oder `docs/`-Seiten aktualisiert, falls Nutzer-API sich ändert
  - README or `docs/` pages updated if user-facing API changes
- [ ] Bei Methodik-Änderungen: Kontext/Kommentare für Reviewer hinzugefügt
  - For methodology changes: Added context/comments for reviewers

---

## Verwandte Issues / Related issues

- Closes #(issue-number)
- Related to #(issue-number)

---

## Screenshots oder Demo / Screenshots or demo (if applicable)

Falls UI-Änderungen: Bitte Screenshot oder kurze Beschreibung / If UI changes: Please add a screenshot or brief description.
