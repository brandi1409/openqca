import type { RawDataset } from "./demo";
import { findCaseColumn, numericValues } from "./dataset-columns";

/** Robustes CSV-Parsing: erkennt Trennzeichen (,/;/Tab) und Dezimal-Komma. */
export function parseCsv(text: string, name = "import.csv"): RawDataset {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("Datei enthält zu wenige Zeilen (Kopfzeile + mindestens ein Fall nötig).");

  const semis = (lines[0].match(/;/g) || []).length;
  const commas = (lines[0].match(/,/g) || []).length;
  const tabs = (lines[0].match(/\t/g) || []).length;
  const delim = tabs > semis && tabs > commas ? "\t" : semis > commas ? ";" : ",";
  const decimalComma = delim === ";";

  const split = (line: string) => line.split(delim).map((s) => s.trim().replace(/^"|"$/g, ""));
  const columns = split(lines[0]);
  if (new Set(columns).size !== columns.length) throw new Error("Doppelte Spaltennamen in der Kopfzeile.");

  const rows: Record<string, number | string>[] = lines.slice(1).map((line) => {
    const vals = split(line);
    const row: Record<string, number | string> = {};
    columns.forEach((col, i) => {
      const raw = vals[i] ?? "";
      const normalized = decimalComma ? raw.replace(",", ".") : raw;
      const num = Number(normalized);
      row[col] = raw !== "" && !Number.isNaN(num) ? num : raw;
    });
    return row;
  });

  const caseCol = findCaseColumn(columns, rows);

  // Anker-Vorschläge aus Perzentilen (nur Startpunkt — Nutzer soll theoretisch begründen).
  const anchors: Record<string, [number, number, number]> = {};
  for (const col of columns) {
    const nums = numericValues({ name, caseCol, columns, rows, anchors: {} }, col).sort((a, b) => a - b);
    if (nums.length < 3) continue;
    const q = (p: number) => nums[Math.min(nums.length - 1, Math.round(p * (nums.length - 1)))];
    anchors[col] = [round(q(0.1)), round(q(0.5)), round(q(0.9))];
  }

  return { name, caseCol, columns, rows, anchors };
}

function round(v: number): number {
  return Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(2);
}
