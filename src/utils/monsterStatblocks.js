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
    monster.name,
    monster.type,
    monster.role,
    monster.source,
    monster.cr,
    ...(monster.tags || []),
    ...(monster.environment || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
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
    legendaryActions: Array.isArray(monster.legendaryActions) ? monster.legendaryActions.length : 0,
    lairAction: false,
    notes: `${monster.size || ""} ${monster.type || ""} - CR ${normalizeCr(monster.cr)} - ${monster.source || ""}`.trim(),
    hiddenFromPlayers: false,
    monsterIndex: monster.index,
    source: monster.source || "",
    cr: normalizeCr(monster.cr),
    xp: Number(monster.xp || 0),
    size: monster.size || "",
    type: monster.type || "",
    alignment: monster.alignment || "",
    speed: monster.speed || "",
    abilities,
    saves: monster.saves || {},
    skills: monster.skills || {},
    senses: monster.senses || "",
    languages: monster.languages || "",
    traits: monster.traits || [],
    actions: monster.actions || [],
    reactions: monster.reactions || [],
    environment: monster.environment || [],
    tags: monster.tags || [],
  };
}
