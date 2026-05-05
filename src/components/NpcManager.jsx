import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { npcs } from "../data/campaignData.js";
import { DmOnly, Panel, Tag } from "./ui.jsx";

const filters = ["All", "Ally", "Hostile", "Missing", "Unknown"];

export function NpcManager() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const visibleNpcs = useMemo(
    () =>
      npcs.filter((npc) => {
        const matchesFilter = filter === "All" || npc.status === filter;
        const matchesQuery = `${npc.name} ${npc.role} ${npc.faction}`.toLowerCase().includes(query.toLowerCase());
        return matchesFilter && matchesQuery;
      }),
    [filter, query]
  );

  return (
    <main className="workspace">
      <header className="topbar">
        <div>
          <p className="label">NPC & Faction Manager</p>
          <h1>Relaties, geheimen en zichtbare informatie</h1>
          <span>Player-visible notes blijven gescheiden van DM-notes.</span>
        </div>
      </header>
      <Panel
        title="NPC index"
        action={
          <label className="search-box">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek NPC of faction" />
          </label>
        }
      >
        <div className="tab-row">
          {filters.map((item) => (
            <button className={filter === item ? "tab tab--active" : "tab"} key={item} type="button" onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="npc-grid">
          {visibleNpcs.map((npc) => (
            <article className="npc-card" key={npc.name}>
              <div className="npc-card__head">
                <div className="portrait-slot">{npc.name.slice(0, 2)}</div>
                <div>
                  <h3>{npc.name}</h3>
                  <span>{npc.role} - {npc.faction}</span>
                </div>
                <Tag tone={npc.status === "Hostile" ? "danger" : npc.status === "Ally" ? "safe" : "warning"}>{npc.status}</Tag>
              </div>
              <dl>
                <div><dt>Voice</dt><dd>{npc.voice}</dd></div>
                <div><dt>Wants</dt><dd>{npc.wants}</dd></div>
                <div><dt>Fear</dt><dd>{npc.fear}</dd></div>
                <div><dt>Relatie</dt><dd>{npc.relationship}</dd></div>
              </dl>
              <p className="player-safe-line"><strong>Player-safe:</strong> {npc.visible}</p>
              <DmOnly>{npc.secret}</DmOnly>
            </article>
          ))}
        </div>
      </Panel>
    </main>
  );
}
