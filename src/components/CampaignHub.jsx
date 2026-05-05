import { arcs, campaign } from "../data/campaignData.js";
import { DmOnly, Panel, Tag } from "./ui.jsx";

export function CampaignHub() {
  return (
    <main className="workspace two-column">
      <header className="topbar">
        <div>
          <p className="label">Campaign Hub</p>
          <h1>{campaign.name}</h1>
          <span>{campaign.tone}</span>
        </div>
      </header>

      <section className="main-column">
        <Panel title="Arcs en canon">
          <div className="timeline">
            {arcs.map((arc) => (
              <article className="timeline-item" key={arc.name}>
                <div>
                  <Tag tone={arc.status === "Actief" ? "danger" : "neutral"}>{arc.status}</Tag>
                  <h3>{arc.name}</h3>
                </div>
                <ul>
                  {arc.beats.map((beat) => (
                    <li key={beat}>{beat}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Open mysteries">
          <div className="mystery-grid">
            {campaign.mysteries.map((mystery) => (
              <p key={mystery}>{mystery}</p>
            ))}
          </div>
        </Panel>
      </section>

      <aside className="side-column">
        <Panel title="Continuity warnings">
          <div className="warning-stack">
            {campaign.warnings.map((warning) => (
              <DmOnly key={warning.title}>
                <strong>{warning.title}</strong> - {warning.detail}
              </DmOnly>
            ))}
          </div>
        </Panel>

        <Panel title="Player-safe samenvatting">
          <p>
            Cobra Kai vertrekt als Envoys of the Merchants uit Port Nyanzaru. De eerste route loopt naar
            Firefinger, waar Azaka's familie-masker verborgen is. Daarna wacht Mezro.
          </p>
          <div className="split-tags">
            <Tag tone="safe">Publiceerbaar</Tag>
            <Tag tone="warning">Geen Astral Cradle naam</Tag>
          </div>
        </Panel>
      </aside>
    </main>
  );
}
