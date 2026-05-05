import { useMemo, useState } from "react";
import { quests } from "../data/campaignData.js";
import { DmOnly, Panel, Tag } from "./ui.jsx";

const statuses = ["All", "Hidden", "Available", "Active", "Completed", "Failed"];

export function QuestLog() {
  const [status, setStatus] = useState("All");
  const visibleQuests = useMemo(
    () => quests.filter((quest) => status === "All" || quest.status === status),
    [status]
  );

  return (
    <main className="workspace">
      <header className="topbar">
        <div>
          <p className="label">Quest Log</p>
          <h1>Waarheid, geruchten en volgende stappen</h1>
          <span>Elke quest bewaart een player-visible samenvatting en DM-only waarheid.</span>
        </div>
      </header>
      <Panel title="Quests">
        <div className="tab-row">
          {statuses.map((item) => (
            <button className={status === item ? "tab tab--active" : "tab"} key={item} type="button" onClick={() => setStatus(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="quest-table">
          {visibleQuests.map((quest) => (
            <article className="quest-row" key={quest.title}>
              <div>
                <h3>{quest.title}</h3>
                <span>{quest.type} - {quest.linked}</span>
              </div>
              <Tag tone={quest.status === "Active" ? "safe" : quest.status === "Hidden" ? "danger" : "neutral"}>{quest.status}</Tag>
              <p><strong>Next:</strong> {quest.next}</p>
              <p><strong>Player-safe:</strong> {quest.playerSafe}</p>
              <DmOnly>{quest.dmTruth}</DmOnly>
            </article>
          ))}
        </div>
      </Panel>
    </main>
  );
}
