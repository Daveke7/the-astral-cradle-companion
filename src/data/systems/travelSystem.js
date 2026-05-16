export const TRAVEL_ROLE_DEFINITIONS = [
  { id: "guide", label: "Guide", icon: "compass", notes: "Route, tempo, veilige paden" },
  { id: "scout", label: "Scout", icon: "footprints", notes: "Sporen, voorhoede, stealth" },
  { id: "warden", label: "Warden", icon: "shield", notes: "Camp safety, fysieke obstakels" },
  { id: "lookout", label: "Lookout", icon: "eye", notes: "Canopy, lucht, verre beweging" },
  { id: "quartermaster", label: "Quartermaster", icon: "pack", notes: "Supplies, water, medicine" },
  { id: "lorekeeper", label: "Lorekeeper", icon: "rune", notes: "Ruines, symbolen, magic residue" },
];

export const TRAVEL_ROLE_LABELS = Object.fromEntries(TRAVEL_ROLE_DEFINITIONS.map((role) => [role.id, role.label]));

export const TRAVEL_PACE_OPTIONS = ["Voorzichtig", "Normaal", "Geforceerd"];

export const TRAVEL_ROUTE_NODES = [
  { id: "port", label: "Port Nyanzaru", x: 9, y: 72, visibility: "known" },
  { id: "trail", label: "Jungle Approach", x: 26, y: 56, visibility: "known" },
  { id: "black-pool", label: "Spiegelwater", x: 43, y: 65, visibility: "dm" },
  { id: "red-trail", label: "Thay spoor", x: 56, y: 42, visibility: "dm" },
  { id: "foothills", label: "Firefinger Foothills", x: 72, y: 36, visibility: "hidden" },
  { id: "firefinger", label: "Firefinger", x: 88, y: 22, visibility: "known" },
];

export const TRAVEL_MAP_OVERLAYS = [
  { id: "route", label: "Route", defaultVisible: true, playerSafe: true },
  { id: "grid", label: "Hex grid", defaultVisible: false, playerSafe: true },
  { id: "labels", label: "Labels", defaultVisible: true, playerSafe: true },
  { id: "dmMarkers", label: "DM markers", defaultVisible: true, playerSafe: false },
  { id: "redTrail", label: "Thay trail", defaultVisible: true, playerSafe: false },
  { id: "weather", label: "Weather", defaultVisible: true, playerSafe: true },
];

export const TRAVEL_TERRAIN_CONDITIONS = [
  { id: "dense-jungle", label: "Dense Jungle", effect: "Visibility lightly obscured. Scout/Lookout matter more." },
  { id: "heavy-rain", label: "Heavy Rain", effect: "Tracks fade fast. Quartermaster checks protect supplies." },
  { id: "high-canopy", label: "High Canopy", effect: "Flying threats get better opening positions." },
  { id: "old-ruins", label: "Old Ruins", effect: "Lorekeeper can convert danger into a clue." },
];

export const TRAVEL_EVENT_TABLES = {
  good: [
    {
      title: "De oude processieweg",
      pressure: "De expeditie wint tijd zonder lawaai te maken.",
      playerSafe: "De jungle opent zich rond een half verzonken stenen route, oud maar nog bruikbaar.",
      dmOnly: "Een Chultaanse processieweg wijst richting Firefinger, maar bevat ook een vers weggeveegde Thayaanse markering.",
      mechanics: "+1 route progress. De volgende travel check krijgt advantage voor Guide of Lorekeeper.",
      clue: "Sanae voelt dat de oude reliefs haar groene haar niet als vreemd maar als herkenbaar behandelen.",
      map: "ancient Chultan processional road through dense jungle, half sunken stone slabs, broken vine-covered reliefs, muddy side channels",
    },
    {
      title: "Kampplaats onder wortelbogen",
      pressure: "De party vindt beschutting voordat de avondregen losbarst.",
      playerSafe: "Tussen enorme wortelbogen ligt een droge kampplaats waar oude reizigers ooit tekens achterlieten.",
      dmOnly: "Een symbool lijkt op het motief van Azaka's familie-masker, maar is gedeeltelijk uitgekrast.",
      mechanics: "Iedereen kan veilig short rest plannen. Quartermaster voorkomt 1 supply loss.",
      clue: "Azaka herkent het patroon, maar doet alsof het haar niets zegt.",
      map: "sheltered jungle campsite beneath gigantic root arches, dry raised earth, old carved trail signs, rain channels around the camp",
    },
    {
      title: "Spiegelwater zonder sterren",
      pressure: "Een mystieke locatie levert richting op, maar voelt verkeerd.",
      playerSafe: "Een stille poel weerspiegelt een zwarte hemel waar geen blad doorheen beweegt.",
      dmOnly: "William's blade toont heel kort sterren in het water, alsof iets onder Chult een herinnering aan de hemel bewaart.",
      mechanics: "Lorekeeper krijgt een gratis clue. William of Kai krijgt een korte, verontrustende echo.",
      clue: "De juiste route ligt zuidelijker dan Azaka had verwacht.",
      map: "still black jungle pool, reflective water without stars, mossy stones, narrow trails splitting around the pool, eerie clearings",
    },
  ],
  mixed: [
    {
      title: "Rode linten in natte bast",
      pressure: "De route is bruikbaar, maar de Red Wizards waren hier eerder.",
      playerSafe: "Aan drie bomen hangen natte rode vezels, te precies om toeval te zijn.",
      dmOnly: "Zorath's verkenners hebben deze route bewust half zichtbaar gelaten om achtervolgers te meten.",
      mechanics: "Kies: +1 route progress of spoor veilig wissen. Bij haast stijgt Thay clock +5.",
      clue: "Het lint is niet oud. Iemand loopt niet dagen maar uren voor.",
      map: "muddy jungle crossroads, red cloth fibers tied into wet tree bark, trampled ferns, shallow footprints, narrow sight lines",
    },
    {
      title: "De ingestorte hangbrug",
      pressure: "Vooruitgang vraagt tijd, risico of middelen.",
      playerSafe: "Een ravijn snijdt de route open. De resten van een touwbrug hangen als donkere ribben in de mist.",
      dmOnly: "Aan de overkant zit een subtiele conjuration burn in de steen: iemand is hier niet geklommen maar verplaatst.",
      mechanics: "Athletics/Acrobatics plan nodig. Bij falen: supply loss, damage, of Firefinger alert +10.",
      clue: "De overkant bevat een korte route naar hoger terrein.",
      map: "jungle ravine crossing with collapsed rope bridge, mist rising from below, broken posts, slick stones, multiple crossing points",
    },
    {
      title: "Stilte in het bladerdak",
      pressure: "De jungle zwijgt te plotseling.",
      playerSafe: "Het bladerdak wordt stil. Zelfs de regen lijkt zachter te vallen.",
      dmOnly: "Pterafolk scouts testen de expeditie vanuit hoogte maar vallen nog niet aan.",
      mechanics: "Lookout of Scout kan een hinderlaag voorkomen. Bij gemiste kans start de volgende encounter met enemy positioning.",
      clue: "Een stukje rood lint zit vast aan iets hoog boven het pad.",
      map: "dense jungle trail beneath high canopy, elevated ledges and branches, hidden ambush perches, wet leaves, limited visibility",
    },
  ],
  bad: [
    {
      title: "De modder die terugtrekt",
      pressure: "De route wordt een val en kost tempo.",
      playerSafe: "De grond zakt onder de eerste stappen weg alsof de jungle ademhaalt.",
      dmOnly: "De modder bedekt oude offerstenen die reageren op bloed, hitte en paniek.",
      mechanics: "-1 route progress. Warden voorkomt schade; Quartermaster voorkomt supply loss. Anders beide klein toepassen.",
      clue: "Onder de modder staat een Chultaans teken voor 'waarschuw de hemel'.",
      map: "dangerous jungle mud sink, exposed ancient offering stones, broken roots, half-submerged trail markers, escape routes through brush",
    },
    {
      title: "Thayaanse meetcirkel",
      pressure: "De party loopt door een plek die hen observeert.",
      playerSafe: "In een open plek ligt een perfecte cirkel waar geen plant doorheen groeit.",
      dmOnly: "Dit is een uitgebrande meetcirkel van Zorath. Als de party hem verstoort, weet zijn expeditie dat ze dichtbij zijn.",
      mechanics: "Arcana/Investigation om veilig te lezen. Bij falen: Thay clock +10 of een spell-effect echo.",
      clue: "De cirkel wijst niet naar Firefinger, maar verder landinwaarts.",
      map: "perfect circular dead clearing in dense jungle, ash-gray soil, arcane scorch marks, overgrown approach paths, no grid, no labels",
    },
    {
      title: "Droomkoorts bij daglicht",
      pressure: "De omgeving valt de continuiteit van de party aan.",
      playerSafe: "De hitte wordt glasachtig. Voor een moment lijken schaduwen twee seconden te laat te bewegen.",
      dmOnly: "Kai of William hoort een impliciete echo van de kracht onder Mezro, zonder de naam Astral Cradle te noemen.",
      mechanics: "Wisdom save of exhaustion pressure. Lorekeeper kan het patroon vastleggen als clue.",
      clue: "De zwarte nachten zijn niet alleen boven de wereld; iets trekt het licht omlaag.",
      map: "feverish jungle trail with warped shadows, tilted ruins, black reflective puddles, claustrophobic vegetation, surreal but playable top-down map",
    },
  ],
};

export function defaultTravelOverlays() {
  return Object.fromEntries(TRAVEL_MAP_OVERLAYS.map((overlay) => [overlay.id, overlay.defaultVisible]));
}

export function defaultTravelRoles(party = []) {
  const names = party.map((member) => member.name);
  const defaults = {
    guide: { character: "Azaka", roll: 12, modifier: 5 },
    scout: { character: names[4] || "", roll: 10, modifier: 4 },
    warden: { character: names[2] || "", roll: 10, modifier: 3 },
    lookout: { character: names[0] || "", roll: 10, modifier: 3 },
    quartermaster: { character: names[3] || "", roll: 10, modifier: 2 },
    lorekeeper: { character: names[0] || "", roll: 10, modifier: 5 },
  };

  return TRAVEL_ROLE_DEFINITIONS.map((role) => ({
    id: role.id,
    character: defaults[role.id]?.character || "",
    roll: defaults[role.id]?.roll || 10,
    modifier: defaults[role.id]?.modifier || 0,
    notes: role.notes,
  }));
}
