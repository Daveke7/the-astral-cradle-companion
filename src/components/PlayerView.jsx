import { EyeOff, MonitorUp, Users } from "lucide-react";
import { campaign, quests } from "../data/campaignData.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

export function PlayerView({ scenes, playerView, partyMembers, publishScene }) {
  const publishedSceneSet = new Set(playerView.publishedSceneIds);
  const published = scenes.filter((scene) => publishedSceneSet.has(scene.id));
  const knownQuests = quests.filter((quest) => quest.status !== "Hidden");

  return (
    <main className="workspace player-view">
      <header className="topbar">
        <div>
          <p className="label">Player View</p>
          <h1>Veilige tafelweergave</h1>
          <span>Alleen handmatig gepubliceerde informatie. Geen DM-only velden. Laatst gepubliceerd: {playerView.lastPublishedAt ? new Date(playerView.lastPublishedAt).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "nog niet"}</span>
        </div>
        <button className="button button--ghost" type="button" onClick={() => publishScene(scenes[0].id)}>
          <MonitorUp size={18} /> Publiceer huidige locatie
        </button>
      </header>

      <section className="player-stage">
        <div>
          <span className="player-stage__label">{campaign.partyName}</span>
          <h2>{playerView.currentLocation || "Junglepad richting Firefinger"}</h2>
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
        {playerView.publishedCards.length ? (
          <div className="published-list">
            {playerView.publishedCards.map((card) => (
              <article key={card.id}>
                <Tag tone="safe">Player-safe</Tag>
                <h3>{card.title.replace(/^Scene \d+\s*-\s*/, "")}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        ) : published.length ? (
          <div className="published-list">
            {published.map((scene) => (
              <article key={scene.id}>
                <Tag tone="safe">Player-safe</Tag>
                <h3>{scene.title.replace(/^Scene \d+\s*-\s*/, "")}</h3>
                <p>{scene.playerSafe}</p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState>Nog niets gepubliceerd. Gebruik Live Runtime om updates naar deze view te sturen.</EmptyState>
        )}
      </Panel>

      <section className="player-portal-grid">
        <Panel title="Bekende quests">
          <div className="player-quests">
            {knownQuests.map((quest) => (
              <p key={quest.title}><strong>{quest.title}:</strong> {quest.playerSafe}</p>
            ))}
          </div>
        </Panel>

        <Panel title="Party portal">
          <div className="portal-party-list">
            {partyMembers.map((member) => (
              <article key={member.name}>
                {member.imageUrl ? (
                  <img src={member.imageUrl} alt={member.name} />
                ) : (
                  <div className="avatar-slot"><Users size={16} /></div>
                )}
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.visible}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </main>
  );
}
