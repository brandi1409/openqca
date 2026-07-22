import type { RawDataset } from "./demo";

/** Convert a stored cell to a finite number without coercing ordinary text. */
export function cellToNumber(value: number | string | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  const normalized = text.includes(",") && !text.includes(".") ? text.replace(",", ".") : text;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Finite numeric observations for one column; missing cells are omitted. */
export function numericValues(ds: RawDataset, column: string): number[] {
  return ds.rows
    .map((row) => cellToNumber(row[column]))
    .filter((value): value is number => value !== null);
}

/**
 * Numeric set candidates. Missing cells are allowed, but mixed non-numeric text
 * is rejected so labels and malformed observations cannot be calibrated silently.
 */
export function numericColumns(ds: RawDataset): string[] {
  return ds.columns.filter((column) => {
    if (column === ds.caseCol) return false;
    const values = ds.rows.map((row) => row[column]);
    const finite = values.filter((value) => cellToNumber(value) !== null);
    if (finite.length === 0) return false;
    return values.every((value) => {
      if (typeof value === "string" && value.trim() === "") return true;
      return cellToNumber(value) !== null;
    });
  });
}

/**
 * Detect a label column while ignoring blanks and numeric strings. If no text
 * label exists, preserve the importer's first-column fallback.
 */
export function findCaseColumn(
  columns: string[],
  rows: Record<string, number | string>[],
): string {
  return (
    columns.find((column) =>
      rows.some((row) => {
        const value = row[column];
        return typeof value === "string" && value.trim() !== "" && cellToNumber(value) === null;
      }),
    ) ?? columns[0]
  );
}
