import { useState } from "react";
import { Copy, Eye, Plus, Sparkles, Theater, Users } from "lucide-react";
import { copyNpc, generateRandomNpc } from "../utils/npcGenerator.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

const regions = ["Chult", "Port Nyanzaru", "Thayan", "Baldur's Gate", "Jungle Tribes", "Any"];
const roleTypes = ["Civilian", "Criminal", "Political", "Mystic", "Explorer", "Antagonist"];
const dispositions = [
  { id: "neutral", label: "Neutral" },
  { id: "ally", label: "Ally leaning" },
  { id: "hostile", label: "Hostile leaning" },
];
const dangers = [
  { id: "story", label: "Story NPC" },
  { id: "capable", label: "Capable" },
  { id: "dangerous", label: "Dangerous" },
];
const factions = [
  "random",
  "None",
  "Merchant Princes",
  "Red Wizards of Thay",
  "Echo Syndicate",
  "Explorer's Guild",
  "Iron Serpent remnants",
  "Mage's Enclave",
  "Tabaxi clans",
  "Jungle Elf remnant",
  "Cult of the Black Night",
];

function toneForStatus(status) {
  if (status === "Hostile") return "danger";
  if (status === "Ally") return "safe";
  return "warning";
}

function NpcOutput({ npc, onSave, saved }) {
  if (!npc) return <EmptyState>Kies de parameters en genereer een NPC.</EmptyState>;
  return (
    <article className="random-npc-output">
      <header>
        <div>
          <span>{npc.region} / {npc.faction}</span>
          <h2>{npc.name}</h2>
        </div>
        <Tag tone={toneForStatus(npc.status)}>{npc.status}</Tag>
      </header>

      <div className="random-npc-identity">
        <article><span>Role</span><strong>{npc.role}</strong></article>
        <article><span>Voice</span><strong>{npc.voice}</strong></article>
        <article><span>Appearance</span><strong>{npc.appearance}</strong></article>
        <article><span>Mannerism</span><strong>{npc.mannerism}</strong></article>
      </div>

      <section className="random-npc-motives">
        <p><strong>Wants</strong><span>{npc.wants}</span></p>
        <p><strong>Fear</strong><span>{npc.fear}</span></p>
        <p><strong>Relationship</strong><span>{npc.relationship}</span></p>
        <p><strong>Hook</strong><span>{npc.hook}</span></p>
      </section>

      <section className="random-npc-table-text">
        <article>
          <Eye size={16} />
          <div>
            <strong>Player-safe</strong>
            <span>{npc.playerSafe}</span>
          </div>
        </article>
        <article>
          <Theater size={16} />
          <div>
            <strong>DM-only secret</strong>
            <span>{npc.secret}</span>
          </div>
        </article>
      </section>

      <section className="random-npc-statline">
        <article><span>AC</span><strong>{npc.statBlock.ac}</strong></article>
        <article><span>HP</span><strong>{npc.statBlock.hp}</strong></article>
        <article><span>Combat role</span><strong>{npc.statBlock.role}</strong></article>
        <article><span>Attack</span><strong>{npc.statBlock.attack}</strong></article>
      </section>

      <footer className="random-npc-actions">
        <button className="button button--ghost" type="button" onClick={() => copyNpc(npc)}>
          <Copy size={16} /> Kopieer NPC
        </button>
        <button className="button button--primary" type="button" onClick={() => onSave(npc)} disabled={saved}>
          <Plus size={16} /> {saved ? "Opgeslagen" : "Bewaar in NPC index"}
        </button>
      </footer>
    </article>
  );
}

export function RandomNpcGenerator({ generatedNpcs = [], onSaveNpc }) {
  const [region, setRegion] = useState("Port Nyanzaru");
  const [roleType, setRoleType] = useState("Explorer");
  const [factionMode, setFactionMode] = useState("random");
  const [disposition, setDisposition] = useState("neutral");
  const [danger, setDanger] = useState("capable");
  const [npc, setNpc] = useState(null);

  function rollNpc() {
    setNpc(generateRandomNpc({ region, roleType, factionMode, disposition, danger }));
  }

  const saved = npc ? generatedNpcs.some((item) => item.id === npc.id) : false;

  return (
    <main className="workspace random-npc-page">
      <header className="topbar random-npc-header">
        <div>
          <p className="label">Random NPC Generator</p>
          <h1>NPC's die meteen speelbaar zijn</h1>
          <span>Naam, stem, uiterlijk, motivatie, geheim, faction, hook en combat-lite stats.</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--primary" type="button" onClick={rollNpc}>
            <Sparkles size={18} /> Genereer NPC
          </button>
        </div>
      </header>

      <section className="random-npc-layout">
        <Panel title="Generator controls" action={<Tag>{generatedNpcs.length} opgeslagen</Tag>}>
          <div className="random-npc-controls">
            <label>
              <span>Region</span>
              <select value={region} onChange={(event) => setRegion(event.target.value)}>
                {regions.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>NPC type</span>
              <select value={roleType} onChange={(event) => setRoleType(event.target.value)}>
                {roleTypes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Faction</span>
              <select value={factionMode} onChange={(event) => setFactionMode(event.target.value)}>
                {factions.map((item) => <option key={item} value={item}>{item === "random" ? "Random faction" : item}</option>)}
              </select>
            </label>
            <label>
              <span>Disposition</span>
              <select value={disposition} onChange={(event) => setDisposition(event.target.value)}>
                {dispositions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Danger</span>
              <select value={danger} onChange={(event) => setDanger(event.target.value)}>
                {dangers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          </div>
          <div className="random-npc-source-notes">
            <span>Bewaren voegt de NPC toe aan de NPC Manager, inclusief player-safe en DM-only informatie.</span>
            <span>Gebruik Antagonist + Dangerous voor snelle rivalen, informanten of Thayan agents.</span>
          </div>
        </Panel>

        <Panel title={npc ? npc.name : "NPC output"} className="random-npc-output-panel">
          <NpcOutput npc={npc} onSave={onSaveNpc} saved={saved} />
        </Panel>

        <aside className="random-npc-side">
          <Panel title="Recent opgeslagen">
            <div className="random-npc-history">
              {generatedNpcs.length ? (
                generatedNpcs.slice(0, 8).map((item) => (
                  <article key={item.id}>
                    <Users size={16} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.role} / {item.faction}</span>
                    </div>
                    <Tag tone={toneForStatus(item.status)}>{item.status}</Tag>
                  </article>
                ))
              ) : (
                <EmptyState>Nog geen gegenereerde NPC's opgeslagen.</EmptyState>
              )}
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}
