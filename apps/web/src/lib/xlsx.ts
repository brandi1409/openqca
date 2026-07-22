import * as XLSX from "xlsx";
import type { RawDataset } from "@/lib/demo";
import { findCaseColumn, numericValues } from "@/lib/dataset-columns";
/** Wandelt eine hochgeladene XLSX-Datei (erstes Sheet) in ein RawDataset um. */
export async function parseXlsxToDataset(file: File): Promise<RawDataset> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Die Arbeitsmappe enthält kein Arbeitsblatt.");
  const worksheet = workbook.Sheets[sheetName];

  const raw = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

  const isEmptyRow = (row: unknown[] | undefined): boolean =>
    !row || row.every((c) => c === undefined || c === null || (typeof c === "string" && c.trim() === ""));

  const nonEmptyRows = raw.filter((row) => !isEmptyRow(row));
  if (nonEmptyRows.length < 2) {
    throw new Error("Datei enthält zu wenige Zeilen (Kopfzeile + mindestens ein Fall nötig).");
  }

  const toCell = (v: unknown): number | string => {
    if (typeof v === "number") return v;
    if (v === undefined || v === null) return "";
    return String(v).trim();
  };

  const headerRow = nonEmptyRows[0];
  const columns = headerRow.map((c) => String(toCell(c)));
  if (new Set(columns).size !== columns.length) {
    throw new Error("Doppelte Spaltennamen in der Kopfzeile.");
  }

  const rows: Record<string, number | string>[] = nonEmptyRows.slice(1).map((line) => {
    const row: Record<string, number | string> = {};
    columns.forEach((col, i) => {
      row[col] = toCell(line[i]);
    });
    return row;
  });

  const caseCol = findCaseColumn(columns, rows);

  // Anker-Vorschläge aus Perzentilen (nur Startpunkt — Nutzer soll theoretisch begründen).
  const anchors: Record<string, [number, number, number]> = {};
  for (const col of columns) {
    const nums = numericValues({ name: file.name, caseCol, columns, rows, anchors: {} }, col).sort((a, b) => a - b);
    if (nums.length < 3) continue;
    const q = (p: number) => nums[Math.min(nums.length - 1, Math.round(p * (nums.length - 1)))];
    anchors[col] = [round(q(0.1)), round(q(0.5)), round(q(0.9))];
  }

  return { name: file.name, caseCol, columns, rows, anchors };
}

function round(v: number): number {
  return Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(2);
}
