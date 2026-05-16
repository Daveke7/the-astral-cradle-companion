import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Dice5,
  Download,
  Eye,
  MapPinned,
  Route,
  RotateCcw,
  Sparkles,
  Swords,
} from "lucide-react";
import {
  TRAVEL_PACE_OPTIONS,
  TRAVEL_ROLE_LABELS,
  TRAVEL_TERRAIN_CONDITIONS,
} from "../data/systems/travelSystem.js";
import { buildChultRouteAnalysis } from "../utils/jungleTravelEngine.js";
import { CommandModeSwitch, CommandTabs } from "./v2/CommandPrimitives.jsx";
import { StatusPill, V2Panel } from "./v2/TabletopPrimitives.jsx";

const outcomeLabels = {
  good: "Goed",
  mixed: "Medium",
  bad: "Slecht",
};

const detailTabs = [
  { value: "mechanics", label: "Mechanics" },
  { value: "dm", label: "DM-only" },
  { value: "prompt", label: "Map prompt" },
];

function formatMapPrompt(mapPrompt) {
  return JSON.stringify(mapPrompt, null, 2);
}

function totalForRole(role) {
  return Number(role.roll || 0) + Number(role.modifier || 0);
}

function hasRoleRoll(role) {
  return role.roll !== "" && role.roll !== null && role.roll !== undefined;
}

function downloadTravelLog(travel, routeAnalysis) {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), routeAnalysis, travel }, null, 2);
  navigator.clipboard?.writeText(payload);
}

function toneForOutcome(outcome) {
  if (outcome === "good") return "safe";
  if (outcome === "bad") return "danger";
  return "warning";
}

function toneForDifficulty(difficulty) {
  if (difficulty === "brutal") return "danger";
  if (difficulty === "hard") return "warning";
  return "safe";
}

function roleTone(role, dc) {
  if (!hasRoleRoll(role)) return "neutral";
  const total = totalForRole(role);
  if (total >= dc + 5) return "safe";
  if (total >= dc) return "safe";
  if (total <= dc - 5) return "danger";
  return "warning";
}

function roleLabel(role, dc) {
  if (!hasRoleRoll(role)) return "Open";
  const total = totalForRole(role);
  if (total >= dc + 5) return "Sterk";
  if (total >= dc) return "Succes";
  if (total <= dc - 5) return "Hard fail";
  return "Risico";
}

function routeWindow(hexes, currentIndex) {
  const start = Math.max(0, currentIndex - 2);
  const end = Math.min(hexes.length, currentIndex + 4);
  return hexes.slice(start, end).map((hex, offset) => {
    const index = start + offset;
    return {
      ...hex,
      index,
      state: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
    };
  });
}

function describeOutcomeForecast(successCount, roleCount, missingCount) {
  if (missingCount > 0) return `${missingCount} rol${missingCount === 1 ? "" : "len"} open`;
  if (successCount >= Math.ceil(roleCount * 0.7)) return "Waarschijnlijk goed";
  if (successCount >= Math.ceil(roleCount * 0.35)) return "Gemengd risico";
  return "Hoge druk";
}

export function JungleTravel({
  travel,
  chultMap,
  partyMembers,
  onPatchTravel,
  onUpdateRole,
  onRollRole,
  onGenerateEvent,
  onUndoLastTravelEvent,
  onSendEventToRuntime,
  onPublishEventToPlayers,
  onSeedInitiative,
  onNavigate,
}) {
  const [viewMode, setViewMode] = useState("run");
  const [eventTab, setEventTab] = useState("mechanics");
  const routeAnalysis = useMemo(() => buildChultRouteAnalysis(chultMap, travel), [chultMap, travel]);
  const lastEvent = travel.lastEvent;
  const characterOptions = ["Azaka", ...partyMembers.map((member) => member.name)];
  const effectiveDc = travel.autoRouteDc === false ? Number(travel.dc || 15) : routeAnalysis.suggestedDc;
  const currentHex = routeAnalysis.currentHex;
  const nextHex = routeAnalysis.hexes[routeAnalysis.routeProgressHexIndex + 1] || null;
  const routeProgressMax = Math.max(0, routeAnalysis.routeHexes.length - 1);
  const routeProgressPercent = routeProgressMax
    ? Math.round((routeAnalysis.routeProgressHexIndex / routeProgressMax) * 100)
    : 0;
  const completedRoles = travel.roles.filter(hasRoleRoll);
  const missingRoles = travel.roles.length - completedRoles.length;
  const successfulRoles = completedRoles.filter((role) => totalForRole(role) >= effectiveDc).length;
  const forecast = describeOutcomeForecast(successfulRoles, travel.roles.length, missingRoles);
  const routeStages = routeWindow(routeAnalysis.hexes, routeAnalysis.routeProgressHexIndex);

  function renderEventDetail() {
    if (!lastEvent) return null;

    if (eventTab === "dm") {
      return (
        <div className="travel-detail-stack travel-detail-stack--danger">
          <article>
            <span>DM-only</span>
            <p>{lastEvent.dmOnly}</p>
          </article>
          <article>
            <span>Clue</span>
            <p>{lastEvent.clue}</p>
          </article>
        </div>
      );
    }

    if (eventTab === "prompt") {
      return (
        <div className="travel-map-prompt-card">
          <div>
            <span>Prompt</span>
            <p>{lastEvent.mapPrompt?.prompt}</p>
          </div>
          <div className="travel-prompt-actions">
            <button
              className="button button--ghost"
              type="button"
              onClick={() => navigator.clipboard?.writeText(lastEvent.mapPrompt?.prompt || "")}
            >
              <Copy size={16} /> Kopieer prompt
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => navigator.clipboard?.writeText(formatMapPrompt(lastEvent.mapPrompt))}
            >
              <Copy size={16} /> Kopieer JSON
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="travel-detail-stack">
        <article>
          <span>Mechanics</span>
          <p>{lastEvent.mechanics}</p>
        </article>
        <article>
          <span>Role pressure</span>
          <p>{lastEvent.pressureRole}</p>
        </article>
      </div>
    );
  }

  return (
    <main className="workspace travel-v2-page travel-command-page travel-play-page">
      <header className="travel-v2-header travel-play-header">
        <div>
          <span className="v2-eyebrow">Jungle Reis</span>
          <h1>{travel.routeName}</h1>
          <p>{routeAnalysis.summary} - gekoppeld aan de Chult Hex Map.</p>
        </div>
        <div className="travel-v2-actions">
          <CommandModeSwitch
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: "run", label: "Aan tafel" },
              { value: "setup", label: "Setup" },
            ]}
          />
          <button className="button button--ghost" type="button" onClick={() => onNavigate?.("chult-map")}>
            <MapPinned size={17} /> Chult Map
          </button>
          <button className="button button--ghost" type="button" onClick={() => downloadTravelLog(travel, routeAnalysis)}>
            <Download size={17} /> Export
          </button>
        </div>
      </header>

      {viewMode === "run" ? (
        <section className="travel-runtime-console">
          <V2Panel
            title="Route Lane"
            eyebrow="Waar zijn ze, wat kost het, wat komt eraan"
            action={<StatusPill tone={travel.autoRouteDc === false ? "warning" : "safe"}>{travel.autoRouteDc === false ? "Manual DC" : "Auto DC"}</StatusPill>}
            className="travel-route-panel"
          >
            <div className="travel-route-hero">
              <div className="travel-route-objective">
                <span>Current hex</span>
                <h2>{currentHex.hexId} - {currentHex.title}</h2>
                <p>{currentHex.descriptors.slice(0, 4).join(", ")}</p>
              </div>
              <div className="travel-route-metrics">
                <article>
                  <span>Dag</span>
                  <strong>{travel.day}</strong>
                  <small>{travel.pace}</small>
                </article>
                <article>
                  <span>DC</span>
                  <strong>{effectiveDc}</strong>
                  <small>{successfulRoles}/{travel.roles.length} succes</small>
                </article>
                <article>
                  <span>Supplies</span>
                  <strong>{travel.supplies}</strong>
                  <small>forecast -{routeAnalysis.supplyForecast}</small>
                </article>
                <article>
                  <span>Afstand</span>
                  <strong>{routeAnalysis.kilometers} km</strong>
                  <small>{routeAnalysis.miles} miles</small>
                </article>
              </div>
            </div>

            <div className="travel-route-lane" aria-label={`Route progress ${routeProgressPercent}%`}>
              <div className="travel-route-lane__glow" style={{ width: `${routeProgressPercent}%` }} />
              {routeStages.map((hex) => (
                <article className={`travel-route-node travel-route-node--${hex.state}`} key={`${hex.hexId}-${hex.index}`}>
                  <span>{hex.index}</span>
                  <strong>{hex.hexId}</strong>
                  <small>{hex.terrainLabel}</small>
                </article>
              ))}
            </div>

            <div className="travel-day-settings">
              <label>
                <span>Weer / sfeer</span>
                <input value={travel.weather} onChange={(event) => onPatchTravel({ weather: event.target.value })} />
              </label>
              <label>
                <span>Pace</span>
                <select value={travel.pace} onChange={(event) => onPatchTravel({ pace: event.target.value })}>
                  {TRAVEL_PACE_OPTIONS.map((pace) => <option key={pace}>{pace}</option>)}
                </select>
              </label>
              <label>
                <span>Supplies</span>
                <input type="number" min="0" value={travel.supplies} onChange={(event) => onPatchTravel({ supplies: event.target.value })} />
              </label>
              <label>
                <span>Next terrain</span>
                <input readOnly value={nextHex?.terrainLabel || "Doel bereikt"} />
              </label>
            </div>
          </V2Panel>

          <div className="travel-play-grid">
            <V2Panel
              title="Roll Board"
              eyebrow="Vul de rollen in, de engine bepaalt de travel day"
              action={<StatusPill tone={missingRoles ? "warning" : successfulRoles >= 4 ? "safe" : successfulRoles >= 2 ? "warning" : "danger"}>{forecast}</StatusPill>}
              className="travel-roll-panel"
            >
              <div className="travel-flow-steps">
                <span className="travel-flow-steps__item travel-flow-steps__item--active">1 Route</span>
                <span className="travel-flow-steps__item travel-flow-steps__item--active">2 Rollen</span>
                <span className={`travel-flow-steps__item ${lastEvent ? "travel-flow-steps__item--active" : ""}`}>3 Uitkomst</span>
                <span className={`travel-flow-steps__item ${lastEvent ? "travel-flow-steps__item--active" : ""}`}>4 Naar tafel</span>
              </div>

              <div className="travel-role-board">
                {travel.roles.map((role, index) => {
                  const total = totalForRole(role);
                  const tone = roleTone(role, effectiveDc);
                  return (
                    <article className={`travel-role-card travel-role-card--${tone}`} key={role.id}>
                      <div className="travel-role-card__head">
                        <div>
                          <strong>{TRAVEL_ROLE_LABELS[role.id]}</strong>
                          <small>{role.character || "Geen character"}</small>
                        </div>
                        <StatusPill tone={tone === "neutral" ? "warning" : tone}>{roleLabel(role, effectiveDc)}</StatusPill>
                      </div>
                      <div className="travel-role-card__controls travel-role-card__controls--play">
                        <label className="travel-role-card__character">
                          Speler
                          <select value={role.character} onChange={(event) => onUpdateRole(index, { character: event.target.value })}>
                            {characterOptions.map((character) => <option key={character}>{character}</option>)}
                          </select>
                        </label>
                        <label>
                          Roll
                          <input type="number" value={role.roll} onChange={(event) => onUpdateRole(index, { roll: event.target.value })} />
                        </label>
                        <label>
                          Mod
                          <input type="number" value={role.modifier} onChange={(event) => onUpdateRole(index, { modifier: event.target.value })} />
                        </label>
                        <button type="button" onClick={() => onRollRole(index)} aria-label={`Rol ${TRAVEL_ROLE_LABELS[role.id]}`}>
                          <Dice5 size={17} />
                        </button>
                        <div className="travel-role-total">
                          <span>Totaal</span>
                          <strong>{hasRoleRoll(role) ? total : "-"}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="travel-resolve-console">
                <div>
                  <strong>{missingRoles ? `${missingRoles} rol${missingRoles === 1 ? "" : "len"} nog open` : "Klaar om te resolven"}</strong>
                  <span>{successfulRoles}/{travel.roles.length} rollen halen DC {effectiveDc}</span>
                </div>
                <button className="travel-resolve-button" type="button" onClick={onGenerateEvent}>
                  <Sparkles size={18} /> Resolve Travel Day
                </button>
              </div>
            </V2Panel>

            <aside className="travel-outcome-column">
              <V2Panel
                title="Uitkomst"
                eyebrow="Wat je nu aan tafel nodig hebt"
                action={lastEvent ? <StatusPill tone={toneForOutcome(lastEvent.outcome)}>{outcomeLabels[lastEvent.outcome]}</StatusPill> : null}
                className="travel-outcome-panel"
              >
                {lastEvent ? (
                  <article className={`travel-outcome-card travel-outcome-card--${lastEvent.outcome}`}>
                    <div className="travel-outcome-head travel-outcome-head--play">
                      <div>
                        <span>Dag {lastEvent.day} / {lastEvent.currentHex}</span>
                        <h2>{lastEvent.title}</h2>
                        <p>{lastEvent.pressure}</p>
                      </div>
                    </div>

                    <div className="travel-table-card">
                      <span>Read-aloud</span>
                      <p>{lastEvent.readAloud}</p>
                    </div>

                    <div className="travel-impact-row">
                      <article>
                        <CheckCircle2 size={15} />
                        <span>Progress</span>
                        <strong>+{lastEvent.routeImpact?.progressGain ?? 0} hex</strong>
                      </article>
                      <article>
                        <Route size={15} />
                        <span>Nieuwe hex</span>
                        <strong>{lastEvent.routeImpact?.nextRouteIndex ?? routeAnalysis.routeProgressHexIndex}</strong>
                      </article>
                      <article>
                        <Sparkles size={15} />
                        <span>Supplies</span>
                        <strong>-{lastEvent.routeImpact?.supplyCost ?? 0}</strong>
                      </article>
                    </div>

                    <CommandTabs tabs={detailTabs} value={eventTab} onChange={setEventTab} />
                    {renderEventDetail()}

                    <div className="event-action-row travel-action-row">
                      <button className="button button--ghost" type="button" onClick={onSendEventToRuntime}>
                        <Route size={16} /> Runtime
                      </button>
                      <button className="button button--ghost" type="button" onClick={onSeedInitiative}>
                        <Swords size={16} /> Initiative
                      </button>
                      <button className="button button--ghost" type="button" onClick={onPublishEventToPlayers}>
                        <Eye size={16} /> Publish
                      </button>
                      <button className="button button--ghost" type="button" onClick={onUndoLastTravelEvent}>
                        <RotateCcw size={16} /> Undo
                      </button>
                    </div>
                  </article>
                ) : (
                  <div className="travel-empty-outcome">
                    <MapPinned size={30} />
                    <h2>Nog geen reisdag geresolved</h2>
                    <p>Vul de rollen in en laat de engine een goed, medium of slecht event maken met route-impact en map prompt.</p>
                  </div>
                )}
              </V2Panel>

              <V2Panel title="Terrain Mix" eyebrow="Routegevoel">
                <div className="terrain-mix-list terrain-mix-list--compact">
                  {routeAnalysis.terrainMix.map((terrain) => (
                    <span key={terrain.id}>
                      {terrain.label} x{terrain.count} / {terrain.kilometers} km
                    </span>
                  ))}
                </div>
              </V2Panel>
            </aside>
          </div>

          <V2Panel title="Travel Log" eyebrow="Compacte geschiedenis">
            <div className="travel-history-timeline">
              {travel.history?.length ? (
                travel.history.slice(0, 8).map((event) => (
                  <article key={event.id} className={`travel-history-chip travel-history-chip--${event.outcome}`}>
                    <StatusPill tone={toneForOutcome(event.outcome)}>{event.outcome}</StatusPill>
                    <strong>Dag {event.day}: {event.title}</strong>
                    <span>{event.currentHex} / {event.currentTerrain}</span>
                  </article>
                ))
              ) : (
                <p className="empty-state">Nog geen travel history.</p>
              )}
            </div>
          </V2Panel>
        </section>
      ) : (
        <section className="travel-setup-console">
          <V2Panel title="Route Setup" eyebrow="Alleen de instellingen die de reisdag sturen">
            <div className="travel-setup-grid-clean">
              <label>
                <span>Dag</span>
                <input type="number" min="1" value={travel.day} onChange={(event) => onPatchTravel({ day: event.target.value })} />
              </label>
              <label>
                <span>Pace</span>
                <select value={travel.pace} onChange={(event) => onPatchTravel({ pace: event.target.value })}>
                  {TRAVEL_PACE_OPTIONS.map((pace) => <option key={pace}>{pace}</option>)}
                </select>
              </label>
              <label>
                <span>Supplies</span>
                <input type="number" min="0" value={travel.supplies} onChange={(event) => onPatchTravel({ supplies: event.target.value })} />
              </label>
              <label>
                <span>Travel DC</span>
                <input
                  type="number"
                  min="5"
                  value={effectiveDc}
                  disabled={travel.autoRouteDc !== false}
                  onChange={(event) => onPatchTravel({ dc: event.target.value })}
                />
              </label>
              <label className="travel-setup-grid-clean__wide">
                <span>Route progress</span>
                <input
                  type="range"
                  min="0"
                  max={routeProgressMax}
                  value={Math.min(Number(travel.routeProgressHexIndex || 0), routeProgressMax)}
                  onChange={(event) =>
                    onPatchTravel({ routeProgressHexIndex: Number(event.target.value), routeProgress: Number(event.target.value) })
                  }
                />
              </label>
              <label className="travel-setup-grid-clean__wide">
                <span>Weer / sfeer</span>
                <input value={travel.weather} onChange={(event) => onPatchTravel({ weather: event.target.value })} />
              </label>
              <label className="travel-setup-check">
                <input
                  type="checkbox"
                  checked={travel.autoRouteDc !== false}
                  onChange={(event) => onPatchTravel({ autoRouteDc: event.target.checked })}
                />
                <span>Automatische route DC</span>
              </label>
              <label className="travel-setup-check">
                <input
                  type="checkbox"
                  checked={travel.includeDmInPrompts !== false}
                  onChange={(event) => onPatchTravel({ includeDmInPrompts: event.target.checked })}
                />
                <span>DM-only elementen in map prompt</span>
              </label>
              <button className="button button--ghost travel-setup-grid-clean__wide" type="button" onClick={() => onNavigate?.("chult-map")}>
                <MapPinned size={17} /> Route tekenen op Chult Map
              </button>
            </div>
          </V2Panel>

          <V2Panel title="Prompt Elements" eyebrow="Must-haves voor de AI map prompt">
            <div className="travel-prompt-editor">
              <textarea
                value={travel.promptElements || ""}
                onChange={(event) => onPatchTravel({ promptElements: event.target.value })}
                placeholder="Een element per regel: ingestorte brug, rode linten, Azaka's maskerspoor, zwarte regen, oude reliefs..."
              />
            </div>
          </V2Panel>

          <V2Panel title="Route Reference" eyebrow="Inklapbare engine context">
            <div className="travel-reference-drawer">
              <details>
                <summary>Terrain rules</summary>
                <div className="terrain-rule-list">
                  {TRAVEL_TERRAIN_CONDITIONS.map((condition) => (
                    <article key={condition.id}>
                      <Route size={15} />
                      <div>
                        <strong>{condition.label}</strong>
                        <span>{condition.effect}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </details>
              <details>
                <summary>Route mix</summary>
                <div className="terrain-mix-list terrain-mix-list--stacked">
                  {routeAnalysis.terrainMix.map((terrain) => (
                    <span key={terrain.id}>
                      {terrain.label} x{terrain.count} / {terrain.miles} mi / {terrain.kilometers} km
                    </span>
                  ))}
                </div>
              </details>
            </div>
          </V2Panel>
        </section>
      )}
    </main>
  );
}
