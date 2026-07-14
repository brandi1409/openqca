# Prototypen & Plan

Explorative Vorstufen aus der Konzeptphase (statische HTML-Dateien, ohne Build im Browser öffnebar). Sie sind **nicht** Teil der lauffähigen App unter `apps/web`, sondern dokumentieren die Design- und Produktentscheidungen.

- **01-analyse-pipeline-prototyp.html** — erster klickbarer Durchstich der vollständigen Analyse-Pipeline (Kalibrierung → Truth Table → Minimierung → XY-Plot → Protokoll), noch mit Inline-Logik.
- **02-kalibrierungs-assistent.html** — geführter Kalibrierungs-Assistent (Methodenwahl, Theorie-vs.-Daten-Anker, Live-Coach mit Schiefe-/0,5-/Grenzfall-Diagnostik). Herzstück der „geführten" Produktidee; in der App unter `apps/web` real umgesetzt.
- **03-goldplan.html** — der Gold-Plan: Definition-of-Done, Tarife, Tech-Stack, 7-Phasen-Bauplan, Recht/DSGVO, Aufgabenteilung.

Die produktive Umsetzung liegt im Rechenkern `packages/engine` und der App `apps/web`.
