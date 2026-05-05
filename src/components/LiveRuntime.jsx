import { Check, Megaphone, RotateCcw } from "lucide-react";
import { scenes, tools } from "../data/campaignData.js";
import { DmOnly, EmptyState, Panel, Tag } from "./ui.jsx";

export function LiveRuntime({
  activeSceneId,
  setActiveSceneId,
  completedScenes,
  toggleSceneComplete,
  publishedScenes,
  publishScene,
  notes,
  setNotes,
}) {
  const scene = scenes.find((item) => item.id === activeSceneId) ?? scenes[0];

  return (
    <main className="workspace runtime-layout">
      <header className="topbar">
        <div>
          <p className="label">Live Runtime</p>
          <h1>{scene.title}</h1>
          <span>{scene.goal}</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" type="button" onClick={() => toggleSceneComplete(scene.id)}>
            {completedScenes.has(scene.id) ? <RotateCcw size={18} /> : <Check size={18} />}
            {completedScenes.has(scene.id) ? "Heropen" : "Scene klaar"}
          </button>
          <button className="button button--primary" type="button" onClick={() => publishScene(scene.id)}>
            <Megaphone size={18} /> Publiceer
          </button>
        </div>
      </header>

      <aside className="scene-nav">
        {scenes.map((item) => (
          <button
            className={item.id === scene.id ? "scene-tab scene-tab--active" : "scene-tab"}
            key={item.id}
            type="button"
            onClick={() => setActiveSceneId(item.id)}
          >
            <span>{item.title.replace("Scene ", "")}</span>
            {completedScenes.has(item.id) && <Tag tone="safe">klaar</Tag>}
          </button>
        ))}
      </aside>

      <section className="runtime-main">
        <Panel title="Read-aloud">
          <p className="read-aloud">{scene.readAloud}</p>
        </Panel>

        <Panel title="Clues to reveal">
          <div className="clue-list">
            {scene.clues.map((clue) => (
              <button type="button" key={clue}>{clue}</button>
            ))}
          </div>
        </Panel>

        <Panel title="Sessie notities">
          <textarea
            className="notes-box"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Korte tafelnotities: keuzes, beloftes, nieuwe NPC namen, gevolgen."
          />
        </Panel>
      </section>

      <aside className="runtime-side">
        <Panel title="DM-only">
          <DmOnly>{scene.dmOnly}</DmOnly>
        </Panel>
        <Panel title="Quick DC">
          <div className="tool-stack">
            {tools.slice(0, 3).map((tool) => (
              <p key={tool.name}>
                <strong>{tool.name}</strong>
                <span>{tool.detail}</span>
              </p>
            ))}
          </div>
        </Panel>
        <Panel title="Player View status">
          {publishedScenes.has(scene.id) ? (
            <Tag tone="safe">Deze scene is gepubliceerd</Tag>
          ) : (
            <EmptyState>Nog niet naar Player View gestuurd.</EmptyState>
          )}
        </Panel>
      </aside>
    </main>
  );
}
