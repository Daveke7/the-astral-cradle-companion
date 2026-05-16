import { EyeOff, MonitorUp, Users } from "lucide-react";
import { campaign, quests } from "../data/campaignData.js";
import { getHexPositionById } from "../data/systems/chultHexSystem.js";
import { buildChultRouteAnalysis } from "../utils/jungleTravelEngine.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

function buildSafeRoutePoints(hexes) {
  if (!hexes.length) return [];
  const rawPoints = hexes.map((hex) => ({ ...getHexPositionById(hex.hexId), hex }));
  const minX = Math.min(...rawPoints.map((point) => point.x));
  const maxX = Math.max(...rawPoints.map((point) => point.x));
  const minY = Math.min(...rawPoints.map((point) => point.y));
  const maxY = Math.max(...rawPoints.map((point) => point.y));
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  return rawPoints.map((point) => ({
    ...point,
    x: 8 + ((point.x - minX) / spanX) * 84,
    y: 18 + ((point.y - minY) / spanY) * 62,
  }));
}

export function PlayerView({ scenes, playerView, partyMembers, chultMap, travel, publishScene }) {
  const publishedSceneSet = new Set(playerView.publishedSceneIds);
  const published = scenes.filter((scene) => publishedSceneSet.has(scene.id));
  const knownQuests = quests.filter((quest) => quest.status !== "Hidden");
  const routeAnalysis = buildChultRouteAnalysis(chultMap, travel);
  const publishedRouteSet = new Set(chultMap?.publishedRouteHexes || []);
  const knownRouteHexes = routeAnalysis.hexes.filter((hex) => publishedRouteSet.has(hex.hexId));
  const knownDistanceKm = Math.round(Math.max(0, knownRouteHexes.length - 1) * 10 * 1.60934);
  const safeRoutePoints = buildSafeRoutePoints(knownRouteHexes);
  const safeRoutePolyline = safeRoutePoints.map((point) => `${point.x},${point.y}`).join(" ");
  const currentKnownHex = knownRouteHexes[knownRouteHexes.length - 1];
  const knownProgressPercent = routeAnalysis.totalHexes
    ? Math.round((Math.max(0, knownRouteHexes.length - 1) / routeAnalysis.totalHexes) * 100)
    : 0;

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
            Firefinger wacht boven de boomkruinen. Bekende route: ongeveer {knownDistanceKm} km.
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

        <Panel title="Bekende expeditieroute">
          {knownRouteHexes.length ? (
            <div className="player-route-safe">
              <div className="player-route-map" aria-label="Bekende expeditieroute">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M8 82 C28 18 63 94 92 22" />
                  {safeRoutePolyline ? <polyline points={safeRoutePolyline} /> : null}
                </svg>
                {safeRoutePoints.map((point, index) => (
                  <span
                    className={index === safeRoutePoints.length - 1 ? "player-route-dot player-route-dot--current" : "player-route-dot"}
                    key={`${point.hex.hexId}-${index}`}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  />
                ))}
              </div>
              <div className="player-route-stats">
                <article>
                  <span>Bekend</span>
                  <strong>{knownRouteHexes.length} hexes</strong>
                </article>
                <article>
                  <span>Afstand</span>
                  <strong>{knownDistanceKm} km</strong>
                </article>
                <article>
                  <span>Voortgang</span>
                  <strong>{knownProgressPercent}%</strong>
                </article>
              </div>
              <div className="player-route-current">
                <Tag tone="safe">huidig bekend punt</Tag>
                <strong>{currentKnownHex?.title}</strong>
                <span>{currentKnownHex?.playerSafe || currentKnownHex?.terrainLabel}</span>
              </div>
              <div className="player-route-list">
                {knownRouteHexes.map((hex, index) => (
                  <article key={`${hex.hexId}-${index}`}>
                    <Tag tone={index === knownRouteHexes.length - 1 ? "safe" : "neutral"}>
                      {index === knownRouteHexes.length - 1 ? "huidig" : "bekend"}
                    </Tag>
                    <strong>{hex.title}</strong>
                    <span>{hex.playerSafe || hex.terrainLabel}</span>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>Nog geen route naar Player View gepubliceerd.</EmptyState>
          )}
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
