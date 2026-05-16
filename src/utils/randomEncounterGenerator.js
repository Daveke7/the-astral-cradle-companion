const xpThresholds = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

const encounterHooks = {
  Chult: [
    "The encounter begins with canopy movement before the party sees the threat.",
    "Rain turns the ground into sliding mud and makes ranged lines awkward.",
    "A distant signal from Firefinger changes the monsters' behavior mid-fight.",
  ],
  Thayan: [
    "A red glyph on a tree flares when the first creature drops to half HP.",
    "The enemy is testing the party, not merely trying to kill them.",
    "A mirror shard on the ground reflects one round before it happens.",
  ],
  Undead: [
    "The dead are guarding something they no longer understand.",
    "The air goes cold and the jungle insects fall silent.",
    "One corpse carries a clue that should not have survived decay.",
  ],
  Beasts: [
    "This is territory behavior, not malice.",
    "The creatures retreat if bloodied and not cornered.",
    "A young or wounded creature nearby explains the aggression.",
  ],
  Arcane: [
    "Wild magic leaks from a ruined focus nearby.",
    "A spell effect is still running from a fight that happened days ago.",
    "The battlefield reacts to spoken spell components.",
  ],
  Any: [
    "The encounter is a pressure test: noise, time, supplies or trust should matter.",
    "A third party watches the fight from concealment.",
    "The battlefield offers a way to win without killing everything.",
  ],
};

const objectiveByShape = {
  patrol: "Capture one scout or prevent a warning signal.",
  ambush: "Break the ambush line and secure a defensible position.",
  lair: "Survive the territory advantage and force the enemy to reposition.",
  boss: "Stop the leader's ritual, order or escape route.",
  swarm: "Hold formation while reducing numbers fast.",
  hazard: "Escape the terrain threat while enemies harry the party.",
};

const timerByShape = {
  patrol: "After round 4, a runner tries to leave the map.",
  ambush: "At initiative 20 each round, cover or footing changes.",
  lair: "At round 3, reinforcements or lair pressure escalates.",
  boss: "At round 5, the leader attempts a decisive retreat or activation.",
  swarm: "Each round after round 2, one more minion arrives unless blocked.",
  hazard: "At initiative 20, the hazard expands or shifts.",
};

const battlefieldByEnvironment = {
  Jungle: "Dense trees, slick roots, vines as vertical routes, visibility often 30-60 ft.",
  Ruins: "Broken sightlines, half-walls, elevation changes, unstable stone and old glyphs.",
  River: "Mud banks, deep channels, swimming routes, cover from reeds and fallen trunks.",
  City: "Crowds, rooftops, market stalls, witnesses and escape alleys.",
  Swamp: "Difficult terrain, hidden water, biting insects, sinking ground.",
  Coast: "Wind, wet stone, ship debris, sudden drops and waves.",
  Dungeon: "Tight corridors, doors, sound carry, choke points and hidden rooms.",
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function encounterMultiplier(count) {
  if (count <= 1) return 1;
  if (count === 2) return 1.5;
  if (count <= 6) return 2;
  if (count <= 10) return 2.5;
  if (count <= 14) return 3;
  return 4;
}

function targetXp(level, pcs, difficulty) {
  const row = xpThresholds[Math.max(1, Math.min(20, Number(level || 1)))] || xpThresholds[4];
  return Math.round((row[difficulty] || row.medium) * Number(pcs || 4));
}

function monsterMatchesEnvironment(monster, environment) {
  if (environment === "Any") return true;
  const text = [monster.name, monster.type, monster.role, ...(monster.environment || []), ...(monster.tags || [])]
    .join(" ")
    .toLowerCase();
  const words = {
    Jungle: ["jungle", "forest", "beast", "dinosaur", "chult", "flyer"],
    Ruins: ["ruin", "undead", "construct", "humanoid", "cult", "thay"],
    River: ["swim", "crocodile", "river", "swamp", "beast"],
    City: ["humanoid", "guard", "bandit", "cult", "thay"],
    Swamp: ["swamp", "crocodile", "poison", "undead"],
    Coast: ["flyer", "swim", "beast", "humanoid"],
    Dungeon: ["undead", "spider", "goblin", "cult", "humanoid"],
  }[environment] || [environment.toLowerCase()];
  return words.some((word) => text.includes(word));
}

function monsterMatchesTheme(monster, theme) {
  if (theme === "Any") return 1;
  const text = [monster.name, monster.type, monster.role, monster.source, ...(monster.tags || []), ...(monster.environment || [])]
    .join(" ")
    .toLowerCase();
  const words = {
    Chult: ["chult", "jungle", "dinosaur", "crocodile", "tiger", "ape", "wasp"],
    Thayan: ["thay", "red wizard", "cult", "wizard", "arcane", "undead"],
    Undead: ["undead", "zombie", "skeleton", "wight", "ghost"],
    Beasts: ["beast", "dinosaur", "ape", "tiger", "spider", "wasp"],
    Humanoids: ["humanoid", "bandit", "guard", "scout", "cult", "goblin"],
    Arcane: ["wizard", "spell", "arcane", "construct", "elemental", "fiend"],
    Aerial: ["fly", "flying", "wing", "wasp", "pterafolk"],
  }[theme] || [theme.toLowerCase()];
  return words.some((word) => text.includes(word)) ? 4 : 1;
}

function roleScore(monster, shape) {
  const role = String(monster.role || "").toLowerCase();
  if (shape === "boss" && ["leader", "brute", "controller"].some((item) => role.includes(item))) return 4;
  if (shape === "swarm" && ["minion", "skirmisher", "soldier"].some((item) => role.includes(item))) return 4;
  if (shape === "ambush" && ["skirmisher", "artillery", "controller"].some((item) => role.includes(item))) return 4;
  if (shape === "patrol" && ["soldier", "skirmisher", "leader"].some((item) => role.includes(item))) return 3;
  if (shape === "hazard" && ["controller", "artillery", "skirmisher"].some((item) => role.includes(item))) return 3;
  return 1;
}

function buildCandidatePool(monsters, { environment, theme, shape, partyLevel, includeCampaignThreats }) {
  const maxXp = targetXp(partyLevel, 1, "deadly") * 1.6;
  const filtered = monsters
    .filter((monster) => includeCampaignThreats || !String(monster.source || "").toLowerCase().includes("campaign custom"))
    .filter((monster) => numberValue(monster.xp, 0) > 0)
    .filter((monster) => numberValue(monster.xp, 0) <= maxXp)
    .filter((monster) => monsterMatchesEnvironment(monster, environment));

  const base = filtered.length ? filtered : monsters.filter((monster) => numberValue(monster.xp, 0) > 0);
  return base.flatMap((monster) =>
    Array.from({ length: monsterMatchesTheme(monster, theme) + roleScore(monster, shape) }, () => monster)
  );
}

function compactEntries(selected) {
  const byIndex = new Map();
  selected.forEach((monster) => {
    const key = monster.index || monster.name;
    const current = byIndex.get(key);
    if (current) current.count += 1;
    else byIndex.set(key, { monster, count: 1 });
  });
  return Array.from(byIndex.values());
}

function estimateDifficulty(adjustedXp, level, pcs) {
  const row = xpThresholds[Math.max(1, Math.min(20, Number(level || 1)))] || xpThresholds[4];
  const thresholds = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value * pcs]));
  if (adjustedXp >= thresholds.deadly) return "deadly";
  if (adjustedXp >= thresholds.hard) return "hard";
  if (adjustedXp >= thresholds.medium) return "medium";
  return "easy";
}

function tacticFor(entry) {
  const role = String(entry.monster.role || "").toLowerCase();
  if (role.includes("controller")) return `${entry.monster.name}: open met control, forceer movement of saves.`;
  if (role.includes("artillery")) return `${entry.monster.name}: blijf op afstand, focus wounded targets of concentratie.`;
  if (role.includes("brute")) return `${entry.monster.name}: claim ruimte, blokkeer route, punish melee clustering.`;
  if (role.includes("leader")) return `${entry.monster.name}: gebruikt minions als scherm en probeert te ontsnappen als bloedied.`;
  if (role.includes("skirmisher")) return `${entry.monster.name}: hit-and-run, dekking, hoogte of flanken.`;
  return `${entry.monster.name}: speelt op terreinvoordeel en druk op supplies/tijd.`;
}

export function generateRandomEncounter({
  monsters,
  partyLevel,
  pcs,
  difficulty,
  environment,
  theme,
  shape,
  includeCampaignThreats,
  maxCreatures,
}) {
  const target = targetXp(partyLevel, pcs, difficulty);
  const pool = buildCandidatePool(monsters, { environment, theme, shape, partyLevel, includeCampaignThreats });
  const selected = [];
  let rawXp = 0;
  const creatureLimit = Math.max(1, Math.min(18, Number(maxCreatures || 8)));

  for (let attempt = 0; attempt < creatureLimit * 18 && selected.length < creatureLimit; attempt += 1) {
    const remaining = Math.max(50, target - rawXp);
    const affordable = pool.filter((monster) => numberValue(monster.xp, 0) <= remaining * (shape === "boss" && selected.length === 0 ? 1.4 : 0.82));
    const next = pick(affordable.length ? affordable : pool);
    if (!next) break;
    selected.push(next);
    rawXp += numberValue(next.xp, 0);
    const adjusted = Math.round(rawXp * encounterMultiplier(selected.length));
    if (adjusted >= target * 0.88 && selected.length >= (shape === "boss" ? 2 : 1)) break;
  }

  if (!selected.length && monsters.length) selected.push(monsters.find((monster) => numberValue(monster.xp, 0) > 0) || monsters[0]);
  const entries = compactEntries(selected);
  const totalMonsters = selected.length;
  const adjustedXp = Math.round(rawXp * encounterMultiplier(totalMonsters));
  const actualDifficulty = estimateDifficulty(adjustedXp, partyLevel, pcs);

  return {
    id: `random-encounter-${Date.now()}`,
    title: `${theme === "Any" ? environment : theme} ${shape} encounter`,
    summary: `${pcs} PCs level ${partyLevel}, target ${difficulty}, estimated ${actualDifficulty}`,
    targetXp: target,
    rawXp,
    adjustedXp,
    multiplier: encounterMultiplier(totalMonsters),
    difficulty: actualDifficulty,
    environment,
    theme,
    shape,
    monsters: entries,
    objective: objectiveByShape[shape] || objectiveByShape.patrol,
    timer: timerByShape[shape] || timerByShape.patrol,
    battlefield: battlefieldByEnvironment[environment] || battlefieldByEnvironment.Jungle,
    hook: pick(encounterHooks[theme] || encounterHooks.Any),
    tactics: entries.map(tacticFor),
    playerSafe: `Er is beweging in ${environment.toLowerCase()} terrein. De tegenstand lijkt georganiseerd genoeg om gevaarlijk te worden.`,
    dmOnly: pick([
      "Een overlevende kan de party naar een nieuwe clue leiden.",
      "Het gevecht maakt genoeg lawaai om later een consequence clock te vullen.",
      "Een monster draagt sporen van Thayan manipulatie.",
      "Het terrein bevat een player-safe ontdekking als de party niet alles verbrandt.",
    ]),
  };
}

export function copyRandomEncounter(encounter) {
  if (!encounter) return;
  const lines = [
    encounter.title,
    encounter.summary,
    `XP: raw ${encounter.rawXp}, adjusted ${encounter.adjustedXp}, target ${encounter.targetXp}`,
    "",
    "Monsters:",
    ...encounter.monsters.map((entry) => `- ${entry.count}x ${entry.monster.name} (CR ${entry.monster.cr}, ${entry.monster.role}, ${entry.monster.xp} XP)`),
    "",
    `Objective: ${encounter.objective}`,
    `Timer: ${encounter.timer}`,
    `Battlefield: ${encounter.battlefield}`,
    `Hook: ${encounter.hook}`,
    "",
    "Tactics:",
    ...encounter.tactics.map((line) => `- ${line}`),
    "",
    `Player-safe: ${encounter.playerSafe}`,
    `DM-only: ${encounter.dmOnly}`,
  ];
  navigator.clipboard?.writeText(lines.join("\n"));
}
