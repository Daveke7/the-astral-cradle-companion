import { Dices, EyeOff, FastForward, HeartPulse, ListOrdered, Plus, RotateCcw, Skull, Trash2 } from "lucide-react";
import { EmptyState, Meter, Panel, Tag } from "./ui.jsx";

const conditions = ["Blinded", "Charmed", "Frightened", "Grappled", "Poisoned", "Prone", "Stunned", "Restrained", "Unconscious"];

function orderedParticipants(participants) {
  return [...participants].sort((left, right) => {
    if (right.initiative !== left.initiative) return right.initiative - left.initiative;
    return right.dexMod - left.dexMod;
  });
}

function healthTone(participant) {
  if (participant.hp <= 0) return "danger";
  if (participant.hp <= participant.maxHp / 3) return "warning";
  return "accent";
}

function healthLabel(participant) {
  if (participant.hp <= 0) return "down";
  if (participant.hp <= participant.maxHp / 3) return "bloodied";
  return "steady";
}

function nextLogLine(participant, round) {
  return `R${round}: ${participant?.name || "Onbekend"} is aan de beurt.`;
}

export function InitiativeTracker({
  initiative,
  onPatchInitiative,
  onUpdateParticipant,
  onAddParticipant,
  onRemoveParticipant,
  onResetInitiative,
}) {
  const ordered = orderedParticipants(initiative.participants);
  const active = ordered[initiative.activeIndex % Math.max(ordered.length, 1)] || null;
  const next = ordered[(initiative.activeIndex + 1) % Math.max(ordered.length, 1)] || null;

  function nextTurn() {
    if (!ordered.length) return;
    const nextIndex = (initiative.activeIndex + 1) % ordered.length;
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
    const previousIndex = initiative.activeIndex === 0 ? ordered.length - 1 : initiative.activeIndex - 1;
    const previousRound = initiative.activeIndex === 0 ? Math.max(1, initiative.round - 1) : initiative.round;
    onPatchInitiative({ activeIndex: previousIndex, round: previousRound });
  }

  function sortTurns() {
    onPatchInitiative({
      participants: ordered,
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
    const tempDamage = amount < 0 ? Math.min(participant.tempHp, Math.abs(amount)) : 0;
    const hpDelta = amount < 0 ? amount + tempDamage : amount;
    onUpdateParticipant(participant.id, {
      tempHp: amount < 0 ? participant.tempHp - tempDamage : participant.tempHp,
      hp: Math.max(0, Math.min(participant.maxHp, participant.hp + hpDelta)),
    });
  }

  function toggleCondition(participant, condition) {
    const set = new Set(participant.conditions);
    if (set.has(condition)) set.delete(condition);
    else set.add(condition);
    onUpdateParticipant(participant.id, { conditions: Array.from(set) });
  }

  return (
    <main className="workspace initiative-page">
      <header className="topbar">
        <div>
          <p className="label">Initiative Tracker</p>
          <h1>{initiative.encounterName}</h1>
          <span>Ronde {initiative.round} - nu: {active?.name || "niemand"} - volgende: {next?.name || "niemand"}</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" type="button" onClick={previousTurn}>
            <RotateCcw size={18} /> Terug
          </button>
          <button className="button button--primary" type="button" onClick={nextTurn}>
            <FastForward size={18} /> Volgende
          </button>
        </div>
      </header>

      <section className="initiative-toolbar">
        <label>
          Encounter
          <input value={initiative.encounterName} onChange={(event) => onPatchInitiative({ encounterName: event.target.value })} />
        </label>
        <label>
          Quick HP
          <input
            type="number"
            value={initiative.quickAmount}
            onChange={(event) => onPatchInitiative({ quickAmount: Number(event.target.value || 1) })}
          />
        </label>
        <button className="button button--ghost" type="button" onClick={rollAll}>
          <Dices size={17} /> Roll all
        </button>
        <button className="button button--ghost" type="button" onClick={sortTurns}>
          <ListOrdered size={17} /> Sort
        </button>
        <button className="button button--ghost" type="button" onClick={onAddParticipant}>
          <Plus size={17} /> Add
        </button>
        <button className="button button--ghost" type="button" onClick={onResetInitiative}>
          <Skull size={17} /> Clear
        </button>
      </section>

      <section className="initiative-layout">
        <Panel title="Turn order" className="initiative-board">
          {ordered.length ? (
            <div className="initiative-list">
              {ordered.map((participant, index) => {
                const isActive = active?.id === participant.id;
                return (
                  <article className={isActive ? "initiative-row initiative-row--active" : "initiative-row"} key={participant.id}>
                    <div className="turn-marker">
                      <span>{index + 1}</span>
                      {isActive ? <Tag tone="safe">turn</Tag> : null}
                    </div>
                    <div className="initiative-main">
                      <div className="initiative-name-line">
                        <input
                          value={participant.name}
                          onChange={(event) => onUpdateParticipant(participant.id, { name: event.target.value })}
                          aria-label="Naam"
                        />
                        <select value={participant.side} onChange={(event) => onUpdateParticipant(participant.id, { side: event.target.value })}>
                          <option value="party">party</option>
                          <option value="ally">ally</option>
                          <option value="enemy">enemy</option>
                          <option value="neutral">neutral</option>
                        </select>
                      </div>
                      <div className="initiative-fields">
                        <label>Init<input type="number" value={participant.initiative} onChange={(event) => onUpdateParticipant(participant.id, { initiative: Number(event.target.value) })} /></label>
                        <label>Dex<input type="number" value={participant.dexMod} onChange={(event) => onUpdateParticipant(participant.id, { dexMod: Number(event.target.value) })} /></label>
                        <label>AC<input type="number" value={participant.ac} onChange={(event) => onUpdateParticipant(participant.id, { ac: Number(event.target.value) })} /></label>
                        <label>HP<input type="number" value={participant.hp} onChange={(event) => onUpdateParticipant(participant.id, { hp: Number(event.target.value) })} /></label>
                        <label>Max<input type="number" value={participant.maxHp} onChange={(event) => onUpdateParticipant(participant.id, { maxHp: Number(event.target.value) })} /></label>
                        <label>Temp<input type="number" value={participant.tempHp} onChange={(event) => onUpdateParticipant(participant.id, { tempHp: Number(event.target.value) })} /></label>
                      </div>
                      <div className="initiative-health">
                        <Meter value={participant.maxHp ? (participant.hp / participant.maxHp) * 100 : 0} tone={healthTone(participant)} />
                        <Tag tone={participant.hp <= 0 ? "danger" : participant.hp <= participant.maxHp / 3 ? "warning" : "safe"}>
                          {healthLabel(participant)}
                        </Tag>
                        {participant.hiddenFromPlayers ? <Tag tone="danger">hidden</Tag> : null}
                        {participant.concentration ? <Tag tone="warning">concentration</Tag> : null}
                        {participant.reactionUsed ? <Tag>reaction used</Tag> : null}
                      </div>
                      <div className="condition-toggle-row">
                        {conditions.map((condition) => (
                          <button
                            className={participant.conditions.includes(condition) ? "mini-toggle mini-toggle--active" : "mini-toggle"}
                            key={condition}
                            type="button"
                            onClick={() => toggleCondition(participant, condition)}
                          >
                            {condition}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={participant.notes}
                        onChange={(event) => onUpdateParticipant(participant.id, { notes: event.target.value })}
                        placeholder="Tactics, reminders, recharge, aura, saves, special rules."
                      />
                    </div>
                    <div className="initiative-actions">
                      <button type="button" onClick={() => rollParticipant(participant)} title="Roll d20 + dex"><Dices size={16} /></button>
                      <button type="button" onClick={() => adjustHp(participant, -initiative.quickAmount)} title="Damage"><HeartPulse size={16} />-{initiative.quickAmount}</button>
                      <button type="button" onClick={() => adjustHp(participant, initiative.quickAmount)} title="Heal"><HeartPulse size={16} />+{initiative.quickAmount}</button>
                      <button type="button" onClick={() => onUpdateParticipant(participant.id, { reactionUsed: !participant.reactionUsed })}>Reaction</button>
                      <button type="button" onClick={() => onUpdateParticipant(participant.id, { concentration: !participant.concentration })}>Conc.</button>
                      <button type="button" onClick={() => onUpdateParticipant(participant.id, { hiddenFromPlayers: !participant.hiddenFromPlayers })}><EyeOff size={16} /></button>
                      <button type="button" onClick={() => onRemoveParticipant(participant.id)} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState>Geen deelnemers. Voeg party, monsters of NPCs toe.</EmptyState>
          )}
        </Panel>

        <aside className="initiative-side">
          <Panel title="Active turn">
            {active ? (
              <div className="active-turn-card">
                <Tag tone={active.side === "enemy" ? "danger" : "safe"}>{active.side}</Tag>
                <h2>{active.name}</h2>
                <p>{active.notes || "Geen tactische notities."}</p>
                <div className="split-tags">
                  <Tag>AC {active.ac}</Tag>
                  <Tag>{active.hp}/{active.maxHp} HP</Tag>
                  <Tag>Init {active.initiative}</Tag>
                </div>
              </div>
            ) : (
              <EmptyState>Geen actieve deelnemer.</EmptyState>
            )}
          </Panel>

          <Panel title="Encounter pressure">
            <label className="field-line">
              <span>Objective</span>
              <textarea value={initiative.objective} onChange={(event) => onPatchInitiative({ objective: event.target.value })} />
            </label>
            <label className="field-line">
              <span>Timer / reinforcement</span>
              <textarea value={initiative.timer} onChange={(event) => onPatchInitiative({ timer: event.target.value })} />
            </label>
            <label className="field-line">
              <span>Lair / initiative 20</span>
              <input value={initiative.lairActionName} onChange={(event) => onPatchInitiative({ lairActionName: event.target.value })} />
            </label>
          </Panel>

          <Panel title="Turn log">
            <div className="turn-log">
              {initiative.log.length ? initiative.log.map((line) => <p key={line}>{line}</p>) : <EmptyState>Nog geen turn log.</EmptyState>}
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}
