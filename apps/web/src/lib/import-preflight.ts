import type { RawDataset } from "@/lib/demo";
import {
  cellToNumber,
  numericColumns as analysisNumericColumns,
} from "@/lib/dataset-columns";

export type DetectedColumnType = "case" | "crisp" | "fuzzy" | "raw" | "text";
export interface ImportPreflight {
  filename: string;
  dataset: RawDataset;
  rowCount: number;
  numericColumns: string[];
  detectedTypes: Record<string, DetectedColumnType>;
  proposedConditions: string[];
  proposedOutcome: string | null;
  warnings: string[];
  blockingIssues: string[];
}

export function inspectImport(dataset: RawDataset, filename: string): ImportPreflight {
  const detectedTypes: Record<string, DetectedColumnType> = {};
  const numericColumns = analysisNumericColumns(dataset);
  const numericColumnSet = new Set(numericColumns);
  for (const column of dataset.columns) {
    if (column === dataset.caseCol) {
      detectedTypes[column] = "case";
      continue;
    }
    if (!numericColumnSet.has(column)) {
      detectedTypes[column] = "text";
      continue;
    }
    const values = dataset.rows
      .map((row) => cellToNumber(row[column]))
      .filter((value): value is number => value !== null);
    detectedTypes[column] = values.every((value) => value === 0 || value === 1)
      ? "crisp"
      : values.every((value) => value >= 0 && value <= 1)
        ? "fuzzy"
        : "raw";
  }
  const warnings: string[] = [];
  const blockingIssues: string[] = [];
  if (!dataset.caseCol.trim()) {
    blockingIssues.push("A case identifier column is required.");
  } else {
    const caseLabels = dataset.rows.map((row) => String(row[dataset.caseCol] ?? "").trim());
    if (caseLabels.some((label) => label.length === 0)) {
      blockingIssues.push("Case identifiers must not be blank.");
    }
    if (new Set(caseLabels).size !== caseLabels.length) {
      blockingIssues.push("Case identifiers must be unique.");
    }
  }
  if (dataset.rows.length === 0) blockingIssues.push("The file contains no data rows.");
  if (numericColumns.length < 2) {
    blockingIssues.push("At least two numeric analysis columns are required.");
  }
  const proposedOutcome = numericColumns.at(-1) ?? null;
  return {
    filename,
    dataset,
    rowCount: dataset.rows.length,
    numericColumns,
    detectedTypes,
    proposedConditions: proposedOutcome
      ? numericColumns.filter((column) => column !== proposedOutcome)
      : [],
    proposedOutcome,
    warnings,
    blockingIssues,
  };
}
