import { campaign, encounters, scenes } from "./campaignData.js";

export const WORKSPACE_VERSION = 1;

export const defaultImportText = `## Scene: Regen boven Firefinger
Doel: Zet de jungle-expeditie onder druk en laat Firefinger als belofte aan de horizon voelen.
Conflict: De gids wil tempo maken, maar de party ziet Red Wizard-sporen.
Read-aloud: De regen valt warm en zwaar. Boven de boomkruinen staat Firefinger als een zwarte tand tegen een sterrenloze hemel.
Clues:
- Een rood Thayaans lint zit vast aan een gespleten tak.
- Sanae ziet een groenharig silhouet in verweerde steen.
Player-safe: Firefinger is zichtbaar boven de jungle. Azaka wordt stiller naarmate de toren dichterbij komt.
DM-only: Zorath is hier niet meer, maar zijn expeditie loopt voor op de party.

## Encounter: Pterafolk scouts
Objective: Vang een scout of route-info, niet alleen doden.
Terrain: Dicht bladerdak, hoogteverschillen, 25 ft zicht.
Timer: Na ronde 4 klinkt een krijs-signaal vanaf Firefinger.

## Handout: Azaka's maskerspoor
Visibility: reveal-later
Text: Een gebroken kraal met hetzelfde patroon als Azaka's familie-masker.`;

function uniqueStrings(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map(String).filter(Boolean)));
}

function monsterWithDefaults(monster) {
  return {
    name: monster.name || "Onbekende vijand",
    role: monster.role || "Skirmisher",
    ac: Number(monster.ac || 10),
    hp: Number(monster.hp ?? monster.maxHp ?? 1),
    maxHp: Number(monster.maxHp ?? monster.hp ?? 1),
    initiative: Number(monster.initiative || 0),
    conditions: uniqueStrings(monster.conditions),
  };
}

function initiativeParticipantWithDefaults(participant = {}) {
  return {
    id: participant.id || `turn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: participant.name || "Nieuwe deelnemer",
    side: participant.side || "enemy",
    role: participant.role || "",
    initiative: Number(participant.initiative || 0),
    dexMod: Number(participant.dexMod || 0),
    ac: Number(participant.ac || 10),
    hp: Number(participant.hp ?? participant.maxHp ?? 1),
    maxHp: Number(participant.maxHp ?? participant.hp ?? 1),
    tempHp: Number(participant.tempHp || 0),
    conditions: uniqueStrings(participant.conditions),
    concentration: Boolean(participant.concentration),
    reactionUsed: Boolean(participant.reactionUsed),
    legendaryActions: Number(participant.legendaryActions || 0),
    lairAction: Boolean(participant.lairAction),
    notes: participant.notes || "",
    hiddenFromPlayers: Boolean(participant.hiddenFromPlayers),
  };
}

function createDefaultInitiative() {
  const partyTurns = campaign.party.map((member, index) =>
    initiativeParticipantWithDefaults({
      id: `pc-${member.name.toLowerCase()}`,
      name: member.name,
      side: "party",
      role: member.player,
      initiative: 10 - index,
      ac: 14,
      hp: 1,
      maxHp: 1,
      notes: member.hook,
    })
  );
  const monsterTurns = (encounters[0]?.monsters || []).map((monster) =>
    initiativeParticipantWithDefaults({
      id: `monster-${monster.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      ...monster,
      side: "enemy",
    })
  );

  return {
    encounterName: encounters[0]?.name || "Nieuwe encounter",
    round: 1,
    activeIndex: 0,
    quickAmount: 5,
    lairActionName: "Firefinger hazard op initiative 20",
    objective: encounters[0]?.objective || "",
    timer: encounters[0]?.timer || "",
    participants: [...partyTurns, ...monsterTurns],
    log: [],
  };
}

function createDefaultPartyMembers() {
  return campaign.party.map((member, index) => ({
    name: member.name,
    classSummary: member.player,
    level: campaign.partyLevel,
    race: member.player.split(" ")[0] || "",
    ac: "",
    maxHp: "",
    passivePerception: "",
    spellSaveDc: "",
    status: member.status,
    hook: member.hook,
    visible: member.visible,
    imageUrl: "",
    beyondUrl: "",
    beyondCharacterId: "",
    gear: "",
    notes: "",
    conditions: "",
    spotlight: member.hook,
    lastSnapshotAt: "",
    importSource: index === 0 ? "seed" : "",
  }));
}

function createDefaultImportCenter() {
  return {
    sourceType: "beyond-url",
    targetMemberName: campaign.party[0]?.name || "",
    url: "",
    sourceText: "",
    review: null,
    history: [],
  };
}

function partyMemberWithDefaults(member = {}, fallback = {}) {
  return {
    name: member.name || fallback.name || "Onbekende PC",
    classSummary: member.classSummary || fallback.classSummary || fallback.player || "",
    level: member.level ?? fallback.level ?? campaign.partyLevel,
    race: member.race || fallback.race || "",
    ac: member.ac ?? fallback.ac ?? "",
    maxHp: member.maxHp ?? fallback.maxHp ?? "",
    passivePerception: member.passivePerception ?? fallback.passivePerception ?? "",
    spellSaveDc: member.spellSaveDc ?? fallback.spellSaveDc ?? "",
    status: member.status || fallback.status || "",
    hook: member.hook || fallback.hook || "",
    visible: member.visible || fallback.visible || "",
    imageUrl: member.imageUrl || "",
    beyondUrl: member.beyondUrl || "",
    beyondCharacterId: member.beyondCharacterId || "",
    gear: member.gear || "",
    notes: member.notes || "",
    conditions: member.conditions || "",
    spotlight: member.spotlight || fallback.spotlight || member.hook || fallback.hook || "",
    lastSnapshotAt: member.lastSnapshotAt || "",
    importSource: member.importSource || "",
  };
}

function importCenterWithDefaults(imports = {}, defaults = createDefaultImportCenter()) {
  return {
    ...defaults,
    ...(imports && typeof imports === "object" ? imports : {}),
    history: Array.isArray(imports?.history) ? imports.history : defaults.history,
    review: imports?.review && typeof imports.review === "object" ? imports.review : null,
  };
}

function createDefaultFactionClocks() {
  return [
    {
      id: "zorath-expedition",
      name: "Zorath Expedition",
      progress: 45,
      nextMove: "Bereikt een ruine-spoor richting Mezro en wist zijn teleportatiecirkel uit.",
    },
    {
      id: "cassian-recovery",
      name: "Cassian's Recovery",
      progress: 28,
      nextMove: "Zoekt politieke dekking en een nieuwe manier om William te framen.",
    },
    {
      id: "merchant-princes",
      name: "Merchant Princes",
      progress: 38,
      nextMove: "Willen bewijs dat Cobra Kai hun titel Envoys waard is.",
    },
    {
      id: "tharizdun-influence",
      name: "Tharizdun Influence",
      progress: 52,
      nextMove: "Fluistert via reflecties, dromen en Williams blade.",
    },
  ];
}

function createDefaultFirefinger() {
  return {
    alert: 25,
    partyNoise: 20,
    levels: [
      { id: "erosion-caves", name: "Erosion Caves", status: "unseen", notes: "Modder, scherpe steen, oude Chultaanse resten." },
      { id: "broken-nest", name: "Broken Nest Hall", status: "unseen", notes: "Nestmateriaal, krijs-signalen, eerste pterafolk sporen." },
      { id: "signal-chamber", name: "Signal Chamber", status: "unseen", notes: "Oude signaalmechaniek, mogelijke clue naar Mezro." },
      { id: "upper-roost", name: "Upper Roost", status: "unseen", notes: "Gevaarlijke hoogte, Azaka-maskerspoor." },
      { id: "summit", name: "Summit", status: "unseen", notes: "Verticale finale, wind, valgevaar, uitzicht op jungle." },
    ],
  };
}

export function createWorkspaceState() {
  return {
    version: WORKSPACE_VERSION,
    activeModule: "dashboard",
    prep: {
      importText: defaultImportText,
      lastRepairPrompt: "",
    },
    runtime: {
      activeSceneId: scenes[0]?.id || "",
      completedSceneIds: [],
      clueStatuses: {},
      notesByScene: {},
      pinnedNpcNames: [],
      panicLog: [],
      startedAt: "",
      updatedAt: "",
    },
    playerView: {
      mode: "scene",
      currentLocation: "Junglepad richting Firefinger",
      publishedSceneIds: scenes[0]?.id ? [scenes[0].id] : [],
      publishedCards: [],
      activePublishedId: scenes[0]?.id || "",
      lastPublishedAt: "",
    },
    campaignOs: {
      activeTab: "live",
      threatLevel: "pressure",
      clueLedger: {},
      npcRelations: {},
      debriefNotes: "",
      debriefDraft: "",
      factionClocks: createDefaultFactionClocks(),
      firefinger: createDefaultFirefinger(),
      consequences: [],
      continuityAcknowledged: [],
    },
    party: {
      members: createDefaultPartyMembers(),
      snapshots: [],
    },
    imports: createDefaultImportCenter(),
    encounter: {
      activeEncounterId: encounters[0]?.id || "",
      activeTurn: 0,
      round: 1,
      monsters: (encounters[0]?.monsters || []).map(monsterWithDefaults),
      objectiveStatus: "Nog open",
      timerProgress: 0,
    },
    initiative: createDefaultInitiative(),
    updatedAt: "",
  };
}

export function normalizeWorkspaceState(value = {}) {
  const defaults = createWorkspaceState();
  const runtime = value.runtime && typeof value.runtime === "object" ? value.runtime : {};
  const playerView = value.playerView && typeof value.playerView === "object" ? value.playerView : {};
  const encounter = value.encounter && typeof value.encounter === "object" ? value.encounter : {};
  const initiative = value.initiative && typeof value.initiative === "object" ? value.initiative : {};
  const campaignOs = value.campaignOs && typeof value.campaignOs === "object" ? value.campaignOs : {};
  const party = value.party && typeof value.party === "object" ? value.party : {};
  const imports = value.imports && typeof value.imports === "object" ? value.imports : {};
  const firefinger = campaignOs.firefinger && typeof campaignOs.firefinger === "object" ? campaignOs.firefinger : {};

  return {
    ...defaults,
    ...value,
    version: WORKSPACE_VERSION,
    prep: {
      ...defaults.prep,
      ...(value.prep && typeof value.prep === "object" ? value.prep : {}),
    },
    runtime: {
      ...defaults.runtime,
      ...runtime,
      completedSceneIds: uniqueStrings(runtime.completedSceneIds),
      pinnedNpcNames: uniqueStrings(runtime.pinnedNpcNames),
      clueStatuses: runtime.clueStatuses && typeof runtime.clueStatuses === "object" ? runtime.clueStatuses : {},
      notesByScene: runtime.notesByScene && typeof runtime.notesByScene === "object" ? runtime.notesByScene : {},
      panicLog: Array.isArray(runtime.panicLog) ? runtime.panicLog : [],
    },
    playerView: {
      ...defaults.playerView,
      ...playerView,
      publishedSceneIds: uniqueStrings(playerView.publishedSceneIds),
      publishedCards: Array.isArray(playerView.publishedCards) ? playerView.publishedCards : [],
    },
    campaignOs: {
      ...defaults.campaignOs,
      ...campaignOs,
      clueLedger: campaignOs.clueLedger && typeof campaignOs.clueLedger === "object" ? campaignOs.clueLedger : {},
      npcRelations: campaignOs.npcRelations && typeof campaignOs.npcRelations === "object" ? campaignOs.npcRelations : {},
      factionClocks: Array.isArray(campaignOs.factionClocks) ? campaignOs.factionClocks : defaults.campaignOs.factionClocks,
      firefinger: {
        ...defaults.campaignOs.firefinger,
        ...firefinger,
        alert: Math.max(0, Math.min(100, Number(firefinger.alert ?? defaults.campaignOs.firefinger.alert))),
        partyNoise: Math.max(0, Math.min(100, Number(firefinger.partyNoise ?? defaults.campaignOs.firefinger.partyNoise))),
        levels: Array.isArray(firefinger.levels) ? firefinger.levels : defaults.campaignOs.firefinger.levels,
      },
      consequences: Array.isArray(campaignOs.consequences) ? campaignOs.consequences : [],
      continuityAcknowledged: uniqueStrings(campaignOs.continuityAcknowledged),
    },
    party: {
      ...defaults.party,
      ...party,
      members: Array.isArray(party.members)
        ? party.members.map((member, index) => partyMemberWithDefaults(member, defaults.party.members[index]))
        : defaults.party.members,
      snapshots: Array.isArray(party.snapshots) ? party.snapshots : defaults.party.snapshots,
    },
    imports: importCenterWithDefaults(imports, defaults.imports),
    encounter: {
      ...defaults.encounter,
      ...encounter,
      activeTurn: Number(encounter.activeTurn || 0),
      round: Math.max(1, Number(encounter.round || 1)),
      timerProgress: Math.max(0, Math.min(100, Number(encounter.timerProgress || 0))),
      monsters: Array.isArray(encounter.monsters)
        ? encounter.monsters.map(monsterWithDefaults)
        : defaults.encounter.monsters,
    },
    initiative: {
      ...defaults.initiative,
      ...initiative,
      round: Math.max(1, Number(initiative.round || 1)),
      activeIndex: Math.max(0, Number(initiative.activeIndex || 0)),
      quickAmount: Math.max(1, Number(initiative.quickAmount || defaults.initiative.quickAmount)),
      participants: Array.isArray(initiative.participants)
        ? initiative.participants.map(initiativeParticipantWithDefaults)
        : defaults.initiative.participants,
      log: Array.isArray(initiative.log) ? initiative.log : [],
    },
  };
}
