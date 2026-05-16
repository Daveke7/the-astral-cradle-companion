import { expandHexRoute, getNeighborHexIds, parseHexId } from "../data/systems/chultHexSystem.js";
import {
  TRAVEL_BACKUP_ENCOUNTER_TABLES,
  TRAVEL_EVENT_TABLES,
  TRAVEL_RESOURCE_DEFAULTS,
  TRAVEL_ROLE_LABELS,
  TOA_WILDERNESS_COLUMNS,
  TOA_WILDERNESS_ENCOUNTERS,
  defaultTravelRoles,
} from "../data/systems/travelSystem.js";
import { getToaEncounterDetail } from "../data/systems/toaEncounterDetails.js";

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

function parseRange(range) {
  const value = String(range || "").trim();
  if (!value) return null;
  const [rawMin, rawMax = rawMin] = value.split("-");
  const min = Number(rawMin === "00" ? 100 : rawMin);
  const max = Number(rawMax === "00" ? 100 : rawMax);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

function inRange(roll, range) {
  const parsed = parseRange(range);
  return parsed ? roll >= parsed.min && roll <= parsed.max : false;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeResources(resources = {}) {
  return {
    ...TRAVEL_RESOURCE_DEFAULTS,
    ...(resources && typeof resources === "object" ? resources : {}),
    partySize: Math.max(1, numeric(resources.partySize) || TRAVEL_RESOURCE_DEFAULTS.partySize),
    water: Math.max(0, numeric(resources.water ?? TRAVEL_RESOURCE_DEFAULTS.water)),
    rations: Math.max(0, numeric(resources.rations ?? TRAVEL_RESOURCE_DEFAULTS.rations)),
    insectRepellent: Math.max(0, numeric(resources.insectRepellent ?? TRAVEL_RESOURCE_DEFAULTS.insectRepellent)),
    raincatchers: Math.max(0, numeric(resources.raincatchers ?? TRAVEL_RESOURCE_DEFAULTS.raincatchers)),
    waterPerPerson: Math.max(0, numeric(resources.waterPerPerson ?? TRAVEL_RESOURCE_DEFAULTS.waterPerPerson)),
    rationsPerPerson: Math.max(0, numeric(resources.rationsPerPerson ?? TRAVEL_RESOURCE_DEFAULTS.rationsPerPerson)),
    useInsectRepellent: resources.useInsectRepellent !== false,
  };
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

export function buildTravelResourceForecast(travelState = {}, routeAnalysisInput = null, scoredRoles = []) {
  const routeAnalysis = routeAnalysisInput || buildChultRouteAnalysis({}, travelState);
  const resources = normalizeResources(travelState.resources);
  const weatherText = String(travelState.weather || "").toLowerCase();
  const rainy = weatherText.includes("regen") || weatherText.includes("rain") || weatherText.includes("storm");
  const forcedPace = travelState.pace === "Geforceerd";
  const quartermaster = scoredRoles.find((role) => role.id === "quartermaster");
  const waterBase = Math.ceil(resources.partySize * resources.waterPerPerson);
  const waterPacePenalty = forcedPace ? Math.ceil(resources.partySize * 0.5) : 0;
  const terrainWaterPenalty = ["swamp", "mountains", "firefinger"].includes(routeAnalysis.currentHex?.terrainId) ? 1 : 0;
  const waterRainGain = rainy ? Math.min(waterBase, resources.raincatchers * 2) : 0;
  const quartermasterSave = quartermaster?.status === "strong" ? 1 : 0;
  const waterUsed = Math.max(0, waterBase + waterPacePenalty + terrainWaterPenalty - waterRainGain - quartermasterSave);
  const rationsUsed = Math.max(0, Math.ceil(resources.partySize * resources.rationsPerPerson) - (quartermaster?.status === "success" || quartermaster?.status === "strong" ? 1 : 0));
  const repellentUsed = resources.useInsectRepellent && ["jungle", "denseJungle", "swamp", "river"].includes(routeAnalysis.currentHex?.terrainId) ? 1 : 0;
  const after = {
    ...resources,
    water: Math.max(0, resources.water - waterUsed),
    rations: Math.max(0, resources.rations - rationsUsed),
    insectRepellent: Math.max(0, resources.insectRepellent - repellentUsed),
  };
  const warnings = [
    resources.water < waterUsed ? "Watertekort: exhaustion pressure of trager tempo." : "",
    resources.rations < rationsUsed ? "Rationtekort: long rest of morale onder druk." : "",
    repellentUsed && resources.insectRepellent < repellentUsed ? "Geen insect repellent: ziekte/insect pressure." : "",
    forcedPace ? "Geforceerd tempo verhoogt waterverbruik." : "",
  ].filter(Boolean);

  return {
    before: resources,
    after,
    waterUsed,
    rationsUsed,
    repellentUsed,
    waterRainGain,
    rainy,
    warnings,
    summary: `Water -${waterUsed}, rations -${rationsUsed}, repellent -${repellentUsed}.${warnings.length ? ` ${warnings[0]}` : ""}`,
  };
}

export function buildToaMovementForecast(travelState = {}, routeAnalysisInput = null) {
  const routeAnalysis = routeAnalysisInput || buildChultRouteAnalysis({}, travelState);
  const mode = travelState.transportMode || "foot";
  const pace = travelState.pace || "Normaal";
  const terrain = routeAnalysis.currentHex?.terrainId || "jungle";
  const isRiverOrLake = terrain === "river" || String(routeAnalysis.currentHex?.terrainLabel || "").toLowerCase().includes("lake");
  const isSwamp = terrain === "swamp";
  const normalHexes = mode === "flying30" ? 3 : mode === "canoe" && isRiverOrLake ? 2 : 1;
  const adjustedNormal = mode === "canoe" && isSwamp ? 1 : normalHexes;
  const label =
    mode === "flying30"
      ? "Flying 30 ft: ongeveer 4 miles per uur"
      : pace === "Geforceerd"
        ? `${adjustedNormal} hex + d4 kans op +1`
        : pace === "Voorzichtig"
          ? `${Math.max(0, adjustedNormal - 1)}-${adjustedNormal} hex, stealth mogelijk`
          : `${adjustedNormal} hex per dag`;
  const perceptionPenalty = pace === "Geforceerd" ? -5 : 0;
  const navigationModifier = pace === "Voorzichtig" ? 5 : pace === "Geforceerd" ? -5 : 0;

  return {
    mode,
    pace,
    baseHexes: adjustedNormal,
    label,
    miles: adjustedNormal * MILES_PER_HEX,
    kilometers: Math.round(adjustedNormal * MILES_PER_HEX * KILOMETERS_PER_MILE),
    perceptionPenalty,
    navigationModifier,
  };
}

function toaNavigationDc(currentHex = {}) {
  return currentHex.terrainId === "coast" || currentHex.terrainId === "settlement" ? 10 : 15;
}

function directionLabel(fromHex, toHex) {
  const from = parseHexId(fromHex);
  const to = parseHexId(toHex);
  if (!from || !to) return "onbekend";
  const dc = to.column - from.column;
  const dr = to.row - from.row;
  if (dc === 0 && dr < 0) return "noord";
  if (dc === 0 && dr > 0) return "zuid";
  if (dc < 0 && dr <= 0) return "noordwest";
  if (dc < 0) return "zuidwest";
  if (dc > 0 && dr <= 0) return "noordoost";
  return "zuidoost";
}

export function rollTravelLostCheck(travelState = {}, chultMap = {}) {
  const routeAnalysis = buildChultRouteAnalysis(chultMap, travelState);
  const movement = buildToaMovementForecast(travelState, routeAnalysis);
  const dc = toaNavigationDc(routeAnalysis.currentHex);
  const guide = (travelState.roles || []).find((role) => role.id === "guide") || {};
  const roll = numeric(guide.roll);
  const total = roleTotal(guide) + movement.navigationModifier;
  const intendedHex = routeAnalysis.routeHexes[routeAnalysis.routeProgressHexIndex + 1] || routeAnalysis.currentHex.hexId;
  const neighbors = getNeighborHexIds(routeAnalysis.currentHex.hexId);
  const driftOptions = neighbors.filter((hexId) => hexId !== intendedHex);
  const driftHex = randomItem(driftOptions.length ? driftOptions : neighbors) || routeAnalysis.currentHex.hexId;
  const success = roll >= 20 || total >= dc;

  return {
    id: `lost-${Date.now()}`,
    checkedAt: new Date().toISOString(),
    active: !success,
    success,
    dc,
    paceModifier: movement.navigationModifier,
    navigator: guide.character || "Guide",
    roll,
    total,
    fromHex: routeAnalysis.currentHex.hexId,
    intendedHex,
    driftHex: success ? "" : driftHex,
    driftDirection: success ? "" : directionLabel(routeAnalysis.currentHex.hexId, driftHex),
    message: success
      ? `${guide.character || "De guide"} houdt de route vast. De party blijft op koers naar ${intendedHex}.`
      : `${guide.character || "De guide"} mist de subtiele afslag. De party drijft ${directionLabel(routeAnalysis.currentHex.hexId, driftHex)} richting hex ${driftHex}.`,
  };
}

function tableForTerrain(terrainId = "jungle") {
  if (TRAVEL_BACKUP_ENCOUNTER_TABLES[terrainId]) return TRAVEL_BACKUP_ENCOUNTER_TABLES[terrainId];
  if (terrainId === "settlement") return TRAVEL_BACKUP_ENCOUNTER_TABLES.coast;
  return TRAVEL_BACKUP_ENCOUNTER_TABLES.jungle;
}

function inferToaColumn(routeAnalysis, travelState = {}) {
  if (travelState.backupEncounter?.tableColumn) return travelState.backupEncounter.tableColumn;
  const terrainId = routeAnalysis.currentHex?.terrainId || "jungle";
  if (terrainId === "coast" || terrainId === "settlement") return "beach";
  if (terrainId === "mountains" || terrainId === "firefinger") return "mountains";
  if (terrainId === "river") return "rivers";
  if (terrainId === "ruins") return "ruins";
  if (terrainId === "swamp") return "swamp";
  return "jungleNoUndead";
}

function rowsForToaColumn(column) {
  return TOA_WILDERNESS_ENCOUNTERS
    .filter((entry) => entry[column])
    .map((entry) => ({ ...entry, range: entry[column] }));
}

export function rollTravelBackupEncounter(travelState = {}, chultMap = {}) {
  const routeAnalysis = buildChultRouteAnalysis(chultMap, travelState);
  const dayPart = travelState.backupEncounter?.dayPart || "Ochtend";
  const tableMode = travelState.backupEncounter?.tableMode || "toa";

  if (tableMode === "toa") {
    const tableColumn = inferToaColumn(routeAnalysis, travelState);
    const encounterCheck = Math.floor(Math.random() * 20) + 1;
    const threshold = clampNumber(numeric(travelState.backupEncounter?.threshold) || 16, 1, 20);
    const rows = rowsForToaColumn(tableColumn);
    const percentileRoll = Math.floor(Math.random() * 100) + 1;
    const entry = rows.find((row) => inRange(percentileRoll, row.range));
    const columnLabel = TOA_WILDERNESS_COLUMNS.find((column) => column.id === tableColumn)?.label || tableColumn;
    const detail = entry ? getToaEncounterDetail(entry.name) : null;

    return {
      id: `toa-encounter-${Date.now()}`,
      tableMode,
      rolledAt: new Date().toISOString(),
      dayPart,
      tableColumn,
      terrainId: routeAnalysis.currentHex.terrainId,
      terrainLabel: columnLabel,
      encounterCheck,
      threshold,
      occurs: encounterCheck >= threshold,
      roll: percentileRoll,
      range: entry?.range || "",
      title: entry?.name || "Geen match",
      type: "ToA Wilderness d100",
      detail,
      pressure: encounterCheck >= threshold
        ? `${columnLabel}: d100 ${percentileRoll} -> ${entry?.name || "geen match"}.`
        : `Geen random encounter. d20 ${encounterCheck} is lager dan ${threshold}.`,
      setup: encounterCheck >= threshold
        ? detail?.preview || "Open de detailkaart hieronder voor de encountertekst."
        : "Geen encounter deze periode. Houd alleen sfeer, sporen of resource pressure over.",
    };
  }

  const terrainId = travelState.backupEncounter?.terrainId || routeAnalysis.currentHex.terrainId || "jungle";
  const table = tableForTerrain(terrainId);
  const roll = Math.floor(Math.random() * 20) + 1;
  const entry = table.find((item) => roll >= item.min && roll <= item.max) || table[0];

  return {
    id: `backup-encounter-${Date.now()}`,
    rolledAt: new Date().toISOString(),
    roll,
    terrainId,
    terrainLabel: routeAnalysis.currentHex.terrainLabel,
    dayPart,
    ...entry,
  };
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
  const isLost = Boolean(travelState.lostStatus?.active);
  const progressGain = isLost ? 0 : progressForOutcome(outcome, scoredRoles, routeAnalysis.pace);
  const nextRouteIndex = clampNumber(
    routeAnalysis.routeProgressHexIndex + progressGain,
    0,
    Math.max(0, routeAnalysis.routeHexes.length - 1)
  );
  const supplyCost = supplyCostForOutcome(outcome, scoredRoles, routeAnalysis.currentHex, routeAnalysis.pace);
  const suppliesAfter = Math.max(0, numeric(travelState.supplies) - supplyCost);
  const resourceImpact = buildTravelResourceForecast(travelState, routeAnalysis, scoredRoles);
  const discoveredHexes = routeAnalysis.routeHexes.slice(0, nextRouteIndex + 1);
  const arrived = nextRouteIndex >= routeAnalysis.routeHexes.length - 1;
  const contextLine = `${routeAnalysis.currentHex.terrainLabel}: ${routeAnalysis.currentHex.descriptors.slice(0, 3).join(", ")}.`;
  const lostLine = isLost
    ? ` Lost: de party is van koers; progress wordt niet toegepast tot de route hersteld is. Drift richting ${travelState.lostStatus?.driftHex || "onbekende hex"}.`
    : "";

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
    mechanics: `${event.mechanics} Progress: +${progressGain} route hex(es). Supplies -${supplyCost}. Resources: ${resourceImpact.summary}${lostLine} ${arrived ? "Doel bereikt of binnen zicht." : "Expeditie beweegt door."}`,
    clue: event.clue,
    pressureRole: pressureRole ? `${pressureRole.label}: ${pressureRole.character || "onbekend"} (${pressureRole.total})` : "",
    spotlightRole: spotlightRole ? `${spotlightRole.label}: ${spotlightRole.character || "onbekend"} (${spotlightRole.total})` : "",
    scoredRoles,
    routeImpact: {
      progressGain,
      nextRouteIndex,
      supplyCost,
      suppliesAfter,
      resourceImpact,
      lost: isLost ? travelState.lostStatus : null,
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
      resources: resourceImpact.after,
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
