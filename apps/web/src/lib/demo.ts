import type { QcaCase } from "@openqca/engine";

/** Synthetischer Demo-Datensatz (angelehnt an die Lipset-Fragestellung, rein illustrativ). */
export interface RawDataset {
  name: string;
  caseCol: string;
  columns: string[];
  rows: Record<string, number | string>[];
  /** Vorgeschlagene Kalibrierungsanker je Rohvariable: [voll draußen, Kreuzung, voll drinnen]. */
  anchors: Record<string, [number, number, number]>;
}

const HEADER = ["Fall", "wohlstand", "urban", "bildung", "stabil", "demo_ueberleben"];
const RAW: (string | number)[][] = [
  ["Belgien", 1098, 60, 94, 10, 9], ["Niederlande", 1008, 57, 95, 9, 10], ["Grossbritannien", 1038, 74, 99, 10, 10],
  ["Frankreich", 983, 51, 96, 7, 8], ["Schweden", 897, 34, 99, 9, 9], ["Tschechoslowakei", 586, 42, 95, 8, 7],
  ["Finnland", 590, 22, 99, 7, 6], ["Irland", 662, 25, 95, 8, 7], ["Deutschland", 795, 56, 98, 4, 2],
  ["Oesterreich", 720, 33, 98, 3, 2], ["Spanien", 367, 37, 50, 4, 1], ["Italien", 517, 31, 72, 5, 1],
  ["Polen", 350, 25, 77, 3, 2], ["Ungarn", 424, 36, 91, 4, 2], ["Portugal", 320, 15, 38, 5, 1],
  ["Griechenland", 390, 31, 59, 4, 1], ["Estland", 468, 28, 95, 6, 3], ["Rumaenien", 331, 21, 62, 4, 1],
];

export const DEMO: RawDataset = {
  name: "demo_zwischenkriegszeit (synthetisch)",
  caseCol: "Fall",
  columns: HEADER,
  rows: RAW.map((r) => {
    const o: Record<string, number | string> = {};
    HEADER.forEach((h, i) => (o[h] = r[i]));
    return o;
  }),
  anchors: {
    wohlstand: [400, 550, 900],
    urban: [25, 45, 65],
    bildung: [60, 85, 98],
    stabil: [4, 6.5, 10],
    demo_ueberleben: [2, 5, 9],
  },
};

/** Wandelt kalibrierte Rohdaten in Engine-Fälle: alle Fuzzy-Spalten (fs_*) übernehmen. */
export function toQcaCases(
  rows: Record<string, number | string>[],
  caseCol: string,
  fuzzyCols: string[],
): QcaCase[] {
  return rows.map((r) => {
    const values: Record<string, number> = {};
    for (const c of fuzzyCols) values[c] = Number(r[c]);
    return { label: String(r[caseCol]), values };
  });
}
