import { normalizeApiMagicItem } from "./magicItems.js";
import { normalizeApiMonster } from "./monsterStatblocks.js";
import { normalizeApiSpell } from "./spellbook.js";

const DND_API_ROOT = "https://www.dnd5eapi.co";
const DND_API_2014 = `${DND_API_ROOT}/api/2014`;
const OPEN5E_API_ROOT = "https://api.open5e.com";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Kon ${url} niet laden.`);
  return response.json();
}

async function mapLimit(items, limit, mapper, onProgress) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
      onProgress?.(index + 1, items.length);
    }
  });
  await Promise.all(workers);
  return results.filter(Boolean);
}

async function fetchAllSrdDetails(endpoint, normalizer, onProgress) {
  const index = await fetchJson(`${DND_API_2014}/${endpoint}`);
  const results = index.results || [];
  return mapLimit(
    results,
    8,
    async (entry) => {
      const detail = await fetchJson(entry.url?.startsWith("http") ? entry.url : `${DND_API_ROOT}${entry.url}`);
      return normalizer(detail);
    },
    onProgress
  );
}

function open5eUrl(endpoint, page = 1) {
  const cleanEndpoint = String(endpoint).replace(/^\/+|\/+$/g, "");
  const versionedEndpoint = cleanEndpoint.startsWith("v1/") || cleanEndpoint.startsWith("v2/") ? cleanEndpoint : `v2/${cleanEndpoint}`;
  return `${OPEN5E_API_ROOT}/${versionedEndpoint}/?limit=100&page=${page}`;
}

async function fetchAllOpen5e(endpoint, normalizer, onProgress) {
  const all = [];
  let page = 1;
  let next = open5eUrl(endpoint, page);
  while (next) {
    const payload = await fetchJson(next);
    const results = payload.results || [];
    all.push(...results.map(normalizer));
    onProgress?.(all.length, payload.count || all.length);
    next = payload.next;
    page += 1;
    if (!next && payload.count && all.length < payload.count) next = open5eUrl(endpoint, page);
  }
  return all;
}

async function fetchAllOpen5eFallback(endpoints, normalizer, onProgress) {
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const entries = await fetchAllOpen5e(endpoint, normalizer, onProgress);
      if (entries.length) return entries;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;
  return [];
}

function normalizeOpen5eMonster(monster = {}) {
  const cr = monster.cr || monster.challenge_rating || "?";
  return {
    index: monster.slug || monster.key || monster.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: monster.name || "Open5e monster",
    source: `Open5e${monster.document__title ? ` - ${monster.document__title}` : ""}`,
    size: monster.size || "",
    type: monster.type || "",
    alignment: monster.alignment || "",
    cr: String(cr),
    xp: Number(monster.xp || 0),
    role: monster.role || "Open5e",
    environment: monster.environments || [],
    tags: [monster.type, monster.size, ...(monster.tags || [])].filter(Boolean),
    ac: Number(monster.armor_class || monster.ac || 10),
    hp: Number(monster.hit_points || monster.hp || 1),
    hitDice: monster.hit_dice || "",
    speed: typeof monster.speed === "string" ? monster.speed : JSON.stringify(monster.speed || ""),
    abilities: {
      str: Number(monster.strength || monster.str || 10),
      dex: Number(monster.dexterity || monster.dex || 10),
      con: Number(monster.constitution || monster.con || 10),
      int: Number(monster.intelligence || monster.int || 10),
      wis: Number(monster.wisdom || monster.wis || 10),
      cha: Number(monster.charisma || monster.cha || 10),
    },
    saves: {},
    skills: {},
    senses: monster.senses || "",
    languages: monster.languages || "-",
    traits: (monster.special_abilities || monster.traits || []).map((trait) => ({
      name: trait.name || "Trait",
      desc: trait.desc || trait.description || "",
    })),
    actions: (monster.actions || []).map((action) => ({
      name: action.name || "Action",
      attack: action.attack || "",
      damage: action.damage || "",
      desc: action.desc || action.description || "",
    })),
    reactions: (monster.reactions || []).map((reaction) => ({
      name: reaction.name || "Reaction",
      attack: reaction.attack || "",
      damage: reaction.damage || "",
      desc: reaction.desc || reaction.description || "",
    })),
    legendaryActions: (monster.legendary_actions || []).map((action) => ({
      name: action.name || "Legendary Action",
      attack: action.attack || "",
      damage: action.damage || "",
      desc: action.desc || action.description || "",
    })),
  };
}

function normalizeOpen5eSpell(spell = {}) {
  return {
    index: spell.slug || spell.key || spell.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: spell.name || "Open5e spell",
    source: `Open5e${spell.document__title ? ` - ${spell.document__title}` : ""}`,
    level: Number(spell.level || 0),
    school: spell.school || "",
    castingTime: spell.casting_time || "",
    range: spell.range || "",
    components: String(spell.components || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    material: spell.material || "",
    duration: spell.duration || "",
    concentration: Boolean(spell.concentration),
    ritual: Boolean(spell.ritual),
    classes: String(spell.dnd_class || spell.classes || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    tags: [spell.school, ...(spell.concentration ? ["concentration"] : []), ...(spell.ritual ? ["ritual"] : [])].filter(Boolean),
    desc: [spell.desc || spell.description || ""].filter(Boolean),
    higherLevel: [spell.higher_level || spell.higher_level_desc || ""].filter(Boolean),
  };
}

function normalizeOpen5eMagicItem(item = {}) {
  return {
    index: item.slug || item.key || item.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: item.name || "Open5e magic item",
    source: `Open5e${item.document__title ? ` - ${item.document__title}` : ""}`,
    type: item.type || item.category || "Magic Item",
    rarity: item.rarity || "Unknown",
    attunement: Boolean(item.requires_attunement || String(item.desc || "").toLowerCase().includes("attunement")),
    tags: [item.type, item.rarity].filter(Boolean),
    notes: "",
    desc: [item.desc || item.description || ""].filter(Boolean),
    properties: [],
    damage: "",
    weight: item.weight || "",
  };
}

function stripHtml(value = "") {
  return String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function splitList(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "")
    .split(/[,;/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinTextList(value, fallback = "-") {
  const list = splitList(value);
  return list.length ? list.join(", ") : fallback;
}

function normalizeFoundryMonster(document = {}) {
  const system = document.system || {};
  return {
    index: document._id || document.id || document.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: document.name || "Foundry NPC",
    source: "Foundry private import",
    size: system.traits?.size || system.details?.size || "",
    type: system.details?.type?.value || system.details?.type || "",
    alignment: system.details?.alignment || "",
    cr: String(system.details?.cr ?? "?"),
    xp: Number(system.details?.xp?.value || system.details?.xp || 0),
    role: "Foundry",
    environment: [],
    tags: ["foundry", system.details?.type?.value].filter(Boolean),
    ac: Number(system.attributes?.ac?.value || system.attributes?.ac?.flat || 10),
    hp: Number(system.attributes?.hp?.max || system.attributes?.hp?.value || 1),
    hitDice: system.attributes?.hd || "",
    speed: Object.entries(system.attributes?.movement || {})
      .filter(([, value]) => value)
      .map(([key, value]) => `${key} ${value} ft`)
      .join(", "),
    abilities: {
      str: Number(system.abilities?.str?.value || 10),
      dex: Number(system.abilities?.dex?.value || 10),
      con: Number(system.abilities?.con?.value || 10),
      int: Number(system.abilities?.int?.value || 10),
      wis: Number(system.abilities?.wis?.value || 10),
      cha: Number(system.abilities?.cha?.value || 10),
    },
    saves: {},
    skills: {},
    senses: system.attributes?.senses ? JSON.stringify(system.attributes.senses) : "",
    languages: joinTextList(system.traits?.languages?.value),
    traits: [],
    actions: (document.items || [])
      .filter((item) => ["weapon", "feat", "spell"].includes(item.type))
      .map((item) => ({
        name: item.name,
        attack: item.system?.attackBonus || "",
        damage: item.system?.damage?.parts?.map((part) => part.join(" ")).join(", ") || "",
        desc: stripHtml(item.system?.description?.value || ""),
      })),
    reactions: [],
    legendaryActions: [],
  };
}

function normalizeFoundrySpell(document = {}) {
  const system = document.system || {};
  return {
    index: document._id || document.id || document.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: document.name || "Foundry spell",
    source: "Foundry private import",
    level: Number(system.level || 0),
    school: system.school || "",
    castingTime: system.activation?.cost ? `${system.activation.cost} ${system.activation.type}` : system.activation?.type || "",
    range: system.range?.value ? `${system.range.value} ${system.range.units || ""}` : "",
    components: Object.entries(system.components || {})
      .filter(([, value]) => value)
      .map(([key]) => key.toUpperCase()),
    material: system.materials?.value || "",
    duration: system.duration?.value ? `${system.duration.value} ${system.duration.units || ""}` : "",
    concentration: Boolean(system.components?.concentration || system.duration?.concentration),
    ritual: Boolean(system.components?.ritual || system.ritual),
    classes: [],
    tags: ["foundry", system.school].filter(Boolean),
    desc: [stripHtml(system.description?.value || "")].filter(Boolean),
    higherLevel: [],
  };
}

function normalizeFoundryItem(document = {}) {
  const system = document.system || {};
  return {
    index: document._id || document.id || document.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: document.name || "Foundry item",
    source: "Foundry private import",
    type: document.type === "weapon" ? "Weapon" : document.type === "equipment" ? "Armor" : "Wondrous Item",
    rarity: system.rarity || "Unknown",
    attunement: Boolean(system.attunement),
    tags: ["foundry", document.type].filter(Boolean),
    notes: "",
    desc: [stripHtml(system.description?.value || "")].filter(Boolean),
    properties: Object.entries(system.properties || {})
      .filter(([, value]) => value)
      .map(([key]) => key),
    damage: system.damage?.parts?.map((part) => part.join(" ")).join(", ") || "",
    weight: system.weight ? `${system.weight} lb` : "",
  };
}

function normalizePrivateMonster(monster = {}, source = "Private local import") {
  const system = monster.system || {};
  const name = monster.name || "Private monster";
  return {
    index: monster.index || monster.slug || monster._id || monster.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    source: monster.source || source,
    size: monster.size || system.traits?.size || "",
    type: monster.type === "npc" ? system.details?.type?.value || "npc" : monster.type || system.details?.type?.value || "",
    alignment: monster.alignment || system.details?.alignment || "",
    cr: String(monster.cr ?? monster.challenge_rating ?? system.details?.cr ?? "?"),
    xp: Number(monster.xp ?? system.details?.xp?.value ?? system.details?.xp ?? 0),
    role: monster.role || "Private",
    environment: splitList(monster.environment || monster.environments),
    tags: splitList(monster.tags),
    aliases: splitList(monster.aliases || monster.alias),
    ac: Number(monster.ac ?? monster.armor_class ?? system.attributes?.ac?.value ?? system.attributes?.ac?.flat ?? 10),
    hp: Number(monster.hp ?? monster.hit_points ?? system.attributes?.hp?.max ?? system.attributes?.hp?.value ?? 1),
    hitDice: monster.hitDice || monster.hit_dice || system.attributes?.hd || "",
    speed: monster.speed || "",
    abilities: monster.abilities || {
      str: Number(monster.str ?? monster.strength ?? system.abilities?.str?.value ?? 10),
      dex: Number(monster.dex ?? monster.dexterity ?? system.abilities?.dex?.value ?? 10),
      con: Number(monster.con ?? monster.constitution ?? system.abilities?.con?.value ?? 10),
      int: Number(monster.int ?? monster.intelligence ?? system.abilities?.int?.value ?? 10),
      wis: Number(monster.wis ?? monster.wisdom ?? system.abilities?.wis?.value ?? 10),
      cha: Number(monster.cha ?? monster.charisma ?? system.abilities?.cha?.value ?? 10),
    },
    saves: monster.saves || {},
    skills: monster.skills || {},
    senses: monster.senses || "",
    languages: monster.languages || "-",
    traits: (monster.traits || monster.special_abilities || []).map((trait) => ({
      name: trait.name || "Trait",
      desc: stripHtml(trait.desc || trait.description || ""),
    })),
    actions: (monster.actions || []).map((action) => ({
      name: action.name || "Action",
      attack: action.attack || action.attack_bonus || "",
      damage: action.damage || "",
      desc: stripHtml(action.desc || action.description || ""),
    })),
    reactions: (monster.reactions || []).map((reaction) => ({
      name: reaction.name || "Reaction",
      attack: reaction.attack || "",
      damage: reaction.damage || "",
      desc: stripHtml(reaction.desc || reaction.description || ""),
    })),
    legendaryActions: (monster.legendaryActions || monster.legendary_actions || []).map((action) => ({
      name: action.name || "Legendary Action",
      attack: action.attack || "",
      damage: action.damage || "",
      desc: stripHtml(action.desc || action.description || ""),
    })),
    imagePrompt: monster.imagePrompt || monster.image_prompt || monster.visualPrompt || monster.visual_prompt || null,
  };
}

function normalizePrivateSpell(spell = {}, source = "Private local import") {
  const system = spell.system || {};
  const name = spell.name || "Private spell";
  return {
    index: spell.index || spell.slug || spell._id || spell.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    source: spell.source || source,
    level: Number(spell.level ?? system.level ?? 0),
    school: spell.school || system.school || "",
    castingTime: spell.castingTime || spell.casting_time || (system.activation?.cost ? `${system.activation.cost} ${system.activation.type}` : ""),
    range: spell.range || (system.range?.value ? `${system.range.value} ${system.range.units || ""}` : ""),
    components: splitList(spell.components || Object.entries(system.components || {}).filter(([, value]) => value).map(([key]) => key.toUpperCase())),
    material: spell.material || system.materials?.value || "",
    duration: spell.duration || (system.duration?.value ? `${system.duration.value} ${system.duration.units || ""}` : ""),
    concentration: Boolean(spell.concentration || system.components?.concentration || system.duration?.concentration),
    ritual: Boolean(spell.ritual || system.components?.ritual || system.ritual),
    classes: splitList(spell.classes || spell.dnd_class),
    tags: splitList(spell.tags),
    desc: Array.isArray(spell.desc) ? spell.desc.map(stripHtml) : [stripHtml(spell.desc || spell.description || system.description?.value || "")].filter(Boolean),
    higherLevel: Array.isArray(spell.higherLevel)
      ? spell.higherLevel.map(stripHtml)
      : [stripHtml(spell.higherLevel || spell.higher_level || spell.higher_level_desc || "")].filter(Boolean),
  };
}

function normalizePrivateMagicItem(item = {}, source = "Private local import") {
  const system = item.system || {};
  const name = item.name || "Private magic item";
  return {
    index: item.index || item.slug || item._id || item.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    source: item.source || source,
    type: item.type === "weapon" ? "Weapon" : item.type === "equipment" ? "Armor" : item.type || item.category || "Magic Item",
    rarity: item.rarity || system.rarity || "Unknown",
    attunement: Boolean(item.attunement || item.requires_attunement || system.attunement),
    tags: splitList(item.tags),
    notes: item.notes || "",
    desc: Array.isArray(item.desc) ? item.desc.map(stripHtml) : [stripHtml(item.desc || item.description || system.description?.value || "")].filter(Boolean),
    properties: splitList(item.properties || Object.entries(system.properties || {}).filter(([, value]) => value).map(([key]) => key)),
    damage: item.damage || system.damage?.parts?.map((part) => part.join(" ")).join(", ") || "",
    weight: item.weight || (system.weight ? `${system.weight} lb` : ""),
  };
}

function uniqueEntries(entries) {
  const byKey = new Map();
  entries.filter(Boolean).forEach((entry) => {
    const key = entry.index || entry.name;
    byKey.set(key, { ...(byKey.get(key) || {}), ...entry });
  });
  return Array.from(byKey.values());
}

function inferDocumentKind(document = {}) {
  if (document.type === "npc" || document.type === "monster") return "monster";
  if (document.type === "spell" || document.level !== undefined || document.school || document.casting_time || document.castingTime) return "spell";
  if (["weapon", "equipment", "consumable", "loot", "backpack"].includes(document.type)) return "magicItem";
  if (document.rarity || document.attunement !== undefined || document.requires_attunement !== undefined) return "magicItem";
  if (document.hp || document.hit_points || document.ac || document.armor_class || document.challenge_rating || document.cr) return "monster";
  return "unknown";
}

function flattenDocuments(value) {
  if (Array.isArray(value)) return value.flatMap(flattenDocuments);
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value.items) && value.name && value.type) return [value];
  if (value.type && value.name) return [value];
  return Object.values(value).flatMap(flattenDocuments);
}

export async function syncSrdCompendium(type, onProgress) {
  if (type === "monsters") return fetchAllSrdDetails("monsters", normalizeApiMonster, onProgress);
  if (type === "spells") return fetchAllSrdDetails("spells", normalizeApiSpell, onProgress);
  if (type === "magicItems") return fetchAllSrdDetails("magic-items", normalizeApiMagicItem, onProgress);
  return [];
}

export async function syncOpen5eCompendium(type, onProgress) {
  if (type === "monsters") return fetchAllOpen5e("creatures", normalizeOpen5eMonster, onProgress);
  if (type === "spells") return fetchAllOpen5e("spells", normalizeOpen5eSpell, onProgress);
  if (type === "magicItems") return fetchAllOpen5eFallback(["magic-items", "magicitems", "v1/magicitems"], normalizeOpen5eMagicItem, onProgress);
  return [];
}

export function importPrivateCompendiumJson(text) {
  return analyzePrivateCompendiumJson(text).entries;
}

export function analyzePrivateCompendiumJson(text) {
  const parsed = JSON.parse(text);
  const documents = flattenDocuments(parsed);
  const direct = parsed && typeof parsed === "object" ? parsed : {};
  const directMonsters = Array.isArray(direct.monsters) ? direct.monsters.map((item) => normalizePrivateMonster(item)) : [];
  const directSpells = Array.isArray(direct.spells) ? direct.spells.map((item) => normalizePrivateSpell(item)) : [];
  const directMagicItems = Array.isArray(direct.magicItems) ? direct.magicItems.map((item) => normalizePrivateMagicItem(item)) : [];
  const inferred = documents.reduce(
    (result, document) => {
      const kind = inferDocumentKind(document);
      if (kind === "monster") result.monsters.push(document.type === "npc" || document.system ? normalizeFoundryMonster(document) : normalizePrivateMonster(document));
      else if (kind === "spell") result.spells.push(document.type === "spell" && document.system ? normalizeFoundrySpell(document) : normalizePrivateSpell(document));
      else if (kind === "magicItem") result.magicItems.push(document.system ? normalizeFoundryItem(document) : normalizePrivateMagicItem(document));
      else result.unknown.push(document);
      return result;
    },
    { monsters: [], spells: [], magicItems: [], unknown: [] }
  );

  const entries = {
    monsters: uniqueEntries([...directMonsters, ...inferred.monsters]),
    spells: uniqueEntries([...directSpells, ...inferred.spells]),
    magicItems: uniqueEntries([...directMagicItems, ...inferred.magicItems]),
  };
  const warnings = [];
  if (!entries.monsters.length && !entries.spells.length && !entries.magicItems.length) warnings.push("Geen bekende compendium records herkend.");
  if (inferred.unknown.length) warnings.push(`${inferred.unknown.length} records konden niet automatisch worden geclassificeerd.`);

  return {
    entries,
    counts: {
      monsters: entries.monsters.length,
      spells: entries.spells.length,
      magicItems: entries.magicItems.length,
      unknown: inferred.unknown.length,
      rawDocuments: documents.length,
    },
    samples: {
      monsters: entries.monsters.slice(0, 5),
      spells: entries.spells.slice(0, 5),
      magicItems: entries.magicItems.slice(0, 5),
      unknown: inferred.unknown.slice(0, 5).map((item) => ({ name: item.name || item._id || "Unknown", type: item.type || "unknown" })),
    },
    warnings,
  };
}
