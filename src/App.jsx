import { useMemo, useState } from "react";
import { AppShell } from "./components/AppShell.jsx";
import { CampaignHub } from "./components/CampaignHub.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { EncounterTracker } from "./components/EncounterTracker.jsx";
import { LiveRuntime } from "./components/LiveRuntime.jsx";
import { NpcManager } from "./components/NpcManager.jsx";
import { PlayerView } from "./components/PlayerView.jsx";
import { QuestLog } from "./components/QuestLog.jsx";
import { SessionPrep } from "./components/SessionPrep.jsx";
import { encounters, scenes } from "./data/campaignData.js";

const modules = [
  { id: "dashboard", label: "Dashboard" },
  { id: "campaign", label: "Campaign Hub" },
  { id: "prep", label: "Sessie Prep" },
  { id: "runtime", label: "Live Runtime" },
  { id: "encounter", label: "Encounter" },
  { id: "npcs", label: "NPCs" },
  { id: "quests", label: "Quests" },
  { id: "player", label: "Player View" },
];

function parsePrepMarkdown(text) {
  if (!text.trim()) return [];

  const headingPattern = /^(?:#{1,3}\s*)?(Scene|NPC|Encounter|Handout|Loot)\s*:?\s*(.+)$/gim;
  return [...text.matchAll(headingPattern)].map((match) => ({
    type: match[1],
    title: match[2].trim().replace(/\*+/g, ""),
  }));
}

function App() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [activeSceneId, setActiveSceneId] = useState(scenes[0].id);
  const [completedScenes, setCompletedScenes] = useState(() => new Set());
  const [publishedScenes, setPublishedScenes] = useState(() => new Set([scenes[0].id]));
  const [notes, setNotes] = useState("");
  const [importText, setImportText] = useState("## Scene: Regen boven Firefinger\nDM-only: Zorath was hier eerder.\nPlayer-safe: De toren staat als een zwarte tand boven de jungle.\n\n## Encounter: Pterafolk scouts\nDoel: vang een scout levend.");
  const [monsters, setMonsters] = useState(encounters[0].monsters);
  const [activeTurn, setActiveTurn] = useState(0);

  const structuredImport = useMemo(() => parsePrepMarkdown(importText), [importText]);

  function toggleSceneComplete(sceneId) {
    setCompletedScenes((current) => {
      const next = new Set(current);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  }

  function publishScene(sceneId) {
    setPublishedScenes((current) => new Set(current).add(sceneId));
  }

  const screen = {
    dashboard: (
      <Dashboard
        onNavigate={setActiveModule}
        completedScenes={completedScenes}
        publishedCount={publishedScenes.size}
      />
    ),
    campaign: <CampaignHub />,
    prep: (
      <SessionPrep
        importText={importText}
        setImportText={setImportText}
        structuredImport={structuredImport}
      />
    ),
    runtime: (
      <LiveRuntime
        activeSceneId={activeSceneId}
        setActiveSceneId={setActiveSceneId}
        completedScenes={completedScenes}
        toggleSceneComplete={toggleSceneComplete}
        publishedScenes={publishedScenes}
        publishScene={publishScene}
        notes={notes}
        setNotes={setNotes}
      />
    ),
    encounter: (
      <EncounterTracker
        monsters={monsters}
        setMonsters={setMonsters}
        activeTurn={activeTurn}
        setActiveTurn={setActiveTurn}
      />
    ),
    npcs: <NpcManager />,
    quests: <QuestLog />,
    player: <PlayerView publishedScenes={publishedScenes} publishScene={publishScene} />,
  }[activeModule];

  return (
    <AppShell modules={modules} activeModule={activeModule} onSelect={setActiveModule}>
      {screen}
    </AppShell>
  );
}

export default App;
