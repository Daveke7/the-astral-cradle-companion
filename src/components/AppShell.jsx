import { useEffect, useMemo, useState } from "react";
import { campaign } from "../data/campaignData.js";

const navModes = [
  { id: "play", label: "Spelen", helper: "Aan tafel", defaultModule: "runtime" },
  { id: "make", label: "Maken", helper: "Prep en wereld", defaultModule: "prep" },
  { id: "generators", label: "Generators", helper: "Rolls en shops", defaultModule: "random-encounter" },
  { id: "players", label: "Spelers", helper: "Party en publicatie", defaultModule: "party" },
];

function getModuleModes(module) {
  return module.modes || [module.mode || "play"];
}

function resolveMode(modules, activeModule, fallback = "play") {
  return getModuleModes(modules.find((module) => module.id === activeModule) || {}).at(0) || fallback;
}

export function AppShell({ modules, activeModule, onSelect, children }) {
  const [selectedMode, setSelectedMode] = useState(() => resolveMode(modules, activeModule));
  const visibleModules = useMemo(
    () => modules.filter((module) => getModuleModes(module).includes(selectedMode)),
    [modules, selectedMode]
  );

  useEffect(() => {
    const activeModes = getModuleModes(modules.find((module) => module.id === activeModule) || {});
    if (!activeModes.includes(selectedMode)) {
      setSelectedMode(activeModes.at(0) || "play");
    }
  }, [activeModule, modules, selectedMode]);

  function selectMode(mode) {
    const targetModules = modules.filter((module) => getModuleModes(module).includes(mode.id));
    setSelectedMode(mode.id);
    if (!targetModules.some((module) => module.id === activeModule)) {
      onSelect(targetModules.find((module) => module.id === mode.defaultModule)?.id || targetModules.at(0)?.id);
    }
  }

  return (
    <div className="app-shell app-shell--ribbon">
      <main className="app-main">
        <header className="command-ribbon" aria-label="Hoofdnavigatie">
          <div className="command-ribbon__brand">
            <span>RB</span>
            <div>
              <strong>{campaign.name}</strong>
              <small>{campaign.activeCampaign}</small>
            </div>
          </div>

          <nav className="command-ribbon__modes" aria-label="Werkmodus">
            {navModes.map((mode) => (
              <button
                className={selectedMode === mode.id ? "mode-pill mode-pill--active" : "mode-pill"}
                key={mode.id}
                type="button"
                onClick={() => selectMode(mode)}
              >
                <strong>{mode.label}</strong>
                <span>{mode.helper}</span>
              </button>
            ))}
          </nav>

          <nav className="command-ribbon__modules" aria-label="Alle modules">
            {visibleModules.map((item) => (
              <button
                className={activeModule === item.id ? "ribbon-pill ribbon-pill--active" : "ribbon-pill"}
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        {children}

        <footer className="status-bar">
          <span>D&D 5e</span>
          <span className="status-dot" /> Lokaal opgeslagen
          <span>{campaign.currentDate}</span>
        </footer>
      </main>
    </div>
  );
}
