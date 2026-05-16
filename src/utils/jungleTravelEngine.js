import { expandHexRoute, parseHexId } from "../data/systems/chultHexSystem.js";
import { TRAVEL_EVENT_TABLES, TRAVEL_ROLE_LABELS, defaultTravelRoles } from "../data/systems/travelSystem.js";

const PACE_PROFILES = {
  Voorzichtig: { label: "Voorzichtig", progress: 0.85, supplyMultiplier: 0.9, dcModifier: -1 },
  Normaal: { label: "Normaal", progress: 1, supplyMultiplier: 1, dcModifier: 0 },
  Geforceerd: { label: "Geforceerd", progress: 1.25, supplyMultiplier: 1.25, dcModifier: 2 },
};

export const MILES_PER_HEX = 10;
export const KILOMETERS_PER_MILE = 1.60934;

const TERRAIN_PROFILES = {
  settlement: {
    label: "Settlement / kuststad",
    difficulty: "easy",
    travelWeight: 0.45,
    dcModifier: -3,
    supplyCost: 0,
    visibility: "open",
    descriptors: ["stenen straten", "drukke marktwegen", "kustlucht", "beschutte bevoorrading"],
    hazards: ["politieke aandacht", "achtervolgers", "poortcontroles"],
    promptTerrain: "busy tropical port edge, stone streets meeting jungle paths, market awnings, rain channels, coastal humidity",
  },
  coast: {
    label: "Kust / open water",
    difficulty: "normal",
    travelWeight: 0.75,
    dcModifier: -1,
    supplyCost: 0.5,
    visibility: "open",
    descriptors: ["zout water", "mangrove-randen", "rotsige kust", "open zichtlijnen"],
    hazards: ["getijde", "gladde rotsen", "verloren spoor"],
    promptTerrain: "tropical coastline, mangrove roots, wet rocks, tidal pools, broken jungle trail near the shore",
  },
  jungle: {
    label: "Jungle",
    difficulty: "normal",
    travelWeight: 1,
    dcModifier: 1,
    supplyCost: 1,
    visibility: "limited",
    descriptors: ["dicht bladerdak", "modderige paden", "lianen", "vochtige hitte"],
    hazards: ["verdwalen", "insecten", "verborgen roofdieren"],
    promptTerrain: "dense Chultan jungle, muddy trail, thick vines, broad leaves, humid air, broken sight lines",
  },
  denseJungle: {
    label: "Dichte jungle",
    difficulty: "hard",
    travelWeight: 1.25,
    dcModifier: 2,
    supplyCost: 1.25,
    visibility: "heavily limited",
    descriptors: ["verstikkend bladerdak", "nauwe zichtlijnen", "wortelwanden", "zware regen"],
    hazards: ["hinderlaag", "ziekte", "supply loss", "trage voortgang"],
    promptTerrain: "claustrophobic dense jungle, high canopy, root walls, wet ferns, narrow muddy approaches, poor visibility",
  },
  river: {
    label: "Rivier / oversteek",
    difficulty: "hard",
    travelWeight: 1.2,
    dcModifier: 2,
    supplyCost: 1,
    visibility: "mixed",
    descriptors: ["rivierbochten", "drijfhout", "modderbanken", "gladde stenen"],
    hazards: ["oversteek", "stroming", "verloren uitrusting"],
    promptTerrain: "jungle river crossing, muddy banks, slick stones, driftwood, shallow fords, hidden side trails",
  },
  swamp: {
    label: "Moeras",
    difficulty: "brutal",
    travelWeight: 1.55,
    dcModifier: 3,
    supplyCost: 1.5,
    visibility: "obscured",
    descriptors: ["stilstaand water", "zuigende modder", "ziekte-insecten", "rotte wortels"],
    hazards: ["exhaustion", "ziekte", "vastgezogen route", "verloren supplies"],
    promptTerrain: "dangerous tropical swamp, black standing water, sucking mud, rotten roots, half-submerged stones, narrow dry islands",
  },
  mountains: {
    label: "Bergen / kliffen",
    difficulty: "hard",
    travelWeight: 1.4,
    dcModifier: 3,
    supplyCost: 1.1,
    visibility: "high vantage",
    descriptors: ["steile hellingen", "losse stenen", "smalle richels", "uitzicht boven het bladerdak"],
    hazards: ["valgevaar", "lawine-achtig puin", "trage klim"],
    promptTerrain: "jungle mountain foothills, steep wet cliffs, narrow ledges, loose stones, elevated roots, dramatic height changes",
  },
  ruins: {
    label: "Oude Chultaanse ruines",
    difficulty: "hard",
    travelWeight: 1.15,
    dcModifier: 2,
    supplyCost: 1,
    visibility: "broken cover",
    descriptors: ["gebroken reliëfs", "overwoekerde stenen", "oude processieweg", "verzonken tempelresten"],
    hazards: ["vallen", "oude magie", "verborgen clues"],
    promptTerrain: "ancient Chultan ruins swallowed by jungle, broken reliefs, mossy stones, sunken processional path, vine-covered walls",
  },
  firefinger: {
    label: "Firefinger hoogtes",
    difficulty: "brutal",
    travelWeight: 1.45,
    dcModifier: 4,
    supplyCost: 1.25,
    visibility: "vertical",
    descriptors: ["oude signaaltoren", "klifwanden", "hoge nesten", "wind boven het bladerdak"],
    hazards: ["pterafolk scouts", "valgevaar", "verticale hinderlaag"],
    promptTerrain:
      "ancient Chultan signal tower above dense jungle, cliff ledges, wind-scoured stone, high roost platforms, vertical approaches",
  },
};

export const CHULT_TERRAIN_PROFILE_OPTIONS = Object.entries(TERRAIN_PROFILES).map(([id, profile]) => ({
  id,
  label: profile.label,
  difficulty: profile.difficulty,
}));

const TERRAIN_KEYWORDS = [
  { profile: "firefinger", terms: ["firefinger", "pterafolk", "signaaltoren", "tower", "hoogte", "klif", "vertical"] },
  { profile: "settlement", terms: ["port nyanzaru", "stad", "settlement", "merchant", "hub", "port"] },
  { profile: "ruins", terms: ["ruine", "ruins", "mezro", "ancient", "chultaanse", "processieweg", "temple"] },
  { profile: "river", terms: ["river", "rivier", "crossing", "oversteek", "ford"] },
  { profile: "swamp", terms: ["swamp", "moeras", "sinking", "mud", "modder"] },
  { profile: "mountains", terms: ["mountain", "bergen", "cliff", "klif", "foothills", "heights"] },
  { profile: "coast", terms: ["coast", "kust", "bay", "zee", "sea", "shore"] },
  { profile: "denseJungle", terms: ["dense", "dicht", "jungle", "canopy", "bladerdak"] },
];

const TAG_MODIFIERS = [
  { terms: ["thay", "zorath", "red wizard"], dc: 1, risk: 2, hazards: ["Thayaans spoor", "arcane surveillance"] },
  { terms: ["pterafolk"], dc: 1, risk: 2, hazards: ["hoogtehinderlaag", "pterafolk scouts"] },
  { terms: ["undead", "dood", "curse"], dc: 1, risk: 2, hazards: ["necrotische resten", "rusteloze doden"] },
  { terms: ["astral-cradle", "tharizdun"], dc: 1, risk: 3, hazards: ["kosmische echo", "zwarte nacht omen"] },
  { terms: ["azaka"], dc: -1, risk: 0, hazards: [] },
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roleTotal(role) {
  return numeric(role.roll) + numeric(role.modifier);
}

function scoreRoles(roles, dc) {
  return roles.map((role) => {
    const roll = numeric(role.roll);
    const total = roleTotal(role);
    const status =
      roll >= 20 || total >= dc + 5 ? "strong" : total >= dc ? "success" : roll <= 1 || total <= dc - 5 ? "hardFail" : "fail";
    return { ...role, total, label: TRAVEL_ROLE_LABELS[role.id] || role.id, status };
  });
}

function outcomeFromRoles(scoredRoles) {
  const score = scoredRoles.reduce((sum, role) => {
    if (role.status === "strong") return sum + 2;
    if (role.status === "success") return sum + 1;
    if (role.status === "hardFail") return sum - 2;
    return sum - 1;
  }, 0);
  if (score >= 4) return "good";
  if (score >= 0) return "mixed";
  return "bad";
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function compact(values) {
  return values.map((value) => String(value || "").trim()).filter(Boolean);
}

function splitTerms(value) {
  return String(value || "")
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function textForHex(note = {}) {
  return [
    note.title,
    note.terrain,
    note.playerSafe,
    note.dmNotes,
    note.encounterSeed,
    note.mapPromptSeed,
    ...(Array.isArray(note.tags) ? note.tags : []),
  ]
    .join(" ")
    .toLowerCase();
}

function inferProfileId(hexId, note = {}) {
  if (TERRAIN_PROFILES[note.terrainProfileId]) return note.terrainProfileId;

  const parsed = parseHexId(hexId);
  const text = textForHex(note);
  const keywordMatch = TERRAIN_KEYWORDS.find((entry) => entry.terms.some((term) => text.includes(term)));
  if (keywordMatch) return keywordMatch.profile;
  if (!parsed) return "jungle";

  const { column, row } = parsed;
  if (column >= 40 && column <= 44 && row >= 20 && row <= 23) return "settlement";
  if (column >= 42 && column <= 45 && row >= 30 && row <= 34) return "firefinger";
  if (column >= 48 && column <= 52 && row >= 25 && row <= 31) return "ruins";
  if (column >= 28 && column <= 36 && row >= 26 && row <= 37) return "river";
  if (column <= 17 && row <= 20) return "coast";
  if (row >= 41 && row <= 58 && column >= 33 && column <= 53) return "swamp";
  if (column <= 24 && row >= 27 && row <= 58) return "mountains";
  if (row >= 24 && row <= 45) return "denseJungle";
  return "jungle";
}

function applyTagModifiers(base, note = {}) {
  const text = textForHex(note);
  const matched = TAG_MODIFIERS.filter((modifier) => modifier.terms.some((term) => text.includes(term)));
  const dcModifier = matched.reduce((sum, modifier) => sum + modifier.dc, base.dcModifier);
  const risk = matched.reduce((sum, modifier) => sum + modifier.risk, base.risk);
  const hazards = unique([...base.hazards, ...matched.flatMap((modifier) => modifier.hazards)]);
  return { ...base, dcModifier, risk, hazards };
}

export function analyzeChultHex(hexId, notesByHex = {}) {
  const parsed = parseHexId(hexId);
  const safeHex = parsed?.id || "4332";
  const note = notesByHex?.[safeHex] || {};
  const profileId = inferProfileId(safeHex, note);
  const profile = TERRAIN_PROFILES[profileId] || TERRAIN_PROFILES.jungle;
  const tags = Array.isArray(note.tags) ? note.tags : [];
  const enrichedProfile = applyTagModifiers(
    {
      ...profile,
      id: profileId,
      risk: profile.dcModifier + (profile.difficulty === "brutal" ? 3 : profile.difficulty === "hard" ? 2 : 1),
    },
    note
  );

  return {
    hexId: safeHex,
    title: note.title || enrichedProfile.label,
    note,
    terrainId: enrichedProfile.id,
    terrainLabel: note.terrain || enrichedProfile.label,
    difficulty: enrichedProfile.difficulty,
    travelWeight: enrichedProfile.travelWeight,
    dcModifier: enrichedProfile.dcModifier,
    supplyCost: enrichedProfile.supplyCost,
    visibility: enrichedProfile.visibility,
    descriptors: unique([...enrichedProfile.descriptors, ...tags]),
    hazards: enrichedProfile.hazards,
    risk: enrichedProfile.risk,
    promptTerrain: enrichedProfile.promptTerrain,
    playerSafe: note.playerSafe || "",
    dmNotes: note.dmNotes || "",
    encounterSeed: note.encounterSeed || "",
    requiredElements: splitTerms(note.mapPromptSeed),
    tags,
  };
}

export function buildChultRouteAnalysis(chultMap = {}, travelState = {}) {
  const routeWaypoints = Array.isArray(chultMap.routeHexes)
    ? chultMap.routeHexes.map((hexId) => parseHexId(hexId)?.id).filter(Boolean)
    : ["4122", "4332"];
  const routeHexes = expandHexRoute(routeWaypoints);
  const hexes = routeHexes.map((hexId) => analyzeChultHex(hexId, chultMap.notesByHex || {}));
  const travelHexes = hexes.slice(1);
  const pace = PACE_PROFILES[travelState.pace] || PACE_PROFILES.Normaal;
  const travelWeight = travelHexes.reduce((sum, hex) => sum + hex.travelWeight, 0);
  const terrainDc = travelHexes.length
    ? Math.round(travelHexes.reduce((sum, hex) => sum + hex.dcModifier, 0) / travelHexes.length)
    : 0;
  const weatherText = String(travelState.weather || "").toLowerCase();
  const weatherModifier = weatherText.includes("regen") || weatherText.includes("storm") ? 1 : 0;
  const routeRisk = travelHexes.reduce((sum, hex) => sum + hex.risk, 0);
  const suggestedDc = clampNumber(12 + terrainDc + pace.dcModifier + weatherModifier, 8, 24);
  const routeProgressHexIndex = clampNumber(
    Math.floor(numeric(travelState.routeProgressHexIndex ?? travelState.routeProgress)),
    0,
    Math.max(0, routeHexes.length - 1)
  );
  const currentHex =
    hexes[routeProgressHexIndex] ||
    analyzeChultHex(chultMap.selectedHex || routeHexes[0] || "4122", chultMap.notesByHex || {});
  const remainingWeight = hexes.slice(routeProgressHexIndex + 1).reduce((sum, hex) => sum + hex.travelWeight, 0);
  const totalHexes = Math.max(0, routeHexes.length - 1);
  const miles = totalHexes * MILES_PER_HEX;
  const kilometers = Math.round(miles * KILOMETERS_PER_MILE);
  const estimatedDays = totalHexes > 0 ? Math.max(0.5, roundToHalf(travelWeight / pace.progress)) : 0;
  const remainingDays = roundToHalf(Math.max(0, remainingWeight / pace.progress));
  const supplyForecast = Math.ceil(travelHexes.reduce((sum, hex) => sum + hex.supplyCost, 0) * pace.supplyMultiplier);
  const terrainMix = Object.values(
    travelHexes.reduce((acc, hex) => {
      const key = hex.terrainId;
      acc[key] = acc[key] || { id: key, label: TERRAIN_PROFILES[key]?.label || hex.terrainLabel, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {})
  ).map((terrain) => ({
    ...terrain,
    miles: terrain.count * MILES_PER_HEX,
    kilometers: Math.round(terrain.count * MILES_PER_HEX * KILOMETERS_PER_MILE),
  }));

  return {
    routeWaypoints,
    routeHexes,
    hexes,
    currentHex,
    pace,
    routeProgressHexIndex,
    totalHexes,
    miles,
    kilometers,
    distanceLabel: `${miles} mi / ${kilometers} km`,
    travelWeight,
    estimatedDays,
    remainingDays,
    supplyForecast,
    suggestedDc,
    routeRisk,
    terrainMix,
    summary: `${totalHexes} hexes / ${miles} miles / ${kilometers} km / ${estimatedDays} dagen`,
  };
}

function roundToHalf(value) {
  return Math.max(0, Math.round(value * 2) / 2);
}

function buildMapPrompt({ event, currentHex, routeAnalysis, travelState, seed }) {
  const nextHex = routeAnalysis.hexes[routeAnalysis.routeProgressHexIndex + 1] || routeAnalysis.currentHex;
  const travelElements = splitTerms(travelState.promptElements);
  const noteElements = currentHex.requiredElements || [];
  const dmElements = travelState.includeDmInPrompts === false ? [] : [currentHex.encounterSeed, currentHex.dmNotes];
  const requiredElements = unique([
    ...noteElements,
    ...travelElements,
    ...dmElements,
    event.map,
  ]);
  const terrainMix = routeAnalysis.terrainMix
    .map((terrain) => `${terrain.label} ${terrain.count} hexes`)
    .join(", ");
  const promptParts = compact([
    "TRUE TOP-DOWN fantasy battle map for Dungeons & Dragons 5e",
    "Chult jungle expedition",
    currentHex.promptTerrain,
    `terrain identity: ${currentHex.terrainLabel}`,
    nextHex?.hexId !== currentHex.hexId ? `route continues into: ${nextHex.terrainLabel}` : "",
    terrainMix ? `route terrain mix: ${terrainMix}` : "",
    `visibility: ${currentHex.visibility}`,
    travelState.weather ? `weather and mood: ${travelState.weather}` : "",
    `travel event: ${event.map}`,
    requiredElements.length ? `must include: ${requiredElements.join(", ")}` : "",
    currentHex.hazards.length ? `environmental pressure: ${currentHex.hazards.join(", ")}` : "",
    "cinematic dark fantasy color, practical playable terrain, clear paths, elevation cues, rich natural detail",
    "no characters, no text, no labels, no grid",
  ]);

  return {
    prompt: promptParts.join(", "),
    negative_prompt:
      "characters, creatures, miniatures, labels, text, grid, UI, watermark, logo, isometric view, side view, blurry, dark unreadable areas, cropped map edges",
    steps: 30,
    cfg_scale: 7,
    seed,
    source: {
      terrain: currentHex.terrainLabel,
      nextTerrain: nextHex?.terrainLabel || currentHex.terrainLabel,
      difficulty: currentHex.difficulty,
      estimatedRouteDays: routeAnalysis.estimatedDays,
      terrainMix: routeAnalysis.terrainMix,
      dmIncluded: travelState.includeDmInPrompts !== false,
    },
  };
}

function progressForOutcome(outcome, scoredRoles, pace) {
  const guide = scoredRoles.find((role) => role.id === "guide");
  const guideHelp = guide?.status === "strong" ? 0.5 : guide?.status === "success" ? 0.25 : 0;
  const base = outcome === "good" ? 1.25 : outcome === "mixed" ? 1 : guide?.status === "hardFail" ? 0 : 0.5;
  return Math.max(0, Math.round((base + guideHelp) * pace.progress));
}

function supplyCostForOutcome(outcome, scoredRoles, currentHex, pace) {
  const quartermaster = scoredRoles.find((role) => role.id === "quartermaster");
  const base = Math.ceil((1 + currentHex.supplyCost) * pace.supplyMultiplier);
  const penalty = outcome === "bad" ? 1 : 0;
  const save = quartermaster?.status === "strong" ? 1 : 0;
  return Math.max(0, base + penalty - save);
}

export function generateJungleTravelEvent(travelState, chultMap = {}) {
  const routeAnalysis = buildChultRouteAnalysis(chultMap, travelState);
  const dc = travelState.autoRouteDc === false ? numeric(travelState.dc) || routeAnalysis.suggestedDc : routeAnalysis.suggestedDc;
  const scoredRoles = scoreRoles(travelState.roles || [], dc);
  const outcome = outcomeFromRoles(scoredRoles);
  const event = randomItem(TRAVEL_EVENT_TABLES[outcome]);
  const weakRoles = scoredRoles.filter((role) => role.status === "fail" || role.status === "hardFail");
  const strongRoles = scoredRoles.filter((role) => role.status === "success" || role.status === "strong");
  const pressureRole = weakRoles[0] || [...scoredRoles].sort((a, b) => a.total - b.total)[0];
  const spotlightRole = strongRoles[0] || [...scoredRoles].sort((a, b) => b.total - a.total)[0];
  const seed = Math.floor(Math.random() * 900000) + 100000;
  const progressGain = progressForOutcome(outcome, scoredRoles, routeAnalysis.pace);
  const nextRouteIndex = clampNumber(
    routeAnalysis.routeProgressHexIndex + progressGain,
    0,
    Math.max(0, routeAnalysis.routeHexes.length - 1)
  );
  const supplyCost = supplyCostForOutcome(outcome, scoredRoles, routeAnalysis.currentHex, routeAnalysis.pace);
  const suppliesAfter = Math.max(0, numeric(travelState.supplies) - supplyCost);
  const discoveredHexes = routeAnalysis.routeHexes.slice(0, nextRouteIndex + 1);
  const arrived = nextRouteIndex >= routeAnalysis.routeHexes.length - 1;
  const contextLine = `${routeAnalysis.currentHex.terrainLabel}: ${routeAnalysis.currentHex.descriptors.slice(0, 3).join(", ")}.`;

  return {
    id: `travel-${Date.now()}`,
    createdAt: new Date().toISOString(),
    routeName: travelState.routeName,
    region: travelState.region,
    pace: travelState.pace,
    day: numeric(travelState.day) || 1,
    dc,
    currentHex: routeAnalysis.currentHex.hexId,
    currentTerrain: routeAnalysis.currentHex.terrainLabel,
    outcome,
    title: event.title,
    pressure: event.pressure,
    readAloud: `${contextLine} ${event.playerSafe}`,
    playerSafe: `${contextLine} ${event.playerSafe}`,
    dmOnly: `${event.dmOnly} Routecontext: ${routeAnalysis.currentHex.dmNotes || routeAnalysis.currentHex.hazards.join(", ")}.`,
    mechanics: `${event.mechanics} Progress: +${progressGain} route hex(es). Supplies -${supplyCost}. ${arrived ? "Doel bereikt of binnen zicht." : "Expeditie beweegt door."}`,
    clue: event.clue,
    pressureRole: pressureRole ? `${pressureRole.label}: ${pressureRole.character || "onbekend"} (${pressureRole.total})` : "",
    spotlightRole: spotlightRole ? `${spotlightRole.label}: ${spotlightRole.character || "onbekend"} (${spotlightRole.total})` : "",
    scoredRoles,
    routeImpact: {
      progressGain,
      nextRouteIndex,
      supplyCost,
      suppliesAfter,
      arrived,
      discoveredHexes,
      remainingDays: routeAnalysis.remainingDays,
    },
    routeAnalysis: {
      summary: routeAnalysis.summary,
      suggestedDc: routeAnalysis.suggestedDc,
      estimatedDays: routeAnalysis.estimatedDays,
      remainingDays: routeAnalysis.remainingDays,
      supplyForecast: routeAnalysis.supplyForecast,
      miles: routeAnalysis.miles,
      kilometers: routeAnalysis.kilometers,
      distanceLabel: routeAnalysis.distanceLabel,
      terrainMix: routeAnalysis.terrainMix,
    },
    travelPatch: {
      day: (numeric(travelState.day) || 1) + 1,
      dc,
      routeProgressHexIndex: nextRouteIndex,
      routeProgress: nextRouteIndex,
      supplies: suppliesAfter,
    },
    mapPrompt: buildMapPrompt({ event, currentHex: routeAnalysis.currentHex, routeAnalysis, travelState, seed }),
  };
}

const TRAVEL_ENCOUNTER_TEMPLATES = [
  {
    id: "pterafolk",
    terms: ["pterafolk", "bladerdak", "canopy", "scout", "krijs-signaal"],
    encounterName: "Pterafolk canopy ambush",
    enemyName: "Pterafolk scout",
    role: "Artillery / skirmisher",
    ac: 13,
    hp: 26,
    dexMod: 2,
    objective: "Overleef de openingshinderlaag en voorkom dat een scout alarm slaat richting Firefinger.",
    timer: "Na ronde 4 klinkt een krijs-signaal; Firefinger alert stijgt als niemand ingrijpt.",
    lairActionName: "Canopy gusts op initiative 20",
    tactics: "Start verborgen of op hoogte. Laat minimaal een vijand disengage of wegvliegen als alarmdrager.",
  },
  {
    id: "thay",
    terms: ["thay", "thayaans", "red wizard", "zorath", "meetcirkel", "conjuration", "arcane"],
    encounterName: "Thayan field probe",
    enemyName: "Thayan echo",
    role: "Controller / artillery",
    ac: 12,
    hp: 18,
    dexMod: 1,
    objective: "Verstoor de arcane meting voordat Zorath genoeg informatie krijgt over de party-route.",
    timer: "Elke ronde op initiative 20 laadt de meetcirkel; bij 3 ladingen stijgt de Thay clock.",
    lairActionName: "Meetcirkel pulse op initiative 20",
    tactics: "Gebruik forced movement, spiegelbeelden en cover. Deze vijand hoeft niet te winnen, alleen data te stelen.",
  },
  {
    id: "mud",
    terms: ["modder", "mud", "sink", "moeras", "swamp", "ziekte", "exhaustion"],
    encounterName: "Living mud hazard",
    enemyName: "Grasping mud mass",
    role: "Controller / hazard",
    ac: 11,
    hp: 22,
    dexMod: -1,
    objective: "Haal iedereen uit de gevaarlijke grond met zo min mogelijk supply loss.",
    timer: "Bij elke ronde na ronde 2 trekt het terrein een supply pack of losse gear omlaag.",
    lairActionName: "Zuigende grond op initiative 20",
    tactics: "Gebruik grappled/restrained als terreinstatus. Maak het een rescue scene, niet alleen damage.",
  },
  {
    id: "ruins",
    terms: ["ruine", "ruins", "reli", "stenen", "temple", "ancient", "chultaanse"],
    encounterName: "Ancient ruin defense",
    enemyName: "Animated ruin shard",
    role: "Soldier / controller",
    ac: 14,
    hp: 24,
    dexMod: 0,
    objective: "Lees of veilig passeer de ruine zonder de oude verdediging volledig wakker te maken.",
    timer: "Elke mislukte Arcana/History/Investigation check activeert extra terreinruk of falling stone.",
    lairActionName: "Oude reliefs op initiative 20",
    tactics: "Laat slimme checks schade voorkomen. Beloning is een clue, niet alleen loot.",
  },
  {
    id: "jungle",
    terms: ["jungle", "hinderlaag", "ambush", "roof", "predator", "trail"],
    encounterName: "Jungle pressure encounter",
    enemyName: "Jungle ambusher",
    role: "Skirmisher",
    ac: 12,
    hp: 16,
    dexMod: 2,
    objective: "Hou routeformatie intact en bescherm de zwakste expeditierol.",
    timer: "Na ronde 3 raakt de route verspreid; Scout of Guide moet de groep herpakken.",
    lairActionName: "Dichte jungle op initiative 20",
    tactics: "Gebruik cover, split pressure en korte zichtlijnen. Laat succes tempo besparen.",
  },
];

export function buildTravelInitiativeSeed(event = {}, existingPartyTurns = []) {
  const primaryText = [
    event.title,
    event.currentTerrain,
    event.pressure,
    event.mechanics,
    event.clue,
  ]
    .join(" ")
    .toLowerCase();
  const contextText = [
    event.dmOnly,
    event.mapPrompt?.prompt,
  ]
    .join(" ")
    .toLowerCase();
  const template =
    TRAVEL_ENCOUNTER_TEMPLATES.find((candidate) => candidate.terms.some((term) => primaryText.includes(term))) ||
    TRAVEL_ENCOUNTER_TEMPLATES.find((candidate) => candidate.terms.some((term) => contextText.includes(term))) ||
    TRAVEL_ENCOUNTER_TEMPLATES.find((candidate) => candidate.id === "jungle");
  const enemyCount = event.outcome === "bad" ? 3 : event.outcome === "mixed" ? 2 : 1;
  const hiddenFromPlayers = event.outcome !== "good";
  const enemies = Array.from({ length: enemyCount }).map((_, index) => ({
    id: `travel-enemy-${event.id || Date.now()}-${index}`,
    name: enemyCount > 1 ? `${template.enemyName} ${index + 1}` : template.enemyName,
    side: "enemy",
    role: template.role,
    initiative: 12 - index * 2,
    dexMod: template.dexMod,
    ac: template.ac,
    hp: template.hp,
    maxHp: template.hp,
    tempHp: 0,
    conditions: [],
    concentration: false,
    reactionUsed: false,
    legendaryActions: 0,
    lairAction: false,
    hiddenFromPlayers,
    notes: [
      template.tactics,
      event.pressure,
      event.mechanics,
      event.clue ? `Clue inzet: ${event.clue}` : "",
      event.pressureRole ? `Druk op rol: ${event.pressureRole}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  }));

  return {
    encounterName: event.title || template.encounterName,
    round: 1,
    activeIndex: 0,
    objective: template.objective,
    timer: template.timer,
    lairActionName: template.lairActionName,
    participants: [...existingPartyTurns, ...enemies],
    logLine: `Travel encounter seed: ${template.encounterName}`,
  };
}

export { TRAVEL_ROLE_LABELS as roleLabels, defaultTravelRoles };
