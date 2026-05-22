import { Check, ClipboardCheck, DownloadCloud, ExternalLink, Link2, RefreshCcw, Save, ShieldCheck } from "lucide-react";
import { EmptyState, Meter, Panel, Tag } from "./ui.jsx";

const sourceTypes = [
  { id: "beyond-url", label: "Beyond link" },
  { id: "json", label: "JSON paste" },
  { id: "manual", label: "Manual text" },
];

const reviewFields = [
  ["importMethod", "Import methode"],
  ["name", "Naam"],
  ["classSummary", "Class"],
  ["level", "Level"],
  ["proficiencyBonus", "Prof"],
  ["race", "Race/species"],
  ["background", "Background"],
  ["alignment", "Alignment"],
  ["ac", "AC"],
  ["currentHp", "Current HP"],
  ["maxHp", "Max HP"],
  ["tempHp", "Temp HP"],
  ["passivePerception", "Passive Perception"],
  ["spellSaveDc", "Spell Save DC"],
  ["spellAttackBonus", "Spell Attack"],
  ["spellcastingAbility", "Spell Ability"],
  ["speed", "Speed"],
  ["abilities", "Abilities"],
  ["attacks", "Attacks"],
  ["spells", "Spells"],
  ["preparedSpells", "Prepared"],
  ["proficiencies", "Proficiencies"],
  ["languages", "Languages"],
  ["gear", "Gear"],
  ["currency", "Currency"],
  ["beyondCharacterId", "Beyond ID"],
  ["jsonSource", "JSON bron"],
];

export function ImportCenter({
  importCenter,
  partyMembers,
  snapshots,
  onPatchImportCenter,
  onAnalyzeImport,
  onApplyImport,
  onCreateSnapshot,
}) {
  const review = importCenter.review;
  const target = partyMembers.find((member) => member.name === importCenter.targetMemberName) || partyMembers[0];

  return (
    <main className="workspace import-center">
      <header className="topbar">
        <div>
          <p className="label">Import Center</p>
          <h1>D&D Beyond-light snapshots</h1>
          <span>Bewaar links, plak exports of tekst, review wijzigingen, en maak character snapshots zonder spoiler-risico.</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" type="button" onClick={onAnalyzeImport}>
            <RefreshCcw size={18} /> Analyseer / haal op
          </button>
          <button className="button button--primary" type="button" onClick={onApplyImport} disabled={!review}>
            <Save size={18} /> Toepassen
          </button>
        </div>
      </header>

      <section className="import-layout">
        <div className="main-column">
          <Panel title="Bron">
            <div className="tab-row">
              {sourceTypes.map((type) => (
                <button
                  className={importCenter.sourceType === type.id ? "tab tab--active" : "tab"}
                  key={type.id}
                  type="button"
                  onClick={() => onPatchImportCenter({ sourceType: type.id })}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="import-form-grid">
              <label className="field-line">
                <span>Target PC</span>
                <select
                  value={importCenter.targetMemberName}
                  onChange={(event) => onPatchImportCenter({ targetMemberName: event.target.value })}
                >
                  {partyMembers.map((member) => (
                    <option key={member.name}>{member.name}</option>
                  ))}
                </select>
              </label>
              <label className="field-line">
                <span>D&D Beyond URL</span>
                <input
                  value={importCenter.url}
                  onChange={(event) => onPatchImportCenter({ url: event.target.value })}
                  placeholder="https://www.dndbeyond.com/characters/..."
                />
              </label>
            </div>

            <label className="field-line import-textarea">
              <span>JSON of character tekst</span>
              <textarea
                value={importCenter.sourceText}
                onChange={(event) => onPatchImportCenter({ sourceText: event.target.value })}
                placeholder="Plak hier D&D Beyond JSON, een PDF-copy/paste, of handmatige regels zoals Name:, Class:, Level:, AC:, HP:, Gear:."
              />
            </label>

            <div className="import-helper-strip">
              <span>
                <DownloadCloud size={16} />
                Beyond link probeert public JSON, daarna embedded pagina-data, daarna HTML-tekst.
              </span>
              {review?.beyondApiUrl ? (
                <a href={review.beyondApiUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} /> Open JSON fallback
                </a>
              ) : null}
            </div>
            {importCenter.lastBeyondFetch ? <p className="import-fetch-note">Laatste Beyond fetch: {importCenter.lastBeyondFetch}</p> : null}
            {importCenter.fetchError ? <p className="monster-source-warning">{importCenter.fetchError}</p> : null}
          </Panel>

          <Panel title="Review voordat je opslaat">
            {review ? (
              <>
                <div className="quality-card quality-card--compact">
                  <div>
                    <strong>{review.confidence}%</strong>
                    <span>Import confidence</span>
                  </div>
                  <Meter value={review.confidence} tone={review.confidence < 55 ? "danger" : "accent"} />
                </div>
                <div className="review-grid">
                  {reviewFields.map(([key, label]) => (
                    <article key={key}>
                      <span className="label">{label}</span>
                      <strong>{review[key] || "Niet gevonden"}</strong>
                    </article>
                  ))}
                </div>
                {review.warnings?.length ? (
                  <div className="warning-stack">
                    {review.warnings.map((warning) => (
                      <p className="dm-only" key={warning}>
                        <ShieldCheck size={16} /> <span>{warning}</span>
                      </p>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyState>Analyseer eerst een bron. De app past niets automatisch toe.</EmptyState>
            )}
          </Panel>
        </div>

        <aside className="side-column">
          <Panel title="Huidige target">
            {target ? (
              <div className="target-card">
                <div className="avatar-slot">{target.name.slice(0, 2)}</div>
                <div>
                  <strong>{target.name}</strong>
                  <span>{target.classSummary}</span>
                </div>
                <div className="split-tags">
                  <Tag>Level {target.level || "?"}</Tag>
                  <Tag>AC {target.ac || "?"}</Tag>
                  <Tag>HP {target.maxHp || "?"}</Tag>
                </div>
                {target.beyondUrl ? (
                  <a href={target.beyondUrl} target="_blank" rel="noreferrer" className="row-link">
                    <Link2 size={16} /> Open Beyond sheet
                  </a>
                ) : null}
                <button className="button button--ghost" type="button" onClick={() => onCreateSnapshot(target.name)}>
                  <ClipboardCheck size={16} /> Snapshot maken
                </button>
              </div>
            ) : (
              <EmptyState>Kies een party member.</EmptyState>
            )}
          </Panel>

          <Panel title="Snapshot history">
            {snapshots.length ? (
              <div className="list-stack">
                {snapshots.slice(0, 8).map((snapshot) => (
                  <article className="quest-mini" key={snapshot.id}>
                    <Tag tone="safe"><Check size={12} /> Snapshot</Tag>
                    <strong>{snapshot.name}</strong>
                    <span>
                      Level {snapshot.level || "?"} / AC {snapshot.ac || "?"} / HP {snapshot.maxHp || "?"}
                    </span>
                    <small>{new Date(snapshot.createdAt).toLocaleString("nl-NL")}</small>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState>Nog geen snapshots. Maak er een voor je volgende sessie start.</EmptyState>
            )}
          </Panel>

          <Panel title="Regels">
            <ul className="rule-list">
              <li>Geen login of private account-sync: alleen publieke sheets of geplakte JSON.</li>
              <li>Als de browser D&D Beyond blokkeert, plak de JSON of de pagina-bron als scraper fallback.</li>
              <li>Review-to-save voorkomt dat een rommelige paste je party overschrijft.</li>
              <li>Snapshots bewaren tafel-relevante stats per sessiemoment.</li>
            </ul>
          </Panel>
        </aside>
      </section>
    </main>
  );
}
