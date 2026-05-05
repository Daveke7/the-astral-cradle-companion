import { FileText, Sparkles } from "lucide-react";
import { scenes } from "../data/campaignData.js";
import { DmOnly, Panel, Tag } from "./ui.jsx";

const formatRules = [
  "## Scene: titel",
  "Player-safe: korte samenvatting",
  "DM-only: geheim, waarheid of spoiler",
  "NPC: naam - rol - wil - geheim",
  "Encounter: naam - doel - terrein - timer",
  "Loot: item - eigenaar - publiceerbaar ja/nee",
];

export function SessionPrep({ importText, setImportText, structuredImport }) {
  return (
    <main className="workspace two-column">
      <header className="topbar">
        <div>
          <p className="label">Sessie Prep</p>
          <h1>Firefinger opzetten zonder tekstmuur</h1>
          <span>Scenes, clues, NPC links en handouts staan apart voor snel tafelgebruik.</span>
        </div>
      </header>

      <section className="main-column">
        <Panel title="Scene outline">
          <div className="scene-prep-list">
            {scenes.map((scene) => (
              <article className="scene-prep" key={scene.id}>
                <div className="scene-prep__head">
                  <h3>{scene.title}</h3>
                  <Tag>{scene.type}</Tag>
                </div>
                <dl>
                  <div>
                    <dt>Doel</dt>
                    <dd>{scene.goal}</dd>
                  </div>
                  <div>
                    <dt>Conflict</dt>
                    <dd>{scene.conflict}</dd>
                  </div>
                  <div>
                    <dt>Clues</dt>
                    <dd>{scene.clues.join(" / ")}</dd>
                  </div>
                </dl>
                <DmOnly>{scene.dmOnly}</DmOnly>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <aside className="side-column">
        <Panel
          title="AI Prep Import"
          action={<Sparkles size={18} className="muted-icon" />}
        >
          <textarea
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
            placeholder="Plak hier rommelige ChatGPT Markdown. Koppen met Scene, NPC, Encounter, Loot en Handout worden alvast herkend."
          />
          <div className="import-preview">
            <span className="label">Herkend</span>
            {structuredImport.length ? (
              structuredImport.map((item) => (
                <div className="import-row" key={`${item.type}-${item.title}`}>
                  <FileText size={15} />
                  <strong>{item.type}</strong>
                  <span>{item.title}</span>
                </div>
              ))
            ) : (
              <p>Geen koppen herkend. Gebruik bijvoorbeeld "## Scene: Kamp zonder sterren".</p>
            )}
          </div>
        </Panel>

        <Panel title="Formatregels">
          <ul className="rule-list">
            {formatRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </Panel>
      </aside>
    </main>
  );
}
