function clean(value = "") {
  return String(value).replace(/\r/g, "").trim();
}

function stripMarkdown(value = "") {
  return clean(value)
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/^[-*]\s*/, "")
    .trim();
}

function slug(value = "item") {
  return (
    stripMarkdown(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 56) || "item"
  );
}

function compact(value = "", max = 220) {
  const text = clean(value).replace(/\s+/g, " ");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}...`;
}

function splitBullets(value = "") {
  return clean(value)
    .split(/\n+/)
    .map((line) => stripMarkdown(line))
    .filter(Boolean);
}

function extractField(content = "", labels = []) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const allLabels =
    "Doel|Goal|Conflict|Clue|Clues|Secrets?|Secret|Player-safe|Player safe|DM-only|DM only|Read-aloud|Read aloud|Boxed text|NPCs?|Encounter|Loot|Handout|Mogelijke spelerkeuzes|Choices|Objective|Terrain|Timer";
  const regex = new RegExp(
    `(?:^|\\n)\\s*(?:[-*]\\s*)?(?:\\*\\*)?(?:${escaped})(?:\\*\\*)?\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:[-*]\\s*)?(?:\\*\\*)?(?:${allLabels})(?:\\*\\*)?\\s*:|\\n\\s*#{1,4}\\s+|$)`,
    "i"
  );
  return clean(content.match(regex)?.[1] || "");
}

function sectionKind(title = "") {
  const value = stripMarkdown(title).toLowerCase();
  if (/^scene\b/.test(value)) return "Scene";
  if (/^npc\b|belangrijke npc/.test(value)) return "NPC";
  if (/^encounter\b|combat\b/.test(value)) return "Encounter";
  if (/^handout\b|brief\b|letter\b/.test(value)) return "Handout";
  if (/^loot\b|treasure\b|magic item/.test(value)) return "Loot";
  if (/^clue\b|secret\b/.test(value)) return "Clue";
  if (/^act\b|arc\b/.test(value)) return "Act";
  return "Document";
}

export function parseSessionDocumentSections(text = "") {
  const source = clean(text);
  if (!source) return [];

  const headingPattern = /^(#{1,4})\s+(.+)$/gm;
  const matches = [...source.matchAll(headingPattern)];

  if (!matches.length) {
    return [
      {
        id: "document-loose",
        kind: "Document",
        title: "Losse import",
        content: source,
        text: source,
      },
    ];
  }

  return matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    const title = stripMarkdown(match[2]);
    const content = clean(source.slice(start, end));
    return {
      id: `${sectionKind(title).toLowerCase()}-${slug(title)}-${index}`,
      level: match[1].length,
      kind: sectionKind(title),
      title,
      content,
      text: `${title}\n${content}`,
    };
  });
}

export function parsePrepOutput(text = "") {
  const sections = parseSessionDocumentSections(text);
  const scenes = sections
    .filter((section) => section.kind === "Scene")
    .map((section, index) => {
      const title = section.title.replace(/^Scene\s*\d*\s*:?\s*/i, "") || `Scene ${index + 1}`;
      const clueBlock = extractField(section.content, ["Clues", "Clue", "Secrets", "Secret"]);
      return {
        id: section.id,
        title: `Scene ${index + 1} - ${title}`,
        type: "AI import",
        goal: extractField(section.content, ["Doel", "Goal"]) || compact(section.content, 140),
        conflict: extractField(section.content, ["Conflict"]) || "Kies aan tafel welke druk nu het interessantst voelt.",
        readAloud:
          extractField(section.content, ["Read-aloud", "Read aloud", "Boxed text"]) ||
          extractField(section.content, ["Tafelopening"]) ||
          "",
        clues: splitBullets(clueBlock).length ? splitBullets(clueBlock) : [],
        dmOnly: extractField(section.content, ["DM-only", "DM only", "Secret", "Secrets"]) || "",
        playerSafe:
          extractField(section.content, ["Player-safe", "Player safe"]) ||
          "Nog niet opgeschoond voor Player View.",
        linked: [],
        source: "import",
      };
    });

  const cards = sections
    .filter((section) => ["NPC", "Encounter", "Handout", "Loot", "Clue", "Act"].includes(section.kind))
    .map((section) => ({
      id: section.id,
      type: section.kind,
      title: section.title,
      summary: compact(section.content || section.title, 180),
      visibility: /player-safe|safe-to-show|handout|publiceerbaar/i.test(section.text)
        ? "player-ready"
        : /dm-only|spoiler|secret/i.test(section.text)
          ? "gm"
          : "review",
    }));

  return { sections, scenes, cards };
}

export function analyzePrepQuality(text = "") {
  const parsed = parsePrepOutput(text);
  const warnings = [];
  const canonRisks = scanCanonRisks(text);
  const sceneCount = parsed.scenes.length;
  const hasPlayerSafe = /player-safe|player safe/i.test(text);
  const hasDmOnly = /dm-only|dm only|secret/i.test(text);
  const hasReadAloud = /read-aloud|read aloud|boxed text|tafelopening/i.test(text);
  const hasEncounter = parsed.cards.some((card) => card.type === "Encounter");

  if (!sceneCount) warnings.push("Geen duidelijke scene-koppen gevonden.");
  if (!hasPlayerSafe) warnings.push("Player-safe velden ontbreken of zijn niet consequent gelabeld.");
  if (!hasDmOnly) warnings.push("DM-only/secrets zijn niet duidelijk gescheiden.");
  if (!hasReadAloud) warnings.push("Read-aloud of tafelopening ontbreekt.");
  if (!hasEncounter) warnings.push("Geen encounter-blokken herkend.");
  canonRisks.forEach((risk) => warnings.push(risk.summary));

  const score = Math.max(20, 100 - warnings.length * 16);
  return {
    score,
    label: score >= 85 ? "sterk" : score >= 65 ? "bruikbaar" : "rommelig",
    warnings,
    canonRisks,
    counts: {
      scenes: sceneCount,
      npcs: parsed.cards.filter((card) => card.type === "NPC").length,
      encounters: parsed.cards.filter((card) => card.type === "Encounter").length,
      handouts: parsed.cards.filter((card) => card.type === "Handout").length,
      loot: parsed.cards.filter((card) => card.type === "Loot").length,
    },
  };
}

export function scanCanonRisks(text = "") {
  const value = clean(text);
  const lower = value.toLowerCase();
  const risks = [];

  function add(id, severity, summary, detail) {
    risks.push({ id, severity, summary, detail });
  }

  if (/astral cradle/i.test(value) && !/dm-only|dm only|secret/i.test(value.slice(Math.max(0, lower.indexOf("astral cradle") - 160), lower.indexOf("astral cradle") + 220))) {
    add(
      "astral-cradle-leak",
      "hoog",
      "Canon risico: Astral Cradle lijkt buiten DM-only te lekken.",
      "De party kent de naam Astral Cradle nog niet. Zet dit expliciet onder DM-only of herformuleer player-safe."
    );
  }

  if (/sparkwing/i.test(value) && /(leeft|alive|returns|terugkeert|resurrect|herrijst|verschijnt)/i.test(value)) {
    add(
      "sparkwing-alive",
      "hoog",
      "Canon risico: Sparkwing wordt mogelijk als levend beschreven.",
      "Sparkwing is dood. Gebruik hem alleen historisch, symbolisch of na expliciete DM-keuze."
    );
  }

  if (/johan/i.test(value) && /(party|groep|expeditie|jungle|meereist|travels|with them)/i.test(value)) {
    add(
      "johan-location",
      "middel",
      "Canon risico: Johan lijkt met de party mee te reizen.",
      "Johan is op Dragon's Rest gebleven om op te bouwen."
    );
  }

  if (/azari/i.test(value) && /(player character|pc\b|speler|party member|speelbaar)/i.test(value)) {
    add(
      "azari-pc",
      "hoog",
      "Canon risico: Azari lijkt als player character behandeld.",
      "Azari is nu een Tharizdun-aligned NPC en morele wildcard."
    );
  }

  if (/william/i.test(value) && /(red eye|rood oog|rode oog|red glow)/i.test(value)) {
    add(
      "william-eye",
      "middel",
      "Canon risico: William's oogkleur klopt mogelijk niet.",
      "William heeft een toxic green rechteroog met crack-like scars, niet rood."
    );
  }

  if (/(cassian|zorath)/i.test(value) && /(is dead|is dood|gedood|killed|overleden)/i.test(value)) {
    add(
      "villain-death",
      "middel",
      "Canon risico: Cassian of Zorath wordt mogelijk als dood beschreven.",
      "Beiden zijn alive/at large tenzij jij expliciet anders beslist."
    );
  }

  return risks;
}

export function buildRepairPrompt(text = "", quality = analyzePrepQuality(text)) {
  return [
    "Herformatteer onderstaande D&D 5e sessieprep zodat mijn DM Companion hem betrouwbaar kan lezen.",
    "Wijzig geen canon, NPC-namen, clues, loot of gebeurtenissen. Repareer alleen structuur en labels.",
    "",
    "Verplicht format:",
    "- Gebruik '## Scene: Titel' voor elke scene.",
    "- Gebruik per scene exact: 'Doel:', 'Conflict:', 'Read-aloud:', 'Clues:', 'Player-safe:', 'DM-only:'.",
    "- Gebruik '## NPC: Naam' met role, wants, fear, secret, player-safe.",
    "- Gebruik '## Encounter: Naam' met objective, terrain, timer, monsters.",
    "- Gebruik '## Handout: Titel' en label visibility als player-safe of DM-only.",
    "- Gebruik '## Loot: Titel' met eigenaar, status en player-safe.",
    "- Geen tabellen.",
    "",
    "Huidige waarschuwingen:",
    ...(quality.warnings.length ? quality.warnings.map((warning) => `- ${warning}`) : ["- Geen, normaliseer toch het format."]),
    "",
    "Brontekst:",
    text,
  ].join("\n");
}
