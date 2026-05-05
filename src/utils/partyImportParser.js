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

function extractLine(text, labels = []) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = text.match(new RegExp(`(?:^|\\n)\\s*(?:${escaped})\\s*:?\\s*(.+)`, "i"));
  return clean(match?.[1] || "");
}

function extractBlock(text, labels = []) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const stop =
    "Name|Naam|Class|Klasse|Race|Species|Soort|Level|AC|Armor Class|HP|Hit Points|Passive Perception|Spell Save DC|Gear|Items|Equipment|Notes|Notities";
  const match = text.match(
    new RegExp(`(?:^|\\n)\\s*(?:${escaped})\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${stop})\\s*:|$)`, "i")
  );
  return clean(match?.[1] || "");
}

function parseBeyondCharacterId(url = "") {
  return clean(url).match(/characters\/(\d+)/i)?.[1] || "";
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
      const level = entry.level || entry.classLevel;
      return name ? `${name}${level ? ` ${level}` : ""}` : "";
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

function parseJsonImport(sourceText = "") {
  try {
    const parsed = JSON.parse(sourceText);
    const data = parsed.data || parsed.character || parsed;
    const race = firstDefined(
      findByPath(data, "race.fullName"),
      findByPath(data, "race.name"),
      findByPath(data, "species.fullName"),
      findByPath(data, "species.name"),
      findDeep(data, ["raceName", "speciesName"])
    );
    const gearList = firstDefined(findDeep(data, ["inventory"]), findDeep(data, ["equipment"]), []);
    const gear = Array.isArray(gearList)
      ? gearList
          .map((item) => findByPath(item, "definition.name") || item.name || item.label)
          .filter(Boolean)
          .slice(0, 30)
          .join(", ")
      : "";

    return {
      data: {
        name: firstDefined(data.name, findDeep(data, ["characterName"])),
        classSummary: classSummaryFromJson(data),
        level: firstDefined(totalLevelFromJson(data), findDeep(data, ["level"])),
        race,
        ac: firstDefined(findDeep(data, ["armorClass", "ac"]), ""),
        maxHp: firstDefined(findDeep(data, ["maxHp", "hitPointMaximum", "overrideHitPoints", "baseHitPoints"]), ""),
        passivePerception: firstDefined(findDeep(data, ["passivePerception"]), ""),
        spellSaveDc: firstDefined(findDeep(data, ["spellSaveDc", "spellSaveDC"]), ""),
        gear,
      },
      jsonParsed: true,
    };
  } catch {
    return { data: {}, jsonParsed: false };
  }
}

function parseTextImport(sourceText = "") {
  const text = clean(sourceText);
  const gear = extractBlock(text, ["Gear", "Items", "Equipment", "Uitrusting"]);
  return {
    name: extractLine(text, ["Name", "Naam", "Character"]),
    classSummary: extractLine(text, ["Class", "Klasse"]),
    level: toNumber(extractLine(text, ["Level", "Lvl"])),
    race: extractLine(text, ["Race", "Species", "Soort"]),
    ac: toNumber(extractLine(text, ["AC", "Armor Class"])),
    maxHp: toNumber(extractLine(text, ["HP", "Hit Points", "Max HP"])),
    passivePerception: toNumber(extractLine(text, ["Passive Perception", "Passieve Perceptie"])),
    spellSaveDc: toNumber(extractLine(text, ["Spell Save DC", "Spell DC"])),
    gear,
    notes: extractBlock(text, ["Notes", "Notities"]),
  };
}

export function parsePartyImport(importCenter = {}) {
  const sourceText = clean(importCenter.sourceText);
  const url = clean(importCenter.url);
  const warnings = [];
  const fromJson = sourceText ? parseJsonImport(sourceText) : { data: {}, jsonParsed: false };
  const fromText = sourceText && !fromJson.jsonParsed ? parseTextImport(sourceText) : {};
  const beyondCharacterId = parseBeyondCharacterId(url);
  const data = { ...fromText, ...fromJson.data };

  if (importCenter.sourceType === "beyond-url" && !beyondCharacterId) {
    warnings.push("Geen D&D Beyond character-id in de link gevonden. Bewaar de URL alsnog als referentie.");
  }
  if (sourceText && !fromJson.jsonParsed && Object.values(fromText).filter(Boolean).length < 3) {
    warnings.push("De geplakte tekst lijkt weinig herkenbare character velden te bevatten.");
  }
  if (!sourceText && importCenter.sourceType !== "beyond-url") {
    warnings.push("Plak JSON of tekst voordat je analyseert.");
  }

  const filled = Object.values(data).filter(Boolean).length + (beyondCharacterId ? 1 : 0) + (url ? 1 : 0);
  const confidence = Math.min(96, Math.max(20, filled * 11 + (fromJson.jsonParsed ? 16 : 0)));

  return {
    ...data,
    beyondUrl: url,
    beyondCharacterId,
    sourceType: importCenter.sourceType,
    confidence,
    warnings,
    parsedAt: new Date().toISOString(),
  };
}
