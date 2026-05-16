import { useEffect, useMemo, useState } from "react";
import { Copy, Gem, LoaderCircle, Search, Sparkles } from "lucide-react";
import {
  fallbackMagicItemLibrary,
  customMagicItemStorageKey,
  magicItemNotes,
  magicItemRarities,
  magicItemTypes,
} from "../data/systems/magicItemLibrary.js";
import {
  fetchSrdMagicItemDetail,
  fetchSrdMagicItemIndex,
  magicItemSearchText,
} from "../utils/magicItems.js";
import { useCompendiumEntries } from "../utils/useCompendiumEntries.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

function mergeItems(current, incoming) {
  const byIndex = new Map(current.map((item) => [item.index, item]));
  incoming.forEach((item) => {
    const existing = byIndex.get(item.index);
    byIndex.set(item.index, existing ? { ...existing, ...item } : item);
  });
  return Array.from(byIndex.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeImportedItem(item = {}, index = 0) {
  const safeName = item.name || `Private Magic Item ${index + 1}`;
  return {
    index: item.index || `private-${safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
    name: safeName,
    source: item.source || "Private local import",
    type: item.type || item.category || "Magic Item",
    rarity: item.rarity || "Unknown",
    attunement: Boolean(item.attunement),
    tags: Array.isArray(item.tags)
      ? item.tags
      : String(item.tags || "")
          .split(/[,/]/)
          .map((entry) => entry.trim())
          .filter(Boolean),
    notes: item.notes || "",
    desc: Array.isArray(item.desc) ? item.desc : [item.desc || item.description || ""].filter(Boolean),
    properties: Array.isArray(item.properties)
      ? item.properties
      : String(item.properties || "")
          .split(/[,/]/)
          .map((entry) => entry.trim())
          .filter(Boolean),
    damage: item.damage || "",
    weight: item.weight || "",
  };
}

function loadCustomItems() {
  try {
    const stored = JSON.parse(localStorage.getItem(customMagicItemStorageKey) || "[]");
    return Array.isArray(stored) ? stored.map(normalizeImportedItem) : [];
  } catch {
    return [];
  }
}

function saveCustomItems(items) {
  localStorage.setItem(customMagicItemStorageKey, JSON.stringify(items));
}

function itemTone(item) {
  if (item.attunement) return "warning";
  if (item.source?.includes("Campaign")) return "safe";
  return "neutral";
}

function copyItem(item) {
  const payload = [
    `${item.name} (${item.rarity || "Unknown"} ${item.type || "Magic Item"})`,
    `Attunement: ${item.attunement ? "yes" : "no"} | Source: ${item.source || "-"}`,
    item.damage ? `Damage: ${item.damage}` : "",
    item.weight ? `Weight: ${item.weight}` : "",
    item.notes ? `DM notes: ${item.notes}` : "",
    "",
    ...(item.desc || []),
  ]
    .filter((line) => line !== "")
    .join("\n");
  navigator.clipboard?.writeText(payload);
}

function MagicItemDetail({ item, loading }) {
  if (loading) {
    return (
      <div className="magic-item-loading-state">
        <LoaderCircle size={18} />
        <span>Item laden...</span>
      </div>
    );
  }

  if (!item) return <EmptyState>Selecteer een magic item om details te zien.</EmptyState>;

  return (
    <article className="magic-item-detail-card">
      <header className="magic-item-detail-card__head">
        <div>
          <span>{item.rarity || "Unknown"} / {item.type || "Magic Item"}</span>
          <h2>{item.name}</h2>
        </div>
        <div className="split-tags">
          {item.attunement ? <Tag tone="warning">Attunement</Tag> : <Tag tone="safe">No attunement</Tag>}
          <Tag>{item.source || "Vault"}</Tag>
        </div>
      </header>

      <div className="magic-item-rule-grid">
        <article><span>Type</span><strong>{item.type || "-"}</strong></article>
        <article><span>Rarity</span><strong>{item.rarity || "-"}</strong></article>
        <article><span>Damage</span><strong>{item.damage || "-"}</strong></article>
        <article><span>Weight</span><strong>{item.weight || "-"}</strong></article>
      </div>

      {item.notes ? (
        <div className="magic-item-notes">
          <strong>DM notes</strong>
          <span>{item.notes}</span>
        </div>
      ) : null}

      {(item.properties || []).length ? (
        <div className="magic-item-property-list">
          {item.properties.map((property) => <Tag key={property}>{property}</Tag>)}
        </div>
      ) : null}

      <div className="magic-item-description">
        {(item.desc || []).length ? item.desc.map((line) => <p key={line}>{line}</p>) : <EmptyState>Dit item heeft nog geen detailtekst geladen.</EmptyState>}
      </div>

      <footer className="magic-item-detail-card__foot">
        <div className="magic-item-tag-list">
          {(item.tags || []).length ? item.tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : <Tag>Geen tags</Tag>}
        </div>
        <button className="button button--ghost" type="button" onClick={() => copyItem(item)}>
          <Copy size={16} /> Kopieer
        </button>
      </footer>
    </article>
  );
}

export function MagicItemSheet() {
  const compendiumItems = useCompendiumEntries("magicItems");
  const [customItems, setCustomItems] = useState(() => loadCustomItems());
  const [items, setItems] = useState(() => mergeItems(compendiumItems, loadCustomItems()));
  const [selectedItem, setSelectedItem] = useState(() => compendiumItems[0] || fallbackMagicItemLibrary[0]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [attunementFilter, setAttunementFilter] = useState("all");
  const [customImportText, setCustomImportText] = useState("");
  const [customImportStatus, setCustomImportStatus] = useState("");
  const [loadState, setLoadState] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setItems((current) => mergeItems(compendiumItems, current));
    setSelectedItem((current) => current || compendiumItems[0] || fallbackMagicItemLibrary[0]);
  }, [compendiumItems]);

  useEffect(() => {
    let cancelled = false;
    async function loadIndex() {
      if (loadState !== "idle") return;
      setLoadState("loading");
      try {
        const onlineItems = await fetchSrdMagicItemIndex();
        if (cancelled) return;
        setItems((current) => mergeItems(current, onlineItems));
        setLoadState("loaded");
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError.message || "Online magic item-lijst niet beschikbaar. Starter vault blijft bruikbaar.");
        setLoadState("error");
      }
    }

    loadIndex();
    return () => {
      cancelled = true;
    };
  }, [loadState]);

  const filteredItems = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return items
      .filter((item) => (lowerQuery ? magicItemSearchText(item).includes(lowerQuery) : true))
      .filter((item) => (typeFilter === "all" ? true : item.type === typeFilter))
      .filter((item) => (rarityFilter === "all" ? true : item.rarity === rarityFilter))
      .filter((item) => {
        if (attunementFilter === "all") return true;
        if (attunementFilter === "yes") return item.attunement;
        return !item.attunement;
      })
      .slice(0, 120);
  }, [attunementFilter, items, query, rarityFilter, typeFilter]);

  async function selectItem(item) {
    setError("");
    setSelectedItem(item);
    if (item.desc?.length) return;
    setLoadState("loading-detail");
    try {
      const detail = await fetchSrdMagicItemDetail(item);
      setSelectedItem(detail);
      setItems((current) => mergeItems(current, [detail]));
      setLoadState("loaded");
    } catch (loadError) {
      setError(loadError.message || "Kon dit magic item niet laden.");
      setLoadState("error");
    }
  }

  function importCustomItems() {
    setCustomImportStatus("");
    try {
      const parsed = JSON.parse(customImportText);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const normalized = list.map(normalizeImportedItem);
      const nextCustomItems = mergeItems(customItems, normalized);
      setCustomItems(nextCustomItems);
      saveCustomItems(nextCustomItems);
      setItems((current) => mergeItems(current, normalized));
      setSelectedItem(normalized[0] || selectedItem);
      setCustomImportText("");
      setCustomImportStatus(`${normalized.length} private item(s) lokaal toegevoegd.`);
    } catch {
      setCustomImportStatus("Import niet gelukt. Gebruik JSON: een object of array met name, type, rarity, desc, enz.");
    }
  }

  function clearCustomItems() {
    setCustomItems([]);
    saveCustomItems([]);
    setItems((current) => current.filter((item) => item.source !== "Private local import"));
    setCustomImportStatus("Private item imports gewist uit deze browser.");
  }

  const isLoading = ["loading", "loading-detail"].includes(loadState);

  return (
    <main className="workspace magic-item-page">
      <header className="topbar magic-item-header">
        <div>
          <p className="label">Magic Item Vault</p>
          <h1>Loot zoeken zonder boek-chaos</h1>
          <span>Rarity, attunement, type, campaign relics en private local imports op één plek.</span>
        </div>
        <div className="topbar__actions">
          <Tag tone={isLoading ? "warning" : "safe"}>{isLoading ? "laden" : `${items.length} items`}</Tag>
          <button className="button button--ghost" type="button" onClick={() => selectedItem && copyItem(selectedItem)}>
            <Copy size={17} /> Kopieer huidige
          </button>
        </div>
      </header>

      <section className="magic-item-layout">
        <Panel title="Item zoeken" action={<Tag>{filteredItems.length} zichtbaar</Tag>}>
          <div className="magic-item-search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek op naam, type, rarity, property, campaign note..."
            />
          </div>

          <div className="magic-item-filter-grid">
            <label>
              <span>Type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">Alle types</option>
                {magicItemTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>
              <span>Rarity</span>
              <select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)}>
                <option value="all">Alle rarities</option>
                {magicItemRarities.map((rarity) => <option key={rarity}>{rarity}</option>)}
              </select>
            </label>
            <label>
              <span>Attunement</span>
              <select value={attunementFilter} onChange={(event) => setAttunementFilter(event.target.value)}>
                <option value="all">Alles</option>
                <option value="yes">Requires attunement</option>
                <option value="no">Geen attunement</option>
              </select>
            </label>
          </div>

          {error ? <p className="monster-source-warning">{error}</p> : null}

          <div className="magic-item-source-notes">
            {magicItemNotes.map((note) => <span key={note}>{note}</span>)}
          </div>

          <div className="magic-item-result-list">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <button
                  className={selectedItem?.index === item.index ? "magic-item-result magic-item-result--active" : "magic-item-result"}
                  key={item.index}
                  type="button"
                  onClick={() => selectItem(item)}
                >
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.rarity || "Unknown"} / {item.type || "Magic Item"} / {item.source || "Vault"}</small>
                  </span>
                  <Tag tone={itemTone(item)}>{item.attunement ? "Attune" : "Ready"}</Tag>
                </button>
              ))
            ) : (
              <EmptyState>Geen magic items gevonden met deze filters.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel title="Item detail" className="magic-item-detail-panel">
          <MagicItemDetail item={selectedItem} loading={loadState === "loading-detail"} />
        </Panel>

        <aside className="magic-item-side-panel">
          <Panel title="Campaign relics">
            <div className="magic-item-pick-list">
              {fallbackMagicItemLibrary.slice(0, 6).map((item) => (
                <button key={item.index} type="button" onClick={() => selectItem(item)}>
                  <Gem size={16} />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.rarity} / {item.type}</small>
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Loot lens">
            <div className="magic-item-lens">
              <article>
                <Sparkles size={17} />
                <div>
                  <strong>Attunement pressure</strong>
                  <span>Gebruik de filter om te zien welke rewards echt een slot kosten.</span>
                </div>
              </article>
              <article>
                <Gem size={17} />
                <div>
                  <strong>Campaign meaning</strong>
                  <span>Relics met notes blijven zichtbaar naast normale loot.</span>
                </div>
              </article>
            </div>
          </Panel>

          <Panel title="Private import">
            <div className="magic-item-private-import">
              <textarea
                value={customImportText}
                onChange={(event) => setCustomImportText(event.target.value)}
                placeholder='Plak JSON, bijvoorbeeld: [{"name":"My Item","type":"Wondrous Item","rarity":"Rare","attunement":true,"desc":["Effect tekst..."],"properties":["Charges"]}]'
              />
              <div>
                <button className="button button--primary" type="button" onClick={importCustomItems}>
                  Import lokaal
                </button>
                <button className="button button--ghost" type="button" onClick={clearCustomItems}>
                  Wis imports
                </button>
              </div>
              <span>{customItems.length} private items opgeslagen.</span>
              {customImportStatus ? <p>{customImportStatus}</p> : null}
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}
