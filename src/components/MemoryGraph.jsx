import { useMemo, useState } from "react";
import { GitBranch, Search, ShieldAlert } from "lucide-react";
import { campaign, npcs, quests } from "../data/campaignData.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

function makeNode(id, type, title, detail, tone = "neutral") {
  return { id, type, title, detail, tone };
}

function buildMemoryGraph({ workspace, partyMembers }) {
  const nodes = [
    makeNode("campaign-red-below", "Campaign", campaign.name, campaign.tone, "danger"),
    ...partyMembers.map((member) => makeNode(`pc-${member.name}`, "PC", member.name, member.spotlight || member.hook, "safe")),
    ...npcs.map((npc) => makeNode(`npc-${npc.name}`, "NPC", npc.name, `${npc.status} / ${npc.relationship}`, npc.status === "Hostile" ? "danger" : "warning")),
    ...quests.map((quest) => makeNode(`quest-${quest.title}`, "Quest", quest.title, quest.next, quest.status === "Active" ? "safe" : "warning")),
    ...workspace.campaignOs.factionClocks.map((clock) =>
      makeNode(`clock-${clock.id}`, "Clock", clock.name, `${clock.progress}% - ${clock.nextMove}`, clock.progress > 60 ? "danger" : "warning")
    ),
    ...workspace.campaignOs.consequences.map((item) =>
      makeNode(`consequence-${item.id}`, "Consequence", item.choice, item.hidden || item.visible || "Nog geen payoff", "danger")
    ),
  ];

  const edges = [
    ...partyMembers.map((member) => ({
      from: member.name,
      to: campaign.activeCampaign,
      label: member.status || "active",
      risk: member.spotlight || member.hook,
    })),
    ...quests.map((quest) => ({
      from: quest.title,
      to: quest.linked,
      label: quest.status,
      risk: quest.dmTruth,
    })),
    ...npcs.map((npc) => ({
      from: npc.name,
      to: npc.faction,
      label: npc.status,
      risk: npc.secret,
    })),
    ...workspace.campaignOs.consequences.map((item) => ({
      from: item.choice,
      to: item.payoff || "Later",
      label: "payoff",
      risk: item.hidden || "Geen verborgen gevolg ingevuld",
    })),
  ];

  return { nodes, edges };
}

export function MemoryGraph({ workspace, partyMembers }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const graph = useMemo(() => buildMemoryGraph({ workspace, partyMembers }), [workspace, partyMembers]);
  const types = ["All", ...Array.from(new Set(graph.nodes.map((node) => node.type)))];
  const filteredNodes = graph.nodes.filter((node) => {
    const haystack = `${node.type} ${node.title} ${node.detail}`.toLowerCase();
    return (type === "All" || node.type === type) && haystack.includes(query.toLowerCase());
  });
  const visibleTitles = new Set(filteredNodes.map((node) => node.title));
  const filteredEdges = graph.edges.filter((edge) => {
    const haystack = `${edge.from} ${edge.to} ${edge.label} ${edge.risk}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) || visibleTitles.has(edge.from);
  });

  return (
    <main className="workspace memory-page">
      <header className="topbar">
        <div>
          <p className="label">Campaign Memory Graph</p>
          <h1>Canon, relaties en losse draden in één brein</h1>
          <span>Niet alleen notities: dit laat zien waar quests, NPCs, party hooks en clocks elkaar raken.</span>
        </div>
      </header>

      <section className="memory-layout">
        <Panel title="Zoeken en filteren">
          <div className="memory-controls">
            <label className="search-box">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Zoek William, Mezro, Cassian..." />
            </label>
            <div className="tab-row">
              {types.map((item) => (
                <button
                  className={type === item ? "tab tab--active" : "tab"}
                  key={item}
                  type="button"
                  onClick={() => setType(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="memory-node-grid">
            {filteredNodes.map((node) => (
              <article className="memory-node" key={node.id}>
                <Tag tone={node.tone}>{node.type}</Tag>
                <strong>{node.title}</strong>
                <span>{node.detail}</span>
              </article>
            ))}
          </div>
        </Panel>

        <aside className="side-column">
          <Panel title="Relaties">
            {filteredEdges.length ? (
              <div className="edge-list">
                {filteredEdges.slice(0, 18).map((edge) => (
                  <article key={`${edge.from}-${edge.to}-${edge.label}`}>
                    <GitBranch size={16} />
                    <div>
                      <strong>{edge.from}</strong>
                      <span>{edge.label} {"->"} {edge.to}</span>
                      <small>{edge.risk}</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState>Geen relaties gevonden voor deze filter.</EmptyState>
            )}
          </Panel>

          <Panel title="Canon risico's">
            <div className="warning-stack">
              {campaign.warnings.map((warning) => (
                <div className="dm-only" key={warning.title}>
                  <ShieldAlert size={16} />
                  <span><strong>{warning.title}</strong> - {warning.detail}</span>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}
