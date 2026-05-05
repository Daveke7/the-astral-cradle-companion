import { Clipboard, FileText, Sparkles } from "lucide-react";
import { scenes as seedScenes } from "../data/campaignData.js";
import { DmOnly, EmptyState, Meter, Panel, Tag } from "./ui.jsx";

const formatRules = [
  "## Scene: titel",
  "Doel: speelbaar doel van de scene",
  "Conflict: druk, keuze of risico",
  "Read-aloud: korte voorleestekst",
  "Clues: bullets met concrete tafelclues",
  "Player-safe: publiceerbare samenvatting",
  "DM-only: geheim, waarheid of spoiler",
  "## Encounter: naam met objective, terrain en timer",
];

export function SessionPrep({
  importText,
  setImportText,
  parsedPrep,
  prepQuality,
  repairPrompt,
  onBuildRepairPrompt,
}) {
  const scenes = parsedPrep.scenes.length ? parsedPrep.scenes : seedScenes;

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
          <div className="quality-card quality-card--compact">
            <div>
              <strong>{prepQuality.score}%</strong>
              <span>Format {prepQuality.label}</span>
            </div>
            <Meter value={prepQuality.score} tone={prepQuality.score < 65 ? "danger" : "accent"} />
          </div>
          <div className="import-preview">
            <span className="label">Herkend</span>
            {parsedPrep.cards.length || parsedPrep.scenes.length ? (
              [...parsedPrep.scenes.map((scene) => ({ ...scene, type: "Scene" })), ...parsedPrep.cards].map((item) => (
                <div className="import-row" key={`${item.type}-${item.id || item.title}`}>
                  <FileText size={15} />
                  <strong>{item.type}</strong>
                  <span>{item.title}</span>
                </div>
              ))
            ) : (
              <p>Geen koppen herkend. Gebruik bijvoorbeeld "## Scene: Kamp zonder sterren".</p>
            )}
          </div>
          {prepQuality.warnings.length ? (
            <div className="repair-box">
              <button className="button button--ghost" type="button" onClick={onBuildRepairPrompt}>
                <Clipboard size={16} /> Maak repair prompt
              </button>
              <ul className="rule-list">
                {prepQuality.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </div>
          ) : null}
          {prepQuality.canonRisks?.length ? (
            <div className="repair-box">
              <span className="label">Canon Risk Scanner</span>
              <ul className="rule-list">
                {prepQuality.canonRisks.map((risk) => (
                  <li key={risk.id}>{risk.detail}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {repairPrompt ? (
            <details className="repair-output">
              <summary>Repair prompt klaar</summary>
              <textarea readOnly value={repairPrompt} />
            </details>
          ) : null}
        </Panel>

        <Panel title="Formatregels">
          <ul className="rule-list">
            {formatRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Import cards">
          {parsedPrep.cards.length ? (
            <div className="list-stack">
              {parsedPrep.cards.slice(0, 8).map((card) => (
                <article className="quest-mini" key={card.id}>
                  <Tag tone={card.visibility === "player-ready" ? "safe" : card.visibility === "gm" ? "danger" : "warning"}>
                    {card.type}
                  </Tag>
                  <strong>{card.title}</strong>
                  <span>{card.summary}</span>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState>Nog geen NPC, handout, loot of encounter cards uit import.</EmptyState>
          )}
        </Panel>
      </aside>
    </main>
  );
}
