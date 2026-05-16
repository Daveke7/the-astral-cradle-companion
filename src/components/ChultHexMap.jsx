import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Crosshair,
  Eraser,
  Eye,
  EyeOff,
  Flag,
  Layers,
  MapPin,
  MousePointer2,
  Pencil,
  Plus,
  Route,
  Save,
  Search,
  Send,
  ShieldAlert,
  Target,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  CHULT_HEX_COLUMNS,
  CHULT_HEX_OVERLAYS,
  CHULT_HEX_ROWS,
  CHULT_HEX_STATUSES,
  createDefaultHexNote,
  getHexPositionById,
  getNeighborHexIds,
  parseHexId,
  positionToHexId,
} from "../data/systems/chultHexSystem.js";
import { CHULT_TERRAIN_PROFILE_OPTIONS, analyzeChultHex, buildChultRouteAnalysis } from "../utils/jungleTravelEngine.js";
import { StatusPill, V2Panel } from "./v2/TabletopPrimitives.jsx";

const chultMapUrl = "/assets/chult-hex-grid-map.jpg";

const statusToneById = Object.fromEntries(CHULT_HEX_STATUSES.map((status) => [status.id, status.tone]));
const statusLabelById = Object.fromEntries(CHULT_HEX_STATUSES.map((status) => [status.id, status.label]));

function toneForStatus(status) {
  return statusToneById[status] || "neutral";
}

function markerKindFromStatus(status) {
  if (status === "danger") return "danger";
  if (status === "objective") return "objective";
  if (status === "visited" || status === "discovered") return "safe";
  return "mystery";
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function noteHasContent(note) {
  return Boolean(
    note?.title ||
      note?.playerSafe ||
      note?.dmNotes ||
      note?.encounterSeed ||
      note?.mapPromptSeed ||
      note?.terrain ||
      note?.tags?.length
  );
}

function copyToClipboard(value) {
  navigator.clipboard?.writeText(value);
}

function buildPromptFromHexAnalysis(hexAnalysis, note) {
  const requiredElements = [
    ...(hexAnalysis.requiredElements || []),
    note.encounterSeed,
    note.title,
  ].filter(Boolean);
  return [
    "TRUE TOP-DOWN playable D&D battle map set in Chult",
    hexAnalysis.promptTerrain,
    `terrain identity: ${hexAnalysis.terrainLabel}`,
    `visibility: ${hexAnalysis.visibility}`,
    requiredElements.length ? `must include: ${requiredElements.join(", ")}` : "",
    hexAnalysis.hazards?.length ? `environmental pressure: ${hexAnalysis.hazards.join(", ")}` : "",
    "clear routes, cover, elevation cues, rich tropical detail, no labels, no text, no characters, no grid",
  ]
    .filter(Boolean)
    .join(", ");
}

function HexMarker({ hexId, label, kind = "safe", selected = false, dimmed = false, onSelect }) {
  const position = getHexPositionById(hexId);
  return (
    <button
      className={[
        "chult-marker",
        `chult-marker--${kind}`,
        selected ? "chult-marker--selected" : "",
        dimmed ? "chult-marker--dimmed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(hexId);
      }}
    >
      <MapPin size={14} />
      {label ? <span>{label}</span> : null}
    </button>
  );
}

function HexPulse({ hexId, variant = "discovered" }) {
  const position = getHexPositionById(hexId);
  return (
    <span
      className={`chult-hex-pulse chult-hex-pulse--${variant}`}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      aria-hidden="true"
    />
  );
}

function RouteGlowNode({ hexId, index, waypoint = false }) {
  const position = getHexPositionById(hexId);
  return (
    <span
      className={[
        "chult-route-node",
        index === 0 ? "chult-route-node--start" : "",
        waypoint ? "chult-route-node--waypoint" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      aria-hidden="true"
    />
  );
}

function Field({ label, children, wide = false }) {
  return (
    <label className={wide ? "hex-field hex-field--wide" : "hex-field"}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function ChultHexMap({
  chultMap,
  onPatchMap,
  onSelectHex,
  onPatchHex,
  onToggleOverlay,
  onToggleRouteHex,
  onMarkDiscovered,
  onSaveRoutePreset,
  onApplyRoutePreset,
  onPublishRoute,
  onNavigateTravel,
}) {
  const viewportRef = useRef(null);
  const stageRef = useRef(null);
  const drawingRef = useRef(false);
  const selectedHex = parseHexId(chultMap.selectedHex)?.id || "4332";
  const selectedNote = chultMap.notesByHex?.[selectedHex] || createDefaultHexNote(selectedHex);
  const [jumpHex, setJumpHex] = useState(selectedHex);
  const [hoverHex, setHoverHex] = useState("");
  const [routeDraftName, setRouteDraftName] = useState("");
  const zoom = Number(chultMap.zoom || 1);
  const playerMode = chultMap.mode === "player";
  const routeTool = chultMap.routeTool || "select";
  const routeWaypoints = chultMap.routeHexes || [];
  const selectedInRoute = routeWaypoints.includes(selectedHex);
  const selectedDiscovered = chultMap.discoveredHexes.includes(selectedHex);
  const selectedAnalysis = useMemo(
    () => analyzeChultHex(selectedHex, chultMap.notesByHex || {}),
    [selectedHex, chultMap.notesByHex]
  );
  const routeAnalysis = useMemo(() => buildChultRouteAnalysis(chultMap, { pace: "Normaal", routeProgressHexIndex: 0 }), [chultMap]);
  const routePathHexes = routeAnalysis.routeHexes || [];
  const routeWaypointSet = useMemo(() => new Set(routeWaypoints), [routeWaypoints]);
  const publishedRouteSet = useMemo(() => new Set(chultMap.publishedRouteHexes || []), [chultMap.publishedRouteHexes]);
  const routeDisplayHexes = playerMode ? routePathHexes.filter((hexId) => publishedRouteSet.has(hexId)) : routePathHexes;
  const discoveredDisplayHexes = playerMode ? chultMap.publishedRouteHexes || [] : chultMap.discoveredHexes || [];
  const routePresets = chultMap.routePresets || [];
  const activePreset = routePresets.find((preset) => preset.id === chultMap.activeRoutePresetId);

  useEffect(() => {
    setJumpHex(selectedHex);
  }, [selectedHex]);

  useEffect(() => {
    setRouteDraftName(activePreset?.name || "Nieuwe Chult route");
  }, [activePreset?.name]);

  useEffect(() => {
    const timer = window.setTimeout(centerSelectedHex, 60);
    return () => window.clearTimeout(timer);
  }, [selectedHex, zoom]);

  function centerSelectedHex() {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage) return;

    const position = getHexPositionById(selectedHex);
    const left = stage.scrollWidth * (position.x / 100) - viewport.clientWidth / 2;
    const top = stage.scrollHeight * (position.y / 100) - viewport.clientHeight / 2;
    viewport.scrollTo({
      left: Math.max(0, left),
      top: Math.max(0, top),
      behavior: "auto",
    });
  }

  const routePoints = useMemo(
    () =>
      routeDisplayHexes
        .map((hexId) => (parseHexId(hexId) ? getHexPositionById(hexId) : null))
        .filter(Boolean)
        .map((position) => `${position.x},${position.y}`)
        .join(" "),
    [routeDisplayHexes]
  );

  const noteMarkers = useMemo(
    () =>
      Object.entries(chultMap.notesByHex || {})
        .filter(([, note]) => noteHasContent(note))
        .map(([hexId, note]) => ({
          id: `note-${hexId}`,
          hex: hexId,
          label: note.title || hexId,
          kind: markerKindFromStatus(note.status),
          playerSafe: Boolean(note.playerSafe),
        })),
    [chultMap.notesByHex]
  );

  const visiblePins = useMemo(() => {
    const allPins = [...(chultMap.pins || []), ...noteMarkers];
    const uniquePins = new Map();
    allPins.forEach((pin) => {
      if (!parseHexId(pin.hex)) return;
      const key = `${pin.hex}-${pin.label}`;
      if (playerMode && pin.playerSafe === false) return;
      uniquePins.set(key, pin);
    });
    return Array.from(uniquePins.values());
  }, [chultMap.pins, noteMarkers, playerMode]);

  const nearbyHexes = useMemo(() => getNeighborHexIds(selectedHex), [selectedHex]);
  const promptText = buildPromptFromHexAnalysis(selectedAnalysis, selectedNote);
  const terrainDistanceLabel = routeAnalysis.terrainMix
    .map((terrain) => `${terrain.label}: ${terrain.miles} mi / ${terrain.kilometers} km`)
    .join(" / ");

  function hexFromPointer(event) {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    return positionToHexId(x, y);
  }

  function handleHexAction(hexId) {
    if (!hexId) return;
    if (routeTool === "draw") {
      const routeHexes = chultMap.routeHexes || [];
      if (routeHexes[routeHexes.length - 1] === hexId || routeHexes.includes(hexId)) {
        onPatchMap({ selectedHex: hexId });
        return;
      }
      onPatchMap({ selectedHex: hexId, routeHexes: [...routeHexes, hexId] });
      return;
    }
    if (routeTool === "erase") {
      onPatchMap({
        selectedHex: hexId,
        routeHexes: (chultMap.routeHexes || []).filter((routeHex) => routeHex !== hexId),
      });
      return;
    }
    onSelectHex(hexId);
  }

  function selectFromPointer(event) {
    if (routeTool !== "select") return;
    handleHexAction(hexFromPointer(event));
  }

  function updateHoverHex(event) {
    const nextHex = hexFromPointer(event);
    if (!nextHex) return;
    setHoverHex((current) => (current === nextHex ? current : nextHex));
    if (drawingRef.current && routeTool !== "select") handleHexAction(nextHex);
  }

  function startPointerRoute(event) {
    if (routeTool === "select") return;
    drawingRef.current = true;
    handleHexAction(hexFromPointer(event));
  }

  function stopPointerRoute() {
    drawingRef.current = false;
  }

  function jumpToHex(event) {
    event.preventDefault();
    const parsed = parseHexId(jumpHex);
    if (parsed) onSelectHex(parsed.id);
  }

  function startRouteAtSelected() {
    onPatchMap({ routeHexes: [selectedHex], routeTool: "draw" });
  }

  function appendSelectedToRoute() {
    const routeHexes = chultMap.routeHexes || [];
    if (routeHexes[routeHexes.length - 1] === selectedHex || routeHexes.includes(selectedHex)) {
      onPatchMap({ selectedHex });
      return;
    }
    onPatchMap({ selectedHex, routeHexes: [...routeHexes, selectedHex] });
  }

  function insertSelectedAsWaypoint() {
    const routeHexes = chultMap.routeHexes || [];
    if (!routeHexes.length || routeHexes.includes(selectedHex)) return;

    const selectedPathIndex = routePathHexes.indexOf(selectedHex);
    let insertAt = routeHexes.length;

    if (selectedPathIndex >= 0) {
      routeHexes.forEach((waypoint, waypointIndex) => {
        const waypointPathIndex = routePathHexes.indexOf(waypoint);
        if (waypointPathIndex >= 0 && waypointPathIndex < selectedPathIndex) {
          insertAt = waypointIndex + 1;
        }
      });
    }

    const nextRoute = [...routeHexes];
    nextRoute.splice(insertAt, 0, selectedHex);
    onPatchMap({ selectedHex, routeHexes: nextRoute });
  }

  function removeSelectedWaypoint() {
    const routeHexes = chultMap.routeHexes || [];
    if (!routeHexes.includes(selectedHex) || routeHexes.length <= 1) return;
    const nextRoute = routeHexes.filter((hexId) => hexId !== selectedHex);
    onPatchMap({ routeHexes: nextRoute, selectedHex: nextRoute[Math.max(0, Math.min(nextRoute.length - 1, routeHexes.indexOf(selectedHex) - 1))] });
  }

  function undoRouteHex() {
    const routeHexes = chultMap.routeHexes || [];
    onPatchMap({ routeHexes: routeHexes.slice(0, -1), selectedHex: routeHexes[routeHexes.length - 2] || selectedHex });
  }

  function clearRoute() {
    onPatchMap({ routeHexes: [], routeTool: "draw" });
  }

  return (
    <main className="workspace chult-hex-page">
      <header className="travel-v2-header chult-hex-header">
        <div>
          <span className="v2-eyebrow">Chult Hex Grid Companion</span>
          <h1>Expeditiekaart van Chult</h1>
          <p>
            Klik op de kaart, spring naar een hex en bewaar DM-only of player-safe notities per coordinaat.
          </p>
        </div>
        <div className="travel-v2-actions">
          <button
            className={playerMode ? "button button--primary" : "button button--ghost"}
            type="button"
            onClick={() => onPatchMap({ mode: playerMode ? "dm" : "player" })}
          >
            {playerMode ? <Eye size={17} /> : <EyeOff size={17} />}
            {playerMode ? "Player-safe view" : "DM view"}
          </button>
          <button className="button button--ghost" type="button" onClick={() => copyToClipboard(selectedHex)}>
            <Copy size={16} /> Kopieer {selectedHex}
          </button>
          <button className="button button--primary" type="button" onClick={onNavigateTravel}>
            <Route size={16} /> Open Jungle Travel
          </button>
        </div>
      </header>

      <section className="chult-hex-layout">
        <div className="chult-hex-main">
          <V2Panel
            title="Chult Map Layer"
            eyebrow="72 kolommen x 85 rijen"
            action={<StatusPill tone={playerMode ? "safe" : "danger"}>{playerMode ? "Spoiler safe" : "DM mode"}</StatusPill>}
            className="chult-map-panel"
          >
            <div className="chult-map-toolbar">
              <form className="hex-jump-form" onSubmit={jumpToHex}>
                <Search size={15} />
                <input
                  aria-label="Spring naar hex"
                  maxLength={4}
                  value={jumpHex}
                  onChange={(event) => setJumpHex(event.target.value.replace(/\D/g, "").slice(0, 4))}
                />
                <button type="submit">Ga</button>
              </form>
              <div className="hex-readout">
                <Crosshair size={16} />
                <strong>{selectedHex}</strong>
                <span>{hoverHex ? `hover ${hoverHex}` : "klik op de kaart"}</span>
              </div>
              <label className="hex-zoom-control">
                <span>Zoom</span>
                <input
                  type="range"
                  min="0.65"
                  max="2.75"
                  step="0.05"
                  value={zoom}
                  onChange={(event) => onPatchMap({ zoom: Number(event.target.value) })}
                />
                <strong>{Math.round(zoom * 100)}%</strong>
              </label>
            </div>

            <div className="route-draw-toolbar">
              <div className="route-tool-group" aria-label="Route tools">
                <button
                  className={routeTool === "select" ? "route-tool-button route-tool-button--active" : "route-tool-button"}
                  type="button"
                  onClick={() => onPatchMap({ routeTool: "select" })}
                >
                  <MousePointer2 size={15} /> Selecteer
                </button>
                <button
                  className={routeTool === "draw" ? "route-tool-button route-tool-button--active" : "route-tool-button"}
                  type="button"
                  onClick={() => onPatchMap({ routeTool: "draw" })}
                >
                  <Pencil size={15} /> Teken route
                </button>
                <button
                  className={routeTool === "erase" ? "route-tool-button route-tool-button--active" : "route-tool-button"}
                  type="button"
                  onClick={() => onPatchMap({ routeTool: "erase" })}
                >
                  <Eraser size={15} /> Gum
                </button>
              </div>
              <div className="route-tool-group route-tool-group--actions">
                <button className="route-tool-button" type="button" onClick={startRouteAtSelected}>
                  <Flag size={15} /> Start hier
                </button>
                <button className="route-tool-button" type="button" onClick={appendSelectedToRoute}>
                  <Route size={15} /> Voeg hex toe
                </button>
                <button className="route-tool-button" type="button" onClick={insertSelectedAsWaypoint} disabled={!routeWaypoints.length || selectedInRoute}>
                  <Plus size={15} /> Insert waypoint
                </button>
                <button className="route-tool-button route-tool-button--danger" type="button" onClick={removeSelectedWaypoint} disabled={!selectedInRoute || routeWaypoints.length <= 1}>
                  <Trash2 size={15} /> Verwijder waypoint
                </button>
                <button className="route-tool-button" type="button" onClick={undoRouteHex} disabled={!(chultMap.routeHexes || []).length}>
                  <Undo2 size={15} /> Undo
                </button>
                <button className="route-tool-button route-tool-button--danger" type="button" onClick={clearRoute}>
                  <Trash2 size={15} /> Wis route
                </button>
              </div>
              <div className="route-distance-readout">
                <strong>{routeAnalysis.distanceLabel}</strong>
                <span>
                  {routeAnalysis.totalHexes} routehexes via {routeAnalysis.routeWaypoints.length} waypoints
                </span>
              </div>
            </div>

            <div className="route-preset-toolbar">
              <label>
                <span>Route preset</span>
                <select value={chultMap.activeRoutePresetId || ""} onChange={(event) => onApplyRoutePreset?.(event.target.value)}>
                  {routePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Naam</span>
                <input value={routeDraftName} onChange={(event) => setRouteDraftName(event.target.value)} />
              </label>
              <button className="route-tool-button" type="button" onClick={() => onSaveRoutePreset?.(routeDraftName)}>
                <Save size={15} /> Save route
              </button>
              <button className="route-tool-button" type="button" onClick={onPublishRoute}>
                <Send size={15} /> Publiceer bekende route
              </button>
            </div>

            <div className="chult-map-viewport" ref={viewportRef}>
              <div
                className="chult-map-stage"
                ref={stageRef}
                style={{ width: `${Math.round(zoom * 100)}%` }}
                onClick={selectFromPointer}
                onPointerDown={startPointerRoute}
                onPointerMove={updateHoverHex}
                onPointerUp={stopPointerRoute}
                onPointerCancel={stopPointerRoute}
                onPointerLeave={() => {
                  setHoverHex("");
                  stopPointerRoute();
                }}
              >
                <img src={chultMapUrl} alt="Chult hex grid map" draggable="false" onLoad={centerSelectedHex} />

                {chultMap.overlays?.route && routePoints ? (
                  <svg className="chult-route-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <polyline className="chult-route-line chult-route-line--glow" points={routePoints} />
                    <polyline className="chult-route-line chult-route-line--halo" points={routePoints} />
                    <polyline className="chult-route-line chult-route-line--core" points={routePoints} />
                  </svg>
                ) : null}

                {chultMap.overlays?.route
                  ? routeDisplayHexes.map((hexId, index) => (
                      <RouteGlowNode
                        key={`route-node-${hexId}-${index}`}
                        hexId={hexId}
                        index={index}
                        waypoint={routeWaypointSet.has(hexId)}
                      />
                    ))
                  : null}

                {chultMap.overlays?.discovered
                  ? discoveredDisplayHexes.map((hexId) => <HexPulse key={hexId} hexId={hexId} />)
                  : null}

                {chultMap.overlays?.danger && !playerMode
                  ? Object.entries(chultMap.notesByHex || {})
                      .filter(([, note]) => note.status === "danger")
                      .map(([hexId]) => <HexPulse key={`danger-${hexId}`} hexId={hexId} variant="danger" />)
                  : null}

                {chultMap.overlays?.locationPins || chultMap.overlays?.notes
                  ? visiblePins.map((pin) => (
                      <HexMarker
                        key={`${pin.id}-${pin.hex}`}
                        hexId={pin.hex}
                        label={chultMap.overlays?.locationPins ? pin.label : ""}
                        kind={pin.kind}
                        dimmed={playerMode && !pin.playerSafe}
                        selected={pin.hex === selectedHex}
                        onSelect={handleHexAction}
                      />
                    ))
                  : null}

                <HexMarker
                  hexId={selectedHex}
                  label={selectedNote.title || selectedHex}
                  kind="selected"
                  selected
                  onSelect={handleHexAction}
                />
              </div>
            </div>

            <div className="overlay-toolbar chult-overlay-toolbar">
              {CHULT_HEX_OVERLAYS.map((overlay) => (
                <button
                  className={chultMap.overlays?.[overlay.id] ? "v2-toggle v2-toggle--active" : "v2-toggle"}
                  key={overlay.id}
                  type="button"
                  onClick={() => onToggleOverlay(overlay.id)}
                >
                  <Layers size={14} />
                  <span>{overlay.label}</span>
                  {overlay.playerSafe ? null : <ShieldAlert size={13} />}
                </button>
              ))}
            </div>
          </V2Panel>

          <div className="chult-map-lower">
            <V2Panel title="Route naar Firefinger" eyebrow="Hex-by-hex expeditiepad">
              <div className="hex-route-list">
                {routeDisplayHexes.map((hexId, index) => {
                  const note = chultMap.notesByHex?.[hexId];
                  const analysisHex = routeAnalysis.hexes[routePathHexes.indexOf(hexId)];
                  const isWaypoint = routeWaypointSet.has(hexId);
                  return (
                    <button
                      className={[
                        "hex-route-step",
                        hexId === selectedHex ? "hex-route-step--active" : "",
                        isWaypoint ? "hex-route-step--waypoint" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={`${hexId}-${index}`}
                      type="button"
                      onClick={() => onSelectHex(hexId)}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{hexId}</strong>
                      <small>{note?.title || analysisHex?.terrainLabel || "Route hex"}</small>
                    </button>
                  );
                })}
              </div>
              <div className="hex-route-summary">
                <span>{routeAnalysis.summary}</span>
                <strong>DC {routeAnalysis.suggestedDc}</strong>
                <small>
                  Forecast: {routeAnalysis.supplyForecast} supplies / {routeAnalysis.estimatedDays} dagen. Spelersafstand: ongeveer {routeAnalysis.kilometers} km.
                </small>
                <small>
                  Waypoints: {routeWaypoints.join(" -> ") || "geen route"}.
                  {playerMode ? ` Player-safe zichtbaar: ${routeDisplayHexes.length} hexes.` : ""}
                </small>
                {terrainDistanceLabel ? <small>Terrainafstand: {terrainDistanceLabel}</small> : null}
              </div>
            </V2Panel>

            <V2Panel title="Player-safe preview" eyebrow="Wat aan tafel getoond mag worden">
              <div className="hex-player-preview">
                <StatusPill tone={selectedNote.playerSafe ? "safe" : "warning"}>
                  {selectedNote.playerSafe ? "Publiceerbaar" : "Nog leeg"}
                </StatusPill>
                <h2>{selectedNote.title || selectedHex}</h2>
                <p>{selectedNote.playerSafe || "Geen player-safe tekst voor deze hex."}</p>
              </div>
            </V2Panel>

            <V2Panel title="Travel Engine Preview" eyebrow="Hex analyse">
              <div className="hex-engine-preview">
                <div>
                  <span>Terrain</span>
                  <strong>{selectedAnalysis.terrainLabel}</strong>
                </div>
                <div>
                  <span>Difficulty</span>
                  <strong>{selectedAnalysis.difficulty}</strong>
                </div>
                <div>
                  <span>DC mod</span>
                  <strong>{selectedAnalysis.dcModifier >= 0 ? `+${selectedAnalysis.dcModifier}` : selectedAnalysis.dcModifier}</strong>
                </div>
                <p>{selectedAnalysis.descriptors.slice(0, 5).join(", ")}</p>
              </div>
            </V2Panel>
          </div>
        </div>

        <aside className="chult-hex-side">
          <V2Panel title="Selected Hex" eyebrow="GM inspector">
            <div className="hex-inspector">
              <div className="hex-inspector__head">
                <Target size={18} />
                <div>
                  <strong>{selectedHex}</strong>
                  <span>
                    {CHULT_HEX_COLUMNS} x {CHULT_HEX_ROWS} Chult grid
                  </span>
                </div>
                <StatusPill tone={toneForStatus(selectedNote.status)}>{statusLabelById[selectedNote.status] || "Onbekend"}</StatusPill>
              </div>
              <div className="hex-engine-strip">
                <span>{selectedAnalysis.terrainLabel}</span>
                <span>{selectedAnalysis.visibility}</span>
                <span>{selectedAnalysis.difficulty}</span>
              </div>

              <div className="hex-inspector-grid">
                <Field label="Titel" wide>
                  <input value={selectedNote.title} onChange={(event) => onPatchHex(selectedHex, { title: event.target.value })} />
                </Field>
                <Field label="Status">
                  <select value={selectedNote.status} onChange={(event) => onPatchHex(selectedHex, { status: event.target.value })}>
                    {CHULT_HEX_STATUSES.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Travel cost">
                  <input
                    value={selectedNote.travelCost}
                    onChange={(event) => onPatchHex(selectedHex, { travelCost: event.target.value })}
                  />
                </Field>
                <Field label="Terrain type" wide>
                  <select
                    value={selectedNote.terrainProfileId || ""}
                    onChange={(event) => onPatchHex(selectedHex, { terrainProfileId: event.target.value })}
                  >
                    <option value="">Auto analyse</option>
                    {CHULT_TERRAIN_PROFILE_OPTIONS.map((terrain) => (
                      <option key={terrain.id} value={terrain.id}>
                        {terrain.label} ({terrain.difficulty})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Terrain label" wide>
                  <input value={selectedNote.terrain} onChange={(event) => onPatchHex(selectedHex, { terrain: event.target.value })} />
                </Field>
                <Field label="Tags" wide>
                  <input
                    value={(selectedNote.tags || []).join(", ")}
                    onChange={(event) => onPatchHex(selectedHex, { tags: splitTags(event.target.value) })}
                    placeholder="thay, pterafolk, ruins"
                  />
                </Field>
                <Field label="Player-safe" wide>
                  <textarea
                    value={selectedNote.playerSafe}
                    onChange={(event) => onPatchHex(selectedHex, { playerSafe: event.target.value })}
                    placeholder="Informatie die je later veilig naar Player View kunt publiceren."
                  />
                </Field>
                <Field label="DM-only notes" wide>
                  <textarea
                    value={selectedNote.dmNotes}
                    onChange={(event) => onPatchHex(selectedHex, { dmNotes: event.target.value })}
                    placeholder="Secrets, clues, NPC movement, continuity notes."
                  />
                </Field>
                <Field label="Encounter seed" wide>
                  <textarea
                    value={selectedNote.encounterSeed}
                    onChange={(event) => onPatchHex(selectedHex, { encounterSeed: event.target.value })}
                    placeholder="Korte encounter of complication seed voor deze hex."
                  />
                </Field>
              </div>

              <div className="hex-action-grid">
                <button
                  className={selectedDiscovered ? "button button--primary" : "button button--ghost"}
                  type="button"
                  onClick={() => onMarkDiscovered(selectedHex)}
                >
                  <Flag size={16} /> {selectedDiscovered ? "Ontdekt" : "Mark ontdekking"}
                </button>
                <button
                  className={selectedInRoute ? "button button--primary" : "button button--ghost"}
                  type="button"
                  onClick={() => onToggleRouteHex(selectedHex)}
                >
                  <Route size={16} /> {selectedInRoute ? "In route" : "Voeg toe aan route"}
                </button>
                <button className="button button--ghost" type="button" onClick={() => copyToClipboard(promptText)}>
                  <Copy size={16} /> Kopieer map prompt
                </button>
              </div>
            </div>
          </V2Panel>

          <V2Panel title="Neighbor Hexes" eyebrow="Snelle navigatie">
            <div className="neighbor-hex-grid">
              {nearbyHexes.map((hexId) => (
                <button key={hexId} type="button" onClick={() => onSelectHex(hexId)}>
                  {hexId}
                </button>
              ))}
            </div>
          </V2Panel>

          <V2Panel title="Must-have Map Elements" eyebrow="Prompt engine input">
            <div className="hex-prompt-box">
              <textarea
                value={selectedNote.mapPromptSeed}
                onChange={(event) => onPatchHex(selectedHex, { mapPromptSeed: event.target.value })}
                placeholder="Voeg belangrijke visuele elementen toe: oude toren, touwbruggen, rode linten, modderpoel, altaarsteen..."
              />
              <p>{promptText}</p>
            </div>
          </V2Panel>
        </aside>
      </section>
    </main>
  );
}
