export const LOCAL_PROJECT_STORAGE_KEY = "openqca_local_project";
export const LOCAL_PROJECT_SCHEMA = "openqca-local-project";
export const LOCAL_PROJECT_VERSION = 2 as const;
export type SupportedLocalProjectVersion = 1 | typeof LOCAL_PROJECT_VERSION;

export interface LocalProjectEnvelope {
  schema: typeof LOCAL_PROJECT_SCHEMA;
  version: SupportedLocalProjectVersion;
  savedAt: string;
  state: unknown;
}

function hasDatasetRows(value: unknown): boolean {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("dataset" in value)
  ) {
    return false;
  }
  const dataset = value.dataset;
  if (
    typeof dataset !== "object" ||
    dataset === null ||
    Array.isArray(dataset) ||
    !("name" in dataset) ||
    !("caseCol" in dataset) ||
    !("columns" in dataset) ||
    !("rows" in dataset)
  ) {
    return false;
  }
  return (
    typeof dataset.name === "string" &&
    typeof dataset.caseCol === "string" &&
    Array.isArray(dataset.columns) &&
    dataset.columns.length > 0 &&
    dataset.columns.every((column) => typeof column === "string") &&
    Array.isArray(dataset.rows) &&
    dataset.rows.every(
      (row) => typeof row === "object" && row !== null && !Array.isArray(row),
    )
  );
}

export function readLocalProject(): LocalProjectEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY) ?? "null");
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed) ||
      !("schema" in parsed) ||
      !("version" in parsed) ||
      !("savedAt" in parsed) ||
      !("state" in parsed) ||
      parsed.schema !== LOCAL_PROJECT_SCHEMA ||
      (parsed.version !== 1 && parsed.version !== LOCAL_PROJECT_VERSION) ||
      typeof parsed.savedAt !== "string" ||
      Number.isNaN(Date.parse(parsed.savedAt)) ||
      !hasDatasetRows(parsed.state)
    ) {
      return null;
    }
    return {
      schema: LOCAL_PROJECT_SCHEMA,
      version: parsed.version,
      savedAt: parsed.savedAt,
      state: parsed.state,
    };
  } catch {
    return null;
  }
}

export function writeLocalProject(state: unknown): boolean {
  if (typeof window === "undefined" || !hasDatasetRows(state)) return false;
  const envelope: LocalProjectEnvelope = {
    schema: LOCAL_PROJECT_SCHEMA,
    version: LOCAL_PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    state,
  };
  try {
    window.localStorage.setItem(LOCAL_PROJECT_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function clearLocalProject(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_PROJECT_STORAGE_KEY);
  } catch {
    // Private browsing/storage quotas can make clearing unavailable.
  }
}
