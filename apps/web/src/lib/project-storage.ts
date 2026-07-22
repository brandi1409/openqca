export const LOCAL_PROJECT_STORAGE_KEY = "openqca_local_project";
export const LOCAL_PROJECT_SCHEMA = "openqca-local-project";
export const LOCAL_PROJECT_VERSION = 1 as const;

export interface LocalProjectEnvelope {
  schema: typeof LOCAL_PROJECT_SCHEMA;
  version: typeof LOCAL_PROJECT_VERSION;
  savedAt: string;
  state: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProjectState(value: unknown): boolean {
  return isRecord(value) && isRecord(value.dataset) && Array.isArray(value.dataset.rows);
}

export function readLocalProject(): LocalProjectEnvelope | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY) ?? "null");
    if (!isRecord(parsed)) return null;
    if (parsed.schema !== LOCAL_PROJECT_SCHEMA || parsed.version !== LOCAL_PROJECT_VERSION) return null;
    if (!isProjectState(parsed.state)) return null;
    return {
      schema: LOCAL_PROJECT_SCHEMA,
      version: LOCAL_PROJECT_VERSION,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
      state: parsed.state,
    };
  } catch {
    return null;
  }
}

export function writeLocalProject(state: unknown): boolean {
  if (typeof window === "undefined" || !isProjectState(state)) return false;
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
