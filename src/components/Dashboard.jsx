import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Eye,
  MapPinned,
  Shield,
  UploadCloud,
  Users,
} from "lucide-react";
import { campaign, npcs, quests, scenes } from "../data/campaignData.js";

const playerActions = [
  {
    label: "Party",
    module: "party",
    icon: Shield,
  },
  {
    label: "Player View",
    module: "player",
    icon: Users,
  },
  {
    label: "Import",
    module: "import",
    icon: UploadCloud,
  },
  {
    label: "Bekende quests",
    module: "quests",
    icon: BookOpenCheck,
  },
];

function countActiveQuests() {
  return quests.filter((quest) => quest.status === "Active").length;
}

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join("")
    .toUpperCase();
}

export function Dashboard({ workspace, onNavigate, completedScenes, publishedCount }) {
  const travelEvent = workspace?.travel?.lastEvent;
  const clocks = workspace?.campaignOs?.factionClocks || [];
  const topClock = [...clocks].sort((left, right) => right.progress - left.progress)[0];
  const importantNpc = npcs.find((npc) => npc.status === "Hostile") || npcs[0];
  const routeDay = workspace?.travel?.day || 1;
  const partyMembers = workspace?.party?.members || [];
  const playerLocation = workspace?.playerView?.currentLocation || "Junglepad richting Firefinger";
  const publishedCards = workspace?.playerView?.publishedCards?.length || 0;

  return (
    <main className="workspace v3-home">
      <section className="v3-hero">
        <div className="v3-hero__content">
          <div className="v3-hero__meta">
            <span>{campaign.name}</span>
            <span>Chult Expeditie</span>
            <span>{campaign.currentDate}</span>
          </div>
          <h1>Tafeloverzicht</h1>
          <p>
            Firefinger staat als een zwarte tand boven het bladerdak. De party volgt Azaka's spoor terwijl Zorath al verder de jungle in snijdt.
          </p>
          <div className="v3-hero__actions">
            <button className="button button--primary" type="button" onClick={() => onNavigate("runtime")}>
              <Eye size={18} /> Start sessie
            </button>
            <button className="button button--ghost" type="button" onClick={() => onNavigate("chult-map")}>
              <MapPinned size={18} /> Open Chult kaart
            </button>
          </div>
        </div>
        <div className="v3-table-map" aria-label="Routebriefing voor de tafel">
          <div className="v3-table-map__route">
            <span className="is-done" />
            <span className="is-active" />
            <span />
            <span />
          </div>
          <div>
            <span>Huidig doel</span>
            <strong>Bereik Firefinger</strong>
            <p>Route dag {routeDay}. Dichte jungle, warme regen, sterrenloze hemel.</p>
          </div>
          <div className="v3-table-map__omens">
            <strong>13</strong>
            <span>zwarte nachten</span>
          </div>
        </div>
      </section>

      <section className="v3-dm-strip">
        <div>
          <strong>Spelers aan tafel</strong>
          <span>
            {playerLocation} - {publishedCards} gepubliceerde updates - {partyMembers.length} party dossiers.
          </span>
        </div>
        <div className="v3-player-quick__party" aria-label="Party quick view">
          {partyMembers.slice(0, 5).map((member) => (
            <button key={member.name} type="button" onClick={() => onNavigate("party")}>
              <span>{initials(member.name)}</span>
              <strong>{member.name}</strong>
            </button>
          ))}
        </div>
        <div className="v3-player-quick__actions">
          {playerActions.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.module} type="button" onClick={() => onNavigate(action.module)}>
                <Icon size={16} /> {action.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="v3-focus-grid">
        <article className="v3-focus-card v3-focus-card--primary">
          <span>Sessiefocus</span>
          <h2>Bereik Firefinger</h2>
          <p>
            Dag {routeDay} van de expeditie. De party volgt Azaka's spoor door Chult, met de Red Wizards nog steeds voor hen uit.
          </p>
          <div className="v3-focus-stats">
            <div><strong>{countActiveQuests()}</strong><span>actieve quests</span></div>
            <div><strong>{routeDay}</strong><span>reisdag</span></div>
            <div><strong>{completedScenes.size}/{scenes.length}</strong><span>scenes klaar</span></div>
            <div><strong>{publishedCount}</strong><span>player-safe</span></div>
          </div>
        </article>

        <article className="v3-focus-card">
          <span>Reisbeat</span>
          <h2>{travelEvent?.title || "Nog geen event geresolved"}</h2>
          <p>{travelEvent?.pressure || "Gebruik Jungle Travel om de volgende dag mechanisch en narratief te laten landen."}</p>
          <button type="button" onClick={() => onNavigate("travel")}>
            Open Jungle Travel <ArrowRight size={16} />
          </button>
        </article>

        <article className="v3-focus-card v3-focus-card--danger">
          <span>DM-only druk</span>
          <h2>{topClock?.name || "Continuity check"}</h2>
          <p>{topClock?.nextMove || "Controleer secrets, clues en player-safe tekst voordat je publiceert."}</p>
          <div className="v3-warning-line">
            <AlertTriangle size={18} />
            <strong>{importantNpc?.name}</strong>
            <span>{importantNpc?.status}</span>
          </div>
        </article>
      </section>
    </main>
  );
}
