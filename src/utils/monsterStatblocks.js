import { buildMonsterImagePrompt } from "./monsterImagePrompts.js";

const DND_API_ROOT = "https://www.dnd5eapi.co";
const DND_API_2014 = `${DND_API_ROOT}/api/2014`;

const abilityNames = {
  str: "strength",
  dex: "dexterity",
  con: "constitution",
  int: "intelligence",
  wis: "wisdom",
  cha: "charisma",
};

export function abilityModifier(score) {
  return Math.floor((Number(score || 10) - 10) / 2);
}

function signed(value) {
  return Number(value) >= 0 ? `+${Number(value)}` : String(Number(value));
}

function normalizeCr(value) {
  if (value === undefined || value === null || value === "") return "?";
  return String(value);
}

function normalizeAction(action = {}) {
  const damage = Array.isArray(action.damage)
    ? action.damage
        .map((item) => item?.damage_dice || "")
        .filter(Boolean)
        .join(" + ")
    : action.damage || "";

  return {
    name: action.name || "Action",
    attack: action.attack_bonus !== undefined ? signed(action.attack_bonus) : action.attack || "",
    damage,
    desc: Array.isArray(action.desc) ? action.desc.join(" ") : action.desc || "",
  };
}

function normalizeProficiencies(proficiencies = []) {
  return proficiencies.reduce(
    (result, item) => {
      const name = item?.proficiency?.name || "";
      const value = signed(item?.value || 0);
      if (name.startsWith("Saving Throw: ")) {
        result.saves[name.replace("Saving Throw: ", "")] = value;
      }
      if (name.startsWith("Skill: ")) {
        result.skills[name.replace("Skill: ", "")] = value;
      }
      return result;
    },
    { saves: {}, skills: {} }
  );
}

function formatArmorClass(value) {
  if (Array.isArray(value)) {
    return Number(value[0]?.value || 10);
  }
  return Number(value || 10);
}

function formatSpeed(speed = {}) {
  if (typeof speed === "string") return speed;
  return Object.entries(speed)
    .map(([key, value]) => `${key} ${value}`)
    .join(", ");
}

function classifyRole(monster) {
  const actions = JSON.stringify(monster.actions || "").toLowerCase();
  const speed = JSON.stringify(monster.speed || "").toLowerCase();
  const hp = Number(monster.hit_points || monster.hp || 0);
  if (actions.includes("spell") || actions.includes("charm") || actions.includes("restrain")) return "Controller";
  if (actions.includes("longbow") || actions.includes("ranged")) return "Artillery";
  if (speed.includes("fly") || speed.includes("climb")) return "Skirmisher";
  if (hp >= 80) return "Brute";
  return "Soldier";
}

export function normalizeApiMonster(monster = {}) {
  const proficiencies = normalizeProficiencies(monster.proficiencies);
  return {
    index: monster.index || monster.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `monster-${Date.now()}`,
    name: monster.name || "Onbekend monster",
    source: "D&D 5e SRD API",
    size: monster.size || "",
    type: monster.type || "",
    alignment: monster.alignment || "",
    cr: normalizeCr(monster.challenge_rating),
    xp: Number(monster.xp || 0),
    role: classifyRole(monster),
    environment: [],
    tags: [monster.type, monster.size].filter(Boolean),
    ac: formatArmorClass(monster.armor_class),
    hp: Number(monster.hit_points || 1),
    hitDice: monster.hit_dice || "",
    speed: formatSpeed(monster.speed),
    abilities: Object.fromEntries(
      Object.entries(abilityNames).map(([short, long]) => [short, Number(monster[long] || 10)])
    ),
    saves: proficiencies.saves,
    skills: proficiencies.skills,
    senses: monster.senses
      ? Object.entries(monster.senses)
          .map(([key, value]) => `${key.replaceAll("_", " ")} ${value}`)
          .join(", ")
      : "",
    languages: monster.languages || "-",
    traits: (monster.special_abilities || []).map((trait) => ({
      name: trait.name || "Trait",
      desc: Array.isArray(trait.desc) ? trait.desc.join(" ") : trait.desc || "",
    })),
    actions: (monster.actions || []).map(normalizeAction),
    reactions: (monster.reactions || []).map(normalizeAction),
    legendaryActions: (monster.legendary_actions || []).map(normalizeAction),
    imagePrompt: monster.imagePrompt || monster.image_prompt || null,
  };
}

export async function fetchSrdMonsterIndex() {
  const response = await fetch(`${DND_API_2014}/monsters`);
  if (!response.ok) throw new Error("Kon de SRD monsterlijst niet laden.");
  const payload = await response.json();
  return (payload.results || []).map((item) => ({
    index: item.index,
    name: item.name,
    apiUrl: item.url?.startsWith("http") ? item.url : `${DND_API_ROOT}${item.url}`,
    source: "D&D 5e SRD API",
    type: "",
    cr: "?",
    role: "Lookup",
    tags: ["online"],
  }));
}

export async function fetchSrdMonsterDetail(monster) {
  if (monster?.actions?.length || monster?.traits?.length || monster?.hp) return monster;
  const url = monster?.apiUrl || `${DND_API_2014}/monsters/${monster.index}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Kon ${monster?.name || "monster"} niet laden.`);
  return normalizeApiMonster(await response.json());
}

export function monsterSearchText(monster) {
  return [
    monsterSearchPrimaryText(monster),
    monster.rawText,
    monster.damageVulnerabilities,
    monster.damageResistances,
    monster.damageImmunities,
    monster.conditionImmunities,
    ...(monster.traits || []).flatMap((entry) => [entry.name, entry.desc]),
    ...(monster.actions || []).flatMap((entry) => [entry.name, entry.desc]),
    ...(monster.reactions || []).flatMap((entry) => [entry.name, entry.desc]),
    ...(monster.legendaryActions || []).flatMap((entry) => [entry.name, entry.desc]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function monsterSearchPrimaryText(monster) {
  return [
    monster.name,
    monster.index,
    monster.type,
    monster.role,
    monster.source,
    monster.sourceType,
    monster.sourceUrl,
    monster.cr,
    monster.alignment,
    monster.senses,
    monster.languages,
    ...(monster.aliases || []),
    ...(monster.tags || []),
    ...(monster.environment || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function normalizeSearchValue(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function monsterMatchesSearch(monster, query = "") {
  const needle = normalizeSearchValue(query);
  if (!needle) return true;
  const primaryHaystack = normalizeSearchValue(monsterSearchPrimaryText(monster));
  if (primaryHaystack.includes(needle)) return true;
  if (needle.length <= 3) return needle.split(" ").every((token) => primaryHaystack.includes(token));
  const haystack = normalizeSearchValue(monsterSearchText(monster));
  if (haystack.includes(needle)) return true;
  return needle.split(" ").every((token) => haystack.includes(token));
}

export function monsterSearchRank(monster, query = "") {
  const needle = normalizeSearchValue(query);
  if (!needle) return 10;
  const name = normalizeSearchValue(monster.name);
  const aliases = (monster.aliases || []).map(normalizeSearchValue);
  const primaryHaystack = normalizeSearchValue(monsterSearchPrimaryText(monster));
  const fullHaystack = normalizeSearchValue(monsterSearchText(monster));
  const tokens = needle.split(" ").filter(Boolean);

  if (name === needle) return 0;
  if (aliases.some((alias) => alias === needle)) return 1;
  if (name.startsWith(needle)) return 2;
  if (aliases.some((alias) => alias.startsWith(needle))) return 3;
  if (name.includes(needle)) return 4;
  if (tokens.every((token) => name.includes(token))) return 5;
  if (primaryHaystack.includes(needle)) return 6;
  if (tokens.every((token) => primaryHaystack.includes(token))) return 7;
  if (fullHaystack.includes(needle)) return 9;
  return 12;
}

export function createParticipantFromMonster(monster, instance = 1) {
  const abilities = monster.abilities || {};
  const dexMod = abilityModifier(abilities.dex);
  const safeIndex = monster.index || monster.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "monster";
  return {
    id: `enemy-${safeIndex}-${Date.now()}-${instance}-${Math.random().toString(36).slice(2, 6)}`,
    name: instance > 1 ? `${monster.name} ${instance}` : monster.name,
    side: "enemy",
    role: monster.role || "Enemy",
    initiative: Math.max(0, 10 + dexMod - instance),
    dexMod,
    ac: Number(monster.ac || 10),
    hp: Number(monster.hp || 1),
    maxHp: Number(monster.hp || 1),
    tempHp: 0,
    conditions: [],
    concentration: false,
    reactionUsed: false,
    legendaryActionCount: Array.isArray(monster.legendaryActions) ? monster.legendaryActions.length : Number(monster.legendaryActions || 0),
    legendaryActions: Array.isArray(monster.legendaryActions) ? monster.legendaryActions : [],
    lairAction: false,
    notes: `${monster.size || ""} ${monster.type || ""} - CR ${normalizeCr(monster.cr)} - ${monster.source || ""}`.trim(),
    hiddenFromPlayers: false,
    monsterIndex: monster.index,
    source: monster.source || "",
    sourceType: monster.sourceType || "",
    sourceUrl: monster.sourceUrl || "",
    imageUrl: monster.imageUrl || "",
    cr: normalizeCr(monster.cr),
    xp: Number(monster.xp || 0),
    size: monster.size || "",
    type: monster.type || "",
    alignment: monster.alignment || "",
    armorClassText: monster.armorClassText || "",
    hitDice: monster.hitDice || "",
    speed: monster.speed || "",
    abilities,
    saves: monster.saves || {},
    skills: monster.skills || {},
    savingThrowsText: monster.savingThrowsText || "",
    skillsText: monster.skillsText || "",
    damageVulnerabilities: monster.damageVulnerabilities || "",
    damageResistances: monster.damageResistances || "",
    damageImmunities: monster.damageImmunities || "",
    conditionImmunities: monster.conditionImmunities || "",
    senses: monster.senses || "",
    languages: monster.languages || "",
    traits: monster.traits || [],
    actions: monster.actions || [],
    bonusActions: monster.bonusActions || [],
    reactions: monster.reactions || [],
    mythicActions: monster.mythicActions || [],
    lairActions: monster.lairActions || [],
    regionalEffects: monster.regionalEffects || [],
    rawText: monster.rawText || "",
    environment: monster.environment || [],
    tags: monster.tags || [],
    aliases: monster.aliases || [],
    imagePrompt: monster.imagePrompt || monster.image_prompt || buildMonsterImagePrompt(monster),
  };
}
