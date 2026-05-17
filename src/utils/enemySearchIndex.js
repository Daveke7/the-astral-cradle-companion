import { encounters } from "../data/campaignData.js";
import { externalEnemyLibrary } from "../data/systems/externalEnemyLibrary.js";
import { pdfEnemyLibrary } from "../data/systems/pdfEnemyLibrary.js";
import { TOA_WILDERNESS_ENCOUNTERS } from "../data/systems/travelSystem.js";
import { getToaEncounterDetail } from "../data/systems/toaEncounterDetails.js";

function slugify(value = "") {
  return String(value || "enemy")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value = "") {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function unique(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function richnessScore(monster = {}) {
  const campaignWeight = /Campaign|custom/i.test(monster.source || "") ? 5000 : 0;
  const jsonWeight = monster.sourceType === "SRD JSON" ? 2300 : 0;
  const statblockWeight = monster.rawText ? 1000 : 0;
  const csvWeight = monster.sourceType === "dnd_monsters.csv" ? 120 : 0;
  const actionWeight =
    (monster.actions?.length || 0) * 90 +
    (monster.traits?.length || 0) * 55 +
    (monster.reactions?.length || 0) * 45 +
    (monster.legendaryActions?.length || 0) * 45 +
    (monster.bonusActions?.length || 0) * 35;
  const mathWeight = Number(monster.hp || 0) + Number(monster.xp || 0) / 100;
  return campaignWeight + jsonWeight + statblockWeight + csvWeight + actionWeight + mathWeight;
}

function preferMonsterData(existing = {}, incoming = {}) {
  const primary = richnessScore(incoming) > richnessScore(existing) ? incoming : existing;
  const secondary = primary === existing ? incoming : existing;
  return {
    ...secondary,
    ...primary,
    index: primary.index || secondary.index || slugify(primary.name || secondary.name),
    sourceType: primary.sourceType || (/Campaign|custom/i.test(primary.source || "") ? "Campaign" : secondary.sourceType || ""),
    aliases: unique([...(existing.aliases || []), ...(incoming.aliases || []), existing.name, incoming.name]),
    tags: unique([...(existing.tags || []), ...(incoming.tags || [])]),
    environment: unique([...(existing.environment || []), ...(incoming.environment || [])]),
    sourceUrl: primary.sourceUrl || secondary.sourceUrl || "",
    imageUrl: primary.imageUrl || secondary.imageUrl || "",
    traits: primary.traits?.length ? primary.traits : secondary.traits || [],
    actions: primary.actions?.length ? primary.actions : secondary.actions || [],
    bonusActions: primary.bonusActions?.length ? primary.bonusActions : secondary.bonusActions || [],
    reactions: primary.reactions?.length ? primary.reactions : secondary.reactions || [],
    legendaryActions: primary.legendaryActions?.length ? primary.legendaryActions : secondary.legendaryActions || [],
    mythicActions: primary.mythicActions?.length ? primary.mythicActions : secondary.mythicActions || [],
    lairActions: primary.lairActions?.length ? primary.lairActions : secondary.lairActions || [],
    regionalEffects: primary.regionalEffects?.length ? primary.regionalEffects : secondary.regionalEffects || [],
    rawText: primary.rawText || secondary.rawText || "",
  };
}

function displayNameFromToaName(name = "") {
  const value = String(name || "").trim();
  const [prefix, rest] = value.split(",").map((item) => item.trim());
  if (!rest) return value;
  if (prefix === "Dinosaurs") return titleCase(rest);
  if (prefix === "Dragon") return `${titleCase(rest)} Dragon`;
  if (prefix === "Snake") return `${titleCase(rest)} Snake`;
  if (prefix === "Undead") return titleCase(rest);
  return `${titleCase(rest)} ${titleCase(prefix)}`;
}

function inferTypeFromName(name = "") {
  const text = name.toLowerCase();
  if (/undead|zombie|skeleton|specter|wight|ghoul/.test(text)) return "undead";
  if (/wizard|fist|zhentarim|cannibal|hunter|explorer|dwarf|lizardfolk|goblin|grung|yuan-ti|aarakocra|tabaxi|firenewt/.test(text)) return "humanoid";
  if (/dragon/.test(text)) return "dragon";
  if (/vine|plant|frond|creeper|mantrap/.test(text)) return "plant";
  if (/mist|cache|statue|winterscape|explorer, dead/.test(text)) return "encounter reference";
  if (/dinosaur|saurus|raptor|ape|boar|crocodile|frog|lizard|scorpion|turtle|wasp|snake|spider|tiger|bat|quipper|stirge/.test(text)) return "beast";
  return "monstrosity";
}

function inferRoleFromName(name = "") {
  const text = name.toLowerCase();
  if (/cache|statue|mist|winterscape|rare plant|explorer, dead/.test(text)) return "Reference";
  if (/wizard|hag|mist|yuan-ti|frond|creeper|mantrap|spider/.test(text)) return "Controller";
  if (/troll|giant|brute|tyrannosaurus|ankylosaurus|crocodile/.test(text)) return "Brute";
  if (/pter|wasp|snake|raptor|hunter|monkey|stirge|bat/.test(text)) return "Skirmisher";
  if (/enclave|fist|zhentarim|explorer/.test(text)) return "Faction";
  return "Lookup";
}

function aliasesForToaName(originalName, displayName) {
  const aliases = [originalName, displayName];
  const [prefix, rest] = String(originalName || "").split(",").map((item) => item.trim());
  if (rest) {
    aliases.push(`${rest} ${prefix}`, `${prefix} ${rest}`);
    if (prefix === "Dinosaurs") aliases.push(`Dinosaur ${rest}`, `Dino ${rest}`);
    if (prefix === "Undead") aliases.push(`${rest} undead`);
  }
  if (displayName.endsWith("s")) aliases.push(displayName.slice(0, -1));
  return unique(aliases);
}

function createToaEncounterRecord(entry = {}) {
  const displayName = displayNameFromToaName(entry.name);
  const detail = getToaEncounterDetail(entry.name);
  return {
    index: slugify(displayName),
    name: displayName,
    source: "ToA Chult encounter index",
    size: "",
    type: inferTypeFromName(entry.name),
    alignment: "",
    cr: "?",
    xp: 0,
    role: inferRoleFromName(entry.name),
    environment: ["Chult", "wilderness"],
    tags: unique(["ToA", "Chult", "wilderness", inferTypeFromName(entry.name), inferRoleFromName(entry.name)]),
    aliases: aliasesForToaName(entry.name, displayName),
    ac: 10,
    hp: 1,
    hitDice: "",
    speed: "",
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saves: {},
    skills: {},
    senses: "",
    languages: "",
    traits: detail?.preview ? [{ name: "Encounter reference", desc: detail.preview }] : [],
    actions: [],
    reactions: [],
    legendaryActions: [],
  };
}

function createCampaignEncounterRecords() {
  return encounters.flatMap((encounter) =>
    (encounter.monsters || []).map((monster) => ({
      index: slugify(monster.index || `${encounter.id}-${monster.name}`),
      name: monster.name || "Campaign enemy",
      source: `Campaign encounter - ${encounter.name}`,
      size: monster.size || "",
      type: monster.type || "campaign enemy",
      alignment: monster.alignment || "",
      cr: monster.cr || "?",
      xp: Number(monster.xp || 0),
      role: monster.role || "Enemy",
      environment: unique(["The Red Below", "Chult", encounter.terrain]),
      tags: unique(["campaign", "encounter", encounter.name, encounter.id, monster.role]),
      aliases: unique([monster.name, encounter.name, encounter.id]),
      ac: Number(monster.ac || 10),
      hp: Number(monster.hp ?? monster.maxHp ?? 1),
      maxHp: Number(monster.maxHp ?? monster.hp ?? 1),
      hitDice: monster.hitDice || "",
      speed: monster.speed || "",
      abilities: monster.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      saves: monster.saves || {},
      skills: monster.skills || {},
      senses: monster.senses || "",
      languages: monster.languages || "",
      traits: monster.traits || [],
      actions: monster.actions || [],
      reactions: monster.reactions || [],
      legendaryActions: monster.legendaryActions || [],
    }))
  );
}

export function buildEnemySearchIndex(baseMonsters = []) {
  const records = [
    ...baseMonsters,
    ...pdfEnemyLibrary,
    ...externalEnemyLibrary,
    ...createCampaignEncounterRecords(),
    ...TOA_WILDERNESS_ENCOUNTERS.map(createToaEncounterRecord),
  ];
  const byIndex = new Map();
  const byName = new Map();

  records.filter(Boolean).forEach((record) => {
    const indexKey = record.index || slugify(record.name);
    const nameKey = slugify(record.name);
    const existingKey = byIndex.has(indexKey) ? indexKey : byName.get(nameKey);
    if (existingKey) {
      const merged = preferMonsterData(byIndex.get(existingKey), record);
      byIndex.set(existingKey, merged);
      byName.set(slugify(merged.name), existingKey);
      return;
    }

    const normalized = { ...record, index: indexKey, aliases: unique(record.aliases || []) };
    byIndex.set(indexKey, normalized);
    byName.set(nameKey, indexKey);
  });

  return Array.from(byIndex.values()).sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}
