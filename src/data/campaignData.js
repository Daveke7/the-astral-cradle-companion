export const campaign = {
  name: "The Red Below",
  system: "D&D 5e",
  tone: "Cinematisch, moreel complex, jungle-expeditie met kosmische dreiging.",
  partyLevel: 4,
  partyName: "Cobra Kai",
  activeCampaign: "Chult Expeditie",
  currentDate: "1492 DR",
  nextSession: {
    title: "De eerste dag onder de zwarte hemel",
    location: "Junglepad richting Firefinger",
    goal: "Azaka's masker terugvinden en de expeditie uit Port Nyanzaru levend op gang krijgen.",
    strongStart:
      "De stad verdwijnt achter groene mist. Boven de boomkruinen blijft de nacht leeg, alsof de hemel vergeten is hoe sterren werken.",
    prepStatus: 72,
  },
  party: [
    {
      name: "Kai",
      player: "Owlin Warlock",
      status: "Tharizdun-touched",
      hook: "Entity groeit sterker; kan nuttige vijanden willen gebruiken.",
      visible: "Relic-expert met Hedwynn, witte uil met rode cape.",
    },
    {
      name: "William",
      player: "Human Rogue",
      status: "Groen oog, pact-littekens",
      hook: "Blade of Broken Mirrors fluistert in zijn rechterhand.",
      visible: "Bastaard-erfgenaam, dodelijk met twee daggers.",
    },
    {
      name: "Sanae",
      player: "Elf Ranger",
      status: "Groen haar gemarkeerd",
      hook: "Mogelijke link met verdwenen Jungle Elves.",
      visible: "Crowd-favorite hunter met Char, vuursalamander.",
    },
    {
      name: "Xribit",
      player: "Grung Bard",
      status: "Echo Syndicate orbit",
      hook: "Spectacle en executies kunnen politieke gevolgen hebben.",
      visible: "Paarse grung performer met Slim Ravy.",
    },
    {
      name: "Whisp",
      player: "Tabaxi Monk",
      status: "Clan-wonden open",
      hook: "Tabaxi clans herenigen of breken.",
      visible: "Jungle scout met Splinter, gerbil met rode bandana.",
    },
  ],
  clocks: [
    {
      name: "Zwarte Nachten",
      progress: 38,
      danger: "Wereldwijde sterrenloze nachten nemen toe.",
    },
    {
      name: "Zorath naar Mezro",
      progress: 45,
      danger: "Red Wizard expeditie loopt parallel.",
    },
    {
      name: "Azaka's vertrouwen",
      progress: 62,
      danger: "Masker-deal bepaalt de toon van de reis.",
    },
  ],
  mysteries: [
    "Wat bouwt de kracht onder Mezro werkelijk op?",
    "Waarom reageert Sanae's groene haar op Chult?",
    "Welke prijs vraagt William's nieuwe blade?",
    "Wat wil Kai's entity nadat Thay valt?",
  ],
  warnings: [
    {
      title: "Sparkwing is dood",
      detail: "Niet gebruiken als actieve dreiging zonder expliciete DM-keuze.",
    },
    {
      title: "Astral Cradle is DM-only",
      detail: "De party kent de naam nog niet. Gebruik omschrijvingen: de plek onder Mezro, de honger onder de hemel.",
    },
    {
      title: "Azari is NPC",
      detail: "Tharizdun-aligned wildcard, twee jaar ouder met Kai.",
    },
  ],
};

export const arcs = [
  {
    name: "Stormwreck Isle",
    status: "Afgerond",
    beats: ["Sparkwing ontwaakt", "William activeert pact-clause", "Azari doodt Sparkwing", "Gate opent"],
  },
  {
    name: "Baldur's Gate Bridge",
    status: "Afgerond",
    beats: ["Safekeeper onthuld", "Zorath doodt Adman", "Kai en Azari keren ouder terug", "Chult visioenen"],
  },
  {
    name: "Festival of Feathers",
    status: "Net afgerond",
    beats: ["Cobra Kai wint arena", "Cassian ontmaskerd", "William pact-ervaring", "Envoys of the Merchants"],
  },
  {
    name: "Jungle naar Mezro",
    status: "Actief",
    beats: ["Firefinger", "Azaka's masker", "Ellisar vinden", "Zorath voorblijven"],
  },
];

export const scenes = [
  {
    id: "trail",
    title: "Scene 1 - De jungle slikt de weg in",
    type: "Exploratie",
    goal: "De expeditie-rollen vastzetten en de eerste tekenen van Chult tonen.",
    conflict: "Hittestuwing, insectenzwermen, verdwijnende stadsgeluiden.",
    readAloud:
      "De poorten van Port Nyanzaru verdwijnen achter jullie. Voor je ligt een muur van groen. De lucht ruikt naar natte aarde, hars en oud bloed. Wanneer de zon zakt, blijft de hemel zwart en leeg.",
    clues: [
      "Azaka let overdreven vaak op de lucht.",
      "Een Red Wizard markering is vers in een boom gekerfd.",
      "Sanae ziet een groenharig silhouet in een verweerde jungle-muur.",
    ],
    dmOnly: "Laat de markering naar Zorath wijzen, maar benoem hem niet direct.",
    playerSafe:
      "De expeditie heeft Port Nyanzaru verlaten. Het eerste doel is Firefinger, een oude Chultaanse signaaltoren.",
    linked: ["Azaka Stormfang", "Firefinger", "Zwarte Nachten"],
  },
  {
    id: "camp",
    title: "Scene 2 - Kamp zonder sterren",
    type: "Sociale spanning",
    goal: "NPC relaties en persoonlijke angsten aanzetten.",
    conflict: "Wie neemt wacht? Welke PC droomt onrustig?",
    readAloud:
      "Het kampvuur is klein, bijna koppig. Boven de bladeren hangt geen sterrenhemel, alleen een zwart vlak dat te dicht bij de wereld lijkt te liggen.",
    clues: [
      "William's blade weerspiegelt een sterrenhemel die er niet is.",
      "Hedwynn weigert naar het zuiden te vliegen.",
      "Whisp vindt tabaxi-kralen in oude modder.",
    ],
    dmOnly: "Kies een PC voor een droomflits. Houd Tharizdun impliciet.",
    playerSafe:
      "De eerste nacht in de jungle verloopt onrustig. De sterren ontbreken nog steeds overal.",
    linked: ["William", "Kai", "Whisp"],
  },
  {
    id: "fingershadow",
    title: "Scene 3 - Schaduw van Firefinger",
    type: "Vooruitblik",
    goal: "Firefinger als verticale dungeon beloven.",
    conflict: "Pterafolk scouts testen de groep vanaf grote hoogte.",
    readAloud:
      "In de verte snijdt een zwarte naald door de boomkruinen. Daarboven cirkelen vormen met vleugels en lange, haakvormige schaduwen.",
    clues: [
      "Azaka wordt stil als de toren zichtbaar wordt.",
      "Een pterafolk draagt een stukje rood Thayaans lint.",
      "Er komt rook uit een niveau waar geen kamp zou moeten zijn.",
    ],
    dmOnly: "De Red Wizards hebben de toren niet in handen, maar hebben er recent sporen achtergelaten.",
    playerSafe:
      "Firefinger is in zicht: een hoge, afgebrokkelde signaaltoren vol vliegende vijanden.",
    linked: ["Firefinger", "Azaka's masker"],
  },
];

export const npcs = [
  {
    name: "Azaka Stormfang",
    role: "Expeditiegids",
    faction: "Chult",
    status: "Ally",
    voice: "Kortaf, scherp, zelden sentimenteel",
    wants: "Familie-masker terug uit Firefinger",
    fear: "Controle verliezen waar de party het kan zien",
    secret: "Haar band met het masker is dieper dan alleen familie-erfenis.",
    relationship: "Professioneel, groeiend vertrouwen",
    visible: "Azaka leidt de expeditie naar Firefinger en Mezro.",
  },
  {
    name: "Zorath Malrek",
    role: "Zulkir van Conjuration",
    faction: "Red Wizards of Thay",
    status: "Hostile",
    voice: "Rustig, superieur, nooit gehaast",
    wants: "Mezro bereiken en de kracht onder Chult opeisen",
    fear: "Dat de party een variabele wordt die Thay niet kan modelleren",
    secret: "Zijn expeditie beweegt al door Chult.",
    relationship: "Terugkerende BBEG, doodde Adman",
    visible: "Een Red Wizard die de party in Baldur's Gate heeft aangevallen.",
  },
  {
    name: "Cassian Vareath",
    role: "Ontmaskerde Iron Serpent",
    faction: "Vareath / Thay",
    status: "Missing",
    voice: "Charmant, aristocratisch, giftig beleefd",
    wants: "William terug in een bruikbare dynastieke positie duwen",
    fear: "Openbaar als mislukkeling van Thay herinnerd worden",
    secret: "Leeft waarschijnlijk en hergroepeert.",
    relationship: "William's oom, persoonlijke dreiging",
    visible: "Cassian werd publiek ontmaskerd als Red Wizard agent.",
  },
  {
    name: "Des Perado",
    role: "Leider Mage's Enclave",
    faction: "Mage's Enclave",
    status: "Unknown",
    voice: "Laag, observerend, te veel begrijpend",
    wants: "Sanae's afkomst en de waarheid onder Mezro begrijpen",
    fear: "Dat de Astral Cradle al verder is dan zijn berekeningen",
    secret: "Kent de naam Astral Cradle of een Chultaanse variant ervan.",
    relationship: "Geinteresseerd in Sanae",
    visible: "Machtige figuur in Port Nyanzaru die Sanae opmerkte.",
  },
  {
    name: "J'Kaar the Voice",
    role: "Merchant Prince",
    faction: "Port Nyanzaru",
    status: "Ally",
    voice: "Ritmisch, scherp, politiek als performance",
    wants: "Cassian's gat vullen zonder diens schaduw te erven",
    fear: "Dat Xribit een symbool wordt dat hij niet kan controleren",
    secret: "Gebruikt Cobra Kai als signaal naar rivalen.",
    relationship: "Gaf Xribit Cloak of the Bat",
    visible: "Nieuwe Merchant Prince na Cassian's val.",
  },
];

export const quests = [
  {
    title: "Azaka's masker",
    type: "Companion quest",
    status: "Active",
    next: "Bereik Firefinger en vind de pterafolk opslagplaats.",
    linked: "Azaka Stormfang / Firefinger",
    playerSafe: "Azaka leidt gratis naar Mezro als haar familie-masker wordt teruggevonden.",
    dmTruth: "Het masker is emotionele hefboom en mogelijk sleutel tot haar verborgen natuur.",
  },
  {
    title: "Ellisar Veyra vinden",
    type: "Main quest",
    status: "Active",
    next: "Zoek sporen van Explorer's Guild notities in de jungle.",
    linked: "Elira Veyra / Mezro",
    playerSafe: "Elira's broer Ellisar wordt vermist in Chult.",
    dmTruth: "Ellisar kan te dicht bij de waarheid onder Mezro zijn gekomen.",
  },
  {
    title: "De Zwarte Nachten stoppen",
    type: "Cosmic quest",
    status: "Active",
    next: "Verbind Firefinger-sporen aan het grotere patroon.",
    linked: "Tharizdun / Mezro",
    playerSafe: "Sinds de gate onder Dragon's Rest opende, zijn alle nachten wereldwijd sterrenloos.",
    dmTruth: "Elke nacht siphont essence naar de Astral Cradle.",
  },
  {
    title: "Tabaxi clans herenigen",
    type: "Personal quest",
    status: "Available",
    next: "Laat Whisp sporen van zijn clan herkennen.",
    linked: "Whisp / Chult",
    playerSafe: "Whisp zoekt de waarheid over zijn clan en familie.",
    dmTruth: "Cassian wilde hem als breekijzer tegen de clans gebruiken.",
  },
  {
    title: "De Jungle Elves",
    type: "Personal quest",
    status: "Hidden",
    next: "Gebruik Sanae's groene haar als stille resonantie bij ruines.",
    linked: "Sanae / Des Perado",
    playerSafe: "Sanae's uiterlijk trekt aandacht in Chult.",
    dmTruth: "Haar groene haar kan wijzen naar verdwenen Jungle Elves.",
  },
];

export const encounters = [
  {
    id: "pterafolk-scouts",
    name: "Pterafolk scouts boven het bladerdak",
    difficulty: "Hard-ish voor level 4",
    terrain: "Smal junglepad, dicht bladerdak, 25 ft zichtlijnen, plotselinge hoogteverschillen.",
    objective: "Niet alles doden: een scout levend of met route-info wegvangen.",
    timer: "Na ronde 4 arriveert een krijs-signaal vanaf Firefinger.",
    monsters: [
      {
        name: "Pterafolk Spear-Diver",
        role: "Skirmisher",
        ac: 13,
        hp: 32,
        maxHp: 32,
        initiative: 17,
        conditions: [],
      },
      {
        name: "Canopy Howler",
        role: "Controller",
        ac: 12,
        hp: 26,
        maxHp: 26,
        initiative: 14,
        conditions: ["Frighten setup"],
      },
      {
        name: "Nest-Bound Brute",
        role: "Brute",
        ac: 14,
        hp: 45,
        maxHp: 45,
        initiative: 8,
        conditions: [],
      },
    ],
  },
];

export const tools = [
  { name: "DC snelreferentie", detail: "10 makkelijk, 15 gemiddeld, 20 moeilijk, 25 heroisch." },
  { name: "Improvisatie-schade", detail: "Level 4: 1d10 klein, 2d10 gevaarlijk, 4d10 dodelijk." },
  { name: "Jungle complicatie", detail: "Leech-swamp, valse trail-marker, Red Wizard scrying scar." },
  { name: "Rumor generator", detail: "Elke rumor heeft een kern van waarheid, een leugen, en een prijs." },
];
