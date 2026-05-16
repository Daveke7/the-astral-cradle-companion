import { useMemo, useState } from "react";
import { Coins, Copy, Gem, LoaderCircle, PackageOpen, Search, Sparkles } from "lucide-react";
import {
  customMagicItemStorageKey,
  magicItemRarities,
} from "../data/systems/magicItemLibrary.js";
import { fetchSrdMagicItemDetail, fetchSrdMagicItemIndex } from "../utils/magicItems.js";
import { copyTreasure, generateTreasure } from "../utils/treasureGenerator.js";
import { useCompendiumEntries } from "../utils/useCompendiumEntries.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

const treasureTypes = [
  { id: "individual", label: "Individual" },
  { id: "individual-items", label: "Individual + item" },
  { id: "hoard", label: "Hoard" },
  { id: "hoard-salvage", label: "Hoard + salvage" },
];

const dangerModes = [
  { id: "nuisance", label: "Easy / nuisance" },
  { id: "standard", label: "Standard" },
  { id: "deadly", label: "Deadly / boss" },
];

const themes = ["Any", "Arcana", "Armaments", "Implements", "Relics", "Chult", "Thayan"];
const environments = ["Jungle", "Ruins", "Urban", "Undead"];
const rarityModes = [{ id: "by-level", label: "By level" }, ...magicItemRarities.map((rarity) => ({ id: rarity, label: rarity }))];

function normalizeImportedItem(item = {}, index = 0) {
  const safeName = item.name || `Private Magic Item ${index + 1}`;
  return {
    index: item.index || `private-${safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
    name: safeName,
    source: item.source || "Private local import",
    type: item.type || item.category || "Magic Item",
    rarity: item.rarity || "Unknown",
    attunement: Boolean(item.attunement),
    tags: Array.isArray(item.tags) ? item.tags : [],
    notes: item.notes || "",
    desc: Array.isArray(item.desc) ? item.desc : [item.desc || item.description || ""].filter(Boolean),
    properties: Array.isArray(item.properties) ? item.properties : [],
    damage: item.damage || "",
    weight: item.weight || "",
  };
}

function loadCustomItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(customMagicItemStorageKey) || "[]");
    return Array.isArray(stored) ? stored.map(normalizeImportedItem) : [];
  } catch {
    return [];
  }
}

function mergeItems(current, incoming) {
  const byIndex = new Map(current.map((item) => [item.index, item]));
  incoming.forEach((item) => byIndex.set(item.index, { ...(byIndex.get(item.index) || {}), ...item }));
  return Array.from(byIndex.values());
}

function CoinReadout({ coins }) {
  const entries = Object.entries(coins || {}).filter(([, value]) => value);
  if (!entries.length) return <EmptyState>Geen coins gerold.</EmptyState>;
  return (
    <div className="treasure-coin-grid">
      {entries.map(([coin, value]) => (
        <article key={coin}>
          <span>{coin}</span>
          <strong>{value.toLocaleString("nl-NL")}</strong>
        </article>
      ))}
    </div>
  );
}

export function TreasureGenerator() {
  const compendiumItems = useCompendiumEntries("magicItems");
  const [pcs, setPcs] = useState(5);
  const [level, setLevel] = useState(4);
  const [challengeRating, setChallengeRating] = useState(4);
  const [type, setType] = useState("hoard");
  const [danger, setDanger] = useState("standard");
  const [rarityMode, setRarityMode] = useState("by-level");
  const [theme, setTheme] = useState("Chult");
  const [environment, setEnvironment] = useState("Jungle");
  const [includeCampaignRelics, setIncludeCampaignRelics] = useState(false);
  const [onlineItems, setOnlineItems] = useState([]);
  const [treasure, setTreasure] = useState(null);
  const [loadState, setLoadState] = useState("idle");
  const [error, setError] = useState("");

  const customItems = useMemo(() => loadCustomItems(), []);
  const itemPool = useMemo(
    () => mergeItems(mergeItems(compendiumItems, customItems), onlineItems),
    [compendiumItems, customItems, onlineItems]
  );

  async function loadOpenItems() {
    setError("");
    setLoadState("loading");
    try {
      const index = await fetchSrdMagicItemIndex();
      const shuffled = [...index].sort(() => Math.random() - 0.5).slice(0, 48);
      const details = await Promise.all(shuffled.map((item) => fetchSrdMagicItemDetail(item)));
      setOnlineItems((current) => mergeItems(current, details));
      setLoadState("loaded");
    } catch (loadError) {
      setError(loadError.message || "Open magic items konden niet geladen worden.");
      setLoadState("error");
    }
  }

  function rollTreasure() {
    setTreasure(
      generateTreasure({
        itemPool,
        pcs,
        level,
        danger,
        challengeRating,
        type,
        rarityMode,
        theme,
        environment,
        includeCampaignRelics,
      })
    );
  }

  return (
    <main className="workspace treasure-page">
      <header className="topbar treasure-header">
        <div>
          <p className="label">Random Treasure Generator</p>
          <h1>Buit die meteen speelbaar is</h1>
          <span>Coins, valuables, salvage, magic items, hooks en DM-only context voor The Red Below.</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" type="button" onClick={loadOpenItems} disabled={loadState === "loading"}>
            {loadState === "loading" ? <LoaderCircle size={17} /> : <Search size={17} />} Laad open items
          </button>
          <button className="button button--primary" type="button" onClick={rollTreasure}>
            <Sparkles size={18} /> Roll treasure
          </button>
        </div>
      </header>

      <section className="treasure-layout">
        <Panel title="Generator controls" action={<Tag>{itemPool.length} items in pool</Tag>}>
          <div className="treasure-controls">
            <label>
              <span>Treasure type</span>
              <select value={type} onChange={(event) => setType(event.target.value)}>
                {treasureTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Danger</span>
              <select value={danger} onChange={(event) => setDanger(event.target.value)}>
                {dangerModes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Party level</span>
              <input type="number" min="1" max="20" value={level} onChange={(event) => setLevel(Number(event.target.value || 1))} />
            </label>
            <label>
              <span>PCs</span>
              <input type="number" min="1" max="10" value={pcs} onChange={(event) => setPcs(Number(event.target.value || 1))} />
            </label>
            <label>
              <span>CR / encounter</span>
              <input type="number" min="0" max="30" value={challengeRating} onChange={(event) => setChallengeRating(Number(event.target.value || 0))} />
            </label>
            <label>
              <span>Magic rarity</span>
              <select value={rarityMode} onChange={(event) => setRarityMode(event.target.value)}>
                {rarityModes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Theme</span>
              <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                {themes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Environment</span>
              <select value={environment} onChange={(event) => setEnvironment(event.target.value)}>
                {environments.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="treasure-check">
              <input
                type="checkbox"
                checked={includeCampaignRelics}
                onChange={(event) => setIncludeCampaignRelics(event.target.checked)}
              />
              <span>Campaign relics mogen mee rollen</span>
            </label>
          </div>
          {error ? <p className="monster-source-warning">{error}</p> : null}
          <div className="treasure-source-notes">
            <span>Private items uit je Magic Item Vault tellen automatisch mee.</span>
            <span>Campaign relics staan standaard uit, zodat PC-items niet per ongeluk loot worden.</span>
          </div>
        </Panel>

        <Panel
          title={treasure ? treasure.title : "Treasure output"}
          action={treasure ? <button className="button button--ghost" type="button" onClick={() => copyTreasure(treasure)}><Copy size={16} /> Kopieer treasure</button> : null}
          className="treasure-output-panel"
        >
          {treasure ? (
            <article className="treasure-output">
              <header>
                <div>
                  <span>{treasure.summary}</span>
                  <h2>{treasure.title}</h2>
                </div>
                <Tag tone="safe">~{treasure.totalEstimate.toLocaleString("nl-NL")} gp</Tag>
              </header>

              <section className="treasure-section">
                <h3><Coins size={17} /> Coins</h3>
                <CoinReadout coins={treasure.coins} />
              </section>

              <section className="treasure-section">
                <h3><Gem size={17} /> Valuables</h3>
                <div className="treasure-list">
                  {treasure.valuables.length ? treasure.valuables.map((item) => (
                    <article key={item.id}>
                      <strong>{item.name}</strong>
                      <span>{item.value}</span>
                    </article>
                  )) : <EmptyState>Geen valuables gerold.</EmptyState>}
                </div>
              </section>

              <section className="treasure-section">
                <h3><Sparkles size={17} /> Magic Items</h3>
                <div className="treasure-list treasure-list--items">
                  {treasure.magicItems.length ? treasure.magicItems.map((item) => (
                    <article key={item.index}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.rarity} / {item.type}</span>
                      </div>
                      <Tag tone={item.attunement ? "warning" : "safe"}>{item.attunement ? "Attune" : "Ready"}</Tag>
                    </article>
                  )) : <EmptyState>Geen magic items gerold.</EmptyState>}
                </div>
              </section>

              {treasure.salvage.length ? (
                <section className="treasure-section">
                  <h3><PackageOpen size={17} /> Salvage</h3>
                  <div className="treasure-list">
                    {treasure.salvage.map((item) => (
                      <article key={item.id}>
                        <strong>{item.name}</strong>
                        <span>{item.use}</span>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </article>
          ) : (
            <EmptyState>Kies de parameters en roll treasure.</EmptyState>
          )}
        </Panel>

        <aside className="treasure-side">
          <Panel title="Table notes">
            {treasure ? (
              <div className="treasure-notes">
                <article>
                  <strong>Player-safe</strong>
                  <span>{treasure.playerSafe}</span>
                </article>
                <article>
                  <strong>Hook</strong>
                  <span>{treasure.hook}</span>
                </article>
                <article>
                  <strong>DM-only</strong>
                  <span>{treasure.dmOnly}</span>
                </article>
              </div>
            ) : (
              <EmptyState>Na het rollen verschijnt hier de tafeltekst.</EmptyState>
            )}
          </Panel>

          <Panel title="Pool summary">
            <div className="treasure-pool">
              <span>Local compendium: {compendiumItems.length}</span>
              <span>Private imports: {customItems.length}</span>
              <span>Open loaded: {onlineItems.length}</span>
              <span>Relic safety: {includeCampaignRelics ? "aan" : "uit"}</span>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}
