import { fallbackMagicItemLibrary } from "../data/systems/magicItemLibrary.js";
import { fallbackMonsterLibrary } from "../data/systems/monsterLibrary.js";
import { fallbackSpellLibrary } from "../data/systems/spellLibrary.js";

export const compendiumStorageKey = "astral-cradle-compendium-v1";
export const compendiumUpdatedEvent = "astral-cradle-compendium-updated";

const fallbackByType = {
  monsters: fallbackMonsterLibrary,
  spells: fallbackSpellLibrary,
  magicItems: fallbackMagicItemLibrary,
};

export function createEmptyCompendium() {
  return {
    version: 1,
    updatedAt: "",
    monsters: [],
    spells: [],
    magicItems: [],
    sources: {},
    importHistory: [],
  };
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function entryKey(entry) {
  return entry?.index || entry?.slug || entry?.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `${Date.now()}`;
}

export function mergeCompendiumEntries(current = [], incoming = []) {
  const byKey = new Map(safeArray(current).map((entry) => [entryKey(entry), entry]));
  safeArray(incoming).forEach((entry) => {
    const key = entryKey(entry);
    const existing = byKey.get(key);
    byKey.set(key, existing ? { ...existing, ...entry, index: existing.index || entry.index || key } : { ...entry, index: entry.index || key });
  });
  return Array.from(byKey.values()).sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export function normalizeCompendium(value = {}) {
  const defaults = createEmptyCompendium();
  return {
    ...defaults,
    ...(value && typeof value === "object" ? value : {}),
    monsters: safeArray(value.monsters),
    spells: safeArray(value.spells),
    magicItems: safeArray(value.magicItems),
    sources: value.sources && typeof value.sources === "object" ? value.sources : {},
    importHistory: safeArray(value.importHistory),
  };
}

export function loadCompendium() {
  try {
    return normalizeCompendium(JSON.parse(localStorage.getItem(compendiumStorageKey) || "{}"));
  } catch {
    return createEmptyCompendium();
  }
}

export function saveCompendium(nextCompendium) {
  const normalized = normalizeCompendium({ ...nextCompendium, updatedAt: new Date().toISOString() });
  localStorage.setItem(compendiumStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(compendiumUpdatedEvent, { detail: normalized }));
  return normalized;
}

export function upsertCompendiumEntries(type, entries, sourceMeta = {}) {
  const current = loadCompendium();
  const next = {
    ...current,
    [type]: mergeCompendiumEntries(current[type], entries),
    sources: {
      ...current.sources,
      [sourceMeta.id || `${type}-${Date.now()}`]: {
        ...sourceMeta,
        type,
        count: entries.length,
        syncedAt: new Date().toISOString(),
      },
    },
    importHistory: [
      {
        id: `import-${Date.now()}`,
        type,
        source: sourceMeta.label || sourceMeta.id || "Import",
        count: entries.length,
        createdAt: new Date().toISOString(),
      },
      ...current.importHistory,
    ].slice(0, 40),
  };
  return saveCompendium(next);
}

export function getCompendiumEntries(type, includeFallback = true) {
  const compendium = loadCompendium();
  const cached = compendium[type] || [];
  if (!includeFallback) return cached;
  return mergeCompendiumEntries(fallbackByType[type] || [], cached);
}

export function clearCompendiumType(type) {
  const current = loadCompendium();
  return saveCompendium({
    ...current,
    [type]: [],
    importHistory: [
      {
        id: `clear-${Date.now()}`,
        type,
        source: "Cleared local cache",
        count: 0,
        createdAt: new Date().toISOString(),
      },
      ...current.importHistory,
    ].slice(0, 40),
  });
}

export function compendiumCounts(compendium = loadCompendium()) {
  return {
    monsters: compendium.monsters.length,
    spells: compendium.spells.length,
    magicItems: compendium.magicItems.length,
  };
}

export function exportCompendiumJson() {
  return JSON.stringify(loadCompendium(), null, 2);
}
