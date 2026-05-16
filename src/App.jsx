import { useCallback, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell.jsx";
import { CampaignHub } from "./components/CampaignHub.jsx";
import { CampaignOs } from "./components/CampaignOs.jsx";
import { ChultHexMap } from "./components/ChultHexMap.jsx";
import { Compendium } from "./components/Compendium.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { EncounterTracker } from "./components/EncounterTracker.jsx";
import { ImportCenter } from "./components/ImportCenter.jsx";
import { InitiativeTracker } from "./components/InitiativeTracker.jsx";
import { JungleTravel } from "./components/JungleTravel.jsx";
import { LiveRuntime } from "./components/LiveRuntime.jsx";
import { MagicItemSheet } from "./components/MagicItemSheet.jsx";
import { MagicShopGenerator } from "./components/MagicShopGenerator.jsx";
import { MemoryGraph } from "./components/MemoryGraph.jsx";
import { NpcManager } from "./components/NpcManager.jsx";
import { PaletteLab } from "./components/PaletteLab.jsx";
import { PartyPage } from "./components/PartyPage.jsx";
import { PlayerView } from "./components/PlayerView.jsx";
import { QuestLog } from "./components/QuestLog.jsx";
import { RandomEncounterGenerator } from "./components/RandomEncounterGenerator.jsx";
import { RandomNpcGenerator } from "./components/RandomNpcGenerator.jsx";
import { SessionPrep } from "./components/SessionPrep.jsx";
import { SpellSheet } from "./components/SpellSheet.jsx";
import { TreasureGenerator } from "./components/TreasureGenerator.jsx";
import { encounters, scenes as seedScenes } from "./data/campaignData.js";
import { createDefaultHexNote } from "./data/systems/chultHexSystem.js";
import { normalizeWorkspaceState } from "./data/workspaceState.js";
import { analyzePrepQuality, buildRepairPrompt, parsePrepOutput } from "./utils/aiPrepParser.js";
import { buildChultRouteAnalysis, buildTravelInitiativeSeed, generateJungleTravelEvent } from "./utils/jungleTravelEngine.js";
import { createParticipantFromMonster } from "./utils/monsterStatblocks.js";
import { fetchDndBeyondCharacter, parsePartyImport } from "./utils/partyImportParser.js";
import { useDebouncedSave } from "./utils/useDebouncedSave.js";
import { loadWorkspaceState, saveWorkspaceState } from "./utils/workspaceStorage.js";

const modules = [
  { id: "dashboard", label: "Home", modes: ["play", "players"] },
  { id: "runtime", label: "Live", modes: ["play"] },
  { id: "travel", label: "Jungle Reis", modes: ["play", "generators"] },
  { id: "chult-map", label: "Chult Kaart", modes: ["play", "make"] },
  { id: "initiative", label: "Initiatief", modes: ["play"] },
  { id: "spells", label: "Spells", modes: ["play", "make"] },
  { id: "items", label: "Items", modes: ["play", "make", "players"] },
  { id: "magic-shop", label: "Magic Shop", modes: ["make", "play", "generators"] },
  { id: "treasure", label: "Treasure", modes: ["make", "play", "generators"] },
  { id: "random-encounter", label: "Encounter Gen", modes: ["play", "make", "generators"] },
  { id: "npc-gen", label: "NPC Gen", modes: ["generators", "make"] },
  { id: "encounter", label: "Combat", modes: ["play"] },
  { id: "player", label: "Spelersscherm", modes: ["play", "players"] },
  { id: "prep", label: "Sessie Prep", modes: ["make"] },
  { id: "campaign", label: "Campaign", modes: ["make"] },
  { id: "os", label: "Campaign OS", modes: ["make"] },
  { id: "compendium", label: "Compendium", modes: ["make", "generators"] },
  { id: "quests", label: "Quests", modes: ["make", "players"] },
  { id: "npcs", label: "NPCs", modes: ["make"] },
  { id: "memory", label: "Memory", modes: ["make"] },
  { id: "import", label: "Imports", modes: ["make", "players"] },
  { id: "palette-lab", label: "Kleur Lab", modes: ["make"] },
  { id: "party", label: "Mijn Party", modes: ["players"] },
];

function App() {
  const [workspace, setWorkspace] = useState(() => loadWorkspaceState());
  const activeModule = workspace.activeModule;
  const parsedPrep = useMemo(() => parsePrepOutput(workspace.prep.importText), [workspace.prep.importText]);
  const prepQuality = useMemo(() => analyzePrepQuality(workspace.prep.importText), [workspace.prep.importText]);
  const scenes = useMemo(() => {
    const importedIds = new Set(parsedPrep.scenes.map((scene) => scene.id));
    return [...seedScenes, ...parsedPrep.scenes.filter((scene) => !importedIds.has(scene.id) || scene.source === "import")];
  }, [parsedPrep.scenes]);
  const completedSceneSet = useMemo(() => new Set(workspace.runtime.completedSceneIds), [workspace.runtime.completedSceneIds]);
  const publishedSceneSet = useMemo(() => new Set(workspace.playerView.publishedSceneIds), [workspace.playerView.publishedSceneIds]);

  const persist = useCallback((updater) => {
    setWorkspace((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return normalizeWorkspaceState(next);
    });
  }, []);

  useDebouncedSave(workspace, saveWorkspaceState, 450);

  function setActiveModule(moduleId) {
    persist((current) => ({ ...current, activeModule: moduleId }));
  }

  function setPrepImportText(importText) {
    persist((current) => ({
      ...current,
      prep: { ...current.prep, importText },
    }));
  }

  function storeRepairPrompt() {
    persist((current) => ({
      ...current,
      prep: {
        ...current.prep,
        lastRepairPrompt: buildRepairPrompt(current.prep.importText, prepQuality),
      },
    }));
  }

  function setActiveSceneId(sceneId) {
    persist((current) => ({
      ...current,
      runtime: {
        ...current.runtime,
        activeSceneId: sceneId,
        updatedAt: new Date().toISOString(),
      },
      campaignOs: {
        ...current.campaignOs,
        activeTab: "live",
      },
    }));
  }

  function toggleSceneComplete(sceneId) {
    persist((current) => {
      const next = new Set(current.runtime.completedSceneIds);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return {
        ...current,
        runtime: {
          ...current.runtime,
          completedSceneIds: Array.from(next),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }

  function publishScene(sceneId) {
    const scene = scenes.find((item) => item.id === sceneId);
    if (!scene) return;

    persist((current) => {
      const publishedSceneIds = Array.from(new Set([...current.playerView.publishedSceneIds, sceneId]));
      const card = {
        id: `${sceneId}-${Date.now()}`,
        type: "scene",
        title: scene.title,
        body: scene.playerSafe,
        publishedAt: new Date().toISOString(),
      };
      return {
        ...current,
        playerView: {
          ...current.playerView,
          mode: "scene",
          activePublishedId: sceneId,
          currentLocation: scene.title.replace(/^Scene \d+\s*-\s*/, ""),
          publishedSceneIds,
          publishedCards: [card, ...current.playerView.publishedCards].slice(0, 12),
          lastPublishedAt: card.publishedAt,
        },
      };
    });
  }

  function setSceneNote(sceneId, note) {
    persist((current) => ({
      ...current,
      runtime: {
        ...current.runtime,
        notesByScene: { ...current.runtime.notesByScene, [sceneId]: note },
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function setClueStatus(sceneId, clue, status) {
    const key = `${sceneId}::${clue}`;
    persist((current) => ({
      ...current,
      runtime: {
        ...current.runtime,
        clueStatuses: {
          ...current.runtime.clueStatuses,
          [key]: { status, updatedAt: new Date().toISOString() },
        },
      },
      campaignOs: {
        ...current.campaignOs,
        clueLedger: {
          ...current.campaignOs.clueLedger,
          [key]: { sceneId, clue, status, updatedAt: new Date().toISOString() },
        },
      },
    }));
  }

  function addPanicPrompt(prompt) {
    persist((current) => ({
      ...current,
      runtime: {
        ...current.runtime,
        panicLog: [{ ...prompt, usedAt: new Date().toISOString() }, ...current.runtime.panicLog].slice(0, 8),
      },
    }));
  }

  function patchTravel(patch) {
    persist((current) => ({
      ...current,
      travel: { ...current.travel, ...patch },
    }));
  }

  function updateTravelRole(index, patch) {
    persist((current) => ({
      ...current,
      travel: {
        ...current.travel,
        roles: current.travel.roles.map((role, roleIndex) =>
          roleIndex === index ? { ...role, ...patch } : role
        ),
      },
    }));
  }

  function rollTravelRole(index) {
    const roll = Math.floor(Math.random() * 20) + 1;
    updateTravelRole(index, { roll });
  }

  function generateTravelEvent() {
    persist((current) => {
      const event = generateJungleTravelEvent(current.travel, current.chultMap);
      const discoveredHexes = Array.from(
        new Set([...(current.chultMap.discoveredHexes || []), ...(event.routeImpact?.discoveredHexes || [])])
      );
      return {
        ...current,
        travel: {
          ...current.travel,
          ...(event.travelPatch || {}),
          lastEvent: event,
          history: [event, ...current.travel.history].slice(0, 20),
        },
        chultMap: {
          ...current.chultMap,
          discoveredHexes,
          selectedHex: event.currentHex || current.chultMap.selectedHex,
        },
      };
    });
  }

  function undoLastTravelEvent() {
    persist((current) => {
      const event = current.travel.lastEvent || current.travel.history?.[0];
      if (!event) return current;

      const routeAnalysis = buildChultRouteAnalysis(current.chultMap, {
        ...current.travel,
        routeProgress: 0,
        routeProgressHexIndex: 0,
      });
      const eventHexIndex = routeAnalysis.routeHexes.findIndex((hexId) => hexId === event.currentHex);
      const previousRouteIndex =
        eventHexIndex >= 0
          ? eventHexIndex
          : Math.max(0, Number(event.routeImpact?.nextRouteIndex || 0) - Number(event.routeImpact?.progressGain || 0));
      const previousSupplies = Math.max(
        0,
        Number(event.routeImpact?.suppliesAfter ?? current.travel.supplies) + Number(event.routeImpact?.supplyCost || 0)
      );
      const nextHistory = (current.travel.history || []).filter((historyEvent) => historyEvent.id !== event.id);

      return {
        ...current,
        travel: {
          ...current.travel,
          day: Math.max(1, Number(event.day || current.travel.day || 1)),
          routeProgress: previousRouteIndex,
          routeProgressHexIndex: previousRouteIndex,
          supplies: previousSupplies,
          lastEvent: nextHistory[0] || null,
          history: nextHistory,
        },
        chultMap: {
          ...current.chultMap,
          selectedHex: event.currentHex || current.chultMap.selectedHex,
        },
      };
    });
  }

  function sendLastTravelEventToRuntime() {
    persist((current) => {
      const event = current.travel.lastEvent;
      const sceneId = current.runtime.activeSceneId || scenes[0]?.id;
      if (!event || !sceneId) return current;

      const existingNote = current.runtime.notesByScene?.[sceneId] || "";
      const eventNote = [
        `## Travel dag ${event.day}: ${event.title}`,
        `Outcome: ${event.outcome} | Hex: ${event.currentHex} | Terrain: ${event.currentTerrain}`,
        `Read-aloud: ${event.readAloud}`,
        `Mechanics: ${event.mechanics}`,
        `Clue: ${event.clue}`,
        `DM-only: ${event.dmOnly}`,
      ].join("\n");

      return {
        ...current,
        activeModule: "runtime",
        runtime: {
          ...current.runtime,
          notesByScene: {
            ...current.runtime.notesByScene,
            [sceneId]: existingNote ? `${existingNote}\n\n${eventNote}` : eventNote,
          },
          panicLog: [
            {
              id: `travel-runtime-${event.id}`,
              title: event.title,
              type: "Travel Event",
              text: event.pressure,
              usedAt: new Date().toISOString(),
            },
            ...current.runtime.panicLog,
          ].slice(0, 8),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }

  function publishLastTravelEventToPlayers() {
    persist((current) => {
      const event = current.travel.lastEvent;
      if (!event) return current;
      const publishedAt = new Date().toISOString();
      const publishedRouteHexes = Array.from(
        new Set([...(current.chultMap.publishedRouteHexes || []), ...(event.routeImpact?.discoveredHexes || [])])
      );

      return {
        ...current,
        activeModule: "player",
        chultMap: {
          ...current.chultMap,
          publishedRouteHexes,
        },
        playerView: {
          ...current.playerView,
          mode: "travel",
          currentLocation: event.currentTerrain || current.playerView.currentLocation,
          publishedCards: [
            {
              id: `travel-player-${event.id}`,
              type: "travel",
              title: event.title,
              body: event.playerSafe,
              publishedAt,
            },
            ...current.playerView.publishedCards,
          ].slice(0, 12),
          lastPublishedAt: publishedAt,
        },
      };
    });
  }

  function seedInitiativeFromLastTravelEvent() {
    persist((current) => {
      const event = current.travel.lastEvent;
      if (!event) return current;
      const partyTurns = current.initiative.participants.filter((participant) => participant.side === "party");
      const seed = buildTravelInitiativeSeed(event, partyTurns);

      return {
        ...current,
        activeModule: "initiative",
        initiative: {
          ...current.initiative,
          encounterName: seed.encounterName,
          round: seed.round,
          activeIndex: seed.activeIndex,
          objective: seed.objective,
          timer: seed.timer,
          lairActionName: seed.lairActionName,
          participants: seed.participants,
          log: [seed.logLine, ...current.initiative.log].slice(0, 12),
        },
      };
    });
  }

  function seedRandomEncounterToInitiative(encounter) {
    persist((current) => {
      const partyTurns = current.initiative.participants.filter((participant) =>
        ["party", "ally"].includes(participant.side)
      );
      const enemies = encounter.monsters.flatMap((entry) =>
        Array.from({ length: entry.count }, (_, index) =>
          createParticipantFromMonster(entry.monster, entry.count > 1 ? index + 1 : 1)
        )
      );

      return {
        ...current,
        activeModule: "initiative",
        initiative: {
          ...current.initiative,
          encounterName: encounter.title,
          round: 1,
          activeIndex: 0,
          objective: encounter.objective,
          timer: encounter.timer,
          lairActionName: encounter.shape === "hazard" || encounter.shape === "lair" ? "Terrain pressure op initiative 20" : current.initiative.lairActionName,
          participants: [...partyTurns, ...enemies],
          log: [
            `R1: random encounter seeded (${encounter.adjustedXp} adjusted XP, ${encounter.difficulty}).`,
            ...current.initiative.log,
          ].slice(0, 12),
        },
      };
    });
  }

  function saveGeneratedNpc(npc) {
    persist((current) => ({
      ...current,
      npcs: {
        ...(current.npcs || {}),
        generated: [
          {
            ...npc,
            generatedAt: new Date().toISOString(),
          },
          ...((current.npcs || {}).generated || []).filter((item) => item.id !== npc.id),
        ].slice(0, 80),
      },
    }));
  }

  function patchChultMap(patch) {
    persist((current) => ({
      ...current,
      chultMap: { ...current.chultMap, ...patch },
    }));
  }

  function saveChultRoutePreset(name) {
    persist((current) => {
      const routeHexes = current.chultMap.routeHexes || [];
      if (!routeHexes.length) return current;
      const safeName = String(name || current.travel.routeName || "Nieuwe Chult route").trim();
      const preset = {
        id: `route-${Date.now()}`,
        name: safeName,
        waypoints: routeHexes,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...current,
        travel: {
          ...current.travel,
          routeName: safeName,
        },
        chultMap: {
          ...current.chultMap,
          activeRoutePresetId: preset.id,
          routePresets: [preset, ...(current.chultMap.routePresets || [])].slice(0, 12),
        },
      };
    });
  }

  function applyChultRoutePreset(presetId) {
    persist((current) => {
      const preset = (current.chultMap.routePresets || []).find((item) => item.id === presetId);
      if (!preset) return current;
      const waypoints = preset.waypoints || [];
      return {
        ...current,
        travel: {
          ...current.travel,
          routeName: preset.name,
          routeProgress: 0,
          routeProgressHexIndex: 0,
        },
        chultMap: {
          ...current.chultMap,
          activeRoutePresetId: preset.id,
          routeHexes: waypoints,
          selectedHex: waypoints[waypoints.length - 1] || current.chultMap.selectedHex,
        },
      };
    });
  }

  function publishChultRouteToPlayers() {
    persist((current) => {
      const routeAnalysis = buildChultRouteAnalysis(current.chultMap, current.travel);
      const progressIndex = Math.min(
        Math.max(0, Number(current.travel.routeProgressHexIndex || 0)),
        Math.max(0, routeAnalysis.routeHexes.length - 1)
      );
      const routeSlice = routeAnalysis.routeHexes.slice(0, progressIndex + 1);
      const currentHex = routeAnalysis.hexes[progressIndex] || routeAnalysis.currentHex;
      const publishedAt = new Date().toISOString();

      return {
        ...current,
        activeModule: "player",
        chultMap: {
          ...current.chultMap,
          publishedRouteHexes: Array.from(new Set([...(current.chultMap.publishedRouteHexes || []), ...routeSlice])),
        },
        playerView: {
          ...current.playerView,
          mode: "travel",
          currentLocation: currentHex.title,
          publishedCards: [
            {
              id: `route-publish-${publishedAt}`,
              type: "route",
              title: `Expeditieroute: ${current.travel.routeName}`,
              body: `${routeSlice.length} bekende routehexes. Huidige locatie: ${currentHex.title}. Afstand bekend: ongeveer ${Math.round(
                Math.max(0, routeSlice.length - 1) * 10 * 1.60934
              )} km.`,
              publishedAt,
            },
            ...current.playerView.publishedCards,
          ].slice(0, 12),
          lastPublishedAt: publishedAt,
        },
      };
    });
  }

  function selectChultHex(selectedHex) {
    persist((current) => ({
      ...current,
      chultMap: { ...current.chultMap, selectedHex },
    }));
  }

  function patchChultHex(hexId, patch) {
    persist((current) => {
      const currentNote = current.chultMap.notesByHex?.[hexId] || createDefaultHexNote(hexId);
      return {
        ...current,
        chultMap: {
          ...current.chultMap,
          selectedHex: hexId,
          notesByHex: {
            ...current.chultMap.notesByHex,
            [hexId]: {
              ...currentNote,
              ...patch,
              hexId,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      };
    });
  }

  function toggleChultOverlay(overlayId) {
    persist((current) => ({
      ...current,
      chultMap: {
        ...current.chultMap,
        overlays: {
          ...current.chultMap.overlays,
          [overlayId]: !current.chultMap.overlays?.[overlayId],
        },
      },
    }));
  }

  function toggleChultRouteHex(hexId) {
    persist((current) => {
      const routeHexes = current.chultMap.routeHexes.includes(hexId)
        ? current.chultMap.routeHexes.filter((item) => item !== hexId)
        : [...current.chultMap.routeHexes, hexId];
      return {
        ...current,
        chultMap: {
          ...current.chultMap,
          routeHexes,
          selectedHex: hexId,
        },
      };
    });
  }

  function markChultDiscovered(hexId) {
    persist((current) => {
      const discoveredHexes = current.chultMap.discoveredHexes.includes(hexId)
        ? current.chultMap.discoveredHexes
        : [...current.chultMap.discoveredHexes, hexId];
      const currentNote = current.chultMap.notesByHex?.[hexId] || createDefaultHexNote(hexId);
      return {
        ...current,
        chultMap: {
          ...current.chultMap,
          selectedHex: hexId,
          discoveredHexes,
          notesByHex: {
            ...current.chultMap.notesByHex,
            [hexId]: {
              ...currentNote,
              status: currentNote.status === "unknown" ? "discovered" : currentNote.status,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      };
    });
  }

  function patchCampaignOs(patch) {
    persist((current) => ({
      ...current,
      campaignOs: { ...current.campaignOs, ...patch },
    }));
  }

  function updateFactionClock(clockId, patch) {
    persist((current) => ({
      ...current,
      campaignOs: {
        ...current.campaignOs,
        factionClocks: current.campaignOs.factionClocks.map((clock) =>
          clock.id === clockId ? { ...clock, ...patch } : clock
        ),
      },
    }));
  }

  function updateFirefinger(patch) {
    persist((current) => ({
      ...current,
      campaignOs: {
        ...current.campaignOs,
        firefinger: { ...current.campaignOs.firefinger, ...patch },
      },
    }));
  }

  function updateFirefingerLevel(levelId, patch) {
    persist((current) => ({
      ...current,
      campaignOs: {
        ...current.campaignOs,
        firefinger: {
          ...current.campaignOs.firefinger,
          levels: current.campaignOs.firefinger.levels.map((level) =>
            level.id === levelId ? { ...level, ...patch } : level
          ),
        },
      },
    }));
  }

  function addConsequence(consequence) {
    persist((current) => ({
      ...current,
      campaignOs: {
        ...current.campaignOs,
        consequences: [
          { id: `consequence-${Date.now()}`, createdAt: new Date().toISOString(), ...consequence },
          ...current.campaignOs.consequences,
        ].slice(0, 20),
      },
    }));
  }

  function patchPartyMember(index, patch) {
    persist((current) => ({
      ...current,
      party: {
        ...current.party,
        members: current.party.members.map((member, memberIndex) =>
          memberIndex === index ? { ...member, ...patch } : member
        ),
      },
    }));
  }

  function patchImportCenter(patch) {
    persist((current) => ({
      ...current,
      imports: { ...current.imports, ...patch },
    }));
  }

  async function analyzePartyImport() {
    const imports = workspace.imports;
    let sourceText = imports.sourceText;
    let fetchError = "";
    let lastBeyondFetch = imports.lastBeyondFetch || "";

    if (imports.sourceType === "beyond-url" && imports.url) {
      try {
        const fetched = await fetchDndBeyondCharacter(imports.url);
        sourceText = JSON.stringify(fetched.payload, null, 2);
        lastBeyondFetch = `${fetched.endpoint} @ ${new Date().toLocaleString("nl-NL")}`;
      } catch (error) {
        fetchError = error.message || "D&D Beyond kon niet automatisch worden opgehaald.";
      }
    }

    persist((current) => {
      const nextImports = {
        ...current.imports,
        sourceText,
        fetchError,
        lastBeyondFetch,
      };
      return {
        ...current,
        imports: {
          ...nextImports,
          review: parsePartyImport(nextImports),
        },
      };
    });
  }

  function applyPartyImport() {
    persist((current) => {
      const review = current.imports.review;
      if (!review) return current;
      const targetName = current.imports.targetMemberName || review.name;
      const appliedAt = new Date().toISOString();
      const mergeKeys = [
        "name",
        "classSummary",
        "level",
        "proficiencyBonus",
        "race",
        "background",
        "alignment",
        "ac",
        "maxHp",
        "currentHp",
        "tempHp",
        "passivePerception",
        "spellSaveDc",
        "spellAttackBonus",
        "spellcastingAbility",
        "speed",
        "senses",
        "initiative",
        "xp",
        "abilities",
        "saves",
        "skills",
        "proficiencies",
        "languages",
        "attacks",
        "spells",
        "cantrips",
        "preparedSpells",
        "gear",
        "currency",
        "notes",
        "imageUrl",
        "beyondUrl",
        "beyondCharacterId",
        "beyondApiUrl",
        "campaignName",
      ];
      return {
        ...current,
        imports: {
          ...current.imports,
          history: [
            { id: `import-${Date.now()}`, targetMemberName: targetName, appliedAt, review },
            ...current.imports.history,
          ].slice(0, 20),
        },
        party: {
          ...current.party,
          members: current.party.members.map((member) => {
            if (member.name !== targetName) return member;
            const patch = mergeKeys.reduce((acc, key) => {
              if (review[key] !== undefined && review[key] !== "") acc[key] = review[key];
              return acc;
            }, {});
            return { ...member, ...patch, lastSnapshotAt: appliedAt, importSource: review.sourceType };
          }),
        },
      };
    });
  }

  function createCharacterSnapshot(memberName) {
    persist((current) => {
      const member = current.party.members.find((item) => item.name === memberName);
      if (!member) return current;
      const createdAt = new Date().toISOString();
      const snapshot = {
        id: `snapshot-${member.name}-${Date.now()}`,
        createdAt,
        name: member.name,
        classSummary: member.classSummary,
        level: member.level,
        race: member.race,
        background: member.background,
        alignment: member.alignment,
        ac: member.ac,
        currentHp: member.currentHp,
        maxHp: member.maxHp,
        tempHp: member.tempHp,
        passivePerception: member.passivePerception,
        spellSaveDc: member.spellSaveDc,
        speed: member.speed,
        abilities: member.abilities,
        attacks: member.attacks,
        spells: member.spells,
        proficiencies: member.proficiencies,
        languages: member.languages,
        gear: member.gear,
        currency: member.currency,
        conditions: member.conditions,
        notes: member.notes,
        beyondUrl: member.beyondUrl,
      };
      return {
        ...current,
        party: {
          ...current.party,
          snapshots: [snapshot, ...current.party.snapshots].slice(0, 30),
          members: current.party.members.map((item) =>
            item.name === memberName ? { ...item, lastSnapshotAt: createdAt } : item
          ),
        },
      };
    });
  }

  function patchEncounter(patch) {
    persist((current) => ({
      ...current,
      encounter: { ...current.encounter, ...patch },
    }));
  }

  function patchInitiative(patch) {
    persist((current) => ({
      ...current,
      initiative: { ...current.initiative, ...patch },
    }));
  }

  function updateInitiativeParticipant(participantId, patch) {
    persist((current) => ({
      ...current,
      initiative: {
        ...current.initiative,
        participants: current.initiative.participants.map((participant) =>
          participant.id === participantId ? { ...participant, ...patch } : participant
        ),
      },
    }));
  }

  function addInitiativeParticipant() {
    persist((current) => ({
      ...current,
      initiative: (() => {
        const participant = {
          id: `turn-${Date.now()}`,
          name: "",
          side: "enemy",
          role: "",
          initiative: 0,
          dexMod: 0,
          ac: 10,
          hp: 1,
          maxHp: 1,
          tempHp: 0,
          conditions: [],
          concentration: false,
          reactionUsed: false,
          legendaryActions: 0,
          lairAction: false,
          notes: "",
          hiddenFromPlayers: false,
        };
        return {
          ...current.initiative,
          participants: [...current.initiative.participants, participant],
          turnOrder: [...(current.initiative.turnOrder || current.initiative.participants.map((item) => item.id)), participant.id],
        };
      })(),
    }));
  }

  function addInitiativeMonster(monster, count = 1) {
    persist((current) => {
      const amount = Math.max(1, Math.min(12, Number(count || 1)));
      const newParticipants = Array.from({ length: amount }, (_, index) =>
        createParticipantFromMonster(monster, amount > 1 ? index + 1 : 1)
      );

      return {
        ...current,
        initiative: {
          ...current.initiative,
          participants: [...current.initiative.participants, ...newParticipants],
          turnOrder: [
            ...(current.initiative.turnOrder || current.initiative.participants.map((participant) => participant.id)),
            ...newParticipants.map((participant) => participant.id),
          ],
          log: [
            `R${current.initiative.round}: ${amount}x ${monster.name} toegevoegd aan combat.`,
            ...current.initiative.log,
          ].slice(0, 12),
        },
      };
    });
  }

  function removeInitiativeParticipant(participantId) {
    persist((current) => ({
      ...current,
      initiative: {
        ...current.initiative,
        activeIndex: 0,
        participants: current.initiative.participants.filter((participant) => participant.id !== participantId),
        turnOrder: (current.initiative.turnOrder || []).filter((id) => id !== participantId),
      },
    }));
  }

  function resetInitiative() {
    persist((current) => ({
      ...current,
      initiative: {
        ...current.initiative,
        round: 1,
        activeIndex: 0,
        log: [],
        participants: [],
        turnOrder: [],
      },
    }));
  }

  function setMonsters(updater) {
    persist((current) => {
      const monsters = typeof updater === "function" ? updater(current.encounter.monsters) : updater;
      return {
        ...current,
        encounter: { ...current.encounter, monsters },
      };
    });
  }

  function setActiveTurn(updater) {
    persist((current) => {
      const activeTurn = typeof updater === "function" ? updater(current.encounter.activeTurn) : updater;
      const round =
        activeTurn > current.encounter.activeTurn && current.encounter.monsters.length
          ? current.encounter.round + (activeTurn % current.encounter.monsters.length === 0 ? 1 : 0)
          : current.encounter.round;
      return {
        ...current,
        encounter: { ...current.encounter, activeTurn, round },
      };
    });
  }

  const screen = {
    dashboard: (
      <Dashboard
        workspace={workspace}
        onNavigate={setActiveModule}
        completedScenes={completedSceneSet}
        publishedCount={publishedSceneSet.size}
        prepQuality={prepQuality}
      />
    ),
    campaign: <CampaignHub workspace={workspace} />,
    compendium: <Compendium />,
    "palette-lab": <PaletteLab />,
    party: <PartyPage members={workspace.party.members} onPatchMember={patchPartyMember} />,
    import: (
      <ImportCenter
        importCenter={workspace.imports}
        partyMembers={workspace.party.members}
        snapshots={workspace.party.snapshots}
        onPatchImportCenter={patchImportCenter}
        onAnalyzeImport={analyzePartyImport}
        onApplyImport={applyPartyImport}
        onCreateSnapshot={createCharacterSnapshot}
      />
    ),
    memory: <MemoryGraph workspace={workspace} partyMembers={workspace.party.members} />,
    os: (
      <CampaignOs
        workspace={workspace}
        scenes={scenes}
        parsedPrep={parsedPrep}
        prepQuality={prepQuality}
        partyMembers={workspace.party.members}
        onNavigate={setActiveModule}
        onSetActiveScene={setActiveSceneId}
        onPublishScene={publishScene}
        onSetClueStatus={setClueStatus}
        onAddPanicPrompt={addPanicPrompt}
        onPatchCampaignOs={patchCampaignOs}
        onUpdateFactionClock={updateFactionClock}
        onUpdateFirefinger={updateFirefinger}
        onUpdateFirefingerLevel={updateFirefingerLevel}
        onAddConsequence={addConsequence}
      />
    ),
    prep: (
      <SessionPrep
        importText={workspace.prep.importText}
        setImportText={setPrepImportText}
        parsedPrep={parsedPrep}
        prepQuality={prepQuality}
        repairPrompt={workspace.prep.lastRepairPrompt}
        onBuildRepairPrompt={storeRepairPrompt}
      />
    ),
    runtime: (
      <LiveRuntime
        scenes={scenes}
        activeSceneId={workspace.runtime.activeSceneId}
        setActiveSceneId={setActiveSceneId}
        completedScenes={completedSceneSet}
        toggleSceneComplete={toggleSceneComplete}
        publishedScenes={publishedSceneSet}
        publishScene={publishScene}
        notesByScene={workspace.runtime.notesByScene}
        setSceneNote={setSceneNote}
        clueStatuses={workspace.runtime.clueStatuses}
        setClueStatus={setClueStatus}
        panicLog={workspace.runtime.panicLog}
        onAddPanicPrompt={addPanicPrompt}
      />
    ),
    travel: (
      <JungleTravel
        travel={workspace.travel}
        chultMap={workspace.chultMap}
        partyMembers={workspace.party.members}
        onPatchTravel={patchTravel}
        onUpdateRole={updateTravelRole}
        onRollRole={rollTravelRole}
        onGenerateEvent={generateTravelEvent}
        onUndoLastTravelEvent={undoLastTravelEvent}
        onSendEventToRuntime={sendLastTravelEventToRuntime}
        onPublishEventToPlayers={publishLastTravelEventToPlayers}
        onSeedInitiative={seedInitiativeFromLastTravelEvent}
        onNavigate={setActiveModule}
      />
    ),
    "chult-map": (
      <ChultHexMap
        chultMap={workspace.chultMap}
        onPatchMap={patchChultMap}
        onSelectHex={selectChultHex}
        onPatchHex={patchChultHex}
        onToggleOverlay={toggleChultOverlay}
        onToggleRouteHex={toggleChultRouteHex}
        onMarkDiscovered={markChultDiscovered}
        onSaveRoutePreset={saveChultRoutePreset}
        onApplyRoutePreset={applyChultRoutePreset}
        onPublishRoute={publishChultRouteToPlayers}
        onNavigateTravel={() => setActiveModule("travel")}
      />
    ),
    encounter: (
      <EncounterTracker
        encounterState={workspace.encounter}
        encounter={encounters.find((item) => item.id === workspace.encounter.activeEncounterId) || encounters[0]}
        monsters={workspace.encounter.monsters}
        setMonsters={setMonsters}
        activeTurn={workspace.encounter.activeTurn}
        setActiveTurn={setActiveTurn}
        patchEncounter={patchEncounter}
      />
    ),
    initiative: (
      <InitiativeTracker
        initiative={workspace.initiative}
        onPatchInitiative={patchInitiative}
        onUpdateParticipant={updateInitiativeParticipant}
        onAddParticipant={addInitiativeParticipant}
        onAddMonster={addInitiativeMonster}
        onRemoveParticipant={removeInitiativeParticipant}
        onResetInitiative={resetInitiative}
      />
    ),
    spells: <SpellSheet />,
    items: <MagicItemSheet />,
    "magic-shop": <MagicShopGenerator />,
    treasure: <TreasureGenerator />,
    "random-encounter": <RandomEncounterGenerator onSeedInitiative={seedRandomEncounterToInitiative} />,
    "npc-gen": <RandomNpcGenerator generatedNpcs={workspace.npcs?.generated || []} onSaveNpc={saveGeneratedNpc} />,
    npcs: <NpcManager generatedNpcs={workspace.npcs?.generated || []} />,
    quests: <QuestLog />,
    player: (
      <PlayerView
        scenes={scenes}
        playerView={workspace.playerView}
        partyMembers={workspace.party.members}
        chultMap={workspace.chultMap}
        travel={workspace.travel}
        publishScene={publishScene}
      />
    ),
  }[activeModule];

  return (
    <AppShell modules={modules} activeModule={activeModule} onSelect={setActiveModule}>
      {screen}
    </AppShell>
  );
}

export default App;
