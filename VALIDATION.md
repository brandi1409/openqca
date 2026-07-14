# Validierung des QCA-Rechenkerns

Die eigenständige Referenz-Suite wird aus dem Repository-Wurzelverzeichnis mit
Node.js 26 ausgeführt:

```sh
node scripts/reference-check.mjs
```

Das Skript importiert die TypeScript-Quellen des Rechenkerns direkt und benötigt
keinen Build-Schritt. Es liest die drei CSV-Dateien unter `datasets/`; die bereits
kalibrierten Crisp- und Fuzzy-Daten werden unmittelbar als QCA-Fälle verwendet.

## Was geprüft wird

- dokumentierte Fixpunkte und ein dokumentiertes Beispiel der direkten
  Kalibrierung (`calibrateDirect`), jeweils mit einer Toleranz von ±0,01;
- vollständiger Aufbau der Truth Tables und eindeutige Zuordnung aller Fälle;
- Berechnung der komplexen und sparsamen Lösung für beide kalibrierten
  Beispieldatensätze;
- dokumentierte komplexe und sparsame Lösungsformeln;
- dokumentierte Kennzahlen der sparsamen Lösungen mit ±0,01:
  - Crisp, `freqCut = 1`, `consCut = 1,00`:
    `FOERDERUNG*TEAM + MARKT*~KONKURRENZ`, Coverage 1,00 und Konsistenz 1,00;
  - Fuzzy, `freqCut = 1`, `consCut = 0,85`:
    `STAATSKAPAZITAET + WOHLSTAND*BILDUNG`, Coverage ungefähr 0,95 und
    Konsistenz ungefähr 0,99;
- Berechnung der Notwendigkeitsanalyse für jede Bedingung und ihre Negation.

Die aktuellen Kennzahlen der komplexen Lösungen sowie die Werte der
Notwendigkeitsanalysen sind im Skript als **interne Regressions-Snapshots**
festgehalten. Sie stammen aus der gegenwärtigen Engine-Ausgabe und werden nicht
als extern validierte Referenzwerte ausgegeben.

## Aussagegrenze

Diese Suite ist eine interne Regressions- und Referenzprüfung für den
openQCA-Rechenkern. Sie zeigt, dass die dokumentierten Beispiele reproduzierbar
sind und dass sich ausgewählte Engine-Ausgaben nicht unbemerkt verändern.

Sie ist **noch keine vollständige Kreuzvalidierung** gegen fsQCA 4.1 oder das
R-Paket QCA. Dafür müssten separat erzeugte Vergleichsausgaben dieser Werkzeuge
vorliegen, methodisch abgeglichen und als unabhängige Fixtures in eine erweiterte
Validierung aufgenommen werden.
