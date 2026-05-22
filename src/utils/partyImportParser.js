const abilityById = {
  1: "str",
  2: "dex",
  3: "con",
  4: "int",
  5: "wis",
  6: "cha",
};

const abilityLabels = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

const alignmentById = {
  1: "Lawful Good",
  2: "Neutral Good",
  3: "Chaotic Good",
  4: "Lawful Neutral",
  5: "Neutral",
  6: "Chaotic Neutral",
  7: "Lawful Evil",
  8: "Neutral Evil",
  9: "Chaotic Evil",
};

function clean(value = "") {
  return String(value).replace(/\r/g, "").trim();
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function toNumber(value) {
  const number = Number(String(value ?? "").match(/-?\d+/)?.[0]);
  return Number.isFinite(number) ? number : "";
}

function toTitle(value = "") {
  return clean(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function findByPath(source, path) {
  return path.split(".").reduce((current, key) => {
    if (current === undefined || current === null) return undefined;
    return current[key];
  }, source);
}

function findDeep(source, keys = []) {
  if (!source || typeof source !== "object") return undefined;
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }
  for (const value of Object.values(source)) {
    const found = findDeep(value, keys);
    if (found !== undefined) return found;
  }
  return undefined;
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function extractLine(text, labels = []) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:${escaped})\\s*:?\\s*(.+)`, "i"));
  return clean(match?.[1] || "");
}

function extractBlock(text, labels = []) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const stop =
    "Name|Naam|Class|Klasse|Race|Species|Soort|Level|AC|Armor Class|HP|Hit Points|Passive Perception|Spell Save DC|Gear|Items|Equipment|Notes|Notities|Spells|Attacks|Proficiencies|Languages";
  const match = text.match(
    new RegExp(`(?:^|\\n)\\s*(?:${escaped})\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${stop})\\s*:|$)`, "i")
  );
  return clean(match?.[1] || "");
}

export function parseBeyondCharacterId(value = "") {
  const source = clean(value);
  return (
    source.match(/characters\/(\d+)/i)?.[1] ||
    source.match(/character\/(?:v\d+\/character\/)?(\d+)/i)?.[1] ||
    source.match(/\b(\d{6,})\b/)?.[1] ||
    ""
  );
}

export function buildBeyondCharacterApiUrl(value = "") {
  const characterId = parseBeyondCharacterId(value);
  return characterId ? `https://character-service.dndbeyond.com/character/v5/character/${characterId}` : "";
}

export async function fetchDndBeyondCharacter(value = "") {
  const characterId = parseBeyondCharacterId(value);
  if (!characterId) throw new Error("Geen D&D Beyond character-id gevonden in deze link.");

  const endpoints = [
    {
      url: `https://character-service.dndbeyond.com/character/v5/character/${characterId}`,
      kind: "json",
      label: "Character service JSON",
      accept: "application/json,text/plain,*/*",
    },
    {
      url: `https://www.dndbeyond.com/characters/${characterId}/json`,
      kind: "json",
      label: "Character JSON fallback",
      accept: "application/json,text/plain,*/*",
    },
    {
      url: `https://www.dndbeyond.com/characters/${characterId}`,
      kind: "html",
      label: "Beyond HTML scraper fallback",
      accept: "text/html,application/xhtml+xml,application/json,text/plain,*/*",
    },
  ];
  let lastError = "";

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        headers: { accept: endpoint.accept },
      });
      if (!response.ok) {
        lastError = `${response.status} ${response.statusText}`;
        continue;
      }

      const sourceText = await response.text();
      const { parsed, jsonParsed, jsonSource } = parseJsonPayload(sourceText);
      if (jsonParsed && isCharacterLikePayload(parsed)) {
        return {
          characterId,
          endpoint: endpoint.url,
          endpointLabel: endpoint.label,
          payload: parsed,
          sourceText,
          sourceKind: endpoint.kind === "html" ? "html-json" : "json",
          jsonSource,
        };
      }

      if (endpoint.kind === "html") {
        const readableText = htmlToReadableText(sourceText);
        const textData = parseTextImport(readableText);
        if (Object.values(textData).filter(hasValue).length >= 3) {
          return {
            characterId,
            endpoint: endpoint.url,
            endpointLabel: endpoint.label,
            payload: null,
            sourceText,
            sourceKind: "html-text",
            jsonSource: "",
          };
        }
      }

      lastError = `${endpoint.label} gaf geen herkenbare character-data terug.`;
    } catch (error) {
      lastError = error.message || "Browser kon D&D Beyond niet ophalen.";
    }
  }

  throw new Error(
    `D&D Beyond kon niet automatisch worden gelezen (${lastError}). Zet de sheet op Public; als D&D Beyond/CORS blokkeert, plak de JSON of pagina-bron hier.`
  );
}

function tryParseJson(value = "") {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value = "") {
  const namedEntities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return String(value).replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    const key = entity.toLowerCase();
    if (key.startsWith("#x")) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith("#")) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return namedEntities[key] || match;
  });
}

function htmlToReadableText(sourceText = "") {
  return decodeHtmlEntities(sourceText)
    .replace(/<script\b[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(address|article|aside|blockquote|dd|details|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)>/gi, "\n")
    .replace(/<(dt|dd|td|th|li)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function extractBalancedJson(source = "", startIndex = 0) {
  const startOffset = source.slice(startIndex).search(/[[{]/);
  if (startOffset < 0) return "";

  const start = startIndex + startOffset;
  const open = source[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }

  return "";
}

function collectJsonCandidates(source = "") {
  const candidates = [];
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let scriptMatch = scriptPattern.exec(source);

  while (scriptMatch) {
    const attrs = scriptMatch[1] || "";
    const body = decodeHtmlEntities(clean(scriptMatch[2] || ""));
    const looksLikeJson = /^[{[]/.test(body);
    const looksRelevant =
      /__NEXT_DATA__|application\/json|application\/ld\+json|character|preload|initial/i.test(attrs) ||
      /"character"|"classes"|"stats"|"inventory"|characterData|__INITIAL_STATE__/i.test(body);

    if (body && looksLikeJson && looksRelevant) {
      candidates.push({ label: attrs.match(/id=["']([^"']+)["']/i)?.[1] || "script-json", text: body });
    }
    scriptMatch = scriptPattern.exec(source);
  }

  const markers = [
    "__NEXT_DATA__",
    "__INITIAL_STATE__",
    "__PRELOADED_STATE__",
    "__APOLLO_STATE__",
    "__CHARACTER_DATA__",
    "characterData",
    "characterJson",
    "ddbCharacter",
  ];
  const lowerSource = source.toLowerCase();

  markers.forEach((marker) => {
    let searchIndex = 0;
    const needle = marker.toLowerCase();
    while (searchIndex < source.length) {
      const markerIndex = lowerSource.indexOf(needle, searchIndex);
      if (markerIndex < 0) break;
      const jsonText = extractBalancedJson(source, markerIndex + marker.length);
      if (jsonText) candidates.push({ label: marker, text: decodeHtmlEntities(jsonText) });
      searchIndex = markerIndex + marker.length;
    }
  });

  return candidates;
}

function parseJsonPayload(sourceText = "") {
  const source = clean(sourceText);
  const direct = source ? tryParseJson(source) : null;
  if (direct) {
    return { parsed: direct, jsonParsed: true, jsonSource: "direct-json" };
  }

  const parsedCandidates = collectJsonCandidates(source)
    .map((candidate) => ({ ...candidate, parsed: tryParseJson(candidate.text) }))
    .filter((candidate) => candidate.parsed);
  const best = parsedCandidates.sort(
    (left, right) => scoreCharacterPayload(right.parsed) - scoreCharacterPayload(left.parsed)
  )[0];
  const bestScore = best ? scoreCharacterPayload(best.parsed) : 0;

  return best && bestScore >= 2
    ? { parsed: best.parsed, jsonParsed: true, jsonSource: best.label }
    : { parsed: null, jsonParsed: false, jsonSource: "" };
}

function characterDataFromPayload(parsed = {}) {
  return parsed?.data?.name || parsed?.data?.id
    ? parsed.data
    : parsed?.data?.character
      ? parsed.data.character
      : parsed?.character?.data
        ? parsed.character.data
        : parsed?.character || parsed;
}

function scoreCharacterPayload(parsed = {}) {
  const data = characterDataFromPayload(parsed);
  const checks = [
    data?.id,
    data?.name,
    findDeep(data, ["characterName"]),
    findDeep(data, ["classes"]),
    findDeep(data, ["stats"]),
    findDeep(data, ["inventory"]),
    findDeep(data, ["race", "species"]),
    findDeep(data, ["modifiers"]),
    findDeep(data, ["spells"]),
    findDeep(data, ["baseHitPoints", "hitPointMaximum", "maxHp"]),
  ];
  return checks.filter((value) => hasValue(value)).length;
}

function isCharacterLikePayload(parsed = {}) {
  return scoreCharacterPayload(parsed) >= 2;
}

function classSummaryFromJson(data) {
  const classes = findDeep(data, ["classes"]);
  if (!Array.isArray(classes)) return "";
  return classes
    .map((entry) => {
      const name =
        findByPath(entry, "definition.name") ||
        findByPath(entry, "classDefinition.name") ||
        entry.name ||
        entry.className;
      const subclass = findByPath(entry, "subclassDefinition.name") || findByPath(entry, "subClassDefinition.name");
      const level = entry.level || entry.classLevel;
      return name ? `${name}${level ? ` ${level}` : ""}${subclass ? ` (${subclass})` : ""}` : "";
    })
    .filter(Boolean)
    .join(" / ");
}

function totalLevelFromJson(data) {
  const classes = findDeep(data, ["classes"]);
  if (!Array.isArray(classes)) return "";
  const total = classes.reduce((sum, entry) => sum + Number(entry.level || entry.classLevel || 0), 0);
  return total || "";
}

function proficiencyBonus(level) {
  const total = Number(level || 0);
  return total ? 2 + Math.floor((total - 1) / 4) : "";
}

function getStatArrayEntry(data, key, id) {
  const list = findDeep(data, [key]);
  if (!Array.isArray(list)) return undefined;
  return list.find((entry) => Number(entry.id) === Number(id) || Number(entry.statId) === Number(id));
}

function abilityScoresFromJson(data) {
  return Object.entries(abilityById).reduce((scores, [id, ability]) => {
    const base = Number(getStatArrayEntry(data, "stats", id)?.value || 10);
    const bonus = Number(getStatArrayEntry(data, "bonusStats", id)?.value || 0);
    const override = getStatArrayEntry(data, "overrideStats", id)?.value;
    scores[ability] = override !== null && override !== undefined ? Number(override) : base + bonus;
    return scores;
  }, {});
}

function abilitySummaryFromJson(data) {
  const scores = abilityScoresFromJson(data);
  const values = Object.entries(scores)
    .filter(([, value]) => Number.isFinite(value))
    .map(([key, value]) => `${abilityLabels[key]} ${value}`);
  return values.length ? values.join(" / ") : "";
}

function formatSpeed(data) {
  const speed =
    findDeep(data, ["speeds"]) ||
    findByPath(data, "race.weightSpeeds.normal") ||
    findByPath(data, "race.weightSpeeds.encumbered") ||
    findDeep(data, ["movement"]);
  if (!speed || typeof speed !== "object") return "";
  return Object.entries(speed)
    .filter(([, value]) => value && typeof value !== "object")
    .map(([key, value]) => `${toTitle(key)} ${value} ft`)
    .join(", ");
}

function collectModifiers(data) {
  const modifiers = findDeep(data, ["modifiers"]);
  if (!modifiers || typeof modifiers !== "object") return [];
  return Object.values(modifiers)
    .flatMap((group) => (Array.isArray(group) ? group : []))
    .filter(Boolean);
}

function modifierLabel(modifier = {}) {
  return (
    modifier.friendlySubtypeName ||
    modifier.friendlyTypeName ||
    modifier.name ||
    toTitle(modifier.subType || modifier.type || "")
  );
}

function formatModifierList(modifiers = [], matcher) {
  const labels = modifiers.filter(matcher).map(modifierLabel).filter(Boolean);
  return Array.from(new Set(labels)).slice(0, 28).join(", ");
}

function collectSpellEntries(data) {
  const entries = [];
  function scan(value, key = "", insideSpellBucket = false) {
    if (!value || typeof value !== "object") return;
    if ((key === "spells" || insideSpellBucket) && Array.isArray(value)) entries.push(...value);
    const nextInsideSpellBucket = insideSpellBucket || key === "spells" || key === "classSpells";
    Object.entries(value).forEach(([childKey, childValue]) => scan(childValue, childKey, nextInsideSpellBucket));
  }
  scan(data);
  return entries;
}

function normalizeSpellEntry(entry = {}) {
  const definition = entry.definition || entry.spellDefinition || entry;
  const name = definition.name || entry.name;
  if (!name || (definition.level === undefined && !definition.school && !definition.castingTime)) return null;
  return {
    name,
    level: Number(definition.level || 0),
    prepared: Boolean(entry.prepared || entry.alwaysPrepared || entry.countsAsKnownSpell),
  };
}

function spellSummaryFromJson(data) {
  const spells = collectSpellEntries(data).map(normalizeSpellEntry).filter(Boolean);
  const byName = new Map(spells.map((spell) => [spell.name, spell]));
  const deduped = Array.from(byName.values()).sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
  const cantrips = deduped.filter((spell) => spell.level === 0).map((spell) => spell.name);
  const prepared = deduped.filter((spell) => spell.prepared && spell.level > 0).map((spell) => spell.name);
  return {
    spells: deduped.map((spell) => `${spell.name}${spell.level ? ` L${spell.level}` : " cantrip"}`).slice(0, 60).join(", "),
    cantrips: cantrips.slice(0, 20).join(", "),
    preparedSpells: prepared.slice(0, 35).join(", "),
  };
}

function inventoryFromJson(data) {
  const inventory = findDeep(data, ["inventory"]);
  return Array.isArray(inventory) ? inventory : [];
}

function itemName(item = {}) {
  return findByPath(item, "definition.name") || item.name || item.label || "";
}

function gearSummaryFromJson(data) {
  return inventoryFromJson(data)
    .map((item) => {
      const name = itemName(item);
      if (!name) return "";
      const quantity = Number(item.quantity || 1);
      const flags = [
        item.equipped ? "equipped" : "",
        item.isAttuned || item.attuned ? "attuned" : "",
        findByPath(item, "definition.rarity") || "",
      ].filter(Boolean);
      return `${quantity > 1 ? `${quantity}x ` : ""}${name}${flags.length ? ` (${flags.join(", ")})` : ""}`;
    })
    .filter(Boolean)
    .slice(0, 80)
    .join(", ");
}

function attackSummaryFromJson(data) {
  const actions = findDeep(data, ["actions"]);
  const actionNames =
    actions && typeof actions === "object"
      ? Object.values(actions)
          .flatMap((group) => (Array.isArray(group) ? group : []))
          .map((action) => findByPath(action, "definition.name") || action.name)
          .filter(Boolean)
      : [];
  const equippedWeapons = inventoryFromJson(data)
    .filter((item) => {
      const itemType = `${findByPath(item, "definition.filterType") || ""} ${findByPath(item, "definition.type") || ""} ${findByPath(item, "definition.name") || ""}`;
      return /weapon|ammunition|dart|dagger|bow|sword|axe|mace|staff|spear|javelin/i.test(itemType);
    })
    .map(itemName)
    .filter(Boolean);
  return Array.from(new Set([...equippedWeapons, ...actionNames])).slice(0, 35).join(", ");
}

function currencySummaryFromJson(data) {
  const currencies = findDeep(data, ["currencies"]) || findDeep(data, ["currency"]);
  if (!currencies || typeof currencies !== "object") return "";
  return ["pp", "gp", "ep", "sp", "cp"]
    .map((coin) => (currencies[coin] || currencies[coin.toUpperCase()] ? `${coin.toUpperCase()} ${currencies[coin] || currencies[coin.toUpperCase()]}` : ""))
    .filter(Boolean)
    .join(", ");
}

function notesFromJson(data) {
  const notes = findDeep(data, ["notes"]);
  if (!notes || typeof notes !== "object") return "";
  return Object.entries(notes)
    .filter(([, value]) => clean(value))
    .map(([key, value]) => `${toTitle(key)}: ${clean(value)}`)
    .join("\n\n");
}

function parseJsonImport(sourceText = "", beyondUrl = "") {
  const { parsed, jsonParsed, jsonSource } = parseJsonPayload(sourceText);
  if (!jsonParsed) return { data: {}, jsonParsed: false, jsonSource: "" };

  const data = characterDataFromPayload(parsed);
  const level = firstDefined(totalLevelFromJson(data), findDeep(data, ["level"]));
  const modifiers = collectModifiers(data);
  const spells = spellSummaryFromJson(data);
  const maxHp = firstDefined(
    findDeep(data, ["overrideHitPoints"]),
    findDeep(data, ["hitPointMaximum", "maxHp"]),
    Number(findDeep(data, ["baseHitPoints"]) || 0) + Number(findDeep(data, ["bonusHitPoints"]) || 0) || ""
  );
  const removedHp = Number(findDeep(data, ["removedHitPoints"]) || 0);
  const currentHp = maxHp !== "" ? Math.max(0, Number(maxHp) - removedHp) : "";
  const characterId = firstDefined(data.id, parseBeyondCharacterId(beyondUrl), parseBeyondCharacterId(sourceText));
  const apiUrl = characterId ? buildBeyondCharacterApiUrl(String(characterId)) : buildBeyondCharacterApiUrl(beyondUrl);
  const race = firstDefined(
    findByPath(data, "race.fullName"),
    findByPath(data, "race.name"),
    findByPath(data, "race.baseRaceName"),
    findByPath(data, "species.fullName"),
    findByPath(data, "species.name"),
    findDeep(data, ["raceName", "speciesName"])
  );

  return {
    data: {
      name: firstDefined(data.name, findDeep(data, ["characterName"])),
      classSummary: classSummaryFromJson(data),
      level,
      proficiencyBonus: proficiencyBonus(level),
      race,
      background: firstDefined(findByPath(data, "background.definition.name"), findByPath(data, "background.name")),
      alignment: firstDefined(data.alignment, alignmentById[data.alignmentId]),
      ac: firstDefined(findDeep(data, ["armorClass", "ac"]), ""),
      maxHp,
      currentHp,
      tempHp: firstDefined(findDeep(data, ["temporaryHitPoints", "tempHp"]), ""),
      passivePerception: firstDefined(findDeep(data, ["passivePerception"]), ""),
      spellSaveDc: firstDefined(findDeep(data, ["spellSaveDc", "spellSaveDC"]), ""),
      spellAttackBonus: firstDefined(findDeep(data, ["spellAttackBonus", "spellAttackModifier"]), ""),
      spellcastingAbility: abilityLabels[abilityById[findDeep(data, ["spellCastingAbilityId", "spellcastingAbilityId"])]] || "",
      speed: formatSpeed(data),
      senses: firstDefined(findDeep(data, ["senses"]), ""),
      initiative: firstDefined(findDeep(data, ["initiative"]), ""),
      xp: firstDefined(findDeep(data, ["currentXp", "experiencePoints", "xp"]), ""),
      abilities: abilitySummaryFromJson(data),
      saves: formatModifierList(modifiers, (modifier) => /saving-throws?/i.test(modifier.subType || modifier.friendlySubtypeName || "")),
      skills: formatModifierList(modifiers, (modifier) => /skill/i.test(modifier.type || modifier.friendlyTypeName || "")),
      proficiencies: formatModifierList(modifiers, (modifier) => /proficiency|expertise/i.test(`${modifier.type} ${modifier.friendlyTypeName}`)),
      languages: formatModifierList(modifiers, (modifier) => /language/i.test(`${modifier.subType} ${modifier.friendlySubtypeName} ${modifier.friendlyTypeName}`)),
      attacks: attackSummaryFromJson(data),
      spells: spells.spells,
      cantrips: spells.cantrips,
      preparedSpells: spells.preparedSpells,
      gear: gearSummaryFromJson(data),
      currency: currencySummaryFromJson(data),
      notes: notesFromJson(data),
      imageUrl: firstDefined(findByPath(data, "decorations.avatarUrl"), data.avatarUrl, data.profileImageUrl),
      beyondUrl,
      beyondCharacterId: characterId ? String(characterId) : "",
      beyondApiUrl: apiUrl,
      campaignName: firstDefined(findByPath(data, "campaign.name"), findDeep(data, ["campaignName"])),
      importMethod: jsonSource === "direct-json" ? "JSON" : `Embedded JSON (${jsonSource})`,
      jsonSource,
    },
    jsonParsed: true,
    jsonSource,
  };
}

function parseTextImport(sourceText = "") {
  const text = clean(sourceText);
  const gear = extractBlock(text, ["Gear", "Items", "Equipment", "Uitrusting"]);
  return {
    name: extractLine(text, ["Name", "Naam", "Character"]),
    classSummary: extractLine(text, ["Class", "Klasse"]),
    level: toNumber(extractLine(text, ["Level", "Lvl"])),
    race: extractLine(text, ["Race", "Species", "Soort"]),
    background: extractLine(text, ["Background", "Achtergrond"]),
    ac: toNumber(extractLine(text, ["AC", "Armor Class"])),
    maxHp: toNumber(extractLine(text, ["HP", "Hit Points", "Max HP"])),
    passivePerception: toNumber(extractLine(text, ["Passive Perception", "Passieve Perceptie"])),
    spellSaveDc: toNumber(extractLine(text, ["Spell Save DC", "Spell DC"])),
    speed: extractLine(text, ["Speed", "Snelheid"]),
    attacks: extractBlock(text, ["Attacks", "Actions", "Aanvallen"]),
    spells: extractBlock(text, ["Spells", "Spellcasting"]),
    proficiencies: extractBlock(text, ["Proficiencies", "Proficienties"]),
    languages: extractBlock(text, ["Languages", "Talen"]),
    gear,
    notes: extractBlock(text, ["Notes", "Notities"]),
  };
}

function hasValue(value) {
  return Array.isArray(value) ? value.length > 0 : clean(value) !== "";
}

function looksLikeHtml(sourceText = "") {
  return /<\/?[a-z][\s\S]*>/i.test(sourceText) && /<html|<body|<script|<div|<section|<main|<span/i.test(sourceText);
}

function importConfidence(data, fromJson, sourceText, beyondCharacterId, url, htmlParsed = false) {
  const importantFields = [
    "name",
    "classSummary",
    "level",
    "race",
    "background",
    "ac",
    "maxHp",
    "currentHp",
    "passivePerception",
    "speed",
    "abilities",
    "attacks",
    "spells",
    "gear",
    "proficiencies",
    "languages",
  ];
  const found = importantFields.filter((key) => hasValue(data[key])).length + (beyondCharacterId ? 1 : 0) + (url ? 1 : 0);
  const base = Math.round((found / (importantFields.length + 2)) * 100);
  const jsonBonus = fromJson ? 12 : 0;
  const htmlBonus = htmlParsed ? 5 : 0;
  const sourcePenalty = sourceText ? 0 : 22;
  return Math.min(99, Math.max(12, base + jsonBonus + htmlBonus - sourcePenalty));
}

export function parsePartyImport(importCenter = {}) {
  const sourceText = clean(importCenter.sourceText);
  const url = clean(importCenter.url);
  const warnings = [];
  const fromJson = sourceText ? parseJsonImport(sourceText, url) : { data: {}, jsonParsed: false };
  const htmlParsed = Boolean(sourceText && !fromJson.jsonParsed && looksLikeHtml(sourceText));
  const fallbackText = htmlParsed ? htmlToReadableText(sourceText) : sourceText;
  const fromText = sourceText && !fromJson.jsonParsed ? parseTextImport(fallbackText) : {};
  const beyondCharacterId = firstDefined(fromJson.data.beyondCharacterId, parseBeyondCharacterId(url));
  const data = {
    ...fromText,
    ...fromJson.data,
    beyondUrl: url || fromJson.data.beyondUrl || "",
    beyondCharacterId,
    beyondApiUrl: fromJson.data.beyondApiUrl || buildBeyondCharacterApiUrl(url),
    importMethod:
      fromJson.data.importMethod ||
      (htmlParsed ? "HTML scraper fallback" : sourceText ? "Manual text fallback" : "Geen bron geanalyseerd"),
    jsonSource: fromJson.jsonSource || "",
  };

  if (importCenter.sourceType === "beyond-url" && !beyondCharacterId) {
    warnings.push("Geen D&D Beyond character-id in de link gevonden. Gebruik een publieke character-link met /characters/123456.");
  }
  if (importCenter.sourceType === "beyond-url" && !sourceText) {
    warnings.push("Alleen de link is nog niet genoeg als D&D Beyond/CORS automatisch ophalen blokkeert. De app probeert JSON en daarna HTML, maar je kunt ook JSON of pagina-bron plakken.");
  }
  if (sourceText && !fromJson.jsonParsed && Object.values(fromText).filter(Boolean).length < 3) {
    warnings.push("De geplakte tekst lijkt weinig herkenbare character velden te bevatten.");
  }
  if (htmlParsed && Object.values(fromText).filter(Boolean).length >= 3) {
    warnings.push("HTML scraper fallback gebruikt: check vooral AC, HP, spells en gear voordat je toepast.");
  }
  if (!sourceText && importCenter.sourceType !== "beyond-url") {
    warnings.push("Plak JSON of tekst voordat je analyseert.");
  }
  if (importCenter.fetchError) warnings.push(importCenter.fetchError);

  return {
    ...data,
    sourceType: importCenter.sourceType,
    jsonParsed: fromJson.jsonParsed,
    htmlParsed,
    confidence: importConfidence(data, fromJson.jsonParsed, sourceText, beyondCharacterId, url, htmlParsed),
    warnings,
    parsedAt: new Date().toISOString(),
  };
}
