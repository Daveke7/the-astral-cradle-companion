import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Copy, LoaderCircle, Search, Sparkles } from "lucide-react";
import { fallbackSpellLibrary, spellClasses, spellSchools, spellSheetNotes } from "../data/systems/spellLibrary.js";
import {
  fetchSrdClassSpells,
  fetchSrdSpellDetail,
  fetchSrdSpellIndex,
  formatSpellLevel,
  spellSearchText,
} from "../utils/spellbook.js";
import { useCompendiumEntries } from "../utils/useCompendiumEntries.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

const levelOptions = Array.from({ length: 10 }, (_, level) => level);
const customSpellStorageKey = "astral-cradle-custom-spells";

function mergeSpells(current, incoming) {
  const byIndex = new Map(current.map((spell) => [spell.index, spell]));
  incoming.forEach((spell) => {
    const existing = byIndex.get(spell.index);
    byIndex.set(spell.index, existing ? { ...existing, ...spell, classes: Array.from(new Set([...(existing.classes || []), ...(spell.classes || [])])) } : spell);
  });
  return Array.from(byIndex.values()).sort((left, right) => {
    if (Number(left.level || 0) !== Number(right.level || 0)) return Number(left.level || 0) - Number(right.level || 0);
    return left.name.localeCompare(right.name);
  });
}

function normalizeImportedSpell(spell = {}, index = 0) {
  const safeName = spell.name || `Private Spell ${index + 1}`;
  return {
    index: spell.index || `private-${safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
    name: safeName,
    source: spell.source || "Private local import",
    level: Number(spell.level || 0),
    school: spell.school || "",
    castingTime: spell.castingTime || spell.casting_time || "",
    range: spell.range || "",
    components: Array.isArray(spell.components)
      ? spell.components
      : String(spell.components || "")
          .split(/[,/]/)
          .map((item) => item.trim())
          .filter(Boolean),
    material: spell.material || "",
    duration: spell.duration || "",
    concentration: Boolean(spell.concentration),
    ritual: Boolean(spell.ritual),
    classes: Array.isArray(spell.classes)
      ? spell.classes
      : String(spell.classes || "")
          .split(/[,/]/)
          .map((item) => item.trim())
          .filter(Boolean),
    tags: Array.isArray(spell.tags) ? spell.tags : [],
    desc: Array.isArray(spell.desc) ? spell.desc : [spell.desc || spell.description || ""].filter(Boolean),
    higherLevel: Array.isArray(spell.higherLevel) ? spell.higherLevel : [spell.higherLevel || spell.higher_level || ""].filter(Boolean),
  };
}

function loadCustomSpells() {
  try {
    const stored = JSON.parse(localStorage.getItem(customSpellStorageKey) || "[]");
    return Array.isArray(stored) ? stored.map(normalizeImportedSpell) : [];
  } catch {
    return [];
  }
}

function saveCustomSpells(spells) {
  localStorage.setItem(customSpellStorageKey, JSON.stringify(spells));
}

function spellTone(spell) {
  if (spell.concentration) return "warning";
  if (spell.ritual) return "safe";
  return "neutral";
}

function copySpell(spell) {
  const payload = [
    `${spell.name} (${formatSpellLevel(spell.level)} ${spell.school || "spell"})`,
    `Casting: ${spell.castingTime || "-"} | Range: ${spell.range || "-"} | Duration: ${spell.duration || "-"}`,
    `Components: ${(spell.components || []).join(", ") || "-"}${spell.material ? ` (${spell.material})` : ""}`,
    "",
    ...(spell.desc || []),
    ...(spell.higherLevel?.length ? ["", "Higher level:", ...spell.higherLevel] : []),
  ].join("\n");
  navigator.clipboard?.writeText(payload);
}

function SpellDetail({ spell, loading }) {
  if (loading) {
    return (
      <div className="spell-loading-state">
        <LoaderCircle size={18} />
        <span>Spell laden...</span>
      </div>
    );
  }

  if (!spell) return <EmptyState>Selecteer een spell om de details te zien.</EmptyState>;

  return (
    <article className="spell-detail-card">
      <header className="spell-detail-card__head">
        <div>
          <span>{formatSpellLevel(spell.level)} level / {spell.school || "School unknown"}</span>
          <h2>{spell.name}</h2>
        </div>
        <div className="split-tags">
          {spell.concentration ? <Tag tone="warning">Concentration</Tag> : null}
          {spell.ritual ? <Tag tone="safe">Ritual</Tag> : null}
          <Tag>{spell.source || "Spellbook"}</Tag>
        </div>
      </header>

      <div className="spell-rule-grid">
        <article><span>Casting</span><strong>{spell.castingTime || "-"}</strong></article>
        <article><span>Range</span><strong>{spell.range || "-"}</strong></article>
        <article><span>Duration</span><strong>{spell.duration || "-"}</strong></article>
        <article><span>Components</span><strong>{(spell.components || []).join(", ") || "-"}</strong></article>
      </div>

      {spell.material ? (
        <div className="spell-material">
          <strong>Material</strong>
          <span>{spell.material}</span>
        </div>
      ) : null}

      <div className="spell-description">
        {(spell.desc || []).length ? spell.desc.map((line) => <p key={line}>{line}</p>) : <EmptyState>Deze spell heeft nog geen detailtekst geladen.</EmptyState>}
      </div>

      {spell.higherLevel?.length ? (
        <div className="spell-higher-level">
          <strong>Higher level</strong>
          {spell.higherLevel.map((line) => <p key={line}>{line}</p>)}
        </div>
      ) : null}

      <footer className="spell-detail-card__foot">
        <div className="spell-class-list">
          {(spell.classes || []).length ? spell.classes.map((item) => <Tag key={item}>{item}</Tag>) : <Tag>Classes onbekend</Tag>}
        </div>
        <button className="button button--ghost" type="button" onClick={() => copySpell(spell)}>
          <Copy size={16} /> Kopieer
        </button>
      </footer>
    </article>
  );
}

export function SpellSheet() {
  const compendiumSpells = useCompendiumEntries("spells");
  const [customSpells, setCustomSpells] = useState(() => loadCustomSpells());
  const [spells, setSpells] = useState(() => mergeSpells(compendiumSpells, loadCustomSpells()));
  const [selectedSpell, setSelectedSpell] = useState(() => compendiumSpells[0] || fallbackSpellLibrary[0]);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [onlyConcentration, setOnlyConcentration] = useState(false);
  const [onlyRitual, setOnlyRitual] = useState(false);
  const [customImportText, setCustomImportText] = useState("");
  const [customImportStatus, setCustomImportStatus] = useState("");
  const [loadState, setLoadState] = useState("idle");
  const [loadedClasses, setLoadedClasses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setSpells((current) => mergeSpells(compendiumSpells, current));
    setSelectedSpell((current) => current || compendiumSpells[0] || fallbackSpellLibrary[0]);
  }, [compendiumSpells]);

  useEffect(() => {
    let cancelled = false;
    async function loadIndex() {
      if (loadState !== "idle") return;
      setLoadState("loading");
      try {
        const onlineSpells = await fetchSrdSpellIndex();
        if (cancelled) return;
        setSpells((current) => mergeSpells(current, onlineSpells));
        setLoadState("loaded");
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError.message || "Online spell-lijst niet beschikbaar. Starter sheet blijft bruikbaar.");
        setLoadState("error");
      }
    }

    loadIndex();
    return () => {
      cancelled = true;
    };
  }, [loadState]);

  useEffect(() => {
    let cancelled = false;
    async function loadClassSpells() {
      if (classFilter === "all" || loadedClasses.includes(classFilter)) return;
      setLoadState("loading-class");
      try {
        const classSpells = await fetchSrdClassSpells(classFilter);
        if (cancelled) return;
        setSpells((current) => mergeSpells(current, classSpells));
        setLoadedClasses((current) => Array.from(new Set([...current, classFilter])));
        setLoadState("loaded");
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError.message || "Class filter kon online niet worden geladen.");
        setLoadState("error");
      }
    }

    loadClassSpells();
    return () => {
      cancelled = true;
    };
  }, [classFilter, loadedClasses]);

  const filteredSpells = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return spells
      .filter((spell) => (lowerQuery ? spellSearchText(spell).includes(lowerQuery) : true))
      .filter((spell) => (levelFilter === "all" ? true : Number(spell.level || 0) === Number(levelFilter)))
      .filter((spell) => (classFilter === "all" ? true : (spell.classes || []).includes(classFilter)))
      .filter((spell) => (schoolFilter === "all" ? true : spell.school === schoolFilter))
      .filter((spell) => (onlyConcentration ? spell.concentration : true))
      .filter((spell) => (onlyRitual ? spell.ritual : true))
      .slice(0, 120);
  }, [classFilter, levelFilter, onlyConcentration, onlyRitual, query, schoolFilter, spells]);

  async function selectSpell(spell) {
    setError("");
    setSelectedSpell(spell);
    if (spell.desc?.length) return;
    setLoadState("loading-detail");
    try {
      const detail = await fetchSrdSpellDetail(spell);
      setSelectedSpell(detail);
      setSpells((current) => mergeSpells(current, [detail]));
      setLoadState("loaded");
    } catch (loadError) {
      setError(loadError.message || "Kon deze spell niet laden.");
      setLoadState("error");
    }
  }

  function importCustomSpells() {
    setCustomImportStatus("");
    try {
      const parsed = JSON.parse(customImportText);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const normalized = list.map(normalizeImportedSpell);
      const nextCustomSpells = mergeSpells(customSpells, normalized);
      setCustomSpells(nextCustomSpells);
      saveCustomSpells(nextCustomSpells);
      setSpells((current) => mergeSpells(current, normalized));
      setSelectedSpell(normalized[0] || selectedSpell);
      setCustomImportText("");
      setCustomImportStatus(`${normalized.length} private spell(s) lokaal toegevoegd.`);
    } catch {
      setCustomImportStatus("Import niet gelukt. Gebruik JSON: een object of array met name, level, school, desc, classes, enz.");
    }
  }

  function clearCustomSpells() {
    setCustomSpells([]);
    saveCustomSpells([]);
    setSpells((current) => current.filter((spell) => spell.source !== "Private local import"));
    setCustomImportStatus("Private spell imports gewist uit deze browser.");
  }

  const loadingDetail = loadState === "loading-detail";
  const isLoading = ["loading", "loading-class", "loading-detail"].includes(loadState);

  return (
    <main className="workspace spell-sheet-page">
      <header className="topbar spell-sheet-header">
        <div>
          <p className="label">Spell Sheet</p>
          <h1>Zoek spells zonder boek-chaos</h1>
          <span>SRD lookup, snelle filters en een leesbare detailkaart voor aan tafel.</span>
        </div>
        <div className="topbar__actions">
          <Tag tone={isLoading ? "warning" : "safe"}>{isLoading ? "laden" : `${spells.length} spells`}</Tag>
          <button className="button button--ghost" type="button" onClick={() => selectedSpell && copySpell(selectedSpell)}>
            <Copy size={17} /> Kopieer huidige
          </button>
        </div>
      </header>

      <section className="spell-sheet-layout">
        <Panel title="Spell zoeken" action={<Tag>{filteredSpells.length} zichtbaar</Tag>}>
          <div className="spell-search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek op naam, class, school, effect, component..."
            />
          </div>

          <div className="spell-filter-grid">
            <label>
              <span>Level</span>
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
                <option value="all">Alle levels</option>
                {levelOptions.map((level) => (
                  <option key={level} value={level}>{formatSpellLevel(level)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Class</span>
              <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                <option value="all">Alle classes</option>
                {spellClasses.map((spellClass) => <option key={spellClass}>{spellClass}</option>)}
              </select>
            </label>
            <label>
              <span>School</span>
              <select value={schoolFilter} onChange={(event) => setSchoolFilter(event.target.value)}>
                <option value="all">Alle schools</option>
                {spellSchools.map((school) => <option key={school}>{school}</option>)}
              </select>
            </label>
            <label className="spell-check-filter">
              <input type="checkbox" checked={onlyConcentration} onChange={(event) => setOnlyConcentration(event.target.checked)} />
              <span>Concentration</span>
            </label>
            <label className="spell-check-filter">
              <input type="checkbox" checked={onlyRitual} onChange={(event) => setOnlyRitual(event.target.checked)} />
              <span>Ritual</span>
            </label>
          </div>

          {error ? <p className="monster-source-warning">{error}</p> : null}

          <div className="spell-source-notes">
            {spellSheetNotes.map((note) => <span key={note}>{note}</span>)}
          </div>

          <div className="spell-result-list">
            {filteredSpells.length ? (
              filteredSpells.map((spell) => (
                <button
                  className={selectedSpell?.index === spell.index ? "spell-result spell-result--active" : "spell-result"}
                  key={spell.index}
                  type="button"
                  onClick={() => selectSpell(spell)}
                >
                  <span>
                    <strong>{spell.name}</strong>
                    <small>{formatSpellLevel(spell.level)} / {spell.school || "school laden"} / {(spell.classes || []).slice(0, 3).join(", ") || "classes laden"}</small>
                  </span>
                  <Tag tone={spellTone(spell)}>
                    {spell.concentration ? "Conc." : spell.ritual ? "Ritual" : spell.castingTime || "Spell"}
                  </Tag>
                </button>
              ))
            ) : (
              <EmptyState>Geen spells gevonden met deze filters.</EmptyState>
            )}
          </div>
        </Panel>

        <Panel title="Spell detail" className="spell-detail-panel">
          <SpellDetail spell={selectedSpell} loading={loadingDetail} />
        </Panel>

        <aside className="spell-quick-panel">
          <Panel title="Combat lens">
            <div className="spell-combat-lens">
              <article>
                <Sparkles size={17} />
                <div>
                  <strong>Actie-economie eerst</strong>
                  <span>Filter op casting time via zoeken: action, bonus action, reaction.</span>
                </div>
              </article>
              <article>
                <BookOpenCheck size={17} />
                <div>
                  <strong>Concentration check</strong>
                  <span>Gebruik de concentration filter om snel te zien wat elkaar uitsluit.</span>
                </div>
              </article>
            </div>
          </Panel>

          <Panel title="Snelle picks">
            <div className="spell-pick-list">
              {fallbackSpellLibrary.slice(0, 7).map((spell) => (
                <button key={spell.index} type="button" onClick={() => selectSpell(spell)}>
                  <strong>{spell.name}</strong>
                  <span>{formatSpellLevel(spell.level)} / {spell.school}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Private import">
            <div className="spell-private-import">
              <textarea
                value={customImportText}
                onChange={(event) => setCustomImportText(event.target.value)}
                placeholder='Plak JSON, bijvoorbeeld: [{"name":"My Spell","level":2,"school":"Illusion","castingTime":"1 action","range":"60 ft","duration":"1 minute","classes":["Wizard"],"desc":["Effect tekst..."]}]'
              />
              <div>
                <button className="button button--primary" type="button" onClick={importCustomSpells}>
                  Import lokaal
                </button>
                <button className="button button--ghost" type="button" onClick={clearCustomSpells}>
                  Wis imports
                </button>
              </div>
              <span>{customSpells.length} private spells opgeslagen.</span>
              {customImportStatus ? <p>{customImportStatus}</p> : null}
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}
