import { useMemo, useState } from "react";
import { BookOpen, Check, Copy, Image as ImageIcon, Search, Shield, SlidersHorizontal, Swords } from "lucide-react";
import { fallbackMonsterLibrary } from "../data/systems/monsterLibrary.js";
import { buildEnemySearchIndex } from "../utils/enemySearchIndex.js";
import { abilityModifier, monsterMatchesSearch, monsterSearchRank } from "../utils/monsterStatblocks.js";
import { monsterImagePromptJson, monsterImagePromptSummary } from "../utils/monsterImagePrompts.js";
import { useCompendiumEntries } from "../utils/useCompendiumEntries.js";
import { useCopyFeedback } from "../utils/useCopyFeedback.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

const crBands = [
  { id: "all", label: "Alle CR" },
  { id: "zero", label: "0-1", min: 0, max: 1 },
  { id: "low", label: "2-4", min: 2, max: 4 },
  { id: "mid", label: "5-10", min: 5, max: 10 },
  { id: "high", label: "11+", min: 11, max: 99 },
  { id: "unknown", label: "Onbekend" },
];

const sourceFilters = [
  { id: "all", label: "Alle bronnen" },
  { id: "pdf", label: "DnD 5 Monsters PDF" },
  { id: "campaign", label: "Campaign" },
  { id: "toa", label: "ToA / Chult" },
  { id: "custom", label: "Custom" },
  { id: "imported", label: "Imports" },
];

const sortOptions = [
  { id: "name", label: "Naam" },
  { id: "cr", label: "CR laag-hoog" },
  { id: "cr-desc", label: "CR hoog-laag" },
  { id: "source", label: "Bron" },
];

function crNumber(value) {
  if (value === undefined || value === null || value === "" || value === "?" || value === "-") return null;
  const text = String(value).trim();
  if (text.includes("/")) {
    const [left, right] = text.split("/").map(Number);
    return right ? left / right : null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function sourceBucket(enemy = {}) {
  const source = `${enemy.source || ""} ${enemy.sourceType || ""}`.toLowerCase();
  if (source.includes("dnd 5 monsters pdf")) return "pdf";
  if (source.includes("campaign")) return "campaign";
  if (source.includes("toa") || source.includes("chult")) return "toa";
  if (source.includes("custom")) return "custom";
  if (source.includes("private") || source.includes("import")) return "imported";
  return "imported";
}

function matchesCrBand(enemy, bandId) {
  if (bandId === "all") return true;
  const value = crNumber(enemy.cr);
  if (bandId === "unknown") return value === null;
  const band = crBands.find((item) => item.id === bandId);
  if (!band || value === null) return false;
  return value >= band.min && value <= band.max;
}

function compareEnemies(sortBy) {
  return (left, right) => {
    if (sortBy === "cr" || sortBy === "cr-desc") {
      const leftCr = crNumber(left.cr) ?? 999;
      const rightCr = crNumber(right.cr) ?? 999;
      return sortBy === "cr" ? leftCr - rightCr || left.name.localeCompare(right.name) : rightCr - leftCr || left.name.localeCompare(right.name);
    }
    if (sortBy === "source") {
      return String(left.source || "").localeCompare(String(right.source || "")) || left.name.localeCompare(right.name);
    }
    return left.name.localeCompare(right.name);
  };
}

function formatMapEntries(value = {}, fallback = "") {
  const entries = Object.entries(value || {});
  if (!entries.length) return fallback || "-";
  return entries.map(([key, item]) => `${key} ${item}`).join(", ");
}

function detailText(value = "") {
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");
  return String(value || "").trim();
}

function shortSummary(enemy = {}) {
  const firstTrait = enemy.traits?.[0];
  const firstAction = enemy.actions?.[0];
  return detailText(firstTrait?.desc || firstAction?.desc || enemy.rawText || "Geen statblocktekst gevonden.");
}

function renderActionSection(title, actions = []) {
  if (!actions?.length) return null;
  return (
    <section className="enemy-detail-section">
      <h3>{title}</h3>
      <div className="monster-action-list">
        {actions.map((action) => (
          <article key={`${title}-${action.name}-${action.desc}`}>
            <div>
              <strong>{action.name}</strong>
              <span>
                {action.attack ? `${action.attack} to hit` : ""}
                {action.attack && action.damage ? " / " : ""}
                {action.damage || ""}
              </span>
            </div>
            {detailText(action.desc) ? <p>{detailText(action.desc)}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function CopyConfirmIcon({ active, size = 14 }) {
  return active ? <Check size={size} /> : <Copy size={size} />;
}

function EnemyDetail({ enemy, count, onCountChange, onAddMonster, onNavigate, onCopyJson, isCopied }) {
  if (!enemy) {
    return <EmptyState>Kies links een enemy om de volledige statblock te zien.</EmptyState>;
  }

  const abilities = enemy.abilities || {};
  const detailJsonKey = `enemy-detail-json-${enemy.index}`;
  const detailJsonCopied = isCopied?.(detailJsonKey);

  return (
    <article className="enemy-detail-card">
      <header className="enemy-detail-card__head">
        <div>
          <span>{enemy.source || "Local enemy library"}</span>
          <h2>{enemy.name}</h2>
          <p>
            {[enemy.size, enemy.type, enemy.alignment].filter(Boolean).join(" ")}
            {enemy.cr ? ` / CR ${enemy.cr}` : ""}
          </p>
        </div>
        <Tag tone={sourceBucket(enemy) === "campaign" ? "warning" : "safe"}>{enemy.role || "Enemy"}</Tag>
      </header>

      <div className="enemy-detail-actions">
        <label className="enemy-count-control">
          x
          <input type="number" min="1" max="12" value={count} onChange={(event) => onCountChange(event.target.value)} />
        </label>
        <button className="button button--primary" type="button" onClick={() => onAddMonster?.(enemy, count)}>
          <Swords size={17} /> Voeg toe aan Initiative
        </button>
        <button className="button button--ghost" type="button" onClick={() => onNavigate?.("initiative")}>
          <BookOpen size={17} /> Open Initiative
        </button>
      </div>

      <div className="monster-core-grid">
        <article><span>AC</span><strong>{enemy.armorClassText || enemy.ac || "-"}</strong></article>
        <article><span>HP</span><strong>{enemy.hp || enemy.maxHp || "-"}</strong></article>
        <article><span>Speed</span><strong>{enemy.speed || "-"}</strong></article>
        <article><span>XP</span><strong>{enemy.xp || "-"}</strong></article>
      </div>

      <div className="monster-ability-grid">
        {["str", "dex", "con", "int", "wis", "cha"].map((ability) => {
          const score = Number(abilities[ability] || 10);
          return (
            <article key={ability}>
              <span>{ability.toUpperCase()}</span>
              <strong>{score}</strong>
              <small>{abilityModifier(score) >= 0 ? "+" : ""}{abilityModifier(score)}</small>
            </article>
          );
        })}
      </div>

      <div className="monster-detail-lines">
        <p><strong>Saves</strong><span>{formatMapEntries(enemy.saves, enemy.savingThrowsText)}</span></p>
        <p><strong>Skills</strong><span>{formatMapEntries(enemy.skills, enemy.skillsText)}</span></p>
        <p><strong>Damage</strong><span>{[enemy.damageVulnerabilities && `Vuln: ${enemy.damageVulnerabilities}`, enemy.damageResistances && `Res: ${enemy.damageResistances}`, enemy.damageImmunities && `Imm: ${enemy.damageImmunities}`].filter(Boolean).join(" / ") || "-"}</span></p>
        <p><strong>Conditions</strong><span>{enemy.conditionImmunities || "-"}</span></p>
        <p><strong>Senses</strong><span>{enemy.senses || "-"}</span></p>
        <p><strong>Languages</strong><span>{enemy.languages || "-"}</span></p>
        <p>
          <strong>Links</strong>
          <span>
            {enemy.sourceUrl ? <a href={enemy.sourceUrl} target="_blank" rel="noreferrer">source</a> : null}
            {enemy.sourceUrl && enemy.imageUrl ? " / " : ""}
            {enemy.imageUrl ? <a href={enemy.imageUrl} target="_blank" rel="noreferrer">image ref</a> : null}
            {!enemy.sourceUrl && !enemy.imageUrl ? "-" : ""}
          </span>
        </p>
      </div>

      {enemy.traits?.length ? (
        <section className="enemy-detail-section">
          <h3>Traits</h3>
          <div className="monster-trait-list">
            {enemy.traits.map((trait) => (
              <article key={`${trait.name}-${trait.desc}`}>
                <strong>{trait.name}</strong>
                <span>{detailText(trait.desc)}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {renderActionSection("Actions", enemy.actions)}
      {renderActionSection("Bonus Actions", enemy.bonusActions)}
      {renderActionSection("Reactions", enemy.reactions)}
      {renderActionSection("Legendary Actions", enemy.legendaryActions)}
      {renderActionSection("Mythic Actions", enemy.mythicActions)}
      {renderActionSection("Lair Actions", enemy.lairActions)}

      <section className="monster-image-prompt">
        <header>
          <div>
            <ImageIcon size={16} />
            <span>Image prompt</span>
          </div>
          <div className="monster-image-prompt__actions">
            <button
              className={detailJsonCopied ? "copy-confirm copy-confirm--active" : "copy-confirm"}
              type="button"
              onClick={() => onCopyJson?.(enemy, detailJsonKey)}
              aria-live="polite"
            >
              <CopyConfirmIcon active={detailJsonCopied} /> {detailJsonCopied ? "Gekopieerd" : "JSON"}
            </button>
          </div>
        </header>
        <p>{monsterImagePromptSummary(enemy)}</p>
        <pre>{monsterImagePromptJson(enemy)}</pre>
      </section>

      {enemy.rawText ? (
        <details className="enemy-raw-statblock">
          <summary>Volledige PDF tekst</summary>
          <pre>{enemy.rawText}</pre>
        </details>
      ) : null}
    </article>
  );
}

export function EnemyBrowser({ onAddMonster, onNavigate }) {
  const compendiumMonsters = useCompendiumEntries("monsters");
  const { copyWithFeedback, isCopied } = useCopyFeedback();
  const enemyIndex = useMemo(() => buildEnemySearchIndex(compendiumMonsters), [compendiumMonsters]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [crFilter, setCrFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [count, setCount] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(() => enemyIndex[0]?.index || fallbackMonsterLibrary[0]?.index || "");

  const typeOptions = useMemo(
    () => ["all", ...Array.from(new Set(enemyIndex.map((enemy) => enemy.type).filter(Boolean))).sort()],
    [enemyIndex]
  );

  const filteredEnemies = useMemo(() => {
    const queryText = query.trim();
    return enemyIndex
      .filter((enemy) => !queryText || monsterMatchesSearch(enemy, queryText))
      .filter((enemy) => typeFilter === "all" || enemy.type === typeFilter)
      .filter((enemy) => sourceFilter === "all" || sourceBucket(enemy) === sourceFilter)
      .filter((enemy) => matchesCrBand(enemy, crFilter))
      .sort((left, right) => {
        if (queryText) {
          const ranked = monsterSearchRank(left, queryText) - monsterSearchRank(right, queryText);
          if (ranked !== 0) return ranked;
        }
        return compareEnemies(sortBy)(left, right);
      });
  }, [crFilter, enemyIndex, query, sortBy, sourceFilter, typeFilter]);

  const visibleEnemies = filteredEnemies.slice(0, 180);
  const selectedEnemy = enemyIndex.find((enemy) => enemy.index === selectedIndex) || filteredEnemies[0] || enemyIndex[0] || null;

  function selectEnemy(enemy) {
    setSelectedIndex(enemy.index);
  }

  function copyPromptJson(enemy, key) {
    if (!enemy) return;
    copyWithFeedback(monsterImagePromptJson(enemy), key || `enemy-json-${enemy.index}`);
  }

  const topJsonKey = selectedEnemy ? `enemy-top-json-${selectedEnemy.index}` : "enemy-top-json";
  const topJsonCopied = isCopied(topJsonKey);

  return (
    <main className="workspace enemies-page">
      <header className="topbar enemies-page__header">
        <div>
          <p className="label">Enemy Library</p>
          <h1>Alle enemies doorzoekbaar aan tafel</h1>
          <span>{enemyIndex.length} lokale enemies uit PDF, campaign, imports en Chult-tabellen. Monsters én humanoids zitten in dezelfde zoekmachine.</span>
        </div>
        <div className="topbar__actions">
          <button
            className={topJsonCopied ? "button button--ghost copy-confirm copy-confirm--active" : "button button--ghost copy-confirm"}
            type="button"
            onClick={() => copyPromptJson(selectedEnemy, topJsonKey)}
            disabled={!selectedEnemy}
            aria-live="polite"
          >
            <CopyConfirmIcon active={topJsonCopied} size={17} /> {topJsonCopied ? "Gekopieerd" : "Prompt JSON"}
          </button>
          <button className="button button--primary" type="button" onClick={() => selectedEnemy && onAddMonster?.(selectedEnemy, count)} disabled={!selectedEnemy}>
            <Swords size={17} /> Naar Initiative
          </button>
        </div>
      </header>

      <section className="enemies-browser-layout">
        <Panel title="Zoeken" action={<Tag>{filteredEnemies.length} matches</Tag>} className="enemies-search-panel">
          <div className="enemy-search-box enemies-search-box--large">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek op naam, type, action, source, taal, damage, tag..." autoFocus />
          </div>

          <div className="enemies-filter-grid">
            <label>
              <span>Type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>{type === "all" ? "Alle types" : type}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Bron</span>
              <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                {sourceFilters.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}
              </select>
            </label>
            <label>
              <span>CR</span>
              <select value={crFilter} onChange={(event) => setCrFilter(event.target.value)}>
                {crBands.map((band) => <option key={band.id} value={band.id}>{band.label}</option>)}
              </select>
            </label>
            <label>
              <span>Sortering</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {sortOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <div className="enemies-search-stats">
            <article><strong>{enemyIndex.length}</strong><span>totaal</span></article>
            <article><strong>{enemyIndex.filter((enemy) => sourceBucket(enemy) === "pdf").length}</strong><span>PDF</span></article>
            <article><strong>{enemyIndex.filter((enemy) => enemy.type === "humanoid").length}</strong><span>humanoids</span></article>
            <article><strong>{enemyIndex.filter((enemy) => enemy.actions?.length).length}</strong><span>met actions</span></article>
          </div>

          <div className="enemies-source-note">
            <SlidersHorizontal size={16} />
            <span>Ongefilterd tonen we de eerste 180 records voor snelheid. Typ een naam of filter om exact te vinden wat je zoekt.</span>
          </div>
        </Panel>

        <Panel title="Resultaten" action={<Tag>{visibleEnemies.length}/{filteredEnemies.length}</Tag>} className="enemies-results-panel">
          <div className="enemies-result-list">
            {visibleEnemies.length ? (
              visibleEnemies.map((enemy) => (
                <button
                  className={selectedEnemy?.index === enemy.index ? "enemies-result enemies-result--active" : "enemies-result"}
                  type="button"
                  key={enemy.index}
                  onClick={() => selectEnemy(enemy)}
                >
                  <span className="enemies-result__mark">
                    <Shield size={16} />
                  </span>
                  <span className="enemies-result__body">
                    <strong>{enemy.name}</strong>
                    <small>{enemy.type || "enemy"} / CR {enemy.cr || "?"} / {enemy.source || "local"}</small>
                    <small>{shortSummary(enemy)}</small>
                  </span>
                  <Tag tone={sourceBucket(enemy) === "campaign" ? "warning" : "safe"}>{sourceBucket(enemy)}</Tag>
                </button>
              ))
            ) : (
              <EmptyState>Geen enemies gevonden. Probeer een losse naam, type of action zoals “wizard”, “yuan-ti”, “bite” of “pter”.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel title="Statblock" className="enemies-detail-panel">
          <EnemyDetail
            enemy={selectedEnemy}
            count={count}
            onCountChange={setCount}
            onAddMonster={onAddMonster}
            onNavigate={onNavigate}
            onCopyJson={copyPromptJson}
            isCopied={isCopied}
          />
        </Panel>
      </section>
    </main>
  );
}
