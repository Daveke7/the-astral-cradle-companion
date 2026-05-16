const namePools = {
  Chult: {
    first: ["Azari", "Kito", "Nia", "Zuberi", "Asha", "Tendaji", "Mosi", "Sefu", "Amara", "Kwalu", "Sanaa", "Jengo"],
    last: ["of the River Gate", "Storm-Veil", "Goldscale", "of Malar's Teeth", "Brightmask", "Reedwalker", "of Old Mezro"],
  },
  "Port Nyanzaru": {
    first: ["Zamira", "Kassam", "Othali", "Bena", "Ishari", "Tavo", "Nehra", "Sibari", "Omuze", "Jassan"],
    last: ["Three-Keys", "Silkledger", "Feathercoin", "Brightstall", "Saffron-Seal", "Rainmarket", "High-Dock"],
  },
  Thayan: {
    first: ["Valesh", "Nymira", "Drazhan", "Kallus", "Sarkeva", "Othryn", "Maletha", "Vorren", "Zalvek"],
    last: ["Malrec", "Dorn", "Vazren", "Keth", "Orlath", "Szassir", "Velkar", "Thomor"],
  },
  "Baldur's Gate": {
    first: ["Mira", "Corren", "Hesk", "Tamsin", "Bran", "Velia", "Rook", "Darra", "Orryn", "Mavik"],
    last: ["Blackwell", "Crowe", "Lantern", "Greyhook", "Duskbarrel", "Pennant", "Lowbridge", "Harth"],
  },
  "Jungle Tribes": {
    first: ["Paka", "Yiri", "Kezha", "Tika", "Oro", "Nim", "Siru", "Talek", "Chira", "Mazho"],
    last: ["Leaf-Shadow", "Jaguar-Eye", "River-Claw", "Silent-Pad", "Red-Seed", "Moon-Bark", "Sun-on-Stone"],
  },
  Any: {
    first: ["Avel", "Seren", "Marro", "Lysa", "Venn", "Kael", "Thora", "Ivo", "Nyx", "Rima"],
    last: ["Ashford", "Vale", "Dusk", "Thorn", "Grey", "Marsh", "Copper", "Hallow"],
  },
};

const roles = {
  Civilian: ["guide", "dock clerk", "healer", "porter", "cook", "cartographer", "street vendor", "temple attendant"],
  Criminal: ["smuggler", "fence", "lookout", "forger", "blackmail broker", "knife-for-hire", "rumor runner"],
  Political: ["merchant agent", "prince's clerk", "tax collector", "guild envoy", "arena sponsor", "guide-license examiner"],
  Mystic: ["dream interpreter", "shrine keeper", "relic reader", "jungle oracle", "failed apprentice", "mask-priest"],
  Explorer: ["rival scout", "ruin delver", "map seller", "expedition survivor", "beast handler", "weathered archaeologist"],
  Antagonist: ["Thayan observer", "cult recruiter", "mercenary captain", "spy", "curse-bearer", "kidnapper"],
};

const factions = [
  "None",
  "Merchant Princes",
  "Red Wizards of Thay",
  "Echo Syndicate",
  "Explorer's Guild",
  "Iron Serpent remnants",
  "Mage's Enclave",
  "Tabaxi clans",
  "Jungle Elf remnant",
  "Aarakocra scouts",
  "Albino Dwarves",
  "Cult of the Black Night",
];

const appearances = [
  "rain-dark cloak, bright beadwork, tired eyes",
  "gold rings on every finger, immaculate sandals, nervous smile",
  "scar across the lip, ink-stained hands, watchful posture",
  "sun-bleached braids, chipped tooth, old expedition pins",
  "painted wooden mask hanging at the belt",
  "white linen, red thread bracelet, smell of incense",
  "mud on the boots but noble fabric underneath",
  "one sleeve pinned empty, eyes that miss nothing",
];

const voices = [
  "soft and precise, never wastes a word",
  "fast, warm, keeps interrupting themselves",
  "low voice with careful pauses before names",
  "laughs too early, then watches reactions",
  "formal courtly phrasing in a rough street accent",
  "raspy whisper as if the jungle might overhear",
  "sings half-sentences under their breath",
  "always repeats the last important word",
];

const wants = [
  "safe passage for someone they refuse to name",
  "proof that a rival lied",
  "enough coin to leave Port Nyanzaru before dawn",
  "the party to carry a sealed message into the jungle",
  "a Red Wizard debt erased without public scandal",
  "a family relic returned from Firefinger",
  "to know whether the black nights are divine punishment",
  "to sell useful truth without becoming responsible for it",
];

const fears = [
  "being recognized by a Thayan agent",
  "the Merchant Princes discovering their side business",
  "dying in the jungle where no ancestor can find them",
  "the party asking the one question they cannot answer",
  "a loved one joining Cassian's surviving network",
  "the old gods beneath Mezro waking hungry",
  "their own reflection moving a heartbeat too late",
  "losing status in front of witnesses",
];

const secrets = [
  "They saw Zorath's expedition pass under false colors.",
  "They sold supplies to Cassian after his public exposure.",
  "They can identify a Jungle Elf mark but will deny it unless protected.",
  "They have a hidden Red Wizard contact, but hate them more than they fear them.",
  "They know Azaka's family mask was used in a recent bargain.",
  "They once worked for the Echo Syndicate and still owe a favor.",
  "They are carrying a map fragment that points toward Mezro.",
  "They dream of starless skies every night and wake with ash under their nails.",
];

const relationships = [
  "useful but not loyal",
  "curious about Cobra Kai's arena reputation",
  "friendly until money becomes involved",
  "afraid of William's changed eye",
  "impressed by Sanae's green hair",
  "wants Kai to inspect a relic privately",
  "knows Xribit's stage name",
  "trusts Whisp's monastic origin more than they admit",
];

const hooks = [
  "Offers a clue if the party promises not to mention their name.",
  "Needs protection for one night before the next caravan leaves.",
  "Has a handout, but only if paid in information instead of gold.",
  "Mistakes one PC for someone from a prophecy, debt, or old crime.",
  "Can arrange a meeting with a faction, but the meeting is a trap-adjacent test.",
  "Knows where a missing expedition cached supplies.",
  "Wants the party to recover a token before someone else translates it.",
  "Can identify one magic item, but the identification reveals a problem.",
];

const npcStatPackages = {
  harmless: { ac: 10, hp: 7, attack: "Dagger +2, 1d4 piercing", role: "Civilian" },
  capable: { ac: 13, hp: 22, attack: "Shortsword +4, 1d6+2 piercing", role: "Skirmisher" },
  veteran: { ac: 15, hp: 45, attack: "Multiattack +5, 1d8+3 slashing", role: "Leader" },
  caster: { ac: 12, hp: 28, attack: "Arcane bolt +5, 2d8 force", role: "Controller" },
};

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function makeName(region) {
  const pool = namePools[region] || namePools.Any;
  return `${pick(pool.first)} ${pick(pool.last)}`;
}

function chooseStatPackage(roleType, danger) {
  if (roleType === "Mystic") return npcStatPackages.caster;
  if (roleType === "Antagonist") return danger === "dangerous" ? npcStatPackages.veteran : npcStatPackages.capable;
  if (danger === "dangerous") return npcStatPackages.capable;
  if (danger === "story") return npcStatPackages.harmless;
  return pick([npcStatPackages.harmless, npcStatPackages.capable]);
}

export function generateRandomNpc({ region, roleType, factionMode, disposition, danger }) {
  const role = pick(roles[roleType] || roles.Civilian);
  const faction = factionMode === "random" ? pick(factions) : factionMode;
  const statPackage = chooseStatPackage(roleType, danger);
  const name = makeName(region);
  const status = disposition === "hostile" ? "Hostile" : disposition === "ally" ? "Ally" : "Unknown";

  return {
    id: `npc-${Date.now()}`,
    name,
    role,
    faction,
    status,
    region,
    appearance: pick(appearances),
    voice: pick(voices),
    wants: pick(wants),
    fear: pick(fears),
    relationship: pick(relationships),
    hook: pick(hooks),
    visible: `${name} is een ${role} uit ${region}, verbonden aan ${faction === "None" ? "geen duidelijke faction" : faction}.`,
    secret: pick(secrets),
    mannerism: pick([
      "touches a charm before answering hard questions",
      "keeps checking exits",
      "never says a faction name aloud",
      "smiles only when lying",
      "counts coin by sound, not sight",
      "uses titles too precisely",
    ]),
    inventory: pick([
      "sealed letter, cheap knife, rainproof pouch",
      "ledger strip, carved bead, two healing herbs",
      "broken signet, loaded dice, wax token",
      "map scrap, red thread, brass key",
      "bone whistle, trade permit, hidden vial",
    ]),
    statBlock: {
      ...statPackage,
      initiative: statPackage.role === "Controller" ? 12 : 10,
    },
    playerSafe: `${name} lijkt ${disposition === "hostile" ? "wantrouwig" : disposition === "ally" ? "behulpzaam" : "moeilijk te lezen"}. ${pick([
      "Ze weten meer over de jungle dan ze eerst zeggen.",
      "Ze reageren zichtbaar op de naam Firefinger.",
      "Ze herkennen de party van de arena-verhalen.",
      "Ze vermijden vragen over de zwarte nachten.",
    ])}`,
    dmOnly: pick([
      "Use this NPC to push a clue without forcing a quest.",
      "They can become a recurring contact if the party protects them.",
      "They are bait for a faction clock, not necessarily an enemy.",
      "They know one truth and one lie about the same subject.",
    ]),
  };
}

export function copyNpc(npc) {
  if (!npc) return;
  const lines = [
    `${npc.name} - ${npc.role}`,
    `Faction: ${npc.faction} | Status: ${npc.status} | Region: ${npc.region}`,
    `Appearance: ${npc.appearance}`,
    `Voice: ${npc.voice}`,
    `Wants: ${npc.wants}`,
    `Fear: ${npc.fear}`,
    `Relationship: ${npc.relationship}`,
    `Hook: ${npc.hook}`,
    `Inventory: ${npc.inventory}`,
    `Stats: AC ${npc.statBlock.ac}, HP ${npc.statBlock.hp}, ${npc.statBlock.attack}`,
    "",
    `Player-safe: ${npc.playerSafe}`,
    `DM-only secret: ${npc.secret}`,
    `DM-only use: ${npc.dmOnly}`,
  ];
  navigator.clipboard?.writeText(lines.join("\n"));
}
