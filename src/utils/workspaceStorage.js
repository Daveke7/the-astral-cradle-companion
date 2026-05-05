import { createWorkspaceState, normalizeWorkspaceState } from "../data/workspaceState.js";

const STORAGE_KEY = "astral-cradle-companion-v1-workspace";

export function loadWorkspaceState() {
  if (typeof window === "undefined") return createWorkspaceState();

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return normalizeWorkspaceState(saved ? JSON.parse(saved) : createWorkspaceState());
  } catch {
    return createWorkspaceState();
  }
}

export function saveWorkspaceState(state) {
  const normalized = normalizeWorkspaceState({
    ...state,
    updatedAt: new Date().toISOString(),
  });

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // De DM-tool moet aan tafel blijven werken, ook als opslag tijdelijk blokkeert.
  }

  return normalized;
}
