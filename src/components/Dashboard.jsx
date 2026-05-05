import { ArrowRight, BookOpenCheck, Eye, FlaskConical, ScrollText, Swords, Users } from "lucide-react";
import { campaign, npcs, quests, scenes } from "../data/campaignData.js";
import { Meter, Panel, Tag } from "./ui.jsx";

export function Dashboard({ onNavigate, completedScenes, publishedCount }) {
  const activeQuests = quests.filter((quest) => quest.status === "Active");
  const importantNpcs = npcs.filter((npc) => ["Ally", "Hostile", "Missing"].includes(npc.status)).slice(0, 4);

  return (
    <main className="workspace dashboard-grid">
      <header className="topbar">
        <div>
          <p className="label">Volgende sessie</p>
          <h1>{campaign.nextSession.title}</h1>
          <span>{campaign.nextSession.location}</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" type="button" onClick={() => onNavigate("prep")}>
            <BookOpenCheck size={18} /> Prep sessie
          </button>
          <button className="button button--primary" type="button" onClick={() => onNavigate("runtime")}>
            <Eye size={18} /> Start sessie
          </button>
        </div>
      </header>

      <Panel title="Sessie focus" className="span-2">
        <div className="session-brief">
          <div>
            <p>{campaign.nextSession.strongStart}</p>
            <div className="brief-meta">
              <Tag tone="safe">Player-safe klaar: {publishedCount}</Tag>
              <Tag tone="danger">DM-only actief</Tag>
              <Tag>{completedScenes.size}/{scenes.length} scenes afgerond</Tag>
            </div>
          </div>
          <div>
            <span className="label">Prep status</span>
            <strong>{campaign.nextSession.prepStatus}%</strong>
            <Meter value={campaign.nextSession.prepStatus} />
          </div>
        </div>
      </Panel>

      <Panel title="Snelle knoppen">
        <div className="quick-grid">
          <button type="button" onClick={() => onNavigate("encounter")}><Swords size={17} /> Encounter</button>
          <button type="button" onClick={() => onNavigate("npcs")}><Users size={17} /> NPC index</button>
          <button type="button" onClick={() => onNavigate("quests")}><ScrollText size={17} /> Quests</button>
          <button type="button" onClick={() => onNavigate("prep")}><FlaskConical size={17} /> AI import</button>
        </div>
      </Panel>

      <Panel title="Open quests">
        <div className="list-stack">
          {activeQuests.map((quest) => (
            <button className="row-link" key={quest.title} type="button" onClick={() => onNavigate("quests")}>
              <span>
                <strong>{quest.title}</strong>
                <small>{quest.next}</small>
              </span>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Belangrijke NPCs">
        <div className="npc-mini-list">
          {importantNpcs.map((npc) => (
            <div className="npc-mini" key={npc.name}>
              <div className="avatar-slot">{npc.name.slice(0, 2)}</div>
              <div>
                <strong>{npc.name}</strong>
                <span>{npc.role}</span>
              </div>
              <Tag tone={npc.status === "Hostile" ? "danger" : npc.status === "Ally" ? "safe" : "warning"}>
                {npc.status}
              </Tag>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Lopende clocks">
        <div className="clock-list">
          {campaign.clocks.map((clock) => (
            <div className="clock-row" key={clock.name}>
              <div>
                <strong>{clock.name}</strong>
                <small>{clock.danger}</small>
              </div>
              <Meter value={clock.progress} tone={clock.progress > 40 ? "danger" : "accent"} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Party status" className="span-2">
        <div className="party-strip">
          {campaign.party.map((pc) => (
            <article className="pc-tile" key={pc.name}>
              <strong>{pc.name}</strong>
              <span>{pc.player}</span>
              <small>{pc.status}</small>
            </article>
          ))}
        </div>
      </Panel>
    </main>
  );
}
