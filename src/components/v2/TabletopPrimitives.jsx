import { Eye, EyeOff, MapPinned, ShieldAlert } from "lucide-react";
import { TRAVEL_MAP_OVERLAYS, TRAVEL_ROUTE_NODES } from "../../data/systems/travelSystem.js";

export function V2Panel({ title, eyebrow, action, children, className = "" }) {
  return (
    <section className={`v2-panel ${className}`}>
      {(title || eyebrow || action) && (
        <div className="v2-panel__head">
          <div>
            {eyebrow ? <span className="v2-eyebrow">{eyebrow}</span> : null}
            {title ? <h2>{title}</h2> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ children, tone = "neutral" }) {
  return <span className={`v2-pill v2-pill--${tone}`}>{children}</span>;
}

export function IconToggle({ active, children, onClick, playerSafe = true }) {
  return (
    <button className={active ? "v2-toggle v2-toggle--active" : "v2-toggle"} type="button" onClick={onClick}>
      {active ? <Eye size={14} /> : <EyeOff size={14} />}
      <span>{children}</span>
      {playerSafe ? null : <ShieldAlert size={13} />}
    </button>
  );
}

function routePath(nodes) {
  return nodes.map((node) => `${node.x},${node.y}`).join(" ");
}

export function LayeredTravelMap({ overlays = {}, selectedNodeId, onSelectNode, routeProgress = 0, lastEvent }) {
  const nodes = TRAVEL_ROUTE_NODES;
  const visibleNodes = nodes.filter((node) => overlays.dmMarkers || node.visibility !== "dm");
  const currentIndex = Math.min(nodes.length - 1, Math.max(0, Number(routeProgress) || 0));

  return (
    <div className="layered-map">
      <div className="layered-map__base" />
      {overlays.grid ? <div className="layered-map__grid" /> : null}
      {overlays.weather ? <div className="layered-map__weather" /> : null}
      {overlays.route ? (
        <svg className="layered-map__route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={routePath(nodes)} />
        </svg>
      ) : null}
      {overlays.redTrail ? <div className="layered-map__red-trail" /> : null}

      <div className="layered-map__nodes">
        {visibleNodes.map((node, index) => {
          const isDone = index <= currentIndex;
          const isSelected = selectedNodeId === node.id;
          return (
            <button
              className={[
                "map-node",
                isDone ? "map-node--done" : "",
                isSelected ? "map-node--selected" : "",
                node.visibility === "dm" ? "map-node--dm" : "",
              ].filter(Boolean).join(" ")}
              key={node.id}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              type="button"
              onClick={() => onSelectNode(node.id)}
            >
              <span />
              {overlays.labels ? <strong>{node.label}</strong> : null}
            </button>
          );
        })}
      </div>

      {lastEvent ? (
        <div className={`layered-map__event layered-map__event--${lastEvent.outcome}`}>
          <MapPinned size={16} />
          <div>
            <strong>{lastEvent.title}</strong>
            <span>{lastEvent.outcome}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function OverlayToolbar({ overlays, onToggle }) {
  return (
    <div className="overlay-toolbar">
      {TRAVEL_MAP_OVERLAYS.map((overlay) => (
        <IconToggle
          active={Boolean(overlays[overlay.id])}
          key={overlay.id}
          onClick={() => onToggle(overlay.id)}
          playerSafe={overlay.playerSafe}
        >
          {overlay.label}
        </IconToggle>
      ))}
    </div>
  );
}
