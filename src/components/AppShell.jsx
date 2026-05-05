import {
  BookOpen,
  Castle,
  ClipboardList,
  Eye,
  Map,
  Swords,
  Theater,
  Users,
} from "lucide-react";
import { campaign } from "../data/campaignData.js";

const iconMap = {
  dashboard: Castle,
  campaign: Map,
  prep: ClipboardList,
  runtime: Eye,
  encounter: Swords,
  npcs: Theater,
  quests: BookOpen,
  player: Users,
};

export function AppShell({ modules, activeModule, onSelect, children }) {
  return (
    <div className="app-shell">
      <aside className="side-nav" aria-label="Hoofdnavigatie">
        <div className="brand">
          <span className="brand__mark">RB</span>
          <div>
            <strong>{campaign.name}</strong>
            <span>DM Companion</span>
          </div>
        </div>
        <nav>
          {modules.map((item) => {
            const Icon = iconMap[item.id];
            return (
              <button
                className={activeModule === item.id ? "nav-item nav-item--active" : "nav-item"}
                key={item.id}
                onClick={() => onSelect(item.id)}
                type="button"
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="campaign-stamp">
          <span>Actief</span>
          <strong>{campaign.activeCampaign}</strong>
          <small>Party level {campaign.partyLevel} - {campaign.currentDate}</small>
        </div>
      </aside>
      {children}
    </div>
  );
}
