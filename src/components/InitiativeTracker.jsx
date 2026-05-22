import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Copy,
  Dices,
  EyeOff,
  FastForward,
  Image as ImageIcon,
  Info,
  ListOrdered,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Skull,
  Swords,
  Trash2,
  X,
} from "lucide-react";
import { fallbackMonsterLibrary } from "../data/systems/monsterLibrary.js";
import { buildEnemySearchIndex } from "../utils/enemySearchIndex.js";
import {
  abilityModifier,
  fetchSrdMonsterDetail,
  fetchSrdMonsterIndex,
  monsterMatchesSearch,
  monsterSearchRank,
} from "../utils/monsterStatblocks.js";
import { buildMonsterImagePrompt, monsterImagePromptJson, monsterImagePromptSummary } from "../utils/monsterImagePrompts.js";
import { useCopyFeedback } from "../utils/useCopyFeedback.js";
import { useCompendiumEntries } from "../utils/useCompendiumEntries.js";
import { CommandModeSwitch } from "./v2/CommandPrimitives.jsx";
import { EmptyState, Meter, Panel, Tag } from "./ui.jsx";

const conditions = ["Blinded", "Charmed", "Frightened", "Grappled", "Poisoned", "Prone", "Stunned", "Restrained", "Unconscious"];

function sortParticipantsByInitiative(participants) {
  return [...participants].sort((left, right) => {
    if (right.initiative !== left.initiative) return right.initiative - left.initiative;
    return right.dexMod - left.dexMod;
  });
}

function orderedParticipants(participants, turnOrder = []) {
  if (!turnOrder?.length) return sortParticipantsByInitiative(participants);
  const byId = new Map(participants.map((participant) => [participant.id, participant]));
  const known = new Set();
  const ordered = turnOrder
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((participant) => {
      if (known.has(participant.id)) return false;
      known.add(participant.id);
      return true;
    });
  return [...ordered, ...participants.filter((participant) => !known.has(participant.id))];
}

function healthTone(participant) {
  if (participant.hp <= 0) return "danger";
  if (participant.hp <= participant.maxHp / 3) return "warning";
  return "accent";
}

function statTone(participant) {
  if (!participant || participant.hp <= 0) return "danger";
  if (participant.hp <= participant.maxHp / 3) return "warning";
  return "safe";
}

function healthLabel(participant) {
  if (participant.hp <= 0) return "down";
  if (participant.hp <= participant.maxHp / 3) return "bloodied";
  return "steady";
}

function sideTone(side) {
  if (side === "enemy") return "danger";
  if (side === "neutral") return "warning";
  return "safe";
}

function isEnemyParticipant(participant) {
  return ["enemy", "neutral"].includes(participant?.side);
}

function hasStatBlock(creature) {
  return Boolean(
    creature &&
      (creature.cr ||
        creature.monsterIndex ||
        creature.type ||
        creature.speed ||
        creature.actions?.length ||
        creature.traits?.length)
  );
}

function hpPercent(participant) {
  return participant?.maxHp ? Math.max(0, Math.min(100, (participant.hp / participant.maxHp) * 100)) : 0;
}

function nextLogLine(participant, round) {
  return `R${round}: ${participant?.name || "Onbekend"} is aan de beurt.`;
}

function detailText(value = "") {
  if (Array.isArray(value)) return value.filter(Boolean).join("\n");
  return String(value || "").trim();
}

function formatMapEntries(value = {}) {
  const entries = Object.entries(value || {});
  if (!entries.length) return "-";
  return entries.map(([key, item]) => `${key} ${item}`).join(", ");
}

function copyToClipboard(value) {
  navigator.clipboard?.writeText(String(value || ""));
}

function CopyConfirmIcon({ active, size = 14 }) {
  return active ? <Check size={size} /> : <Copy size={size} />;
}

function renderMonsterImagePrompt(creature, { compact = false, copyWithFeedback, isCopied, keyPrefix } = {}) {
  if (!creature) return null;
  const payload = buildMonsterImagePrompt(creature);
  const json = monsterImagePromptJson(creature);
  const baseKey = keyPrefix || `monster-prompt-${creature.id || creature.index || creature.monsterIndex || creature.name}`;
  const promptKey = `${baseKey}-prompt`;
  const jsonKey = `${baseKey}-json`;
  const promptCopied = Boolean(isCopied?.(promptKey));
  const jsonCopied = Boolean(isCopied?.(jsonKey));

  function handleCopy(value, key) {
    if (copyWithFeedback) copyWithFeedback(value, key);
    else copyToClipboard(value);
  }

  return (
    <section className={compact ? "monster-image-prompt monster-image-prompt--compact" : "monster-image-prompt"}>
      <header>
        <div>
          <ImageIcon size={16} />
          <span>Image prompt</span>
        </div>
        <div className="monster-image-prompt__actions">
          <button
            className={promptCopied ? "copy-confirm copy-confirm--active" : "copy-confirm"}
            type="button"
            onClick={() => handleCopy(payload.prompt, promptKey)}
            aria-live="polite"
          >
            <CopyConfirmIcon active={promptCopied} /> {promptCopied ? "Gekopieerd" : "Prompt"}
          </button>
          <button
            className={jsonCopied ? "copy-confirm copy-confirm--active" : "copy-confirm"}
            type="button"
            onClick={() => handleCopy(json, jsonKey)}
            aria-live="polite"
          >
            <CopyConfirmIcon active={jsonCopied} /> {jsonCopied ? "Gekopieerd" : "JSON"}
          </button>
        </div>
      </header>
      <p>{payload.prompt}</p>
      {!compact ? <pre>{json}</pre> : <small>{monsterImagePromptSummary(creature)}</small>}
    </section>
  );
}

function renderActionSection(title, actions = [], compact = false) {
  if (!actions?.length) return null;
  return (
    <div className={compact ? "monster-action-section monster-action-section--compact" : "monster-action-section"}>
      <h4>{title}</h4>
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
    </div>
  );
}

function renderStatBlock(creature, { compact = false, includeActions = true, copyWithFeedback, isCopied, copyKeyPrefix } = {}) {
  if (!creature) return <EmptyState>Selecteer een enemy om de statblock te zien.</EmptyState>;
  const abilities = creature.abilities || {};
  const abilityOrder = ["str", "dex", "con", "int", "wis", "cha"];

  return (
    <div className={compact ? "monster-statblock monster-statblock--compact" : "monster-statblock"}>
      <div className="monster-statblock__head">
        <div>
          <strong>{creature.name}</strong>
          <span>
            {[creature.size, creature.type, creature.alignment].filter(Boolean).join(" ")}
            {creature.cr ? ` - CR ${creature.cr}` : ""}
          </span>
        </div>
        <Tag tone={creature.source?.includes("custom") ? "warning" : "safe"}>{creature.role || "Enemy"}</Tag>
      </div>

      <div className="monster-core-grid">
        <article><span>AC</span><strong>{creature.ac ?? "-"}</strong></article>
        <article><span>HP</span><strong>{creature.hp ?? creature.maxHp ?? "-"}</strong></article>
        <article><span>Speed</span><strong>{creature.speed || "-"}</strong></article>
        <article><span>XP</span><strong>{creature.xp || "-"}</strong></article>
      </div>

      <div className="monster-ability-grid">
        {abilityOrder.map((ability) => {
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

      {!compact ? (
        <div className="monster-detail-lines">
          <p><strong>Saves</strong><span>{formatMapEntries(creature.saves)}</span></p>
          <p><strong>Skills</strong><span>{formatMapEntries(creature.skills)}</span></p>
          <p><strong>Damage</strong><span>{[creature.damageVulnerabilities && `Vuln: ${creature.damageVulnerabilities}`, creature.damageResistances && `Res: ${creature.damageResistances}`, creature.damageImmunities && `Imm: ${creature.damageImmunities}`].filter(Boolean).join(" / ") || "-"}</span></p>
          <p><strong>Conditions</strong><span>{creature.conditionImmunities || "-"}</span></p>
          <p><strong>Senses</strong><span>{creature.senses || "-"}</span></p>
          <p><strong>Languages</strong><span>{creature.languages || "-"}</span></p>
          <p>
            <strong>Links</strong>
            <span>
              {creature.sourceUrl ? <a href={creature.sourceUrl} target="_blank" rel="noreferrer">source</a> : null}
              {creature.sourceUrl && creature.imageUrl ? " / " : ""}
              {creature.imageUrl ? <a href={creature.imageUrl} target="_blank" rel="noreferrer">image ref</a> : null}
              {!creature.sourceUrl && !creature.imageUrl ? "-" : ""}
            </span>
          </p>
        </div>
      ) : null}

      {creature.traits?.length ? (
        <div className="monster-trait-list">
          {creature.traits.map((trait) => (
            <article key={`${trait.name}-${trait.desc}`}>
              <strong>{trait.name}</strong>
              <span>{detailText(trait.desc)}</span>
            </article>
          ))}
        </div>
      ) : null}

      {includeActions ? (
        <>
          {renderActionSection("Actions", creature.actions, compact)}
          {renderActionSection("Bonus Actions", creature.bonusActions, compact)}
          {renderActionSection("Reactions", creature.reactions, compact)}
          {renderActionSection("Legendary", creature.legendaryActions, compact)}
          {renderActionSection("Mythic", creature.mythicActions, compact)}
          {renderActionSection("Lair", creature.lairActions, compact)}
        </>
      ) : null}

      {renderMonsterImagePrompt(creature, {
        compact,
        copyWithFeedback,
        isCopied,
        keyPrefix: copyKeyPrefix || `statblock-${creature.id || creature.index || creature.monsterIndex || creature.name}`,
      })}
      {!compact && creature.rawText ? (
        <details className="enemy-raw-statblock">
          <summary>Volledige PDF tekst</summary>
          <pre>{creature.rawText}</pre>
        </details>
      ) : null}
    </div>
  );
}

export function InitiativeTracker({
  initiative,
  onPatchInitiative,
  onUpdateParticipant,
  onAddParticipant,
  onAddMonster,
  onRemoveParticipant,
  onResetInitiative,
}) {
  const compendiumMonsters = useCompendiumEntries("monsters");
  const { copyWithFeedback, isCopied } = useCopyFeedback();
  const [viewMode, setViewMode] = useState("run");
  const [monsterSearch, setMonsterSearch] = useState("");
  const [monsterIndex, setMonsterIndex] = useState(() => buildEnemySearchIndex(compendiumMonsters));
  const [selectedMonster, setSelectedMonster] = useState(() => buildEnemySearchIndex(compendiumMonsters)[0] || fallbackMonsterLibrary[0]);
  const [monsterCount, setMonsterCount] = useState(1);
  const [monsterLoadState, setMonsterLoadState] = useState("idle");
  const [monsterError, setMonsterError] = useState("");
  const [statblockTarget, setStatblockTarget] = useState(null);
  const [actionFocus, setActionFocus] = useState(null);
  const [enemyPickerOpen, setEnemyPickerOpen] = useState(false);
  const ordered = useMemo(
    () => orderedParticipants(initiative.participants, initiative.turnOrder),
    [initiative.participants, initiative.turnOrder]
  );
  const activeIndex = ordered.length ? Number(initiative.activeIndex || 0) % ordered.length : 0;
  const active = ordered[activeIndex] || null;
  const next = ordered[(activeIndex + 1) % Math.max(ordered.length, 1)] || null;
  const activeActionOptions = useMemo(
    () =>
      active
        ? [
            ...(active.actions || []),
            ...(active.bonusActions || []),
            ...(active.reactions || []),
            ...(Array.isArray(active.legendaryActions) ? active.legendaryActions : []),
          ]
        : [],
    [active]
  );
  const enemyParticipants = useMemo(() => ordered.filter(isEnemyParticipant), [ordered]);
  const monsterResults = useMemo(() => {
    const query = monsterSearch.trim();
    const results = query
      ? monsterIndex
          .filter((monster) => monsterMatchesSearch(monster, query))
          .sort((left, right) => monsterSearchRank(left, query) - monsterSearchRank(right, query) || left.name.localeCompare(right.name))
      : monsterIndex;
    return results.slice(0, 36);
  }, [monsterIndex, monsterSearch]);

  useEffect(() => {
    setMonsterIndex((current) => buildEnemySearchIndex([...current, ...compendiumMonsters]));
    setSelectedMonster((current) => current || buildEnemySearchIndex(compendiumMonsters)[0] || fallbackMonsterLibrary[0]);
  }, [compendiumMonsters]);

  useEffect(() => {
    let cancelled = false;
    async function loadOnlineIndex() {
      if (monsterLoadState !== "idle" || (viewMode !== "enemies" && !enemyPickerOpen)) return;
      setMonsterLoadState("loading");
      try {
        const onlineMonsters = await fetchSrdMonsterIndex();
        if (cancelled) return;
        setMonsterIndex((current) => buildEnemySearchIndex([...current, ...onlineMonsters]));
        setMonsterLoadState("loaded");
      } catch (error) {
        if (cancelled) return;
        setMonsterError(error.message || "Online monsterlijst niet beschikbaar. Starter library blijft bruikbaar.");
        setMonsterLoadState("error");
      }
    }

    loadOnlineIndex();
    return () => {
      cancelled = true;
    };
  }, [enemyPickerOpen, monsterLoadState, viewMode]);

  async function selectMonster(monster) {
    setMonsterError("");
    setSelectedMonster(monster);
    if (monster.actions?.length || monster.traits?.length || monster.hp) return monster;

    setMonsterLoadState("loading-detail");
    try {
      const detail = await fetchSrdMonsterDetail(monster);
      setSelectedMonster(detail);
      setMonsterIndex((current) =>
        current.map((item) => (item.index === detail.index ? { ...item, ...detail } : item))
      );
      setMonsterLoadState("loaded");
      return detail;
    } catch (error) {
      setMonsterError(error.message || "Kon deze statblock niet laden.");
      setMonsterLoadState("error");
      return monster;
    }
  }

  async function addMonsterFromPicker(monster, count = 1) {
    const detail = await selectMonster(monster);
    onAddMonster?.(detail, count);
    setEnemyPickerOpen(false);
  }

  function activeIdAfterOrder(nextOrder, preferredId = active?.id) {
    const nextIndex = nextOrder.indexOf(preferredId);
    return nextIndex >= 0 ? nextIndex : 0;
  }

  function setActiveById(participantId) {
    const nextIndex = ordered.findIndex((participant) => participant.id === participantId);
    if (nextIndex >= 0) onPatchInitiative({ activeIndex: nextIndex });
  }

  function moveParticipant(participantId, direction) {
    const ids = ordered.map((participant) => participant.id);
    const index = ids.indexOf(participantId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= ids.length) return;
    const nextOrder = [...ids];
    [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
    onPatchInitiative({
      turnOrder: nextOrder,
      activeIndex: activeIdAfterOrder(nextOrder),
    });
  }

  async function openStatblock(creature, action = null) {
    if (!creature) return;
    setStatblockTarget(creature);
    setActionFocus(action);

    const lookupIndex = creature.monsterIndex || creature.index;
    const needsDetail = lookupIndex && !creature.actions?.length && !creature.traits?.length;
    if (!needsDetail) return;

    setMonsterLoadState("loading-detail");
    try {
      const detail = await fetchSrdMonsterDetail({ index: lookupIndex, apiUrl: creature.apiUrl, name: creature.name });
      const merged = {
        ...creature,
        ...detail,
        id: creature.id,
        name: creature.name || detail.name,
        hp: creature.hp,
        maxHp: creature.maxHp || detail.hp,
        tempHp: creature.tempHp,
        conditions: creature.conditions || [],
      };
      setStatblockTarget(merged);
      setMonsterIndex((current) => current.map((item) => (item.index === detail.index ? { ...item, ...detail } : item)));
      if (creature.id) {
        onUpdateParticipant(creature.id, {
          monsterIndex: detail.index,
          source: detail.source,
          role: detail.role,
          cr: detail.cr,
          xp: detail.xp,
          size: detail.size,
          type: detail.type,
          alignment: detail.alignment,
          speed: detail.speed,
          abilities: detail.abilities,
          saves: detail.saves,
          skills: detail.skills,
          savingThrowsText: detail.savingThrowsText,
          skillsText: detail.skillsText,
          damageVulnerabilities: detail.damageVulnerabilities,
          damageResistances: detail.damageResistances,
          damageImmunities: detail.damageImmunities,
          conditionImmunities: detail.conditionImmunities,
          sourceUrl: detail.sourceUrl,
          imageUrl: detail.imageUrl,
          senses: detail.senses,
          languages: detail.languages,
          traits: detail.traits,
          actions: detail.actions,
          bonusActions: detail.bonusActions,
          reactions: detail.reactions,
          legendaryActionCount: Array.isArray(detail.legendaryActions) ? detail.legendaryActions.length : creature.legendaryActionCount,
          legendaryActions: Array.isArray(detail.legendaryActions) ? detail.legendaryActions : [],
          mythicActions: detail.mythicActions,
          lairActions: detail.lairActions,
          regionalEffects: detail.regionalEffects,
          rawText: detail.rawText,
          imagePrompt: detail.imagePrompt || buildMonsterImagePrompt({ ...creature, ...detail }),
        });
      }
      setMonsterLoadState("loaded");
    } catch (error) {
      setMonsterError(error.message || "Kon deze statblock niet laden.");
      setMonsterLoadState("error");
    }
  }

  function nextTurn() {
    if (!ordered.length) return;
    const nextIndex = (activeIndex + 1) % ordered.length;
    const nextRound = nextIndex === 0 ? initiative.round + 1 : initiative.round;
    const nextParticipant = ordered[nextIndex];
    onPatchInitiative({
      activeIndex: nextIndex,
      round: nextRound,
      participants: initiative.participants.map((participant) =>
        participant.id === active?.id ? { ...participant, reactionUsed: false } : participant
      ),
      log: [nextLogLine(nextParticipant, nextRound), ...initiative.log].slice(0, 12),
    });
  }

  function previousTurn() {
    if (!ordered.length) return;
    const previousIndex = activeIndex === 0 ? ordered.length - 1 : activeIndex - 1;
    const previousRound = activeIndex === 0 ? Math.max(1, initiative.round - 1) : initiative.round;
    onPatchInitiative({ activeIndex: previousIndex, round: previousRound });
  }

  function sortTurns() {
    const sorted = sortParticipantsByInitiative(initiative.participants);
    onPatchInitiative({
      turnOrder: sorted.map((participant) => participant.id),
      activeIndex: 0,
      log: [`R${initiative.round}: initiative gesorteerd.`, ...initiative.log].slice(0, 12),
    });
  }

  function rollParticipant(participant) {
    const initiativeRoll = Math.ceil(Math.random() * 20) + participant.dexMod;
    onUpdateParticipant(participant.id, { initiative: initiativeRoll });
  }

  function rollAll() {
    onPatchInitiative({
      participants: initiative.participants.map((participant) => ({
        ...participant,
        initiative: Math.ceil(Math.random() * 20) + participant.dexMod,
      })),
      activeIndex: 0,
      log: [`R${initiative.round}: initiative gerold voor iedereen.`, ...initiative.log].slice(0, 12),
    });
  }

  function adjustHp(participant, amount) {
    if (!participant) return;
    const currentTempHp = Number(participant.tempHp || 0);
    const tempDamage = amount < 0 ? Math.min(currentTempHp, Math.abs(amount)) : 0;
    const hpDelta = amount < 0 ? amount + tempDamage : amount;
    onUpdateParticipant(participant.id, {
      tempHp: amount < 0 ? currentTempHp - tempDamage : currentTempHp,
      hp: Math.max(0, Math.min(participant.maxHp, participant.hp + hpDelta)),
    });
  }

  function toggleCondition(participant, condition) {
    const set = new Set(participant.conditions || []);
    if (set.has(condition)) set.delete(condition);
    else set.add(condition);
    onUpdateParticipant(participant.id, { conditions: Array.from(set) });
  }

  function renderSetupRow(participant, index) {
    return (
      <article className="setup-combatant-row" key={participant.id}>
        <span className="setup-combatant-row__rank">{index + 1}</span>
        <input
          value={participant.name}
          onChange={(event) => onUpdateParticipant(participant.id, { name: event.target.value })}
          aria-label="Naam"
        />
        <input
          type="number"
          value={participant.initiative}
          onChange={(event) => onUpdateParticipant(participant.id, { initiative: Number(event.target.value) })}
          aria-label="Initiative"
        />
        <select value={participant.side} onChange={(event) => onUpdateParticipant(participant.id, { side: event.target.value })}>
          <option value="party">party</option>
          <option value="ally">ally</option>
          <option value="enemy">enemy</option>
          <option value="neutral">neutral</option>
        </select>
        <input
          type="number"
          value={participant.hp}
          onChange={(event) => onUpdateParticipant(participant.id, { hp: Number(event.target.value), maxHp: Number(event.target.value) || participant.maxHp })}
          aria-label="HP"
        />
        <div className="setup-combatant-row__order">
          <button type="button" onClick={() => moveParticipant(participant.id, -1)} disabled={index === 0} title="Omhoog">
            <ArrowUp size={15} />
          </button>
          <button type="button" onClick={() => moveParticipant(participant.id, 1)} disabled={index === ordered.length - 1} title="Omlaag">
            <ArrowDown size={15} />
          </button>
        </div>
        <button className="setup-combatant-row__delete" type="button" onClick={() => onRemoveParticipant(participant.id)} title="Delete">
          <Trash2 size={16} />
        </button>
      </article>
    );
  }

  return (
    <main className="workspace initiative-page initiative-page--command">
      <header className="topbar initiative-command-header">
        <div>
          <p className="label">Initiative Tracker</p>
          <h1>{initiative.encounterName}</h1>
          <span>Ronde {initiative.round} - nu: {active?.name || "niemand"} - volgende: {next?.name || "niemand"}</span>
        </div>
        <div className="topbar__actions">
          <CommandModeSwitch
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "run", label: "Aan tafel" },
              { value: "enemies", label: "Enemies" },
              { value: "setup", label: "Setup" },
            ]}
          />
          {viewMode === "run" ? (
            <>
              <button className="button button--ghost" type="button" onClick={previousTurn}>
                <RotateCcw size={18} /> Terug
              </button>
              <button className="button button--primary" type="button" onClick={nextTurn}>
                <FastForward size={18} /> Volgende
              </button>
            </>
          ) : null}
        </div>
      </header>

      {viewMode === "run" ? (
        <>
          <section className="tabletop-turn-lane" aria-label="Initiative volgorde">
            <div className="tabletop-turn-lane__head">
              <div>
                <span>Ronde {initiative.round}</span>
                <strong>{ordered.length} deelnemers</strong>
              </div>
              <div>
                <span>Volgende</span>
                <strong>{next?.name || "-"}</strong>
              </div>
            </div>
            <div className="tabletop-turn-grid">
              {ordered.length ? (
                ordered.map((participant, index) => {
                  const participantConditions = participant.conditions || [];
                  const isActive = active?.id === participant.id;
                  return (
                    <article
                      className={`turn-tile turn-tile--${participant.side} ${isActive ? "turn-tile--active" : ""}`}
                      key={participant.id}
                    >
                      <button className="turn-tile__main" type="button" onClick={() => setActiveById(participant.id)}>
                        <span className="turn-tile__rank">{index + 1}</span>
                        <span className="turn-tile__name">{participant.name}</span>
                        <span className="turn-tile__meta">Init {participant.initiative} / AC {participant.ac}</span>
                        <span className="turn-tile__hp">
                          <i style={{ width: `${hpPercent(participant)}%` }} />
                        </span>
                        <span className="turn-tile__foot">
                          <Tag tone={sideTone(participant.side)}>{participant.side}</Tag>
                          {participantConditions.length ? <small>{participantConditions.length} status</small> : null}
                        </span>
                      </button>
                      <div className="turn-tile__tools">
                        <button type="button" onClick={() => moveParticipant(participant.id, -1)} disabled={index === 0} title="Eerder">
                          <ArrowUp size={15} />
                        </button>
                        <button type="button" onClick={() => moveParticipant(participant.id, 1)} disabled={index === ordered.length - 1} title="Later">
                          <ArrowDown size={15} />
                        </button>
                        {hasStatBlock(participant) ? (
                          <button type="button" onClick={() => openStatblock(participant)} title="Statblock">
                            <Info size={15} />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <EmptyState>Geen deelnemers. Voeg ze toe in Setup of Enemies.</EmptyState>
              )}
            </div>
          </section>

          <section className="tabletop-combat-grid">
            <Panel title="Actieve beurt" className="active-turn-card">
              {active ? (
                <>
                  <header className="active-turn-card__head">
                    <div>
                      <Tag tone={sideTone(active.side)}>{active.side}</Tag>
                      <h2>{active.name}</h2>
                      <span>{active.role || active.type || "combatant"}</span>
                    </div>
                    <div className="active-turn-card__stats">
                      <strong>AC {active.ac}</strong>
                      <strong>Init {active.initiative}</strong>
                      {active.cr ? <strong>CR {active.cr}</strong> : null}
                    </div>
                  </header>

                  <div className="active-hp-console">
                    <div>
                      <span>HP</span>
                      <strong>{active.hp}/{active.maxHp}</strong>
                      {active.tempHp ? <small>temp {active.tempHp}</small> : null}
                    </div>
                    <Meter value={hpPercent(active)} tone={healthTone(active)} />
                    <div className="active-hp-buttons">
                      {[-10, -5, -1, 1, 5, 10].map((amount) => (
                        <button key={amount} type="button" onClick={() => adjustHp(active, amount)}>
                          {amount > 0 ? `+${amount}` : amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="active-condition-grid active-condition-grid--large">
                    {conditions.map((condition) => (
                      <button
                        className={(active.conditions || []).includes(condition) ? "mini-toggle mini-toggle--active" : "mini-toggle"}
                        key={condition}
                        type="button"
                        onClick={() => toggleCondition(active, condition)}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>

                  <div className="active-tactical-actions">
                    <button type="button" onClick={() => onUpdateParticipant(active.id, { reactionUsed: !active.reactionUsed })}>
                      {active.reactionUsed ? "Reaction used" : "Reaction"}
                    </button>
                    <button type="button" onClick={() => onUpdateParticipant(active.id, { concentration: !active.concentration })}>
                      {active.concentration ? "Concentrating" : "Conc."}
                    </button>
                    <button type="button" onClick={() => onUpdateParticipant(active.id, { hiddenFromPlayers: !active.hiddenFromPlayers })}>
                      <EyeOff size={16} /> {active.hiddenFromPlayers ? "Hidden" : "Visible"}
                    </button>
                    {hasStatBlock(active) ? (
                      <button type="button" onClick={() => openStatblock(active)}>
                        <Info size={16} /> Stats
                      </button>
                    ) : null}
                    {isEnemyParticipant(active) ? (
                      <button
                        className={isCopied(`active-prompt-json-${active.id}`) ? "copy-confirm copy-confirm--active" : "copy-confirm"}
                        type="button"
                        onClick={() => copyWithFeedback(monsterImagePromptJson(active), `active-prompt-json-${active.id}`)}
                        aria-live="polite"
                      >
                        {isCopied(`active-prompt-json-${active.id}`) ? <Check size={16} /> : <ImageIcon size={16} />} {isCopied(`active-prompt-json-${active.id}`) ? "Gekopieerd" : "Prompt"}
                      </button>
                    ) : null}
                  </div>

                  <textarea
                    value={active.notes}
                    onChange={(event) => onUpdateParticipant(active.id, { notes: event.target.value })}
                    placeholder="Korte tactische notitie voor deze beurt."
                  />
                </>
              ) : (
                <EmptyState>Geen actieve deelnemer.</EmptyState>
              )}
            </Panel>

            <aside className="active-actions-board">
              <Panel title="Acties">
                {hasStatBlock(active) ? (
                  <div className="action-button-grid">
                    {activeActionOptions.length ? (
                      activeActionOptions.map((action) => (
                        <button key={`${action.name}-${action.desc}`} type="button" onClick={() => openStatblock(active, action)}>
                          <Swords size={16} />
                          <span>
                            <strong>{action.name}</strong>
                            <small>{action.damage || action.attack || "detail"}</small>
                          </span>
                        </button>
                      ))
                    ) : (
                      <EmptyState>Geen acties op deze statblock.</EmptyState>
                    )}
                  </div>
                ) : (
                  <EmptyState>Party members tonen hier alleen notities. Enemy stats zitten onder Enemies.</EmptyState>
                )}
              </Panel>

              <Panel title="Encounter pulse">
                <div className="encounter-pulse-list">
                  <article>
                    <span>Objective</span>
                    <strong>{initiative.objective || "Geen objective gezet"}</strong>
                  </article>
                  <article>
                    <span>Timer</span>
                    <strong>{initiative.timer || "Geen timer actief"}</strong>
                  </article>
                  <article>
                    <span>Initiative 20</span>
                    <strong>{initiative.lairActionName || "Geen lair/hazard"}</strong>
                  </article>
                </div>
              </Panel>
            </aside>
          </section>
        </>
      ) : viewMode === "enemies" ? (
        <section className="enemies-command-layout">
          <Panel
            title="Enemy zoeken"
            action={
              monsterLoadState === "loading" || monsterLoadState === "loading-detail" ? (
                <Tag tone="warning">laden</Tag>
              ) : (
                <Tag tone="safe">{monsterIndex.length} records</Tag>
              )
            }
          >
            <div className="enemy-search-box">
              <Search size={17} />
              <input
                value={monsterSearch}
                onChange={(event) => setMonsterSearch(event.target.value)}
                placeholder="Zoek enemy naam..."
              />
            </div>

            {monsterError ? <p className="monster-source-warning">{monsterError}</p> : null}

            <div className="monster-result-list">
              {monsterResults.length ? (
                monsterResults.map((monster) => (
                  <article
                    className={selectedMonster?.index === monster.index ? "monster-result monster-result--active" : "monster-result"}
                    key={monster.index}
                  >
                    <button className="monster-result__main" type="button" onClick={() => selectMonster(monster)}>
                      <span>
                        <strong>{monster.name}</strong>
                        <small>
                          {monster.type || "monster"} - CR {monster.cr || "?"} - {monster.source || "library"}
                        </small>
                        <small>{monsterImagePromptSummary(monster)}</small>
                      </span>
                    </button>
                    <button
                      className={isCopied(`monster-result-json-${monster.index}`) ? "monster-result__copy copy-confirm copy-confirm--active" : "monster-result__copy copy-confirm"}
                      type="button"
                      onClick={() => copyWithFeedback(monsterImagePromptJson(monster), `monster-result-json-${monster.index}`)}
                      aria-live="polite"
                    >
                      <CopyConfirmIcon active={isCopied(`monster-result-json-${monster.index}`)} /> {isCopied(`monster-result-json-${monster.index}`) ? "Gekopieerd" : "JSON"}
                    </button>
                    <Tag tone={monster.actions?.length ? "safe" : "warning"}>{monster.role || "lookup"}</Tag>
                  </article>
                ))
              ) : (
                <EmptyState>Geen monsters gevonden.</EmptyState>
              )}
            </div>
          </Panel>

          <Panel
            title="Statblock preview"
            action={
              <label className="enemy-count-control">
                x
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={monsterCount}
                  onChange={(event) => setMonsterCount(event.target.value)}
                />
              </label>
            }
            className="monster-preview-panel"
          >
            {monsterLoadState === "loading-detail" ? (
              <div className="monster-loading-state">
                <LoaderCircle size={18} />
                <span>Statblock laden...</span>
              </div>
            ) : (
              renderStatBlock(selectedMonster, {
                copyWithFeedback,
                isCopied,
                copyKeyPrefix: `initiative-preview-${selectedMonster?.index || selectedMonster?.name}`,
              })
            )}
            <div className="enemy-add-row">
              <button
                className="button button--primary"
                type="button"
                disabled={!selectedMonster?.hp || monsterLoadState === "loading-detail"}
                onClick={() => onAddMonster?.(selectedMonster, monsterCount)}
              >
                <Plus size={18} /> Voeg enemy toe
              </button>
              <button className="button button--ghost" type="button" onClick={() => setViewMode("run")}>
                <BookOpen size={17} /> Terug naar combat
              </button>
            </div>
          </Panel>

          <Panel title="Enemies in combat" className="enemy-roster-panel">
            <div className="enemy-roster-grid">
              {enemyParticipants.length ? (
                enemyParticipants.map((enemy, index) => (
                  <article className={active?.id === enemy.id ? "enemy-roster-card enemy-roster-card--active" : "enemy-roster-card"} key={enemy.id}>
                    <div className="enemy-roster-card__head">
                      <button type="button" onClick={() => onPatchInitiative({ activeIndex: ordered.findIndex((item) => item.id === enemy.id) })}>
                        #{index + 1}
                      </button>
                      <div>
                      <strong>{enemy.name}</strong>
                      <span>{enemy.role || enemy.type || "enemy"} {enemy.cr ? `- CR ${enemy.cr}` : ""}</span>
                    </div>
                    <Tag tone={statTone(enemy)}>{healthLabel(enemy)}</Tag>
                    {hasStatBlock(enemy) ? (
                      <button className="enemy-roster-card__stats" type="button" onClick={() => openStatblock(enemy)}>
                        <Info size={15} /> Stats
                      </button>
                    ) : null}
                    <button
                      className={isCopied(`enemy-roster-json-${enemy.id}`) ? "enemy-roster-card__stats enemy-roster-card__prompt copy-confirm copy-confirm--active" : "enemy-roster-card__stats enemy-roster-card__prompt copy-confirm"}
                      type="button"
                      onClick={() => copyWithFeedback(monsterImagePromptJson(enemy), `enemy-roster-json-${enemy.id}`)}
                      aria-live="polite"
                    >
                      {isCopied(`enemy-roster-json-${enemy.id}`) ? <Check size={15} /> : <ImageIcon size={15} />} {isCopied(`enemy-roster-json-${enemy.id}`) ? "Gekopieerd" : "Prompt"}
                    </button>
                  </div>
                    <div className="enemy-roster-stats">
                      <span>AC {enemy.ac}</span>
                      <span>HP {enemy.hp}/{enemy.maxHp}</span>
                      <span>Init {enemy.initiative}</span>
                    </div>
                    <Meter value={hpPercent(enemy)} tone={healthTone(enemy)} />
                    {enemy.actions?.length ? renderActionSection("Actions", enemy.actions, true) : null}
                  </article>
                ))
              ) : (
                <EmptyState>Nog geen enemies in combat. Zoek links een monster en voeg hem toe.</EmptyState>
              )}
            </div>
          </Panel>
        </section>
      ) : (
        <>
          <section className="setup-command-strip">
            <label className="setup-encounter-name">
              <span>Encounter</span>
              <input value={initiative.encounterName} onChange={(event) => onPatchInitiative({ encounterName: event.target.value })} />
            </label>
            <button className="button button--ghost" type="button" onClick={rollAll}>
              <Dices size={17} /> Roll
            </button>
            <button className="button button--ghost" type="button" onClick={sortTurns}>
              <ListOrdered size={17} /> Sorteer
            </button>
            <button className="button button--ghost" type="button" onClick={onAddParticipant}>
              <Plus size={17} /> Rij
            </button>
            <button className="button button--ghost" type="button" onClick={() => setEnemyPickerOpen(true)}>
              <Swords size={17} /> Add enemy
            </button>
            <button className="button button--primary" type="button" onClick={() => setViewMode("run")}>
              <FastForward size={17} /> Start
            </button>
            <button className="button button--ghost" type="button" onClick={onResetInitiative}>
              <Skull size={17} /> Leeg
            </button>
          </section>

          <section className="setup-combat-board">
            <Panel title="Snelle setup" className="setup-combatants-panel">
              <div className="setup-combatant-header">
                <span>#</span>
                <span>Naam</span>
                <span>Init</span>
                <span>Side</span>
                <span>HP</span>
                <span>Order</span>
                <span />
              </div>
              {ordered.length ? (
                <div className="setup-combatant-list">
                  {ordered.map(renderSetupRow)}
                </div>
              ) : (
                <EmptyState>Geen deelnemers. Voeg een rij toe of zoek enemies in het Enemies tabje.</EmptyState>
              )}
            </Panel>
          </section>
        </>
      )}

      {enemyPickerOpen ? (
        <div className="enemy-picker-backdrop" role="presentation" onClick={() => setEnemyPickerOpen(false)}>
          <section className="enemy-picker-modal" role="dialog" aria-modal="true" aria-label="Add enemy" onClick={(event) => event.stopPropagation()}>
            <header className="enemy-picker-modal__head">
              <div>
                <span>Setup enemy picker</span>
                <h2>Add enemy</h2>
              </div>
              <button type="button" onClick={() => setEnemyPickerOpen(false)} aria-label="Sluit enemy picker">
                <X size={18} />
              </button>
            </header>

            <div className="enemy-picker-toolbar">
              <div className="enemy-search-box">
                <Search size={17} />
                <input
                  value={monsterSearch}
                  onChange={(event) => setMonsterSearch(event.target.value)}
                  placeholder="Zoek enemy naam..."
                  autoFocus
                />
              </div>
              <label className="enemy-count-control">
                x
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={monsterCount}
                  onChange={(event) => setMonsterCount(event.target.value)}
                />
              </label>
            </div>

            {monsterError ? <p className="monster-source-warning">{monsterError}</p> : null}

            <div className="enemy-picker-layout">
              <div className="enemy-picker-results">
                {monsterResults.length ? (
                  monsterResults.map((monster) => (
                    <article key={monster.index}>
                      <button type="button" onClick={() => selectMonster(monster)}>
                        <strong>{monster.name}</strong>
                        <span>{monster.type || "monster"} / CR {monster.cr || "?"} / {monster.source || "library"}</span>
                        <span>{monsterImagePromptSummary(monster)}</span>
                      </button>
                      <button
                        className={isCopied(`enemy-picker-json-${monster.index}`) ? "button button--ghost copy-confirm copy-confirm--active" : "button button--ghost copy-confirm"}
                        type="button"
                        onClick={() => copyWithFeedback(monsterImagePromptJson(monster), `enemy-picker-json-${monster.index}`)}
                        aria-live="polite"
                      >
                        <CopyConfirmIcon active={isCopied(`enemy-picker-json-${monster.index}`)} size={16} /> {isCopied(`enemy-picker-json-${monster.index}`) ? "Gekopieerd" : "JSON"}
                      </button>
                      <button className="button button--primary" type="button" onClick={() => addMonsterFromPicker(monster, monsterCount)}>
                        <Plus size={16} /> Add
                      </button>
                    </article>
                  ))
                ) : (
                  <EmptyState>Geen enemies gevonden.</EmptyState>
                )}
              </div>

              <aside className="enemy-picker-preview">
                {monsterLoadState === "loading-detail" ? (
                  <div className="monster-loading-state">
                    <LoaderCircle size={18} />
                    <span>Statblock laden...</span>
                  </div>
                ) : (
                  renderStatBlock(selectedMonster, {
                    compact: true,
                    includeActions: false,
                    copyWithFeedback,
                    isCopied,
                    copyKeyPrefix: `initiative-picker-preview-${selectedMonster?.index || selectedMonster?.name}`,
                  })
                )}
                <button
                  className="button button--primary"
                  type="button"
                  disabled={!selectedMonster}
                  onClick={() => addMonsterFromPicker(selectedMonster, monsterCount)}
                >
                  <Plus size={18} /> Voeg selectie toe
                </button>
              </aside>
            </div>
          </section>
        </div>
      ) : null}

      {statblockTarget ? (
        <div
          className="statblock-drawer-backdrop"
          role="presentation"
          onClick={() => {
            setStatblockTarget(null);
            setActionFocus(null);
          }}
        >
          <aside className="statblock-drawer" role="dialog" aria-modal="true" aria-label={`${statblockTarget.name} statblock`} onClick={(event) => event.stopPropagation()}>
            <header className="statblock-drawer__head">
              <div>
                <span>Enemy statblock</span>
                <h2>{statblockTarget.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatblockTarget(null);
                  setActionFocus(null);
                }}
                aria-label="Sluit statblock"
              >
                <X size={18} />
              </button>
            </header>

            {actionFocus ? (
              <section className="statblock-action-focus">
                <div>
                  <Swords size={17} />
                  <strong>{actionFocus.name}</strong>
                </div>
                <span>
                  {[actionFocus.attack ? `${actionFocus.attack} to hit` : "", actionFocus.damage].filter(Boolean).join(" / ")}
                </span>
                {detailText(actionFocus.desc) ? <p>{detailText(actionFocus.desc)}</p> : null}
              </section>
            ) : null}

            {renderStatBlock(statblockTarget, {
              copyWithFeedback,
              isCopied,
              copyKeyPrefix: `initiative-drawer-${statblockTarget?.id || statblockTarget?.index || statblockTarget?.name}`,
            })}
          </aside>
        </div>
      ) : null}
    </main>
  );
}
