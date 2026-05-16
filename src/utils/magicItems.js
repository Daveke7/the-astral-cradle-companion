const DND_API_ROOT = "https://www.dnd5eapi.co";
const DND_API_2014 = `${DND_API_ROOT}/api/2014`;

function normalizeTextList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [String(value)];
}

function normalizeName(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || "";
}

function inferAttunement(item) {
  if (typeof item.attunement === "boolean") return item.attunement;
  const joined = normalizeTextList(item.desc).join(" ").toLowerCase();
  return joined.includes("requires attunement");
}

function inferType(item) {
  return (
    normalizeName(item.type) ||
    normalizeName(item.equipment_category) ||
    normalizeName(item.gear_category) ||
    normalizeName(item.weapon_category) ||
    "Magic Item"
  );
}

function inferRarity(item) {
  return normalizeName(item.rarity) || item.rarity || "Unknown";
}

export function normalizeApiMagicItem(item = {}) {
  const desc = normalizeTextList(item.desc);
  const type = inferType(item);
  const rarity = inferRarity(item);
  return {
    index: item.index || item.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `magic-item-${Date.now()}`,
    name: item.name || "Onbekend magic item",
    source: "D&D 5e SRD API",
    type,
    rarity,
    attunement: inferAttunement(item),
    tags: [type, rarity, ...(inferAttunement(item) ? ["attunement"] : [])].filter(Boolean),
    notes: "",
    desc,
    properties: [
      ...(Array.isArray(item.properties) ? item.properties.map(normalizeName) : []),
      ...(Array.isArray(item.contents) ? item.contents.map((content) => content?.item?.name || "").filter(Boolean) : []),
    ],
    damage: item.damage?.damage_dice || "",
    weight: item.weight ? `${item.weight} lb` : "",
  };
}

export async function fetchSrdMagicItemIndex() {
  const response = await fetch(`${DND_API_2014}/magic-items`);
  if (!response.ok) throw new Error("Kon de SRD magic item-lijst niet laden.");
  const payload = await response.json();
  return (payload.results || []).map((item) => ({
    index: item.index,
    name: item.name,
    source: "D&D 5e SRD API",
    apiUrl: item.url?.startsWith("http") ? item.url : `${DND_API_ROOT}${item.url}`,
    type: "Magic Item",
    rarity: "Unknown",
    attunement: false,
    tags: ["online"],
    desc: [],
    properties: [],
  }));
}

export async function fetchSrdMagicItemDetail(item) {
  if (item?.desc?.length) return item;
  const url = item?.apiUrl || `${DND_API_2014}/magic-items/${item.index}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Kon ${item?.name || "magic item"} niet laden.`);
  return normalizeApiMagicItem(await response.json());
}

export function magicItemSearchText(item) {
  return [
    item.name,
    item.type,
    item.rarity,
    item.source,
    item.notes,
    ...(item.tags || []),
    ...(item.properties || []),
    ...(item.desc || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
