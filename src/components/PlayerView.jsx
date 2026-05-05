import { EyeOff, MonitorUp } from "lucide-react";
import { campaign, scenes } from "../data/campaignData.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

export function PlayerView({ publishedScenes, publishScene }) {
  const published = scenes.filter((scene) => publishedScenes.has(scene.id));

  return (
    <main className="workspace player-view">
      <header className="topbar">
        <div>
          <p className="label">Player View</p>
          <h1>Veilige tafelweergave</h1>
          <span>Alleen handmatig gepubliceerde informatie. Geen DM-only velden.</span>
        </div>
        <button className="button button--ghost" type="button" onClick={() => publishScene(scenes[0].id)}>
          <MonitorUp size={18} /> Publiceer huidige locatie
        </button>
      </header>

      <section className="player-stage">
        <div>
          <span className="player-stage__label">{campaign.partyName}</span>
          <h2>Junglepad richting Firefinger</h2>
          <p>
            De expeditie heeft Port Nyanzaru verlaten. De nacht blijft wereldwijd zonder sterren.
            Firefinger wacht boven de boomkruinen.
          </p>
        </div>
        <div className="safe-seal">
          <EyeOff size={28} />
          <span>spoiler-safe</span>
        </div>
      </section>

      <Panel title="Gepubliceerde updates">
        {published.length ? (
          <div className="published-list">
            {published.map((scene) => (
              <article key={scene.id}>
                <Tag tone="safe">Player-safe</Tag>
                <h3>{scene.title.replace(/^Scene \\d - /, "")}</h3>
                <p>{scene.playerSafe}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>Nog niets gepubliceerd. Gebruik Live Runtime om updates naar deze view te sturen.</EmptyState>
        )}
      </Panel>

      <Panel title="Bekende quests">
        <div className="player-quests">
          <p><strong>Azaka's masker:</strong> herstel de deal met de gids door het masker uit Firefinger terug te halen.</p>
          <p><strong>Ellisar Veyra:</strong> vind Elira's vermiste broer in Chult.</p>
          <p><strong>De Zwarte Nachten:</strong> ontdek waarom de sterren verdwenen zijn.</p>
        </div>
      </Panel>
    </main>
  );
}
