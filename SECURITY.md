# Sicherheitsrichtlinie (Security Policy)

Die Sicherheit von openQCA und der Schutz von Forschungsdaten haben hohe
Priorität. Vielen Dank, dass du hilfst, das Projekt sicher zu halten.

## Unterstützte Versionen

openQCA befindet sich in aktiver Entwicklung. Sicherheitskorrekturen werden für
die jeweils **aktuelle Hauptentwicklungslinie (`main`)** und die letzte
veröffentlichte Version bereitgestellt.

## Sicherheitslücke melden (Responsible Disclosure)

Bitte melde vermutete Sicherheitslücken **vertraulich** und **nicht** über ein
öffentliches Issue, einen Pull Request oder in öffentlichen Diskussionen.

- **Kontakt:** [Kontakt-Platzhalter: security@example.org]
- Alternativ, falls aktiviert, über die private Meldefunktion des Repositories
  („Report a vulnerability" / GitHub Security Advisories).

Bitte gib uns die Gelegenheit, das Problem zu untersuchen und zu beheben, bevor
Details öffentlich gemacht werden (**coordinated / responsible disclosure**).

### Was eine gute Meldung enthält

- Beschreibung der Schwachstelle und der möglichen Auswirkung (impact),
- Schritte zur Reproduktion oder ein Proof of Concept,
- betroffene Komponente (`packages/engine`, `apps/web`, Build/Config …) und
  Version bzw. Commit,
- optional: ein Vorschlag zur Behebung.

### Was du von uns erwarten kannst

- eine **Empfangsbestätigung** innerhalb weniger Werktage,
- eine erste Einschätzung und, wenn bestätigt, einen Plan zur Behebung,
- eine **Nennung** (credit) nach Wunsch, sobald die Lücke geschlossen ist.

Bitte teste **nur gegen deine eigene lokale Installation**. Führe keine Angriffe
gegen fremde Instanzen, produktive Dienste oder Daten Dritter durch.

## Umgang mit Forschungsdaten

openQCA ist **local-first** ausgelegt. Im **kostenlosen Kern (Free-Tier)** wird
der gesamte QCA-Workflow — Import, Kalibrierung, Truth Table, Minimierung,
Konsistenz-/Coverage-Maße, Notwendigkeit und Protokoll — **lokal im Browser der
Nutzerin bzw. des Nutzers** ausgeführt. **Forschungsdaten verlassen im Free-Tier
das Gerät nicht** und werden nicht an einen Server übertragen.

Optionale Funktionen (Cloud-Speicherung mit Konto, KI-Unterstützung,
Zahlungen) sind davon getrennt: Sie sind ausdrücklich als solche
gekennzeichnet und übertragen Daten nur, wenn die Nutzerin bzw. der Nutzer sie
bewusst aktiviert. Meldungen, die einen unbeabsichtigten Abfluss von
Forschungsdaten im Free-Tier betreffen, behandeln wir mit besonderer Priorität.
