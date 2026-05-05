export const WORKSPACE_KEYS = {
  prep: "session_prep",
  runtime: "session_runtime",
  campaignOs: "campaign_os",
  playerView: "player_view",
  encounter: "encounter_tracker",
};

export function isRemoteWorkspaceConfigured() {
  return Boolean(
    import.meta.env?.VITE_SUPABASE_URL &&
      import.meta.env?.VITE_SUPABASE_ANON_KEY
  );
}

export async function loadRemoteWorkspaceStates() {
  if (!isRemoteWorkspaceConfigured()) return null;
  throw new Error("Supabase workspace sync is nog niet gekoppeld aan een schema.");
}

export async function saveRemoteWorkspaceState() {
  if (!isRemoteWorkspaceConfigured()) return null;
  throw new Error("Supabase workspace sync is nog niet gekoppeld aan een schema.");
}
