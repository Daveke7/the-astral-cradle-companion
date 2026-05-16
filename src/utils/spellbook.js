const DND_API_ROOT = "https://www.dnd5eapi.co";
const DND_API_2014 = `${DND_API_ROOT}/api/2014`;

function normalizeTextList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [String(value)];
}

function normalizeComponents(components) {
  return Array.isArray(components) ? components : [];
}

function normalizeSpellLevel(level) {
  return Number(level || 0);
}

function normalizeSchool(school) {
  if (typeof school === "string") return school;
  return school?.name || "";
}

function normalizeClasses(classes = []) {
  return classes.map((item) => item?.name || item).filter(Boolean);
}

export function normalizeApiSpell(spell = {}) {
  return {
    index: spell.index || spell.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `spell-${Date.now()}`,
    name: spell.name || "Onbekende spell",
    source: "D&D 5e SRD API",
    level: normalizeSpellLevel(spell.level),
    school: normalizeSchool(spell.school),
    castingTime: spell.casting_time || spell.castingTime || "",
    range: spell.range || "",
    components: normalizeComponents(spell.components),
    material: spell.material || "",
    duration: spell.duration || "",
    concentration: Boolean(spell.concentration),
    ritual: Boolean(spell.ritual),
    classes: normalizeClasses(spell.classes),
    tags: [
      normalizeSchool(spell.school),
      ...(spell.concentration ? ["concentration"] : []),
      ...(spell.ritual ? ["ritual"] : []),
      ...normalizeClasses(spell.classes),
    ].filter(Boolean),
    desc: normalizeTextList(spell.desc),
    higherLevel: normalizeTextList(spell.higher_level || spell.higherLevel),
  };
}

export async function fetchSrdSpellIndex() {
  const response = await fetch(`${DND_API_2014}/spells`);
  if (!response.ok) throw new Error("Kon de SRD spell-lijst niet laden.");
  const payload = await response.json();
  return (payload.results || []).map((item) => ({
    index: item.index,
    name: item.name,
    source: "D&D 5e SRD API",
    apiUrl: item.url?.startsWith("http") ? item.url : `${DND_API_ROOT}${item.url}`,
    level: normalizeSpellLevel(item.level),
    school: "",
    classes: [],
    tags: ["online"],
  }));
}

export async function fetchSrdClassSpells(className) {
  const classIndex = String(className || "").toLowerCase();
  const response = await fetch(`${DND_API_2014}/classes/${classIndex}/spells`);
  if (!response.ok) throw new Error(`Kon ${className} spells niet laden.`);
  const payload = await response.json();
  return (payload.results || []).map((item) => ({
    index: item.index,
    name: item.name,
    source: "D&D 5e SRD API",
    apiUrl: item.url?.startsWith("http") ? item.url : `${DND_API_ROOT}${item.url}`,
    level: normalizeSpellLevel(item.level),
    school: "",
    classes: [className],
    tags: ["online", className],
  }));
}

export async function fetchSrdSpellDetail(spell) {
  if (spell?.desc?.length) return spell;
  const url = spell?.apiUrl || `${DND_API_2014}/spells/${spell.index}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Kon ${spell?.name || "spell"} niet laden.`);
  return normalizeApiSpell(await response.json());
}

export function spellSearchText(spell) {
  return [
    spell.name,
    spell.school,
    spell.source,
    spell.level,
    spell.castingTime,
    spell.range,
    ...(spell.classes || []),
    ...(spell.tags || []),
    ...(spell.desc || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function formatSpellLevel(level) {
  const numericLevel = Number(level || 0);
  if (numericLevel === 0) return "Cantrip";
  if (numericLevel === 1) return "1st";
  if (numericLevel === 2) return "2nd";
  if (numericLevel === 3) return "3rd";
  return `${numericLevel}th`;
}
