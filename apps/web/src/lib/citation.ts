/**
 * Wie openQCA zitiert wird.
 *
 * Eine Quelle für alle Stellen: Karte in der App, Abschnitt im Bericht,
 * `CITATION.cff`. Der DOI kommt aus `NEXT_PUBLIC_ZENODO_DOI` und wird erst
 * ausgegeben, wenn er gesetzt ist — ein erfundener oder Platzhalter-DOI wäre
 * schlimmer als gar keiner: Er sähe zitierfähig aus und liefe ins Leere.
 *
 * Die Versionsangabe stammt aus `NEXT_PUBLIC_APP_VERSION` (siehe
 * `apps/web/next.config.ts`); fehlt sie, steht dort „dev" statt einer erfundenen
 * Release-Nummer.
 */

const AUTHOR = "Brandauer, John";
const TITLE = "openQCA: An open, reproducible tool for Qualitative Comparative Analysis";
const REPO = "https://github.com/brandi1409/openqca";

export type CitationInfo = {
  /** Volle Version inklusive Commit, wie sie auch im Protokoll steht. */
  version: string;
  /** Nur die Release-Nummer, ohne Commit-Suffix — das gehört in eine Zitation. */
  releaseVersion: string;
  year: number;
  doi: string | null;
  url: string;
  /** Fertige Zeile für einen Literaturverzeichnis-Eintrag. */
  plain: string;
  bibtex: string;
};

export function citationInfo(now: Date = new Date()): CitationInfo {
  const version = process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "dev";
  const releaseVersion = version.split("+")[0];
  const doiRaw = process.env.NEXT_PUBLIC_ZENODO_DOI?.trim();
  const doi = doiRaw ? doiRaw.replace(/^https?:\/\/doi\.org\//, "") : null;
  const year = now.getFullYear();
  const url = doi ? `https://doi.org/${doi}` : REPO;

  const plain = [
    `${AUTHOR} (${year}).`,
    `${TITLE}.`,
    `Version ${releaseVersion}.`,
    doi ? `Zenodo. https://doi.org/${doi}` : REPO,
  ].join(" ");

  const bibtex = [
    "@software{openqca,",
    `  author  = {${AUTHOR}},`,
    `  title   = {${TITLE}},`,
    `  year    = {${year}},`,
    `  version = {${releaseVersion}},`,
    doi ? `  doi     = {${doi}},` : null,
    `  url     = {${url}}`,
    "}",
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return { version, releaseVersion, year, doi, url, plain, bibtex };
}
