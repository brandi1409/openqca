import type { RawDataset } from "@/lib/demo";

export type DetectedColumnType = "case" | "crisp" | "fuzzy" | "raw" | "text";
export interface ImportPreflight { filename: string; dataset: RawDataset; rowCount: number; numericColumns: string[]; detectedTypes: Record<string, DetectedColumnType>; proposedConditions: string[]; proposedOutcome: string | null; warnings: string[] }

export function inspectImport(dataset: RawDataset, filename: string): ImportPreflight {
  const detectedTypes: Record<string, DetectedColumnType> = {};
  const numericColumns: string[] = [];
  for (const column of dataset.columns) {
    if (column === dataset.caseCol) { detectedTypes[column] = "case"; continue; }
    const values = dataset.rows.map((row) => row[column]).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (!values.length) { detectedTypes[column] = "text"; continue; }
    numericColumns.push(column);
    detectedTypes[column] = values.every((value) => value === 0 || value === 1) ? "crisp" : values.every((value) => value >= 0 && value <= 1) ? "fuzzy" : "raw";
  }
  const warnings: string[] = [];
  if (!dataset.caseCol.trim()) warnings.push("No case identifier column was detected.");
  if (!numericColumns.length) warnings.push("No numeric columns were detected.");
  if (dataset.rows.length === 0) warnings.push("The file contains no data rows.");
  const proposedOutcome = numericColumns.at(-1) ?? null;
  return { filename, dataset, rowCount: dataset.rows.length, numericColumns, detectedTypes, proposedConditions: proposedOutcome ? numericColumns.filter((column) => column !== proposedOutcome) : [], proposedOutcome, warnings };
}
