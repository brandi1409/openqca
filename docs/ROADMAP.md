# Roadmap — openQCA

Dieses Dokument gibt einen ehrlichen Überblick über die geplanten Entwicklungen von openQCA in drei Zeithorizonten. Die Roadmap wird regelmäßig aktualisiert und ist **nicht verbindlich** — Prioritäten können sich ändern.

---

## Kurzfristig (nächste 3–6 Monate)

### Cross-Validierung gegen R-Paket QCA abschließen

Die Engine-Regressions-Suite (`node scripts/reference-check.mjs`) validiert derzeit nur interne Konsistenz. Ziel ist eine **Kreuzvalidierung** gegen das etablierte R-Paket QCA (und ggf. fsQCA 4.1), um Korrektheit und Reproduzierbarkeit wissenschaftlich zu sichern. Erfordert: Vergleichs-Fixtures erstellen, Toleranzen abstimmen, Befunde dokumentieren.

### Desktop-Installer via Tauri signieren

Die Tauri-Builds sind funktional, aber unsigniert. Desktop-Download setzt Signatur voraus (Apple Developer ID, Windows Authenticode). Erfordert: Developer-Konten, Zertifikate, Build-Pipeline erweitern, Releases verwalten.

### Repository-Veröffentlichung (öffentlich gehen)

Der Code ist reif, aber das Repo ist noch privat. Nächster Schritt: GitHub öffentlich machen, Lizenztext prüfen, Domain einrichten (oder zenodo.org), Zenodo-DOI generieren, erste stabile Version taggen (v1.0 o. ä.).

---

## Mittelfristig (6–12 Monate)

### csQCA- und mvQCA-Erweiterungen

Die aktuelle Engine implementiert **Standardfall-QCA** (single-outcome, cross-case). Erweiterungen um **Crisp-Set QCA** (vereinfachte, nur 0/1) und **Multi-Value QCA** (Bedingungen mit >2 Werten) würden Anwendbarkeit vergrößern. Erfordert: neue Kalibrations- und Minimierungslogik, separate Tests, Dokumentation.

### Zeitreihen- und Panel-Ansätze prüfen

Einige QCA-Projekte arbeiten mit **Längsschnittdaten** (mehrere Messzeitpunkte pro Fall). Ziel: Machbarkeits-Studie durchführen — können Zeitserien direkt (via Weighted QCA) oder mit Voraggregation in Standard-QCA eingehen? Ergebnis dokumentieren.

### Weitere Robustheits-Tests

Aktuell: `robustness.test.ts` prüft Konsistenz/Coverage unter Perturationen. Erweiterungen: **Jackknife**-Validierung (Fall-wise cross-validation), **Stabilitäts-Indizes** für einzelne Lösungsterme, Sensitivity gegenüber Kalibrationsschwellen. Tools: Integration in Web-UI und/oder R-Export.

### Englische Methodik-Seite (`docs/qca-primer-en.md`)

Der QCA-Primer existiert nur auf Deutsch. Eine **englische Übersetzung** würde internationales Publikum erreichen und das Projekt als wissenschaftliches Werkzeug etablieren. Erfordert: fachkundige Übersetzung (Englisch + QCA-Fachsprache), Review.

---

## Ideen (low-priority backlog)

### Collaboration (echtzeitbasiert)

**Live-Kollaboration** (mehrere Nutzer an einem Projekt): Würde Lehrszenarien und Gruppenprojekte unterstützen. Technisch komplex (WebSocket, Conflict-Resolution). Nieder-Priorität, da aktuell Fokus auf Kern-Engine liegt.

### Lehr-Modus ("Guided Teaching")

Ein **Schritt-für-Schritt-Tutorial**, das Anfänger durch QCA führt — mit Erklärungen, interaktiven Quiz, Beispieldatensätzen. Würde Hürde für Studierende senken. Erfordert: Didaktik-Input, UI-Komponenten.

### Plugin-Schnittstelle

Eine **offene Plugin-API**, mit der Expert:innen die Engine erweitern könnten (neue Kalibrationsmethoden, Export-Formate, Post-Processing). Würde Ökosystem-Wachstum ermöglichen. Langfristig, abhängig von Prioritäten.

### Performance-Optimierungen

Die Engine lädt **vollständig lokal** (browserbasiert), was Vertrauen schafft. Aber: große Datensätze (1000+ Fälle) können langsam werden. Ziel: Profiling, Algorithmen-Optimierung, Web-Worker zur Parallelisierung.

---

## Kontext und Wartung

- **Issue-Triaging:** Regelmäßige Community-Anfragen werden hier eingepflegt; je 2 Wochen Review.
- **Abhängigkeitsupdate:** Node.js, TypeScript, Next.js, React monatlich gepinnt; Sicherheitsupdates sofort.
- **Datenschutz & Lizenz:** Anwaltliche Prüfung der legal/*-Entwürfe bleibt ausstehend (DSGVO, AGB, Impressum müssen vor öffentlichem Deployment verifiziert werden).

