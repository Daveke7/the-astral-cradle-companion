const DEFAULT_NEGATIVE_PROMPT = [
  "3d",
  "3d render",
  "CGI",
  "zbrush",
  "blender",
  "unreal engine",
  "toy",
  "action figure",
  "miniature photography",
  "tabletop miniature",
  "plastic",
  "glossy",
  "resin",
  "resin shine",
  "shiny eyes",
  "plastic eyes",
  "glassy eyes",
  "photoreal",
  "studio lighting",
  "background",
  "detailed background",
  "scenery",
  "landscape",
  "environment",
  "terrain",
  "floor",
  "ground",
  "rocks",
  "grass",
  "trees",
  "dungeon",
  "ruins",
  "sky",
  "horizon",
  "cast shadow",
  "shadowed backdrop",
  "gradient background",
  "gray background",
  "grey background",
  "yellow background",
  "beige background",
  "pedestal",
  "base",
  "display base",
  "miniature base",
  "platform",
  "plinth",
  "diorama",
  "standing on a base",
  "nameplate",
  "label",
  "caption",
  "statblock",
  "trading card",
  "border",
  "frame",
  "watermark",
  "vignette",
  "readable text",
  "letters",
  "logos",
  "ui",
  "hud",
  "minimap",
  "cartoon",
  "anime",
  "chibi",
  "pixel art",
  "low poly",
  "blurry",
  "low detail",
  "cropped",
  "cut off feet",
  "partial body",
  "portrait only",
  "bust",
  "extra characters",
  "crowd",
  "multiple creatures",
  "graphic gore",
  "dismemberment",
].join(", ");

const STYLE_LINE = [
  "isolated single subject only",
  "entire body or complete silhouette visible, including feet, tail, horns, natural appendages and explicitly carried gear if present",
  "centered with generous white space",
  "not standing on any base, floor, pedestal, platform, terrain, or shadow",
  "hand-painted fantasy RPG illustration",
  "classic 1980s painted fantasy art style",
  "highly detailed",
  "crisp linework and painted shading",
  "clean pure white background with no scenery and no text",
].join(", ");

const ROLE_POSES = {
  artillery: "held in a focused ranged combat stance, silhouette built for distance and precision",
  brute: "massive imposing action stance, weight forward, built to claim space and smash through resistance",
  controller: "commanding occult action pose, one hand raised as if shaping invisible magical pressure",
  leader: "dominant command stance, calm and dangerous, clearly directing lesser threats",
  minion: "compact aggressive pose, ready to swarm in with simple brutal intent",
  skirmisher: "dynamic flanking action pose, body twisted mid-motion as if circling prey",
  soldier: "balanced battle-ready stance, guarded and disciplined, body, natural attacks, magic, or limbs prepared",
};

const TYPE_HINTS = {
  beast: "natural predator anatomy, believable muscle, scales, fur, feathers or hide where appropriate",
  construct: "ancient crafted body, worn materials, arcane details, heavy silhouette",
  dragon: "draconic anatomy, powerful wings or serpentine mass, ancient menace",
  elemental: "living elemental body, supernatural texture, fire, water, stone, air or ash details",
  fey: "uncanny faerie presence, elegant but dangerous magical features",
  fiend: "infernal or abyssal silhouette, cruel features, dark supernatural presence",
  giant: "towering humanoid mass, exaggerated strength, weathered wilderness details",
  humanoid: "fantasy character design, expressive face, practical gear, readable silhouette",
  monstrosity: "strange monstrous anatomy, predatory silhouette, unnatural but believable body plan",
  ooze: "viscous amorphous body, wet translucent mass, dangerous organic texture",
  plant: "animated plant monster body, vines, petals, bark, thorns, predatory vegetation",
  undead: "death-touched fantasy horror creature, decayed but readable body, haunted silhouette",
};

const SOURCE_WORD_PATTERNS = [
  /\bdnd\b/gi,
  /\bd&d\b/gi,
  /\bdungeons?\s*&?\s*dragons?\b/gi,
  /\b5e\b/gi,
  /\bsrd\b/gi,
  /\bjson\b/gi,
  /\bpdf\b/gi,
  /\bcsv\b/gi,
  /\btkfu\b/gi,
  /\bgist\b/gi,
  /\bmonsters?\.json\b/gi,
  /\bdnd_monsters\.csv\b/gi,
  /\bmonster manual\b/gi,
  /\bvolo'?s guide to monsters\b/gi,
  /\bmordenkainen'?s tome of foes\b/gi,
  /\bmonsters of the multiverse\b/gi,
  /\bfizban'?s treasury of dragons\b/gi,
  /\btasha.?s cauldron of everything\b/gi,
  /\bxanathar.?s guide to everything\b/gi,
  /\btomb of annihilation\b/gi,
  /\badventures?\b/gi,
  /\brules?\b/gi,
  /\bsource link\b/gi,
  /\bbr\+?\b/gi,
];

const FAMILY_VISUAL_HINTS = [
  [/aboleth/i, "ancient eel-like aberration, broad fishlike head, slick mucus-coated skin, long tentacles, heavy tail"],
  [/aarakocra/i, "birdfolk humanoid with feathered wings, taloned feet, avian head and light warrior gear"],
  [/beholder|spectator/i, "floating orb monster, central eye, many eyestalks, toothy mouth"],
  [/mind flayer|illithid/i, "gaunt humanoid with squid-like face tentacles, high-collared robes, alien posture"],
  [/owlbear/i, "massive bear body with owl head, hooked beak, dense feathers and fur"],
  [/displacer beast/i, "sleek panther-like monster with six legs and long barbed shoulder tentacles"],
  [/gelatinous cube/i, "transparent cubic ooze body, suspended debris shapes inside, glassy slime edges"],
  [/mimic/i, "living treasure chest creature with teeth, tongue, sticky pseudopods and wooden shell"],
  [/rust monster/i, "low insectoid beast with chitin plates, long antennae and rust-colored hide"],
  [/\bboar\b/i, "wild boar anatomy, heavy bristled body, powerful shoulders, tusks and hooves"],
  [/\btiger\b/i, "large striped feline predator, muscular body, claws and fangs"],
  [/\bape\b|\bgorilla\b/i, "powerful primate body, long arms, heavy shoulders and expressive face"],
  [/bulette/i, "armored land-shark monster, heavy plated head, huge jaws, digging claws"],
  [/otyugh/i, "lumpy sewer monster with three legs, tentacles, eyestalk and toothy maw"],
  [/umber hulk/i, "hulking insectoid burrower, hooked claws, mandibles, layered chitin"],
  [/pterafolk/i, "lean winged reptilian humanoid, pterosaur head, leathery wings, clawed hands and feet"],
  [/pteranodon|quetzalcoatlus/i, "large flying pterosaur body, long beak, leathery wings fully spread"],
  [/yuan[- ]?ti/i, "serpentine humanoid, snake eyes, scaled skin, elegant cruel posture"],
  [/grung/i, "small frog-like humanoid, slick bright skin, wide mouth, webbed hands and feet"],
  [/tabaxi/i, "catlike humanoid, feline face, lithe body, tail and agile adventuring gear"],
  [/lizardfolk/i, "reptilian humanoid, scaled hide, long tail, toothy snout, primitive weaponry"],
  [/goblin|batiri/i, "small wiry goblinoid, sharp ears, painted mask or crude jungle gear"],
  [/kobold/i, "small draconic humanoid, snout, horns, tail, nervous aggressive stance"],
  [/troll/i, "tall lanky giant-like monster, long arms, rubbery hide, hooked claws, regenerating horror feel"],
  [/skeleton/i, "animated skeleton, exposed bones, hollow eye sockets, old weapon or broken armor"],
  [/zombie/i, "shambling corpse, torn clothing, slack posture, decayed skin without graphic gore"],
  [/ghoul|ghast/i, "feral undead humanoid, hunched posture, long claws, corpse-pale skin"],
  [/wight/i, "ancient armored undead warrior, sunken face, cold intelligent eyes"],
  [/wraith|specter|ghost/i, "translucent floating undead figure, ragged trailing form, hollow face"],
  [/vampire/i, "pale aristocratic undead, predatory elegance, sharp features, refined clothing"],
  [/lich/i, "skeletal undead spellcaster, ancient robes, jewel-like eyes, arcane hand gesture"],
  [/\b(?:ancient|adult|young)?\s*(?:black|blue|green|red|white|gold|silver|bronze|brass|copper|crystal|emerald|amethyst|sapphire|topaz)?\s*dragon\b|\bfaerie dragon\b|\bdragon turtle\b|\bwyrmling\b/i, "four-legged winged dragon, long tail, horns, claws, powerful neck and sweeping wings"],
  [/wyvern/i, "two-legged draconic predator, batlike wings, barbed tail, narrow aggressive head"],
  [/drake/i, "grounded draconic beast, heavy claws, scaled hide, muscular low stance"],
  [/dinosaur|allosaurus|ankylosaurus|brontosaurus|deinonychus|hadrosaurus|stegosaurus|triceratops|tyrannosaurus|velociraptor/i, "prehistoric reptilian body, powerful legs, natural scales, distinct dinosaur silhouette"],
  [/spider/i, "large arachnid body, eight legs, glossy eyes, sharp fangs, web-spinner abdomen"],
  [/scorpion/i, "chitinous scorpion body, pincers raised, segmented tail with stinger"],
  [/snake|constrictor|viper|cobra/i, "serpentine body, scaled coils, alert head, forked tongue"],
  [/crocodile|alligator/i, "low armored reptile, long jaws, heavy tail, rough plated hide"],
  [/frog|toad/i, "wide amphibian body, powerful hind legs, wet skin, bulging eyes"],
  [/wasp|bee|hornet/i, "insectoid body, translucent wings, striped abdomen, sharp stinger"],
  [/centipede/i, "long segmented insectoid body with many legs and venomous mandibles"],
  [/elemental/i, "humanoid elemental silhouette made from living natural force instead of flesh"],
  [/golem/i, "heavy animated construct, massive fists, carved or forged body"],
  [/animated armor/i, "empty suit of armor moving by magic, no visible person inside"],
  [/assassin vine|vine|creeper/i, "predatory plant creature made of twisting vines, thorns and grasping tendrils"],
  [/shambling mound/i, "hulking walking mass of vines, roots, moss and wet vegetation"],
  [/myconid|fungus|spore/i, "fungal humanoid or mushroom creature, cap-like head, spore textures"],
  [/imp|devil/i, "small infernal fiend, horns, bat wings, barbed tail, malicious grin"],
  [/demon/i, "chaotic fiend body, horns, claws, warped anatomy, savage posture"],
  [/angel|deva|planetar|solar/i, "celestial humanoid, luminous wings, serene dangerous posture"],
  [/\b(?:cloud|fire|frost|hill|stone|storm)\s+giant\b|\bogre\b|\bettin\b/i, "towering humanoid mass, exaggerated strength, weathered wilderness details"],
];

const ELEMENT_VISUAL_HINTS = [
  [/acid|corrosive/i, "acid-stained mouth, claws or breath details in sickly green tones"],
  [/fire|flame|burn|magma|lava|ignite/i, "ember-lit edges, cracked heat-glow details and scorched texture"],
  [/cold|frost|ice|winter/i, "frost-rimed details, icy breath and pale cold coloration"],
  [/lightning|thunder|storm/i, "subtle electric arcs around horns, claws or carried gear if present"],
  [/poison|venom|toxic/i, "venomous fangs or stinger, toxic green accents used sparingly"],
  [/necrotic|death|grave|shadow/i, "deathly pallor, shadow-touched edges and haunted eyes"],
  [/psychic|telepathy|charm|enslave/i, "hypnotic eyes and unsettling alien intelligence"],
  [/radiant|holy|divine/i, "soft golden glow along armor or wings if present"],
];

const BODY_PART_HINTS = [
  [/\b(?:wing|wings|winged|fly|flies|flying|flight)\b/i, "wings fully visible"],
  [/\b(?:horn|horns|horned)\b/i, "prominent horns"],
  [/\b(?:claw|claws|talon|talons)\b/i, "sharp claws or talons clearly visible"],
  [/\b(?:tentacle|tentacles)\b/i, "long tentacles clearly visible"],
  [/\b(?:tail|tails|tailed)\b/i, "tail fully visible"],
  [/\b(?:fang|fangs|bite|maw|jaws|teeth|toothy)\b/i, "dangerous teeth or jaws"],
  [/\b(?:beak|beaked)\b/i, "sharp beak"],
  [/\b(?:scale|scales|scaled|reptile|reptilian|serpent|serpentine)\b/i, "visible scales"],
  [/\b(?:fur|furry|pelt)\b/i, "textured fur"],
  [/\b(?:feather|feathers|feathered|plumage)\b/i, "detailed feathers"],
  [/\b(?:chitin|chitinous|carapace|shell|shelled)\b/i, "layered chitin or shell plates"],
  [/\b(?:slime|slimy|ooze|mucus|mucous)\b/i, "slick wet organic surface"],
  [/\b(?:robe|robes|spellcaster|spellcasting|wizard|mage|warlock|priest|cleric)\b/i, "distinct spellcaster clothing and arcane hand gesture"],
];

const HELD_GEAR_HINTS = [
  [/\b(?:sword|shortsword|longsword|greatsword|blade|scimitar|dagger|rapier|axe|battleaxe|greataxe|handaxe)\b/i, "blade weapon visibly held in hand"],
  [/\b(?:spear|javelin|trident|pike|glaive|halberd|lance)\b/i, "polearm or thrown spear visibly held in hand"],
  [/\b(?:bow|longbow|shortbow|crossbow|arrow|arrows|sling|dart)\b/i, "ranged weapon visibly held in hand"],
  [/\b(?:club|greatclub|mace|morningstar|hammer|warhammer|maul|flail|quarterstaff|staff)\b/i, "blunt weapon visibly held in hand"],
  [/\b(?:shield)\b/i, "shield visible only if held by the creature"],
];

const NATURAL_ONLY_NAME_PATTERN = /\b(?:boar|bear|wolf|tiger|lion|panther|ape|gorilla|crocodile|alligator|snake|viper|constrictor|spider|scorpion|centipede|wasp|frog|toad|dinosaur|allosaurus|ankylosaurus|brontosaurus|deinonychus|dimetrodon|hadrosaurus|plesiosaurus|pteranodon|quetzalcoatlus|stegosaurus|triceratops|tyrannosaurus|velociraptor|owlbear|displacer beast|bulette|rust monster|gelatinous cube|ooze|vine|creeper|shambling mound)\b/i;
const MANIPULATOR_NAME_PATTERN = /\b(?:aarakocra|pterafolk|yuan[- ]?ti|grung|goblin|kobold|lizardfolk|tabaxi|orc|hobgoblin|bugbear|gnoll|skeleton|zombie|wight|lich|vampire|mind flayer|illithid|duergar|drow|giant|ogre|ettin|troll|golem|animated armor|devil|demon|angel|deva|planetar|solar|mage|wizard|priest|acolyte|knight|guard|bandit|assassin|cultist|veteran|warrior|archer)\b/i;

function hashSeed(value = "") {
  const text = String(value || "monster");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return 30000 + (Math.abs(hash) % 60000);
}

function cleanWords(value = "") {
  return String(value || "")
    .replace(/\s+\d+$/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function stripSourceWords(value = "") {
  return SOURCE_WORD_PATTERNS.reduce((text, pattern) => text.replace(pattern, " "), String(value || ""))
    .replace(/\([^)]*(?:source|manual|srd|pdf|csv|json|br\+?)[^)]*\)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detailCorpus(monster = {}) {
  return unique([
    monster.name,
    monster.type,
    monster.role,
    ...(monster.traits || []).flatMap((entry) => [entry.name, entry.desc]),
    ...(monster.actions || []).flatMap((entry) => [entry.name, entry.desc, entry.damage]),
    ...(monster.bonusActions || []).flatMap((entry) => [entry.name, entry.desc]),
    ...(monster.reactions || []).flatMap((entry) => [entry.name, entry.desc]),
    ...(monster.legendaryActions || []).flatMap((entry) => [entry.name, entry.desc]),
  ])
    .join(" ")
    .toLowerCase();
}

function elementCorpus(monster = {}) {
  return unique([
    monster.name,
    monster.type,
    ...(monster.traits || []).map((entry) => entry.name),
    ...(monster.actions || []).flatMap((entry) => [entry.name, entry.damage]),
    ...(monster.bonusActions || []).flatMap((entry) => [entry.name, entry.damage]),
    ...(monster.reactions || []).flatMap((entry) => [entry.name, entry.damage]),
    ...(monster.legendaryActions || []).flatMap((entry) => [entry.name, entry.damage]),
  ])
    .join(" ")
    .toLowerCase();
}

function actionNameCorpus(monster = {}) {
  return unique([
    ...(monster.actions || []).map((entry) => entry.name),
    ...(monster.bonusActions || []).map((entry) => entry.name),
    ...(monster.reactions || []).map((entry) => entry.name),
    ...(monster.legendaryActions || []).map((entry) => entry.name),
  ])
    .join(" ")
    .toLowerCase();
}

function lowerIncludes(value, term) {
  return String(value || "").toLowerCase().includes(term);
}

function roleKey(monster = {}) {
  const role = String(monster.role || "").toLowerCase();
  return Object.keys(ROLE_POSES).find((key) => role.includes(key)) || "soldier";
}

function visualRoleLabel(monster = {}) {
  const role = String(monster.role || "").toLowerCase();
  const explicitRole = Object.keys(ROLE_POSES).find((key) => role.includes(key));
  if (explicitRole) return explicitRole;
  const type = String(monster.type || "").toLowerCase();
  if (type.includes("humanoid") || type.includes("npc")) return "combatant";
  return "enemy creature";
}

function subjectKind(monster = {}) {
  const type = String(monster.type || "").toLowerCase();
  if (type.includes("humanoid") || type.includes("npc")) return "fantasy character";
  if (type.includes("undead")) return "undead fantasy creature";
  if (type.includes("beast")) return "fantasy creature";
  return "fantasy creature";
}

function isTrueDragonName(name = "") {
  const text = cleanWords(name).toLowerCase();
  if (/\bdragonshield\b|\bdragonborn\b/.test(text)) return false;
  return /\bdragon\b|\bwyrmling\b|\bdrake\b|\bwyvern\b/.test(text);
}

function typeHint(monster = {}) {
  const type = String(monster.type || "").toLowerCase();
  if (type.includes("dragon") && !isTrueDragonName(monster.name)) {
    return "draconic humanoid or dragon-blooded creature design, scaled features without a full dragon body";
  }
  const key = Object.keys(TYPE_HINTS).find((candidate) => type.includes(candidate));
  return key ? TYPE_HINTS[key] : "distinct readable silhouette, anatomy and gear matching its fantasy role";
}

function hasManipulators(monster = {}) {
  const type = String(monster.type || "").toLowerCase();
  const name = cleanWords(monster.name || "");
  return (
    type.includes("humanoid") ||
    type.includes("giant") ||
    type.includes("celestial") ||
    MANIPULATOR_NAME_PATTERN.test(name)
  );
}

function heldGearHints(monster = {}) {
  if (!hasManipulators(monster)) return [];
  const actionNames = actionNameCorpus(monster);
  return HELD_GEAR_HINTS.filter(([pattern]) => pattern.test(actionNames)).map(([, hint]) => hint);
}

function hasExplicitHeldGear(monster = {}) {
  return heldGearHints(monster).length > 0;
}

function shouldForbidHeldGear(monster = {}) {
  if (hasExplicitHeldGear(monster)) return false;
  const type = String(monster.type || "").toLowerCase();
  const name = cleanWords(monster.name || "");
  if (type.includes("beast") || type.includes("dragon") || type.includes("ooze") || type.includes("plant")) return true;
  if (NATURAL_ONLY_NAME_PATTERN.test(name)) return true;
  return false;
}

function gearPolicy(monster = {}) {
  if (hasExplicitHeldGear(monster)) return "show only the held weapon or shield explicitly named in its actions";
  if (shouldForbidHeldGear(monster)) return "no held weapons, no swords, no spears, no shields, no armor, no humanoid equipment";
  return "do not invent held weapons; show only gear clearly implied by the creature identity";
}

function negativePromptForMonster(monster = {}) {
  const extra = shouldForbidHeldGear(monster)
    ? "held weapon, sword, spear, bow, shield, armor, saddle, humanoid equipment"
    : "";
  return unique([DEFAULT_NEGATIVE_PROMPT, extra]).join(", ");
}

function campaignFlavor(monster = {}) {
  const text = unique([
    monster.name,
    monster.source,
    monster.type,
    monster.role,
    ...(monster.tags || []),
    ...(monster.environment || []),
  ])
    .join(" ")
    .toLowerCase();

  return [
    text.includes("chult") || text.includes("jungle") ? "jungle-weathered coloration, hide, feathers, scales or chitin without showing any jungle background" : "",
    text.includes("thay") || text.includes("red wizard") ? "sinister red-robed wizard details without symbols or readable text" : "",
    text.includes("firefinger") || text.includes("cliff") ? "high-roost wind-worn creature details without cliffs or scenery" : "",
    text.includes("undead") ? "ancient jungle undead horror mood in the body design only" : "",
  ].filter(Boolean);
}

function colorHintFromName(name = "") {
  const text = name.toLowerCase();
  const colorMap = [
    ["black", "black"],
    ["blue", "deep blue"],
    ["green", "deep green"],
    ["red", "red"],
    ["white", "pale white"],
    ["gold", "golden"],
    ["silver", "silver"],
    ["bronze", "bronze"],
    ["copper", "copper"],
    ["brass", "brass"],
    ["crystal", "crystalline"],
    ["emerald", "emerald green"],
    ["amethyst", "amethyst purple"],
    ["sapphire", "sapphire blue"],
    ["topaz", "topaz yellow"],
    ["shadow", "shadow-dark"],
  ].find(([needle]) => text.includes(needle));
  return colorMap ? `${colorMap[1]} coloration` : "";
}

function visualHintsFromText(monster = {}) {
  const name = cleanWords(monster.name || "");
  const corpus = detailCorpus(monster);
  const elements = elementCorpus(monster);
  const familyHints = FAMILY_VISUAL_HINTS.filter(([pattern, hint]) => {
    if (hint.includes("four-legged winged dragon") && !isTrueDragonName(name)) return false;
    return pattern.test(`${name} ${corpus}`);
  }).map(([, hint]) => hint);
  const elementHints = ELEMENT_VISUAL_HINTS.filter(([pattern]) => pattern.test(elements)).map(([, hint]) => hint);
  const bodyHints = BODY_PART_HINTS.filter(([pattern]) => pattern.test(corpus)).map(([, hint]) => hint);
  const gearHints = heldGearHints(monster);

  return unique([
    colorHintFromName(name),
    ...familyHints,
    ...bodyHints,
    ...gearHints,
    ...elementHints,
  ]).slice(0, 9);
}

function visualDescriptors(monster = {}) {
  return unique([
    stripSourceWords(monster.size),
    stripSourceWords(monster.type),
    typeHint(monster),
    ...visualHintsFromText(monster),
    ...campaignFlavor(monster),
  ])
    .map(stripSourceWords)
    .filter(Boolean)
    .slice(0, 12);
}

function enforceIsolation(prompt = "") {
  const text = stripSourceWords(prompt);
  const isolation = [
    "isolated single subject only",
    "pure white background",
    "no scenery",
    "no terrain",
    "no floor",
    "no shadow",
    "no pedestal",
    "no miniature base",
    "no nameplate",
    "no text",
  ].join(", ");
  return `${text}, ${isolation}`.replace(/\s+/g, " ").trim();
}

function normalizeCustomPrompt(prompt = {}, monster = {}) {
  return {
    prompt: prompt.prompt ? `${enforceIsolation(prompt.prompt)}, ${gearPolicy(monster)}`.replace(/\s+/g, " ").trim() : buildMonsterImagePrompt({ ...monster, imagePrompt: null }).prompt,
    negative_prompt: unique([prompt.negative_prompt, negativePromptForMonster(monster)]).join(", "),
    steps: Number(prompt.steps || 30),
    cfg_scale: Number(prompt.cfg_scale || 7),
    seed: Number(prompt.seed || hashSeed(monster.index || monster.name)),
  };
}

export function buildMonsterImagePrompt(monster = {}) {
  if (monster.imagePrompt && typeof monster.imagePrompt === "object") return normalizeCustomPrompt(monster.imagePrompt, monster);
  if (monster.image_prompt && typeof monster.image_prompt === "object") return normalizeCustomPrompt(monster.image_prompt, monster);

  const name = cleanWords(monster.name || "unknown enemy");
  const role = roleKey(monster);
  const descriptors = visualDescriptors(monster);
  const pose = monster.type === "ooze"
    ? "clear threatening specimen pose, shape readable without any floor or container"
    : monster.type === "plant"
      ? "predatory living-plant pose, tendrils arranged clearly without ground or roots in soil"
      : ROLE_POSES[role];
  const prompt = [
    `full body ${subjectKind(monster)} illustration`,
    `${name.toLowerCase()} ${visualRoleLabel(monster)}`,
    descriptors.join(", "),
    gearPolicy(monster),
    pose,
    STYLE_LINE,
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/\b(source|manual|pdf|csv|json|srd|book|statblock)\b/gi, "")
    .replace(/\s+/g, " ");

  return {
    prompt,
    negative_prompt: negativePromptForMonster(monster),
    steps: 30,
    cfg_scale: 7,
    seed: hashSeed(monster.index || monster.monsterIndex || monster.name),
  };
}

export function monsterImagePromptJson(monster = {}) {
  return JSON.stringify(buildMonsterImagePrompt(monster), null, 2);
}

export function monsterImagePromptSummary(monster = {}) {
  const payload = buildMonsterImagePrompt(monster);
  if (lowerIncludes(payload.prompt, "clean pure white background")) return "Isolated enemy only / pure white / no base or text";
  return "Full body enemy image prompt";
}
