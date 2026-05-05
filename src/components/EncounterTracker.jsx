import { CircleMinus, CirclePlus, Forward } from "lucide-react";
import { encounters } from "../data/campaignData.js";
import { Meter, Panel, Tag } from "./ui.jsx";

export function EncounterTracker({ monsters, setMonsters, activeTurn, setActiveTurn }) {
  const encounter = encounters[0];
  const ordered = [...monsters].sort((a, b) => b.initiative - a.initiative);
  const active = ordered[activeTurn % ordered.length];

  function adjustHp(name, amount) {
    setMonsters((current) =>
      current.map((monster) =>
        monster.name === name
          ? { ...monster, hp: Math.max(0, Math.min(monster.maxHp, monster.hp + amount)) }
          : monster
      )
    );
  }

  return (
    <main className="workspace two-column">
      <header className="topbar">
        <div>
          <p className="label">Encounter Tracker</p>
          <h1>{encounter.name}</h1>
          <span>{encounter.difficulty} - {encounter.objective}</span>
        </div>
        <button className="button button--primary" type="button" onClick={() => setActiveTurn((turn) => turn + 1)}>
          <Forward size={18} /> Volgende beurt
        </button>
      </header>

      <section className="main-column">
        <Panel title="Initiative">
          <div className="combat-list">
            {ordered.map((monster) => (
              <article className={active.name === monster.name ? "combatant combatant--active" : "combatant"} key={monster.name}>
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
          </div>
        </Panel>
        <Panel title="Conditions reminder">
          <div className="condition-grid">
            {["Blinded", "Charmed", "Frightened", "Grappled", "Poisoned", "Prone", "Stunned"].map((condition) => (
              <button key={condition} type="button" title={`${condition}: check PHB/SRD korte regel aan tafel`}>
                {condition}
              </button>
            ))}
          </div>
        </Panel>
      </aside>
    </main>
  );
}
