import { useMemo, useState } from "react";
import { Copy, Gem, LoaderCircle, RefreshCcw, Search, Sparkles, Store } from "lucide-react";
import {
  customMagicItemStorageKey,
  magicItemRarities,
  magicItemTypes,
} from "../data/systems/magicItemLibrary.js";
import { fetchSrdMagicItemDetail, fetchSrdMagicItemIndex } from "../utils/magicItems.js";
import { useCompendiumEntries } from "../utils/useCompendiumEntries.js";
import { EmptyState, Panel, Tag } from "./ui.jsx";

const locations = [
  { id: "thorp", label: "Thorp", count: 3, price: 1.18, weights: { Common: 8, Uncommon: 2 } },
  { id: "hamlet", label: "Hamlet", count: 4, price: 1.12, weights: { Common: 7, Uncommon: 3 } },
  { id: "village", label: "Village", count: 6, price: 1.06, weights: { Common: 6, Uncommon: 4, Rare: 1 } },
  { id: "small-town", label: "Small Town", count: 8, price: 1, weights: { Common: 5, Uncommon: 5, Rare: 2 } },
  { id: "large-town", label: "Large Town", count: 10, price: 0.96, weights: { Common: 4, Uncommon: 5, Rare: 3, "Very Rare": 1 } },
  { id: "small-city", label: "Small City", count: 12, price: 0.92, weights: { Common: 4, Uncommon: 5, Rare: 4, "Very Rare": 2 } },
  { id: "large-city", label: "Large City", count: 14, price: 0.88, weights: { Common: 3, Uncommon: 5, Rare: 4, "Very Rare": 2, Legendary: 1 } },
  { id: "metropolis", label: "Metropolis", count: 16, price: 0.84, weights: { Common: 3, Uncommon: 5, Rare: 5, "Very Rare": 3, Legendary: 1 } },
  { id: "port-nyanzaru", label: "Port Nyanzaru", count: 11, price: 1.05, weights: { Common: 4, Uncommon: 5, Rare: 3, "Very Rare": 1 } },
  { id: "expedition", label: "Jungle Expedition", count: 6, price: 1.22, weights: { Common: 5, Uncommon: 4, Rare: 2 } },
];

const shopTypes = [
  { id: "trader", label: "Trader", types: magicItemTypes, vibe: "chaotische planken, ruilwaar en dubieuze garanties" },
  { id: "armorer", label: "Armorer", types: ["Armor", "Wondrous Item", "Ring"], vibe: "geolied leer, koperwerk en meetlinten aan de muur" },
  { id: "weaponsmith", label: "Weaponsmith", types: ["Weapon", "Wand", "Rod"], vibe: "vonken, wetstenen en wapens achter slot" },
  { id: "alchemist", label: "Alchemist", types: ["Potion", "Wondrous Item"], vibe: "sterke geuren, gekleurde flessen en brandplekken op hout" },
  { id: "scribe", label: "Scribe", types: ["Scroll", "Wondrous Item"], vibe: "droge inkt, catalogi en contracten in te kleine letters" },
  { id: "wandwright", label: "Wandwright", types: ["Wand", "Rod", "Staff"], vibe: "geladen hout, koperen spoelen en licht trillende vitrines" },
  { id: "relic-broker", label: "Relic Broker", types: ["Wondrous Item", "Ring", "Rod", "Weapon"], vibe: "stille vitrines, verzegelde kisten en bewaakte achterkamers" },
];

const rarityModes = [
  { id: "by-location", label: "By location" },
  ...magicItemRarities.map((rarity) => ({ id: rarity, label: rarity })),
];

const basePrices = {
  Common: 55,
  Uncommon: 275,
  Rare: 2750,
  "Very Rare": 28000,
  Legendary: 125000,
  Artifact: 0,
  Varies: 350,
  Unknown: 150,
};

const shopNameBits = {
  first: ["Gilded", "Moonlit", "Copper", "Whispering", "Sevenfold", "Amber", "Hidden", "Ivory", "Stormglass", "Velvet"],
  second: ["Reliquary", "Satchel", "Anvil", "Cabinet", "Lantern", "Coffer", "Compass", "Sigil", "Menagerie", "Exchange"],
};

const keepers = [
  "Azima's cousin with too many ledgers",
  "a calm Chultan appraiser with gold-dusted nails",
  "a retired guide who only accepts coin after a story",
  "a kenku broker who repeats the last buyer's worst lie",
  "a sweating Thayan defector pretending not to be terrified",
  "a tabaxi collector who prices memories higher than gems",
];

const complications = [
  "A Red Wizard agent asked about the same item yesterday.",
  "One item is cursed, but only the shopkeeper knows which.",
  "The best item is not for sale unless the party shares expedition news.",
  "A Merchant Prince tax seal is missing from the shop records.",
  "The shopkeeper recognizes Cobra Kai and quietly raises the price.",
  "A black-night reflection shows one item lying in a different place.",
];

const hooks = [
  "They need a courier to Firefinger before dawn.",
  "They want a recovered jungle idol identified before selling the rare stock.",
  "They offer a discount for news about Zorath's route.",
  "They ask whether William's mirror blade has spoken lately.",
  "They have a locked case marked with a vanished Jungle Elf script.",
  "They want a private meeting away from the Merchant Princes.",
];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function rollWeighted(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return entries[0]?.[0] || "Common";
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
    tags: Array.isArray(item.tags) ? item.tags : [],
    notes: item.notes || "",
    desc: Array.isArray(item.desc) ? item.desc : [item.desc || item.description || ""].filter(Boolean),
    properties: Array.isArray(item.properties) ? item.properties : [],
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

function mergeItems(current, incoming) {
  const byIndex = new Map(current.map((item) => [item.index, item]));
  incoming.forEach((item) => byIndex.set(item.index, { ...(byIndex.get(item.index) || {}), ...item }));
  return Array.from(byIndex.values());
}

function isCampaignItem(item) {
  return String(item.source || "").toLowerCase().includes("campaign");
}

function priceFor(item, location, discountMode) {
  const base = basePrices[item.rarity] ?? basePrices.Unknown;
  if (!base) return "Priceless";
  const variance = 0.78 + Math.random() * 0.58;
  const discount = discountMode === "friendly" ? 0.86 : discountMode === "hostile" ? 1.24 : 1;
  const value = Math.round(base * location.price * variance * discount);
  return `${value.toLocaleString("nl-NL")} gp`;
}

function generateShop({ itemPool, location, shopType, rarityMode, includeCampaignRelics, discountMode }) {
  const allowedPool = itemPool.filter((item) => includeCampaignRelics || !isCampaignItem(item));
  const typePool = allowedPool.filter((item) => shopType.types.includes(item.type));
  const basePool = typePool.length >= 3 ? typePool : allowedPool;
  const picked = [];
  const used = new Set();
  const targetCount = location.count;

  for (let attempt = 0; attempt < targetCount * 12 && picked.length < targetCount; attempt += 1) {
    const targetRarity = rarityMode === "by-location" ? rollWeighted(location.weights) : rarityMode;
    const rarityPool = basePool.filter((item) => item.rarity === targetRarity && !used.has(item.index));
    const fallbackPool = basePool.filter((item) => !used.has(item.index));
    const item = randomItem(rarityPool.length ? rarityPool : fallbackPool);
    if (!item) break;
    used.add(item.index);
    picked.push({
      ...item,
      price: priceFor(item, location, discountMode),
      shelf: item.rarity === "Very Rare" || item.rarity === "Legendary" ? "Back room" : item.attunement ? "Locked case" : "Front shelf",
      availability: item.rarity === "Legendary" || item.rarity === "Artifact" ? "not openly for sale" : item.rarity === "Very Rare" ? "requires favor" : "for sale",
    });
  }

  return {
    id: `shop-${Date.now()}`,
    name: `The ${randomItem(shopNameBits.first)} ${randomItem(shopNameBits.second)}`,
    keeper: randomItem(keepers),
    vibe: shopType.vibe,
    complication: randomItem(complications),
    hook: randomItem(hooks),
    location: location.label,
    shopType: shopType.label,
    stock: picked,
  };
}

function copyShop(shop) {
  if (!shop) return;
  const payload = [
    `${shop.name} - ${shop.shopType} (${shop.location})`,
    `Keeper: ${shop.keeper}`,
    `Vibe: ${shop.vibe}`,
    `Hook: ${shop.hook}`,
    `Complication: ${shop.complication}`,
    "",
    ...shop.stock.map((item) => `- ${item.name} (${item.rarity}, ${item.type}) - ${item.price} - ${item.availability}`),
  ].join("\n");
  navigator.clipboard?.writeText(payload);
}

export function MagicShopGenerator() {
  const compendiumItems = useCompendiumEntries("magicItems");
  const [locationId, setLocationId] = useState("port-nyanzaru");
  const [shopTypeId, setShopTypeId] = useState("trader");
  const [rarityMode, setRarityMode] = useState("by-location");
  const [discountMode, setDiscountMode] = useState("normal");
  const [includeCampaignRelics, setIncludeCampaignRelics] = useState(false);
  const [onlineItems, setOnlineItems] = useState([]);
  const [loadState, setLoadState] = useState("idle");
  const [error, setError] = useState("");
  const [shop, setShop] = useState(null);

  const customItems = useMemo(() => loadCustomItems(), []);
  const itemPool = useMemo(
    () => mergeItems(mergeItems(compendiumItems, customItems), onlineItems),
    [compendiumItems, customItems, onlineItems]
  );
  const location = locations.find((item) => item.id === locationId) || locations[0];
  const shopType = shopTypes.find((item) => item.id === shopTypeId) || shopTypes[0];

  async function loadOpenInventory() {
    setError("");
    setLoadState("loading");
    try {
      const index = await fetchSrdMagicItemIndex();
      const shuffled = [...index].sort(() => Math.random() - 0.5).slice(0, 42);
      const details = await Promise.all(shuffled.map((item) => fetchSrdMagicItemDetail(item)));
      setOnlineItems((current) => mergeItems(current, details));
      setLoadState("loaded");
    } catch (loadError) {
      setError(loadError.message || "Open voorraad kon niet geladen worden.");
      setLoadState("error");
    }
  }

  function rollShop() {
    const nextShop = generateShop({
      itemPool,
      location,
      shopType,
      rarityMode,
      includeCampaignRelics,
      discountMode,
    });
    setShop(nextShop);
  }

  return (
    <main className="workspace magic-shop-page">
      <header className="topbar magic-shop-header">
        <div>
          <p className="label">Magic Shop Generator</p>
          <h1>Maak direct een bruikbare shop</h1>
          <span>Locatie, shoptype, stock, prijzen, shopkeeper, hook en complicatie in één worp.</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" type="button" onClick={loadOpenInventory} disabled={loadState === "loading"}>
            {loadState === "loading" ? <LoaderCircle size={17} /> : <Search size={17} />} Laad open voorraad
          </button>
          <button className="button button--primary" type="button" onClick={rollShop}>
            <Sparkles size={18} /> Genereer shop
          </button>
        </div>
      </header>

      <section className="magic-shop-layout">
        <Panel title="Generator controls" action={<Tag>{itemPool.length} items in pool</Tag>}>
          <div className="magic-shop-controls">
            <label>
              <span>Location</span>
              <select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                {locations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Shop type</span>
              <select value={shopTypeId} onChange={(event) => setShopTypeId(event.target.value)}>
                {shopTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Rarity</span>
              <select value={rarityMode} onChange={(event) => setRarityMode(event.target.value)}>
                {rarityModes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>Disposition</span>
              <select value={discountMode} onChange={(event) => setDiscountMode(event.target.value)}>
                <option value="normal">Normal prices</option>
                <option value="friendly">Friendly discount</option>
                <option value="hostile">Suspicious markup</option>
              </select>
            </label>
            <label className="magic-shop-check">
              <input
                type="checkbox"
                checked={includeCampaignRelics}
                onChange={(event) => setIncludeCampaignRelics(event.target.checked)}
              />
              <span>Campaign relics mogen in stock verschijnen</span>
            </label>
          </div>
          {error ? <p className="monster-source-warning">{error}</p> : null}
          <div className="magic-shop-source-notes">
            <span>Private imports uit je Magic Item Vault tellen automatisch mee.</span>
            <span>Campaign relics staan standaard uit, zodat PC-items niet per ongeluk als winkelwaar verschijnen.</span>
          </div>
        </Panel>

        <Panel
          title={shop ? shop.name : "Shop output"}
          action={shop ? <button className="button button--ghost" type="button" onClick={() => copyShop(shop)}><Copy size={16} /> Kopieer shop</button> : null}
          className="magic-shop-output-panel"
        >
          {shop ? (
            <article className="magic-shop-output">
              <header>
                <div>
                  <span>{shop.shopType} / {shop.location}</span>
                  <h2>{shop.name}</h2>
                </div>
                <Tag tone="safe">{shop.stock.length} items</Tag>
              </header>
              <div className="magic-shop-brief">
                <p><strong>Shopkeeper</strong><span>{shop.keeper}</span></p>
                <p><strong>Sfeer</strong><span>{shop.vibe}</span></p>
                <p><strong>Hook</strong><span>{shop.hook}</span></p>
                <p><strong>Complicatie</strong><span>{shop.complication}</span></p>
              </div>
              <div className="magic-shop-stock-list">
                {shop.stock.map((item) => (
                  <article key={`${shop.id}-${item.index}`}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.rarity} / {item.type} / {item.shelf}</span>
                    </div>
                    <div className="magic-shop-stock-meta">
                      <Tag tone={item.attunement ? "warning" : "safe"}>{item.attunement ? "Attune" : "Ready"}</Tag>
                      <strong>{item.price}</strong>
                    </div>
                    <p>{item.availability}</p>
                  </article>
                ))}
              </div>
            </article>
          ) : (
            <EmptyState>Kies locatie en shoptype, laad eventueel open voorraad, en genereer een shop.</EmptyState>
          )}
        </Panel>

        <aside className="magic-shop-side">
          <Panel title="Shop lens">
            <div className="magic-shop-lens">
              <article>
                <Store size={17} />
                <div>
                  <strong>Prijs is een verhaalhaak</strong>
                  <span>Een duur item kan goedkoper worden met favor, informatie of risico.</span>
                </div>
              </article>
              <article>
                <Gem size={17} />
                <div>
                  <strong>Zeldzaamheid is toegang</strong>
                  <span>Very Rare+ verschijnt vaker achter voorwaarden dan als gewone stock.</span>
                </div>
              </article>
              <article>
                <RefreshCcw size={17} />
                <div>
                  <strong>Reroll zonder stress</strong>
                  <span>Genereer opnieuw tot de shop aanvoelt als jouw scene.</span>
                </div>
              </article>
            </div>
          </Panel>

          <Panel title="Pool summary">
            <div className="magic-shop-pool">
              <span>Local compendium: {compendiumItems.length}</span>
              <span>Private imports: {customItems.length}</span>
              <span>Open loaded: {onlineItems.length}</span>
              <span>Type bias: {shopType.types.join(", ")}</span>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}
