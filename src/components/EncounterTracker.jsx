import { CircleMinus, CirclePlus, Forward } from "lucide-react";
import { Meter, Panel, Tag } from "./ui.jsx";

const conditionReference = {
  Blinded: "Kan niet zien; attacks tegen target hebben advantage, eigen attacks disadvantage.",
  Charmed: "Kan charmer niet aanvallen; charmer heeft advantage op social checks.",
  Frightened: "Disadvantage zolang bron zichtbaar is; kan niet dichterbij bewegen.",
  Grappled: "Speed 0; eindigt als grappler incapacitated is of effect breekt.",
  Poisoned: "Disadvantage op attack rolls en ability checks.",
  Prone: "Melee tegen target advantage, ranged disadvantage; staan kost halve speed.",
  Stunned: "Incapacitated, faalt STR/DEX saves, attacks tegen target advantage.",
};

export function EncounterTracker({ encounterState, encounter, monsters, setMonsters, activeTurn, setActiveTurn, patchEncounter }) {
  const ordered = [...monsters].sort((a, b) => b.initiative - a.initiative);
  const active = ordered.length ? ordered[activeTurn % ordered.length] : null;

  function adjustHp(name, amount) {
    setMonsters((current) =>
      current.map((monster) =>
        monster.name === name
          ? { ...monster, hp: Math.max(0, Math.min(monster.maxHp, monster.hp + amount)) }
          : monster
      )
    );
  }

  function toggleCondition(name, condition) {
    setMonsters((current) =>
      current.map((monster) => {
        if (monster.name !== name) return monster;
        const currentConditions = new Set(monster.conditions);
        if (currentConditions.has(condition)) currentConditions.delete(condition);
        else currentConditions.add(condition);
        return { ...monster, conditions: Array.from(currentConditions) };
      })
    );
  }

  return (
    <main className="workspace two-column">
      <header className="topbar">
        <div>
          <p className="label">Encounter Tracker</p>
          <h1>{encounter.name}</h1>
          <span>Ronde {encounterState.round} - {encounter.difficulty} - {encounter.objective}</span>
        </div>
        <button className="button button--primary" type="button" onClick={() => setActiveTurn((turn) => turn + 1)}>
          <Forward size={18} /> Volgende beurt
        </button>
      </header>

      <section className="main-column">
        <Panel title="Initiative">
          <div className="combat-list">
            {ordered.map((monster) => (
              <article className={active?.name === monster.name ? "combatant combatant--active" : "combatant"} key={monster.name}>
                <div className="combatant__main">
                  <strong>{monster.name}</strong>
                  <span>Init {monster.initiative} - AC {monster.ac}</span>
                  <div className="combat-tags">
                    <Tag>{monster.role}</Tag>
                    {monster.conditions.map((condition) => (
                      <Tag tone="warning" key={condition}>{condition}</Tag>
                    ))}
                  </div>
                </div>
                <div className="hp-box">
                  <span>{monster.hp}/{monster.maxHp} HP</span>
                  <Meter value={(monster.hp / monster.maxHp) * 100} tone={monster.hp < monster.maxHp / 3 ? "danger" : "accent"} />
                  <div className="hp-actions">
                    <button type="button" onClick={() => adjustHp(monster.name, -5)} title="5 damage"><CircleMinus size={16} /></button>
                    <button type="button" onClick={() => adjustHp(monster.name, 5)} title="5 healing"><CirclePlus size={16} /></button>
                  </div>
                </div>
                <div className="condition-toggle-row">
                  {Object.keys(conditionReference).slice(0, 5).map((condition) => (
                    <button
                      className={monster.conditions.includes(condition) ? "mini-toggle mini-toggle--active" : "mini-toggle"}
                      key={condition}
                      type="button"
                      title={conditionReference[condition]}
                      onClick={() => toggleCondition(monster.name, condition)}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <aside className="side-column">
        <Panel title="Terrein en clocks">
          <p>{encounter.terrain}</p>
          <div className="dm-note-block">
            <strong>Timer</strong>
            <span>{encounter.timer}</span>
            <Meter value={encounterState.timerProgress} tone={encounterState.timerProgress > 65 ? "danger" : "accent"} />
            <div className="hp-actions">
              <button type="button" onClick={() => patchEncounter({ timerProgress: Math.max(0, encounterState.timerProgress - 25) })}>-</button>
              <button type="button" onClick={() => patchEncounter({ timerProgress: Math.min(100, encounterState.timerProgress + 25) })}>+</button>
            </div>
          </div>
          <div className="dm-note-block">
            <strong>Objective status</strong>
            <select value={encounterState.objectiveStatus} onChange={(event) => patchEncounter({ objectiveStatus: event.target.value })}>
              <option>Nog open</option>
              <option>Route-info gevonden</option>
              <option>Scout gevangen</option>
              <option>Escalatie gestart</option>
              <option>Afgerond</option>
            </select>
          </div>
        </Panel>
        <Panel title="Conditions reminder">
          <div className="condition-grid">
            {Object.entries(conditionReference).map(([condition, detail]) => (
              <button key={condition} type="button" title={detail}>
                {condition}
              </button>
            ))}
          </div>
        </Panel>
      </aside>
    </main>
  );
}
