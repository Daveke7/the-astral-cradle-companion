const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"];

function cleanText(value = "") {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripEmpty(values = []) {
  return values.map(cleanText).filter(Boolean);
}

function property(label, value) {
  const safeValue = cleanText(value);
  return safeValue ? `property | ${label} | ${safeValue}` : "";
}

function section(title) {
  return `section | ${title}`;
}

function textLine(value) {
  const text = cleanText(value);
  return text ? `text | ${text}` : "";
}

function namedEntryText(entry = {}) {
  const name = cleanText(entry.name);
  const desc = cleanText(entry.desc);
  const attack = cleanText(entry.attack);
  const damage = cleanText(entry.damage);
  const mechanics = stripEmpty([attack && `${attack} to hit`, damage]).join(" / ");
  const prefix = name ? `${name}.` : "";
  return stripEmpty([prefix, mechanics, desc]).join(" ");
}

function formatMap(value = {}, fallback = "") {
  if (typeof value === "string") return value;
  const entries = Object.entries(value || {});
  if (!entries.length) return fallback;
  return entries.map(([key, item]) => `${key} ${item}`).join(", ");
}

function monsterMeta(monster = {}) {
  return stripEmpty([
    [monster.size, monster.type, monster.alignment].filter(Boolean).join(" "),
    monster.cr ? `CR ${monster.cr}` : "",
    monster.role,
  ]).join(" | ");
}

function abilityScore(monster = {}, key) {
  const score = Number(monster.abilities?.[key] || 10);
  return Number.isFinite(score) ? score : 10;
}

function compactEntries(entries = [], limit = 4) {
  return entries.slice(0, limit);
}

function appendNamedSection(contents, title, entries = [], options = {}) {
  const visibleEntries = options.mode === "compact" ? compactEntries(entries, options.compactLimit) : entries;
  const lines = visibleEntries.map(namedEntryText).filter(Boolean);
  if (!lines.length) return;

  contents.push(section(title));
  lines.forEach((line) => contents.push(textLine(line)));
  if (options.mode === "compact" && entries.length > visibleEntries.length) {
    contents.push(textLine(`+ ${entries.length - visibleEntries.length} extra opties in de volledige statblock.`));
  }
}

export function monsterToRpgCard(monster = {}, options = {}) {
  const mode = options.mode || "compact";
  const contents = [
    `subtitle | ${monsterMeta(monster) || "Enemy"}`,
    "rule",
    property("Armor class", monster.armorClassText || monster.ac),
    property("Hit points", monster.hp || monster.maxHp),
    property("Speed", monster.speed),
    "rule",
    `dndstats | ${abilityKeys.map((key) => abilityScore(monster, key)).join(" | ")}`,
    "rule",
    property("Saving Throws", formatMap(monster.saves, monster.savingThrowsText)),
    property("Skills", formatMap(monster.skills, monster.skillsText)),
    property("Damage Vulnerabilities", monster.damageVulnerabilities),
    property("Damage Resistances", monster.damageResistances),
    property("Damage Immunities", monster.damageImmunities),
    property("Condition Immunities", monster.conditionImmunities),
    property("Senses", monster.senses),
    property("Languages", monster.languages),
    property("Challenge", monster.cr ? `${monster.cr}${monster.xp ? ` (${monster.xp} XP)` : ""}` : ""),
  ].filter(Boolean);

  appendNamedSection(contents, "Traits", monster.traits || [], { mode, compactLimit: 4 });
  appendNamedSection(contents, "Actions", monster.actions || [], { mode, compactLimit: 5 });
  appendNamedSection(contents, "Bonus Actions", monster.bonusActions || [], { mode, compactLimit: 2 });
  appendNamedSection(contents, "Reactions", monster.reactions || [], { mode, compactLimit: 2 });
  appendNamedSection(contents, "Legendary Actions", monster.legendaryActions || [], { mode, compactLimit: 3 });
  appendNamedSection(contents, "Mythic Actions", monster.mythicActions || [], { mode, compactLimit: 2 });
  appendNamedSection(contents, "Lair Actions", monster.lairActions || [], { mode, compactLimit: 2 });

  if (options.includeRawText && monster.rawText) {
    contents.push(section("Raw Statblock"));
    contents.push(textLine(monster.rawText));
  }

  const card = {
    title: monster.name || "Unknown enemy",
    icon: options.icon || "imp-laugh",
    contents,
  };

  if (options.includeImages !== false && monster.imageUrl) {
    card.background_image = monster.imageUrl;
  }

  return card;
}

export function monstersToRpgCards(monsters = [], options = {}) {
  return monsters.flatMap((monster) =>
    Array.from({ length: Math.max(1, Number(monster.cardCount || 1)) }, () => monsterToRpgCard(monster, options))
  );
}

export function serializeMonsterCards(monsters = [], options = {}) {
  return JSON.stringify(monstersToRpgCards(monsters, options), null, 2);
}

export function summarizeCardContents(card = {}) {
  return (card.contents || [])
    .filter((line) => !/^rule$/i.test(line))
    .slice(0, 9)
    .map((line) => line.replace(/^(subtitle|property|section|text|dndstats)\s*\|\s*/i, ""))
    .join("\n");
}
