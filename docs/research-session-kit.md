# openQCA researcher session kit

This kit operationalizes `research-observation-protocol.md`. It is for five
formative, 60-minute **first-use** sessions with researchers who do not use R
for QCA. It is not a representative study and does not authorize production
release by itself.

Do not recruit or schedule sessions until the staging canary is green, the exact
tested image digest is recorded, the selected AI provider is enabled only in
staging, and a responsible qualified person has approved the instantiated
participant information, consent wording, provider disclosure, withdrawal
boundary, records lifecycle, and complaint path described below. Reviews by AI
models are advisory preflight only: they are neither this approval nor research
participants.

## Recruitment criteria

Include adults who:

- conduct, support, teach, or study empirical research;
- do not use R for QCA;
- have not contributed to, previously used, opened, tested, or been shown
  openQCA, including its demo or synthetic example;
- can complete the session in German or English;
- can use a desktop browser for 60 minutes;
- agree to work only with the supplied synthetic material.

Recruit five people, with at least two German and two English sessions. Exclude
members of the product team, anyone with prior openQCA exposure, direct reports,
current students, or anyone otherwise dependent on the recruiter or facilitator.
Use a neutral distributor where institutional or teaching power relationships
could exist; authority figures must not learn who responds. Replace an
ineligible attendee before recording any category. Exclude any session in which
the participant opens or supplies real research data. Do not collect names or
demographics in the observation file.

## Channel-ready recruitment notice

Post only after the participant information and consent package has been
instantiated and approved and the staging preflight requirements above are met.
Prefer independently distributed institutional methods or graduate-research
networks, then the [COMPASSS community channels](https://compasss.org/community/).
Use disciplinary lists only where their audience matches the intended sample.
Do not recruit through a channel that requires demographic profiles or exposes
responders to a supervisor, instructor, employer, or other authority figure.

German:

> **Teilnehmende für einen 60-minütigen openQCA-Usability-Test gesucht.**
> Teilnehmen können volljährige Personen, die empirische Forschung durchführen,
> unterstützen, lehren oder studieren, R nicht für QCA verwenden, openQCA nie
> zuvor verwendet oder gezeigt bekommen haben und nicht daran mitgearbeitet
> haben. Die Sitzung ist auf Deutsch oder Englisch möglich und findet am
> Desktop-Browser statt. Verwendet werden ausschließlich
> bereitgestellte synthetische Lehrdaten; eigene Forschungsdaten und
> Forschungsfragen werden weder benötigt noch angenommen. Es gibt keine
> Bildschirm- oder Tonaufnahme. Die Teilnahme ist freiwillig und kann jederzeit
> beendet werden. Weitere Datenschutz- und Einwilligungsinformationen erhalten
> Interessierte vor der Terminvereinbarung.

English:

> **Participants wanted for a 60-minute openQCA usability session.** Adults may
> take part if they conduct, support, teach, or study empirical research, do not
> use R for QCA, have never used or been shown openQCA, and have not contributed
> to it. The session can be completed in German or English in a desktop browser.
> It uses supplied
> synthetic teaching data only; personal research data and research questions
> are neither needed nor accepted. There is no screen or audio recording.
> Participation is voluntary and may be stopped at any time. Prospective
> participants receive the full privacy and consent information before
> scheduling.

Before scheduling, ask only whether the candidate meets each inclusion criterion
above, whether they have ever used or been shown openQCA, whether a power or
dependency relationship exists with the recruiter or facilitator, and
which locale they prefer. Keep the screening pass/fail result, contact details,
scheduling correspondence, participant information delivery, and signed consent
in separate least-privilege stores outside the observation pipeline. The
approved authorization record must define the minimum fields, authorized roles,
retention period, deletion evidence, and privacy/withdrawal/complaint contacts
for those stores. Do not copy any of them into the session row, aggregate,
repository, or product.

## Invitation — German

> Wir testen die Verständlichkeit einer browserbasierten QCA-Arbeitsumgebung für
> Forschende, die R nicht für QCA verwenden. Die Sitzung dauert 60 Minuten und
> verwendet ausschließlich bereitgestellte synthetische Lehrdaten. Getestet wird die Oberfläche, nicht Ihr
> Fachwissen oder Ihre Forschung. Es werden keine eigenen Dateien,
> Forschungsfragen, Fallnamen oder Rohdaten verwendet. Es gibt keine
> Bildschirmaufnahme und keine freien Beobachtungsnotizen. Erfasst werden nur
> vorgegebene Kategorien wie „ohne Hilfe abgeschlossen“, „mit Hilfe
> abgeschlossen“ oder „abgebrochen“. Jede Sitzungszeile wird unmittelbar nach
> der Sitzung in einen verschlüsselten Kohorten-Zwischenstand überführt und
> gelöscht, spätestens innerhalb von 24 Stunden. Lesbare Summen entstehen erst
> nach fünf Sitzungen. Teilnahme und Abbruch sind freiwillig und ohne Nachteile
> möglich.

## Invitation — English

> We are testing the usability of a browser-based QCA workspace for researchers
> who do not use R for QCA. The session takes 60 minutes and uses only supplied
> synthetic teaching data. We are testing the interface, not your expertise or
> research. No personal files, research questions, case names, or raw data will be used.
> There is no screen recording and no free-form observation note. We record only
> fixed categories such as “completed without assistance,” “completed with
> assistance,” or “abandoned.” Each session row is immediately folded into an
> encrypted partial-cohort state and deleted, and no later than 24 hours.
> Readable totals are produced only after five sessions. Participation is
> voluntary and you may stop without consequence.

## Required participant-information authorization

Before recruitment, create one dated, versioned authorization record outside
the repository and observation pipeline. A responsible qualified person must
verify it against the actual staging deployment and approve both language
versions. It must name:

- the study controller, study contact, privacy contact, and independent
  complaint contact;
- the study purpose, 60-minute procedure, absence of compensation or the exact
  compensation, foreseeable burden and risks, and absence of direct benefit;
- every recorded category listed in `research-observation-protocol.md`, the
  separate screening/contact/scheduling/consent records, who may access each
  store, and their respective retention and verified-deletion dates;
- the approved private location, access role, at-rest protection, backup rule,
  retention period, and destruction trigger for the final readable aggregate;
- the actual AI provider and recipient, exact synthetic payload classes and
  request metadata, purpose, processing location, logging, training use,
  provider retention, applicable terms, and the consequence-free right to
  decline each request;
- the withdrawal cutoff: stopping ends collection; an unaggregated row is
  deleted on request; after irreversible non-linkable aggregation an individual
  contribution cannot be found or removed.

Give the approved participant-information sheet in the assigned language before
scheduling and allow questions before consent. The facilitator must verify its
version and date during preflight. If any deployment or provider fact differs,
do not run the session.

## Consent checkpoint

The signed consent record is stored separately and must not contain a key that
can be joined to the observation file. Before opening openQCA, read the matching
script and obtain explicit consent.

German:

> Sie haben das datierte Informationsblatt erhalten und konnten Fragen stellen.
> Heute verwenden Sie nur die bereitgestellten synthetischen Daten. Wir erfassen
> ausschließlich die dort vollständig aufgeführten Kategorien, ohne Bildschirm-,
> Ton- oder Freitextaufzeichnung. Sie können Aufgaben überspringen oder die
> Sitzung jederzeit ohne Nachteil beenden. Das beendet jede weitere Erfassung
> und eine noch nicht aggregierte Sitzungszeile wird gelöscht. Nach der
> irreversiblen, nicht verknüpfbaren Aggregation einer abgeschlossenen Sitzung
> kann Ihr einzelner Beitrag nicht mehr gefunden oder entfernt werden. Drei
> getrennte AI-Schritte sind freiwillig:
> Vor jedem Schritt sehen Sie die exakte synthetische Nutzlast und entscheiden
> erneut, ob sie an den im Informationsblatt genannten Provider gesendet wird.
> Eine Ablehnung hat keine Nachteile. Stimmen Sie der beschriebenen Beobachtung
> ausdrücklich zu?

English:

> You received the dated information sheet and had an opportunity to ask
> questions. Today you will use only the supplied synthetic data. We record only
> the complete category inventory in that sheet, without screen, audio, or
> free-form recording. You may skip tasks or stop at any time without
> consequence; stopping ends further collection and deletes a session row that
> has not yet been aggregated. After irreversible non-linkable aggregation of a
> completed session, your individual contribution can no longer be found or
> removed. The three separate AI steps are optional: before each one you see the
> synthetic payload and decide again whether to send it to the provider named in
> the information sheet. Declining has no disadvantage. Do you explicitly
> consent to this observation as described?

If consent is not explicit, end the session before recording any category.

If a participant stops, stop all collection immediately, delete the session row,
and do not aggregate it or count it among the five completed sessions. Do not
record an `abandoned` outcome for a withdrawn session; `abandoned` describes an
observed task outcome only when the participant continues the session. If a
completed row has already been irreversibly aggregated, explain that the
contribution is no longer identifiable or removable and record nothing further.
A skipped task is not withdrawal from the session.

## Facilitator preflight

Record operational evidence outside the participant observation file:

- staging URL and immutable image digest;
- successful healthcheck and browser canary;
- locale assigned to the session;
- a clean browser profile with no saved openQCA project;
- `docs/research-session-synthetic.csv` available locally;
- AI enabled in staging with the approved provider and gold corpus already green;
- approved participant-information authorization record, matching
  information-sheet version/date, and separate consent form;
- no analytics, screen recorder, meeting transcription, or developer-tools
  network preservation running.

Once before session one, create the cohort key and aggregate state in separate
private directories that are independently access-controlled and excluded from
backups. Reuse the key through session five:

```bash
install -d -m 700 "$HOME/.openqca-research-key" "$HOME/.openqca-research-state"
npm run research:key -- "$HOME/.openqca-research-key/cohort.key"
```

Before each session, create exactly one locale-specific category row directly
as a private 0600 file:

```bash
npm run research:template -- de /tmp/openqca-research-session.json
# or: npm run research:template -- en /tmp/openqca-research-session.json
```

The command creates the file exclusively and refuses to overwrite one. The
template deliberately starts every task as failed or not observed. Change a
value only after directly observing the corresponding behavior. Record
`decision_completion` as `assisted` if any part of calibration or the three
analysis confirmations required procedural help. Never add a field, identifier,
timestamp, URL, text excerpt, error message, provider/model name, QCA value,
payload, or AI response.

## Supplied task material

Give the participant only the column matching the assigned locale.

| Fact | German | English |
|---|---|---|
| Data | Die CSV ist synthetisch und nicht zitierfähig. | The CSV is synthetic and not citable. |
| Case label | `case_id` ist die Fall-ID-Spalte. | `case_id` is the case-label column. |
| Outcome | `y` ist das Outcome. | `y` is the outcome. |
| Conditions | `x1`, `x2`, `x3` und `x4` sind sprachneutrale Bedingungscodes. | `x1`, `x2`, `x3`, and `x4` are language-neutral condition codes. |
| Goal | Erreichen Sie zuerst eine vorläufige Antwort und machen Sie das Projekt danach defense-ready, ohne das Ergebnis als kausalen Nachweis zu behandeln. | Obtain a provisional answer first, then make the project defense-ready without treating the result as causal evidence. |

Research brief content supplied on paper or in a separate read-only task sheet:

| Field | German | English |
|---|---|---|
| Question | Welche Kombinationen von X1 bis X4 sind in den synthetischen Lehrfällen hinreichend für hohe Zugehörigkeit zu Y? | Which combinations of X1 through X4 are sufficient for high membership in Y in the synthetic teaching cases? |
| Case universe | 18 synthetische, sprachneutral codierte Lehrfälle | 18 synthetic, language-neutrally coded teaching cases |
| Time period | Kein realer Zeitraum; synthetischer Lehrdatensatz | No real period; synthetic teaching dataset |
| Outcome concept | Zugehörigkeit zum synthetischen Outcome Y | Membership in synthetic outcome Y |
| Condition rationale | X1 bis X4 wurden nur zur Demonstration konfigurationaler QCA-Rechenwege ausgewählt; keine empirische oder kausale Behauptung | X1 through X4 were selected only to demonstrate configurational QCA calculations; no empirical or causal claim |

Calibration anchors and valid lower/higher crossover alternatives:

| Variable | Fully out | Crossover | Fully in | Lower alternative | Higher alternative |
|---|---:|---:|---:|---:|---:|
| `x1` | 400 | 550 | 900 | 500 | 650 |
| `x2` | 25 | 45 | 65 | 40 | 50 |
| `x3` | 60 | 85 | 98 | 80 | 90 |
| `x4` | 4 | 6.5 | 10 | 5.5 | 7.5 |
| `y` | 2 | 5 | 9 | 4 | 6 |

Evidence content supplied for every active set:

| Field | German | English |
|---|---|---|
| Construct label | Hohe Zugehörigkeit zu X1/X2/X3/X4/Y | High membership in X1/X2/X3/X4/Y |
| Definition | Synthetische Lehrmengen-Zugehörigkeit, abgeleitet aus der bereitgestellten numerischen Skala und den Ankern; keine empirische Validitätsbehauptung. | Synthetic teaching-set membership derived from the supplied numeric scale and anchors; no empirical validity claim. |
| Source | Dieser Sitzungsleitfaden im openQCA-Repository. | This session kit in the openQCA repository. |
| Evidence note | Synthetische Definition und Anker für die Usability-Beobachtung bereitgestellt; nicht extern geprüft. | Synthetic definition and anchors supplied for the usability observation; not externally checked. |

Ask the participant to use the supplied content to make every active set record
ready for a defense package, including case and sensitivity review. Do not name
controls, their order, or the status value that achieves the goal. Any
procedural cue is assistance and must be recorded as such.

Analysis-decision rationales:

| Decision | German | English |
|---|---|---|
| Frequency | Eine Fallzahl pro Truth-Table-Zeile bleibt erhalten, weil die synthetische Lehrstichprobe nur 18 Fälle umfasst. | One case per truth-table row is retained because the synthetic teaching sample contains only 18 cases. |
| Consistency | 0,80 bleibt als transparenter Lehrschwellenwert erhalten, nicht als empirische Validierung. | 0.80 is retained as a transparent teaching threshold, not as empirical validation. |
| Directional expectations | Anwesenheit ist für jede aktive Bedingung eine Lehrannahme und darf nicht als kausale Behauptung interpretiert werden. | Presence is a teaching assumption for each active condition and must not be interpreted as a causal claim. |

Participant task prompts:

| Phase | German | English |
|---|---|---|
| Entry | Benennen Sie alle drei Einstiegspfade. Importieren Sie anschließend die bereitgestellte CSV, weisen Sie die Rollen zu und erreichen Sie eine vorläufige Antwort. | Identify all three entry paths. Then import the supplied CSV, assign the roles, and reach a provisional answer. |
| Research design | Vervollständigen und bestätigen Sie das Forschungsdesign mit den bereitgestellten Inhalten. Prüfen Sie an diesem Entscheidungspunkt die sichtbare Nutzlast für `brief_clarify` und entscheiden Sie, ob Sie senden. | Complete and confirm the research design with the supplied content. At this decision point, inspect the visible `brief_clarify` payload and decide whether to send. |
| Calibration | Dokumentieren Sie alle aktiven Kalibrierungen mit den bereitgestellten Ankern und Evidenzinhalten und prüfen Sie Fall- und Sensitivitätsergebnisse. Prüfen Sie dabei die sichtbare Nutzlast für `calibration_evidence_gaps` und entscheiden Sie, ob Sie senden. | Document all active calibrations with the supplied anchors and evidence content, and review case and sensitivity results. During this work, inspect the visible `calibration_evidence_gaps` payload and decide whether to send. |
| Analysis decisions | Begründen und bestätigen Sie alle drei Analyseentscheidungen. Erklären Sie, wodurch eine Bestätigung ungültig wird. Prüfen Sie vor der letzten Bestätigung die sichtbare Nutzlast für `decision_rationale_review` und entscheiden Sie, ob Sie senden. | Justify and confirm all three analysis decisions. Explain what invalidates a confirmation. Before the final confirmation, inspect the visible `decision_rationale_review` payload and decide whether to send. |
| Evidence and defense | Prüfen Sie die Evidenz, erreichen Sie Defense Readiness und erklären Sie den Unterschied zwischen einer vorläufigen Antwort, einem Replikationspaket und einer kausalen Behauptung. | Inspect the evidence, reach Defense Readiness, and explain the difference between a provisional answer, a reproducibility package, and a causal claim. |

## Neutral 60-minute facilitation

1. **Consent and framing — 5 min.** Give no tour of the interface.
2. **Entry and activation — 10 min.** Ask the participant to identify all three
   entry paths, import the supplied CSV, assign roles, and reach a provisional
   answer. Do not point to a control unless assistance is requested.
3. **Research design — 12 min.** Supply the brief table, ask the participant to
   complete and confirm the design, then evaluate `brief_clarify` at this exact
   decision point through its visible payload preview.
4. **Calibration decisions — 15 min.** Supply anchors and evidence content. Ask
   the participant to document active calibrations and evaluate
   `calibration_evidence_gaps` while that decision is still open.
5. **Analysis decisions — 10 min.** Supply the three rationales. Ask the
   participant to confirm all three decisions, explain invalidation, and
   evaluate `decision_rationale_review` before final confirmation.
6. **Evidence and defense — 8 min.** Ask the participant to inspect evidence,
   reach Defense Readiness, and distinguish a provisional answer, a
   reproducibility package, and a causal claim.

For every AI task, the participant first inspects the exact visible payload.
Repeat the provider, processing, and consequence-free refusal disclosure from
the approved information sheet, then ask for a separate decision whether to
send. A prior send never authorizes a later one. Stop the AI portion immediately
if any prohibited output appears. AI time is part of its associated task, not a
retrospective final phase.

Use only the locale-matched probes:

| German | English |
|---|---|
| „Was würden Sie als Nächstes tun?“ | “What would you do next?” |
| „Was bedeutet dieser Status Ihrer Meinung nach?“ | “What do you think this status means?” |
| „Wo würden Sie danach suchen?“ | “Where would you look for that?” |
| „Würden Sie erwarten, dass diese Aktion das numerische Ergebnis verändert?“ | “Would you expect this action to change the numerical result?” |

Score the three conceptual fields independently and only from the participant's
own explanation:

- `provisional_interpretation` is `correct` only if the current answer is
  described as deterministic but revisable when design or decisions change;
- `gate_interpretation` is `correct` only if Defense Readiness is described as a
  documentation/reproducibility gate, not a truth or quality certificate;
- `causal_interpretation` is `correct` only if the participant explicitly says
  neither the answer nor Defense Readiness establishes causality.

Use `partial` when the distinction is incomplete but not contradicted, and
`incorrect` when the participant asserts the opposite or cannot distinguish it.
Do not prompt with these criteria before scoring.

Do not teach QCA, reveal the next control, praise a choice, or reformulate a task
until the participant explicitly requests assistance. Once assistance is given,
record the task as `assisted`, even if it is later completed.

## Aggregate and delete

Immediately after each completed session, validate its one row, update the
authenticated encrypted partial cohort, and delete the row. A stopped session
is deleted without aggregation:

```bash
npm run research:aggregate -- /tmp/openqca-research-session.json \
  --output "$HOME/.openqca-research-state/cohort.aggregate.json" \
  --key-file "$HOME/.openqca-research-key/cohort.key" --delete-source
```

The output directory must be private mode 0700, excluded from backups and
version control, and accessible only to the approved research-data role.
Sessions one through four leave only an authenticated AES-256-GCM envelope with
mode 0600. It contains no readable counts; the separately protected 32-byte key
is required for the next update. Session five atomically replaces that envelope
with the readable, complete cohort aggregate and deletes the now-obsolete key.
The approved authorization record defines the final aggregate's access role,
at-rest protection, retention deadline, verified-deletion owner, and whether a
non-identifying archival copy is permitted. Never use `/tmp` for the aggregate.
Do not copy, version, back up, or inspect partial files. If recruitment is
cancelled, delete the encrypted partial file, any session row, and the key.

The command authenticates and validates the exact running count schema before
replacement. It rejects extra fields, impossible AI or decision combinations, a
fourth session in one language, a wrong or exposed-permission key, a modified
partial envelope, or a sixth session. It cleans candidate output on failure and
leaves the source row and prior partial state unchanged.

If the command reports that state was updated but source deletion failed,
delete that source manually and do not rerun it. If finalization reports only a
key-deletion failure, delete the named obsolete key manually. Any remaining
source must be removed within 24 hours even if recruitment pauses. Confirm the
session row has mode 0600 before aggregation and verify its deletion afterward.

Only after session five do `cohortComplete`, `languageMix`, the one-dimensional
time, blocker, completion, interpretation, and AI histograms, and all
substantive stop gates become readable. Use that five-session aggregate through
the predeclared decision process below; it does not authorize inventing
participant explanations.

## Evidence-to-iteration decision record

Create a separate, non-participant decision record from the complete aggregate.
Copy no participant-level combinations. List every failed gate with its count,
then select exactly one smallest repairable barrier by this fixed priority:

1. prohibited AI output or privacy/safety failure;
2. causal, provisional-answer, or defense-package conceptual boundary;
3. import/activation, decision completion, or Defense Readiness;
4. required DE/EN language mix;
5. time, blocker, and AI-helpfulness distributions as descriptive tie-breakers.

Record the selected barrier, aggregate fields supporting it, smallest proposed
repair, owner, acceptance check, and exact observation stage to repeat. Do not
infer motives, prevalence, or causality from five sessions. A safety repair
requires the full DE/EN AI goldset plus the affected observation stage; another
failed gate requires the affected stage with a fresh eligible cohort. If all
gates pass, record that no evidence-backed product repair was selected.
