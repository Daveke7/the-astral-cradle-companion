import { useMemo, useState } from "react";
import { Archive, CheckCircle2, Copy, Database, Download, FileJson, RefreshCcw, SearchCheck, Trash2, Upload } from "lucide-react";
import {
  clearCompendiumType,
  compendiumCounts,
  exportCompendiumJson,
  loadCompendium,
  upsertCompendiumEntries,
} from "../utils/compendiumStore.js";
import {
  analyzePrivateCompendiumJson,
  importPrivateCompendiumJson,
  syncOpen5eCompendium,
  syncSrdCompendium,
} from "../utils/compendiumSources.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

const dataTypes = [
  { id: "monsters", label: "Monsters" },
  { id: "spells", label: "Spells" },
  { id: "magicItems", label: "Magic Items" },
];

function typeLabel(type) {
  return dataTypes.find((item) => item.id === type)?.label || type;
}

function copyText(text) {
  navigator.clipboard?.writeText(text);
}

export function Compendium() {
  const [compendium, setCompendium] = useState(() => loadCompendium());
  const [activeType, setActiveType] = useState("monsters");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState("");
  const [importText, setImportText] = useState("");
  const [importAnalysis, setImportAnalysis] = useState(null);
  const [importSelection, setImportSelection] = useState({ monsters: true, spells: true, magicItems: true });
  const [busyKey, setBusyKey] = useState("");
  const counts = compendiumCounts(compendium);
  const activeEntries = compendium[activeType] || [];

  const sourceRows = useMemo(
    () => Object.values(compendium.sources || {}).sort((left, right) => String(right.syncedAt || "").localeCompare(String(left.syncedAt || ""))),
    [compendium.sources]
  );

  async function runSync(source, type) {
    const key = `${source}-${type}`;
    setBusyKey(key);
    setStatus(`Sync gestart: ${source} ${typeLabel(type)}.`);
    setProgress("");
    try {
      const entries =
        source === "SRD"
          ? await syncSrdCompendium(type, (done, total) => setProgress(`${done}/${total}`))
          : await syncOpen5eCompendium(type, (done, total) => setProgress(`${done}/${total}`));
      const next = upsertCompendiumEntries(type, entries, {
        id: `${source.toLowerCase()}-${type}`,
        label: `${source} ${typeLabel(type)}`,
      });
      setCompendium(next);
      setStatus(`${entries.length} ${typeLabel(type)} opgeslagen uit ${source}.`);
    } catch (error) {
      setStatus(error.message || "Sync mislukt.");
    } finally {
      setBusyKey("");
      setProgress("");
    }
  }

  function analyzeImport() {
    setStatus("");
    try {
      const parsed = analyzePrivateCompendiumJson(importText);
      setImportAnalysis(parsed);
      setStatus(
        `Import herkend: ${parsed.counts.monsters} monsters, ${parsed.counts.spells} spells, ${parsed.counts.magicItems} magic items.`
      );
    } catch {
      setImportAnalysis(null);
      setStatus("Analyse niet gelukt. Plak geldige JSON of upload een JSON-bestand.");
    }
  }

  function importPrivate() {
    setStatus("");
    try {
      const parsed = importAnalysis || { entries: importPrivateCompendiumJson(importText) };
      let next = compendium;
      dataTypes.forEach((type) => {
        const entries = parsed.entries[type.id] || [];
        if (entries.length && importSelection[type.id]) {
          next = upsertCompendiumEntries(type.id, entries, {
            id: `private-${type.id}-${Date.now()}`,
            label: `Private import ${type.label}`,
          });
        }
      });
      setCompendium(next);
      setImportAnalysis(null);
      setStatus(
        `Private import klaar: ${importSelection.monsters ? parsed.entries.monsters.length : 0} monsters, ${importSelection.spells ? parsed.entries.spells.length : 0} spells, ${importSelection.magicItems ? parsed.entries.magicItems.length : 0} magic items.`
      );
    } catch {
      setStatus("Import niet gelukt. Plak JSON met monsters/spells/magicItems of een Foundry compendium export.");
    }
  }

  function handleImportText(value) {
    setImportText(value);
    setImportAnalysis(null);
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setImportText(text);
    setImportAnalysis(null);
    setStatus(`${file.name} geladen. Klik op Analyseer import om te previewen.`);
  }

  function toggleImportType(type) {
    setImportSelection((current) => ({ ...current, [type]: !current[type] }));
  }

  function clearType(type) {
    const next = clearCompendiumType(type);
    setCompendium(next);
    setStatus(`${typeLabel(type)} cache gewist.`);
  }

  return (
    <main className="workspace compendium-page">
      <header className="topbar compendium-header">
        <div>
          <p className="label">Compendium Sync</p>
          <h1>Een lokale bron voor monsters, spells en items</h1>
          <span>SRD/Open5e sync, private JSON import, Foundry-style import en lokale cache voor alle tools.</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" type="button" onClick={() => copyText(exportCompendiumJson())}>
            <Copy size={17} /> Kopieer export
          </button>
        </div>
      </header>

      <section className="compendium-layout">
        <Panel title="Local cache" action={<Tag>{counts.monsters + counts.spells + counts.magicItems} records</Tag>}>
          <div className="compendium-counts">
            <button type="button" onClick={() => setActiveType("monsters")}>
              <Archive size={17} />
              <span>Monsters</span>
              <strong>{counts.monsters}</strong>
            </button>
            <button type="button" onClick={() => setActiveType("spells")}>
              <Database size={17} />
              <span>Spells</span>
              <strong>{counts.spells}</strong>
            </button>
            <button type="button" onClick={() => setActiveType("magicItems")}>
              <FileJson size={17} />
              <span>Magic Items</span>
              <strong>{counts.magicItems}</strong>
            </button>
          </div>
          {status ? <p className="compendium-status">{status}{progress ? ` (${progress})` : ""}</p> : null}
        </Panel>

        <Panel title="Sync open data">
          <div className="compendium-sync-grid">
            {dataTypes.map((type) => (
              <article key={type.id}>
                <h3>{type.label}</h3>
                <button className="button button--primary" type="button" disabled={Boolean(busyKey)} onClick={() => runSync("SRD", type.id)}>
                  <RefreshCcw size={16} /> {busyKey === `SRD-${type.id}` ? "Syncing..." : "Sync SRD"}
                </button>
                <button className="button button--ghost" type="button" disabled={Boolean(busyKey)} onClick={() => runSync("Open5e", type.id)}>
                  <Download size={16} /> {busyKey === `Open5e-${type.id}` ? "Syncing..." : "Sync Open5e"}
                </button>
                <button className="button button--ghost" type="button" onClick={() => clearType(type.id)}>
                  <Trash2 size={16} /> Wis cache
                </button>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Private import" className="compendium-import-panel">
          <label className="compendium-file-input">
            <FileJson size={17} />
            <span>Upload JSON export</span>
            <input type="file" accept=".json,application/json" onChange={handleImportFile} />
          </label>
          <textarea
            value={importText}
            onChange={(event) => handleImportText(event.target.value)}
            placeholder='Plak JSON: {"monsters":[...],"spells":[...],"magicItems":[...]} of een Foundry compendium export.'
          />
          <div className="compendium-import-actions">
            <button className="button button--ghost" type="button" onClick={analyzeImport} disabled={!importText.trim()}>
              <SearchCheck size={17} /> Analyseer import
            </button>
            <button className="button button--primary" type="button" onClick={importPrivate} disabled={!importText.trim()}>
              <Upload size={17} /> Importeer selectie
            </button>
          </div>
          <p>Private imports blijven lokaal in deze browser en worden door Initiative, Spells, Items en generatoren gelezen.</p>
        </Panel>

        <Panel title="Import review" className="compendium-review-panel">
          {importAnalysis ? (
            <div className="compendium-review">
              <div className="compendium-review-counts">
                {dataTypes.map((type) => (
                  <label key={type.id}>
                    <input type="checkbox" checked={importSelection[type.id]} onChange={() => toggleImportType(type.id)} />
                    <span>{type.label}</span>
                    <strong>{importAnalysis.counts[type.id]}</strong>
                  </label>
                ))}
                <article>
                  <span>Unknown</span>
                  <strong>{importAnalysis.counts.unknown}</strong>
                </article>
              </div>

              {importAnalysis.warnings.length ? (
                <div className="compendium-review-warnings">
                  {importAnalysis.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                </div>
              ) : (
                <p className="compendium-review-ok"><CheckCircle2 size={16} /> Import ziet er bruikbaar uit.</p>
              )}

              <div className="compendium-review-samples">
                {dataTypes.map((type) => (
                  <article key={type.id}>
                    <h3>{type.label}</h3>
                    {importAnalysis.samples[type.id].length ? (
                      importAnalysis.samples[type.id].map((entry) => (
                        <span key={entry.index || entry.name}>{entry.name}</span>
                      ))
                    ) : (
                      <span>Geen samples</span>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState>Upload of plak JSON en klik op Analyseer import voor een preview.</EmptyState>
          )}
        </Panel>

        <Panel title={`${typeLabel(activeType)} preview`} className="compendium-preview-panel">
          <div className="compendium-preview-list">
            {activeEntries.length ? (
              activeEntries.slice(0, 80).map((entry) => (
                <article key={entry.index || entry.name}>
                  <strong>{entry.name}</strong>
                  <span>{entry.source || "Local"} {entry.cr ? `/ CR ${entry.cr}` : ""} {entry.level !== undefined ? `/ level ${entry.level}` : ""} {entry.rarity ? `/ ${entry.rarity}` : ""}</span>
                </article>
              ))
            ) : (
              <EmptyState>Nog geen lokale records voor dit type.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel title="Sync history">
          <div className="compendium-history">
            {sourceRows.length ? (
              sourceRows.slice(0, 12).map((source) => (
                <article key={`${source.label}-${source.syncedAt}`}>
                  <strong>{source.label}</strong>
                  <span>{source.count} records / {source.syncedAt ? new Date(source.syncedAt).toLocaleString("nl-NL") : "-"}</span>
                </article>
              ))
            ) : (
              <EmptyState>Nog geen sync history.</EmptyState>
            )}
          </div>
        </Panel>
      </section>
    </main>
  );
}
