const rarityByLevel = [
  { max: 4, weights: { Common: 8, Uncommon: 2 } },
  { max: 10, weights: { Common: 4, Uncommon: 5, Rare: 2 } },
  { max: 16, weights: { Uncommon: 3, Rare: 5, "Very Rare": 2 } },
  { max: 20, weights: { Rare: 3, "Very Rare": 5, Legendary: 1 } },
];

const coinProfiles = {
  individual: { cp: [0, 0], sp: [2, 18], ep: [0, 6], gp: [1, 18], pp: [0, 2] },
  "individual-items": { cp: [0, 0], sp: [4, 24], ep: [0, 8], gp: [4, 30], pp: [0, 3] },
  hoard: { cp: [0, 0], sp: [20, 140], ep: [10, 80], gp: [80, 520], pp: [5, 60] },
  "hoard-salvage": { cp: [0, 0], sp: [10, 80], ep: [4, 40], gp: [40, 320], pp: [2, 30] },
};

const valuableTables = {
  Arcana: [
    "obsidian lens etched with impossible constellations",
    "silver spell focus wrapped in red thread",
    "crystal vial of starless ink",
    "fractured mirror shard in a brass case",
  ],
  Armaments: [
    "Chultan bronze shield boss",
    "bundle of pterafolk javelin heads",
    "dragonbone bowstring tube",
    "ceremonial axe with lapis inlay",
  ],
  Implements: [
    "ivory cartographer's compass",
    "rainproof scroll case with merchant seals",
    "jade healer's mortar and pestle",
    "folding field altar with Tyr markings",
  ],
  Relics: [
    "weathered jungle-elf pendant",
    "broken Mezro tile with celestial script",
    "old tabaxi clan bead-string",
    "bronze mask fragment smelling of rain",
  ],
  Chult: [
    "painted dinosaur ivory",
    "gold-inlaid Chultan prayer strip",
    "polished blue-green river stone set in electrum",
    "merchant prince trade token",
  ],
  Thayan: [
    "red-lacquered scroll cylinder",
    "black iron badge with a broken sigil",
    "spell component pouch marked by ash",
    "mirror-backed amulet that feels cold",
  ],
};

const salvageTables = {
  Jungle: [
    "usable climbing spikes and waxed rope",
    "sealed insect-repellent resin",
    "dry ration cache hidden in a bark tube",
    "repairable canoe hardware",
  ],
  Ruins: [
    "stone rubbing of a buried mural",
    "loose glyph tiles worth studying",
    "ancient bronze hinges and fittings",
    "half-burned expedition journal",
  ],
  Urban: [
    "merchant IOU with a recognizable seal",
    "black-market price list",
    "folded invitation to a private auction",
    "set of counterfeit guide permits",
  ],
  Undead: [
    "grave silver wrapped in linen",
    "prayer beads gone cold",
    "sealed bone reliquary",
    "wax tablet naming the dead",
  ],
};

const treasureHooks = [
  "The most valuable item has a mark that matches a clue the party has not connected yet.",
  "A Red Wizard cache inventory lists one item that is missing from the treasure.",
  "The coins are normal, but every reflective surface shows a starless sky.",
  "The valuables were clearly packed for fast travel, not stored for long-term safety.",
  "Azaka recognizes the wrapping style and goes quiet for a moment.",
  "A Merchant Prince would pay more for this if the party reports where it came from.",
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickWeighted(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[0]?.[0] || "Common";
}

function rarityFor(level, rarityMode) {
  if (rarityMode !== "by-level") return rarityMode;
  const row = rarityByLevel.find((entry) => level <= entry.max) || rarityByLevel.at(-1);
  return pickWeighted(row.weights);
}

function coinMultiplier(level, danger) {
  const levelScale = Math.max(1, Number(level || 1)) * 0.42;
  const dangerScale = danger === "deadly" ? 1.6 : danger === "nuisance" ? 0.58 : 1;
  return Math.max(0.45, levelScale * dangerScale);
}

function generateCoins(type, level, danger) {
  const profile = coinProfiles[type] || coinProfiles.hoard;
  const multiplier = coinMultiplier(level, danger);
  return Object.fromEntries(
    Object.entries(profile).map(([coin, [min, max]]) => [coin, Math.round(randInt(min, max) * multiplier)])
  );
}

function estimateGold(coins) {
  return Math.round(
    Number(coins.cp || 0) / 100 +
      Number(coins.sp || 0) / 10 +
      Number(coins.ep || 0) / 2 +
      Number(coins.gp || 0) +
      Number(coins.pp || 0) * 10
  );
}

function valuableValue(level, danger, type) {
  const base = type.includes("hoard") ? randInt(45, 260) : randInt(10, 75);
  const multiplier = coinMultiplier(level, danger);
  return Math.round(base * multiplier);
}

function generateValuables({ theme, environment, type, level, danger }) {
  const count = type.includes("hoard") ? randInt(3, 7) : randInt(0, 2);
  const table = valuableTables[theme] || valuableTables[environment] || valuableTables.Chult;
  return Array.from({ length: count }, (_, index) => ({
    id: `valuable-${Date.now()}-${index}`,
    name: pick(table),
    value: `${valuableValue(level, danger, type).toLocaleString("nl-NL")} gp`,
  }));
}

function generateSalvage(environment, type) {
  if (type !== "hoard-salvage") return [];
  const table = salvageTables[environment] || salvageTables.Jungle;
  return Array.from({ length: randInt(2, 5) }, (_, index) => ({
    id: `salvage-${Date.now()}-${index}`,
    name: pick(table),
    use: pick(["route advantage", "sellable", "clue", "camp resource", "repair material"]),
  }));
}

function scoreItemForTheme(item, theme) {
  if (theme === "Any") return 1;
  const text = [item.name, item.type, item.notes, ...(item.tags || []), ...(item.properties || [])].join(" ").toLowerCase();
  const themeWords = {
    Arcana: ["wand", "rod", "staff", "spell", "arcane", "focus", "magic"],
    Armaments: ["weapon", "armor", "shield", "blade", "bow", "dagger"],
    Implements: ["wondrous", "tool", "utility", "potion", "scroll"],
    Relics: ["relic", "sentient", "ancient", "mirror", "dragon", "robe", "cloak"],
    Chult: ["chult", "jungle", "dinosaur", "mask", "azaka"],
    Thayan: ["thay", "red wizard", "mirror", "ash", "black", "broken"],
  }[theme] || [];
  return themeWords.some((word) => text.includes(word)) ? 4 : 1;
}

function pickMagicItems({ itemPool, type, level, rarityMode, theme, includeCampaignRelics }) {
  const count =
    type === "individual" ? 0 : type === "individual-items" ? randInt(1, 2) : type === "hoard" ? randInt(1, 4) : randInt(0, 2);
  const pool = itemPool.filter((item) => includeCampaignRelics || !String(item.source || "").toLowerCase().includes("campaign"));
  const picked = [];
  const used = new Set();

  for (let index = 0; index < count; index += 1) {
    const rarity = rarityFor(level, rarityMode);
    const rarityPool = pool.filter((item) => item.rarity === rarity && !used.has(item.index));
    const fallbackPool = pool.filter((item) => !used.has(item.index));
    const weightedPool = (rarityPool.length ? rarityPool : fallbackPool).flatMap((item) =>
      Array.from({ length: scoreItemForTheme(item, theme) }, () => item)
    );
    const item = pick(weightedPool);
    if (!item) break;
    used.add(item.index);
    picked.push(item);
  }

  return picked;
}

export function generateTreasure({
  itemPool,
  pcs,
  level,
  danger,
  challengeRating,
  type,
  rarityMode,
  theme,
  environment,
  includeCampaignRelics,
}) {
  const coins = generateCoins(type, level, danger);
  const valuables = generateValuables({ theme, environment, type, level, danger });
  const salvage = generateSalvage(environment, type);
  const magicItems = pickMagicItems({ itemPool, type, level, rarityMode, theme, includeCampaignRelics });
  const coinGold = estimateGold(coins);
  const valuablesGold = valuables.reduce((sum, item) => sum + Number(String(item.value).replace(/\D/g, "") || 0), 0);
  const magicValue = magicItems.reduce((sum, item) => {
    const rarityValue = { Common: 50, Uncommon: 250, Rare: 2500, "Very Rare": 25000, Legendary: 100000 }[item.rarity] || 150;
    return sum + rarityValue;
  }, 0);

  return {
    id: `treasure-${Date.now()}`,
    title: `${type.includes("hoard") ? "Treasure Hoard" : "Individual Treasure"} - level ${level}`,
    summary: `${pcs} PCs, level ${level}, ${danger}, CR ${challengeRating}, ${theme} theme`,
    coins,
    coinGold,
    valuables,
    salvage,
    magicItems,
    totalEstimate: coinGold + valuablesGold + magicValue,
    hook: pick(treasureHooks),
    playerSafe: `De buit bevat munten, ${valuables.length} waardevolle objecten${magicItems.length ? ` en ${magicItems.length} magisch object` : ""}.`,
    dmOnly: pick([
      "Een detail wijst subtiel naar Zorath's route.",
      "Een item reageert op de Blade of Broken Mirrors.",
      "De herkomst botst met wat een NPC eerder beweerde.",
      "De cache is recenter verplaatst dan de omgeving doet vermoeden.",
    ]),
  };
}

export function copyTreasure(treasure) {
  if (!treasure) return;
  const lines = [
    treasure.title,
    treasure.summary,
    "",
    `Coins: ${Object.entries(treasure.coins)
      .filter(([, value]) => value)
      .map(([coin, value]) => `${value} ${coin}`)
      .join(", ") || "none"}`,
    "",
    "Valuables:",
    ...(treasure.valuables.length ? treasure.valuables.map((item) => `- ${item.name} (${item.value})`) : ["- none"]),
    "",
    "Magic Items:",
    ...(treasure.magicItems.length ? treasure.magicItems.map((item) => `- ${item.name} (${item.rarity}, ${item.type})`) : ["- none"]),
    "",
    "Salvage:",
    ...(treasure.salvage.length ? treasure.salvage.map((item) => `- ${item.name} (${item.use})`) : ["- none"]),
    "",
    `Hook: ${treasure.hook}`,
    `DM-only: ${treasure.dmOnly}`,
  ];
  navigator.clipboard?.writeText(lines.join("\n"));
}
