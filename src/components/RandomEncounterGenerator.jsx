import { useMemo, useState } from "react";
import { Copy, LoaderCircle, Route, Search, ShieldAlert, Sparkles, Swords } from "lucide-react";
import { buildEnemySearchIndex } from "../utils/enemySearchIndex.js";
import { fetchSrdMonsterDetail, fetchSrdMonsterIndex } from "../utils/monsterStatblocks.js";
import { monsterImagePromptJson, monsterImagePromptSummary } from "../utils/monsterImagePrompts.js";
import { copyRandomEncounter, generateRandomEncounter } from "../utils/randomEncounterGenerator.js";
import { useCompendiumEntries } from "../utils/useCompendiumEntries.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

const difficulties = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "deadly", label: "Deadly" },
];

const environments = ["Jungle", "Ruins", "River", "City", "Swamp", "Coast", "Dungeon", "Any"];
const themes = ["Chult", "Thayan", "Undead", "Beasts", "Humanoids", "Arcane", "Aerial", "Any"];
const shapes = [
  { id: "patrol", label: "Patrol" },
  { id: "ambush", label: "Ambush" },
  { id: "lair", label: "Lair" },
  { id: "boss", label: "Boss + support" },
  { id: "swarm", label: "Swarm" },
  { id: "hazard", label: "Hazard fight" },
];

function mergeMonsters(current, incoming) {
  const byIndex = new Map(current.map((monster) => [monster.index, monster]));
  incoming.forEach((monster) => byIndex.set(monster.index, { ...(byIndex.get(monster.index) || {}), ...monster }));
  return Array.from(byIndex.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function difficultyTone(difficulty) {
  if (difficulty === "deadly") return "danger";
  if (difficulty === "hard") return "warning";
  return "safe";
}

export function RandomEncounterGenerator({ onSeedInitiative }) {
  const compendiumMonsters = useCompendiumEntries("monsters");
  const [partyLevel, setPartyLevel] = useState(4);
  const [pcs, setPcs] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [environment, setEnvironment] = useState("Jungle");
  const [theme, setTheme] = useState("Chult");
  const [shape, setShape] = useState("ambush");
  const [maxCreatures, setMaxCreatures] = useState(7);
  const [includeCampaignThreats, setIncludeCampaignThreats] = useState(true);
  const [onlineMonsters, setOnlineMonsters] = useState([]);
  const [encounter, setEncounter] = useState(null);
  const [loadState, setLoadState] = useState("idle");
  const [error, setError] = useState("");

  const monsterPool = useMemo(() => buildEnemySearchIndex(mergeMonsters(compendiumMonsters, onlineMonsters)), [compendiumMonsters, onlineMonsters]);
  const usableMonsters = monsterPool.filter((monster) => Number(monster.xp || 0) > 0);

  async function loadOpenMonsters() {
    setError("");
    setLoadState("loading");
    try {
      const index = await fetchSrdMonsterIndex();
      const detailCandidates = index
        .filter((monster) => {
          const text = `${monster.name} ${monster.type} ${monster.tags?.join(" ")}`.toLowerCase();
          if (environment === "Any") return true;
          if (environment === "Jungle") return /ape|spider|tiger|crocodile|wasp|dinosaur|snake|frog|lizard/.test(text);
          if (environment === "Undead") return /zombie|skeleton|ghost|wight|ghoul/.test(text);
          return true;
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, 42);
      const details = await Promise.all(detailCandidates.map((monster) => fetchSrdMonsterDetail(monster)));
      setOnlineMonsters((current) => mergeMonsters(current, details));
      setLoadState("loaded");
    } catch (loadError) {
      setError(loadError.message || "Open monsterdata kon niet geladen worden.");
      setLoadState("error");
    }
  }

  function rollEncounter() {
    setEncounter(
      generateRandomEncounter({
        monsters: usableMonsters,
        partyLevel,
        pcs,
        difficulty,
        environment,
        theme,
        shape,
        includeCampaignThreats,
        maxCreatures,
      })
    );
  }

  return (
    <main className="workspace random-encounter-page">
      <header className="topbar random-encounter-header">
        <div>
          <p className="label">Random Encounter Generator</p>
          <h1>Encounter die direct naar Initiative kan</h1>
          <span>XP-budget, environment, theme, monsters, tactics, timer en battlefield in één worp.</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" type="button" onClick={loadOpenMonsters} disabled={loadState === "loading"}>
            {loadState === "loading" ? <LoaderCircle size={17} /> : <Search size={17} />} Laad open monsters
          </button>
          <button className="button button--primary" type="button" onClick={rollEncounter}>
            <Sparkles size={18} /> Roll encounter
          </button>
        </div>
      </header>

      <section className="random-encounter-layout">
        <Panel title="Generator controls" action={<Tag>{usableMonsters.length} monsters in pool</Tag>}>
          <div className="random-encounter-controls">
            <label>
              <span>Difficulty</span>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                {difficulties.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Shape</span>
              <select value={shape} onChange={(event) => setShape(event.target.value)}>
                {shapes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Party level</span>
              <input type="number" min="1" max="20" value={partyLevel} onChange={(event) => setPartyLevel(Number(event.target.value || 1))} />
            </label>
            <label>
              <span>PCs</span>
              <input type="number" min="1" max="10" value={pcs} onChange={(event) => setPcs(Number(event.target.value || 1))} />
            </label>
            <label>
              <span>Environment</span>
              <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
                {environments.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Theme</span>
              <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                {themes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Max creatures</span>
              <input type="number" min="1" max="18" value={maxCreatures} onChange={(event) => setMaxCreatures(Number(event.target.value || 1))} />
            </label>
            <label className="random-encounter-check">
              <input
                type="checkbox"
                checked={includeCampaignThreats}
                onChange={(event) => setIncludeCampaignThreats(event.target.checked)}
              />
              <span>Campaign threats mogen mee rollen</span>
            </label>
          </div>
          {error ? <p className="monster-source-warning">{error}</p> : null}
          <div className="random-encounter-source-notes">
            <span>De generator gebruikt dezelfde enemy index als Initiative en Enemies, inclusief de lokale PDF library.</span>
            <span>Open monsters blijven optioneel; de app heeft nu al een grote offline pool.</span>
          </div>
        </Panel>

        <Panel
          title={encounter ? encounter.title : "Encounter output"}
          action={
            encounter ? (
              <div className="random-encounter-actions">
                <button className="button button--ghost" type="button" onClick={() => copyRandomEncounter(encounter)}>
                  <Copy size={16} /> Kopieer
                </button>
                <button className="button button--primary" type="button" onClick={() => onSeedInitiative?.(encounter)}>
                  <Swords size={16} /> Naar Initiative
                </button>
              </div>
            ) : null
          }
          className="random-encounter-output-panel"
        >
          {encounter ? (
            <article className="random-encounter-output">
              <header>
                <div>
                  <span>{encounter.summary}</span>
                  <h2>{encounter.title}</h2>
                </div>
                <Tag tone={difficultyTone(encounter.difficulty)}>{encounter.difficulty}</Tag>
              </header>

              <div className="random-encounter-stats">
                <article><span>Target XP</span><strong>{encounter.targetXp}</strong></article>
                <article><span>Raw XP</span><strong>{encounter.rawXp}</strong></article>
                <article><span>Adjusted</span><strong>{encounter.adjustedXp}</strong></article>
                <article><span>Multiplier</span><strong>x{encounter.multiplier}</strong></article>
              </div>

              <section className="random-encounter-section">
                <h3><Swords size={17} /> Monsters</h3>
                <div className="random-encounter-monsters">
                  {encounter.monsters.map((entry) => (
                    <article key={entry.monster.index}>
                      <div>
                        <strong>{entry.count}x {entry.monster.name}</strong>
                        <span>CR {entry.monster.cr} / {entry.monster.role} / {entry.monster.xp} XP</span>
                        <span>{monsterImagePromptSummary(entry.monster)}</span>
                      </div>
                      <button className="button button--ghost" type="button" onClick={() => navigator.clipboard?.writeText(monsterImagePromptJson(entry.monster))}>
                        <Copy size={15} /> JSON
                      </button>
                      <Tag tone={entry.monster.source?.includes("Campaign") ? "warning" : "safe"}>{entry.monster.type || "monster"}</Tag>
                    </article>
                  ))}
                </div>
              </section>

              <section className="random-encounter-brief">
                <p><strong>Objective</strong><span>{encounter.objective}</span></p>
                <p><strong>Timer</strong><span>{encounter.timer}</span></p>
                <p><strong>Battlefield</strong><span>{encounter.battlefield}</span></p>
                <p><strong>Hook</strong><span>{encounter.hook}</span></p>
              </section>
            </article>
          ) : (
            <EmptyState>Kies parameters en roll een encounter.</EmptyState>
          )}
        </Panel>

        <aside className="random-encounter-side">
          <Panel title="Tactics">
            {encounter ? (
              <div className="random-encounter-tactics">
                {encounter.tactics.map((line) => (
                  <article key={line}>
                    <ShieldAlert size={16} />
                    <span>{line}</span>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState>Na het rollen verschijnen hier tactieken.</EmptyState>
            )}
          </Panel>

          <Panel title="Table text">
            {encounter ? (
              <div className="random-encounter-table-text">
                <article>
                  <Route size={16} />
                  <div>
                    <strong>Player-safe</strong>
                    <span>{encounter.playerSafe}</span>
                  </div>
                </article>
                <article>
                  <ShieldAlert size={16} />
                  <div>
                    <strong>DM-only</strong>
                    <span>{encounter.dmOnly}</span>
                  </div>
                </article>
              </div>
            ) : (
              <EmptyState>Geen encounter gerold.</EmptyState>
            )}
          </Panel>
        </aside>
      </section>
    </main>
  );
}
