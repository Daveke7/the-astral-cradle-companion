import { useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, FileJson, Layers3, Search, Trash2 } from "lucide-react";
import { buildEnemySearchIndex } from "../utils/enemySearchIndex.js";
import { monsterMatchesSearch, monsterSearchRank } from "../utils/monsterStatblocks.js";
import { monsterToRpgCard, serializeMonsterCards, summarizeCardContents } from "../utils/monsterCardExporter.js";
import { useCompendiumEntries } from "../utils/useCompendiumEntries.js";
import { useCopyFeedback } from "../utils/useCopyFeedback.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

const rpgCardsUrl = "https://crobi.github.io/rpg-cards/generator/generate.html";

function monsterKey(monster = {}) {
  return monster.index || monster.name;
}

function crNumber(value) {
  if (value === undefined || value === null || value === "" || value === "?") return 999;
  const text = String(value).trim();
  if (text.includes("/")) {
    const [left, right] = text.split("/").map(Number);
    return right ? left / right : 999;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 999;
}

function CopyIcon({ active }) {
  return active ? <Check size={16} /> : <Copy size={16} />;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function ResultButton({ monster, active, onAdd }) {
  return (
    <button className={active ? "monster-card-result monster-card-result--active" : "monster-card-result"} type="button" onClick={() => onAdd(monster)}>
      <span>
        <strong>{monster.name}</strong>
        <small>
          {[monster.size, monster.type, monster.cr ? `CR ${monster.cr}` : "", monster.source].filter(Boolean).join(" / ")}
        </small>
      </span>
      <Tag tone={active ? "safe" : "neutral"}>{active ? "Geselecteerd" : "Add"}</Tag>
    </button>
  );
}

function MiniPreviewCard({ monster, options }) {
  const card = monsterToRpgCard(monster, options);
  const summary = summarizeCardContents(card);
  return (
    <article className="monster-print-card">
      <header>
        <span>{monster.role || "Enemy"}</span>
        <h3>{card.title}</h3>
        <small>{[monster.size, monster.type, monster.alignment].filter(Boolean).join(" ") || "Statblock card"}</small>
      </header>
      <div className="monster-print-card__stats">
        <span>AC <strong>{monster.armorClassText || monster.ac || "-"}</strong></span>
        <span>HP <strong>{monster.hp || monster.maxHp || "-"}</strong></span>
        <span>CR <strong>{monster.cr || "?"}</strong></span>
      </div>
      <pre>{summary}</pre>
    </article>
  );
}

export function MonsterCardForge() {
  const compendiumMonsters = useCompendiumEntries("monsters");
  const { copyWithFeedback, isCopied } = useCopyFeedback();
  const enemies = useMemo(() => buildEnemySearchIndex(compendiumMonsters), [compendiumMonsters]);
  const [query, setQuery] = useState("");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [counts, setCounts] = useState({});
  const [mode, setMode] = useState("compact");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeRawText, setIncludeRawText] = useState(false);

  const selectedMonsters = useMemo(
    () =>
      selectedKeys
        .map((key) => enemies.find((monster) => monsterKey(monster) === key))
        .filter(Boolean)
        .map((monster) => ({ ...monster, cardCount: counts[monsterKey(monster)] || 1 })),
    [counts, enemies, selectedKeys]
  );

  const cardOptions = useMemo(
    () => ({ mode, includeImages, includeRawText, icon: "imp-laugh" }),
    [includeImages, includeRawText, mode]
  );
  const exportJson = useMemo(() => serializeMonsterCards(selectedMonsters, cardOptions), [cardOptions, selectedMonsters]);
  const cardCount = selectedMonsters.reduce((sum, monster) => sum + Number(monster.cardCount || 1), 0);

  const results = useMemo(() => {
    const source = query.trim()
      ? enemies.filter((monster) => monsterMatchesSearch(monster, query))
      : enemies
          .filter((monster) => monster.actions?.length || monster.traits?.length || monster.rawText)
          .sort((left, right) => crNumber(left.cr) - crNumber(right.cr) || left.name.localeCompare(right.name));

    return source
      .sort((left, right) => monsterSearchRank(left, query) - monsterSearchRank(right, query) || left.name.localeCompare(right.name))
      .slice(0, 48);
  }, [enemies, query]);

  function addMonster(monster) {
    const key = monsterKey(monster);
    setSelectedKeys((current) => (current.includes(key) ? current : [...current, key]));
    setCounts((current) => ({ ...current, [key]: current[key] || 1 }));
  }

  function removeMonster(key) {
    setSelectedKeys((current) => current.filter((item) => item !== key));
  }

  function updateCount(key, value) {
    const count = Math.max(1, Math.min(12, Number(value || 1)));
    setCounts((current) => ({ ...current, [key]: count }));
  }

  function copyExport() {
    copyWithFeedback(exportJson, "monster-card-export-json");
  }

  function downloadExport() {
    downloadText(`monster-cards-${new Date().toISOString().slice(0, 10)}.json`, exportJson);
  }

  return (
    <main className="workspace monster-card-forge">
      <header className="topbar">
        <div>
          <p className="label">Monster Card Forge</p>
          <h1>Enemies ombouwen naar kaartjes</h1>
          <span>Zoek monsters, kies aantallen, preview de kaartjes en exporteer direct naar rpg-cards JSON.</span>
        </div>
        <div className="topbar__actions">
          <a className="button button--ghost" href={rpgCardsUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={17} /> Open rpg-cards
          </a>
          <button
            className={isCopied("monster-card-export-json") ? "button button--primary copy-confirm copy-confirm--active" : "button button--primary copy-confirm"}
            type="button"
            onClick={copyExport}
            disabled={!selectedMonsters.length}
            aria-live="polite"
          >
            <CopyIcon active={isCopied("monster-card-export-json")} />
            {isCopied("monster-card-export-json") ? "Gekopieerd" : "Kopieer JSON"}
          </button>
        </div>
      </header>

      <section className="monster-card-forge__summary">
        <article>
          <span>Bronnen</span>
          <strong>{enemies.length}</strong>
          <small>enemies in index</small>
        </article>
        <article>
          <span>Selectie</span>
          <strong>{selectedMonsters.length}</strong>
          <small>unieke statblocks</small>
        </article>
        <article>
          <span>Output</span>
          <strong>{cardCount}</strong>
          <small>kaartjes</small>
        </article>
      </section>

      <section className="monster-card-forge__layout">
        <div className="main-column">
          <Panel title="Monster zoeken">
            <label className="monster-card-search">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek op naam, type, bron, CR, Chult, humanoid..." />
            </label>
            <div className="monster-card-results">
              {results.map((monster) => (
                <ResultButton
                  key={monsterKey(monster)}
                  monster={monster}
                  active={selectedKeys.includes(monsterKey(monster))}
                  onAdd={addMonster}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Kaart preview" action={<Tag tone="safe">{cardCount || 0} cards</Tag>}>
            {selectedMonsters.length ? (
              <div className="monster-print-grid">
                {selectedMonsters.slice(0, 8).map((monster) => (
                  <MiniPreviewCard key={monsterKey(monster)} monster={monster} options={cardOptions} />
                ))}
              </div>
            ) : (
              <EmptyState>Selecteer links een paar enemies om kaartjes te previewen.</EmptyState>
            )}
          </Panel>
        </div>

        <aside className="side-column">
          <Panel
            title="Export setup"
            action={
              <button className="button button--ghost" type="button" onClick={downloadExport} disabled={!selectedMonsters.length}>
                <Download size={16} /> Download
              </button>
            }
          >
            <div className="monster-card-options">
              <label>
                <span>Kaart inhoud</span>
                <select value={mode} onChange={(event) => setMode(event.target.value)}>
                  <option value="compact">Compact tafelkaartje</option>
                  <option value="full">Volledige statblock</option>
                </select>
              </label>
              <label className="check-row">
                <input type="checkbox" checked={includeImages} onChange={(event) => setIncludeImages(event.target.checked)} />
                <span>Gebruik image URL als background_image</span>
              </label>
              <label className="check-row">
                <input type="checkbox" checked={includeRawText} onChange={(event) => setIncludeRawText(event.target.checked)} />
                <span>Raw statblock toevoegen</span>
              </label>
            </div>
            <div className="monster-card-format-note">
              <FileJson size={17} />
              <span>Export volgt het rpg-cards formaat: title, icon, contents en optioneel background_image.</span>
            </div>
          </Panel>

          <Panel title="Geselecteerde enemies">
            {selectedMonsters.length ? (
              <div className="monster-card-selection">
                {selectedMonsters.map((monster) => {
                  const key = monsterKey(monster);
                  return (
                    <article key={key}>
                      <div>
                        <strong>{monster.name}</strong>
                        <small>{[monster.type, monster.cr ? `CR ${monster.cr}` : "", monster.source].filter(Boolean).join(" / ")}</small>
                      </div>
                      <label>
                        <Layers3 size={14} />
                        <input type="number" min="1" max="12" value={counts[key] || 1} onChange={(event) => updateCount(key, event.target.value)} />
                      </label>
                      <button className="icon-button" type="button" onClick={() => removeMonster(key)} aria-label={`${monster.name} verwijderen`}>
                        <Trash2 size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState>Nog geen monsters geselecteerd.</EmptyState>
            )}
          </Panel>

          <Panel title="JSON output">
            {selectedMonsters.length ? (
              <pre className="monster-card-json">{exportJson}</pre>
            ) : (
              <EmptyState>De JSON verschijnt zodra je een monster selecteert.</EmptyState>
            )}
          </Panel>
        </aside>
      </section>
    </main>
  );
}
