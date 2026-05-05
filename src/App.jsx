import { useCallback, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell.jsx";
import { CampaignHub } from "./components/CampaignHub.jsx";
import { CampaignOs } from "./components/CampaignOs.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { EncounterTracker } from "./components/EncounterTracker.jsx";
import { ImportCenter } from "./components/ImportCenter.jsx";
import { InitiativeTracker } from "./components/InitiativeTracker.jsx";
import { LiveRuntime } from "./components/LiveRuntime.jsx";
import { MemoryGraph } from "./components/MemoryGraph.jsx";
import { NpcManager } from "./components/NpcManager.jsx";
import { PartyPage } from "./components/PartyPage.jsx";
import { PlayerView } from "./components/PlayerView.jsx";
import { QuestLog } from "./components/QuestLog.jsx";
import { SessionPrep } from "./components/SessionPrep.jsx";
import { encounters, scenes as seedScenes } from "./data/campaignData.js";
import { normalizeWorkspaceState } from "./data/workspaceState.js";
import { analyzePrepQuality, buildRepairPrompt, parsePrepOutput } from "./utils/aiPrepParser.js";
import { parsePartyImport } from "./utils/partyImportParser.js";
import { useDebouncedSave } from "./utils/useDebouncedSave.js";
import { loadWorkspaceState, saveWorkspaceState } from "./utils/workspaceStorage.js";

const modules = [
  { id: "dashboard", label: "Dashboard" },
  { id: "campaign", label: "Campaign Hub" },
  { id: "party", label: "Mijn Party" },
  { id: "import", label: "Imports" },
  { id: "memory", label: "Memory Graph" },
  { id: "os", label: "Campaign OS" },
  { id: "prep", label: "Sessie Prep" },
  { id: "runtime", label: "Live Runtime" },
  { id: "initiative", label: "Initiative" },
  { id: "encounter", label: "Encounter" },
  { id: "npcs", label: "NPCs" },
  { id: "quests", label: "Quests" },
  { id: "player", label: "Player View" },
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

  function analyzePartyImport() {
    persist((current) => ({
      ...current,
      imports: {
        ...current.imports,
        review: parsePartyImport(current.imports),
      },
    }));
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
        "race",
        "ac",
        "maxHp",
        "passivePerception",
        "spellSaveDc",
        "gear",
        "notes",
        "beyondUrl",
        "beyondCharacterId",
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
        ac: member.ac,
        maxHp: member.maxHp,
        passivePerception: member.passivePerception,
        spellSaveDc: member.spellSaveDc,
        gear: member.gear,
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
      initiative: {
        ...current.initiative,
        participants: [
          ...current.initiative.participants,
          {
            id: `turn-${Date.now()}`,
            name: "Nieuwe deelnemer",
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
          },
        ],
      },
    }));
  }

  function removeInitiativeParticipant(participantId) {
    persist((current) => ({
      ...current,
      initiative: {
        ...current.initiative,
        activeIndex: 0,
        participants: current.initiative.participants.filter((participant) => participant.id !== participantId),
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
        onNavigate={setActiveModule}
        completedScenes={completedSceneSet}
        publishedCount={publishedSceneSet.size}
        prepQuality={prepQuality}
      />
    ),
    campaign: <CampaignHub workspace={workspace} />,
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
        onRemoveParticipant={removeInitiativeParticipant}
        onResetInitiative={resetInitiative}
      />
    ),
    npcs: <NpcManager />,
    quests: <QuestLog />,
    player: (
      <PlayerView
        scenes={scenes}
        playerView={workspace.playerView}
        partyMembers={workspace.party.members}
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
