import { useState } from "react";
import { Check, Eye, ScrollText, ShieldAlert } from "lucide-react";

const palettes = [
  {
    id: "parchment-blue-ledger",
    name: "Parchment Blue Ledger",
    verdict: "Mijn beste lichte optie: rustig, DM-ledger gevoel, heel goed leesbaar.",
    mood: "Parchment, ledger blue, ink, seal red.",
    swatches: [
      ["bg", "Parchment"],
      ["primary", "Ledger"],
      ["accent", "Ink"],
      ["danger", "Seal"],
    ],
    colors: {
      bg: "#EDE5D6",
      depth: "#C9D3DC",
      surface: "#F6F1E8",
      panel: "#FFFBF2",
      primary: "#496A8A",
      accent: "#1D2630",
      danger: "#A83A34",
      parchment: "#F4EFE3",
      text: "#1C2530",
      muted: "#65717D",
      buttonText: "#F7FAFC",
      paperInk: "#1A2028",
    },
  },
  {
    id: "parchment-red-seal",
    name: "Parchment Red Seal",
    verdict: "Licht, dramatisch en campaign-eigen. Rood voelt als signatuur zonder circus.",
    mood: "Parchment, red wax, black ink, pale ash.",
    swatches: [
      ["bg", "Parchment"],
      ["primary", "Wax"],
      ["accent", "Ink"],
      ["muted", "Ash"],
    ],
    colors: {
      bg: "#F0E5D6",
      depth: "#D8CABA",
      surface: "#F8F1E7",
      panel: "#FFF8EC",
      primary: "#9D342F",
      accent: "#24282F",
      danger: "#C1443C",
      parchment: "#F5EBDD",
      text: "#231F1B",
      muted: "#786E64",
      buttonText: "#FFF8EC",
      paperInk: "#261D18",
    },
  },
  {
    id: "parchment-storm-map",
    name: "Parchment Storm Map",
    verdict: "Licht en professioneel. Meer cartographer desk dan fantasy boek.",
    mood: "Storm parchment, slate blue, charcoal, red marker.",
    swatches: [
      ["bg", "Map"],
      ["primary", "Storm"],
      ["accent", "Charcoal"],
      ["danger", "Marker"],
    ],
    colors: {
      bg: "#E8ECEF",
      depth: "#C6D1DB",
      surface: "#F5F7F8",
      panel: "#FFFFFF",
      primary: "#566F88",
      accent: "#151B23",
      danger: "#B5463D",
      parchment: "#F3F5F6",
      text: "#18212B",
      muted: "#66727E",
      buttonText: "#F8FBFD",
      paperInk: "#17202A",
    },
  },
  {
    id: "parchment-expedition",
    name: "Parchment Expedition",
    verdict: "Lichte Chult/adventure richting zonder overdreven jungle-groen.",
    mood: "Sun paper, canopy slate, clay red, charcoal ink.",
    swatches: [
      ["bg", "Sun Paper"],
      ["primary", "Canopy"],
      ["danger", "Clay"],
      ["accent", "Ink"],
    ],
    colors: {
      bg: "#E9DDC7",
      depth: "#CFC1A8",
      surface: "#F5EBD9",
      panel: "#FFF6E7",
      primary: "#5D7770",
      accent: "#202620",
      danger: "#A94937",
      parchment: "#F3E8D4",
      text: "#20231F",
      muted: "#746C5F",
      buttonText: "#F8F3EA",
      paperInk: "#232018",
    },
  },
  {
    id: "parchment-astral-vellum",
    name: "Parchment Astral Vellum",
    verdict: "Licht maar toch magisch. Goed als je Astral Cradle meer elegant wil maken.",
    mood: "Vellum, astral violet, midnight ink, omen red.",
    swatches: [
      ["bg", "Vellum"],
      ["primary", "Astral"],
      ["accent", "Midnight"],
      ["danger", "Omen"],
    ],
    colors: {
      bg: "#ECE7F2",
      depth: "#CDD3E8",
      surface: "#F7F4FB",
      panel: "#FFFFFF",
      primary: "#7766B4",
      accent: "#1A1D32",
      danger: "#B73B3E",
      parchment: "#F3EEF7",
      text: "#1E2032",
      muted: "#70718A",
      buttonText: "#F8F6FF",
      paperInk: "#1B1A2C",
    },
  },
  {
    id: "parchment-monochrome",
    name: "Parchment Monochrome",
    verdict: "De rustigste lichte optie. Bijna alleen papier, inkt en rood.",
    mood: "Warm paper, black ink, grey linework, red exception.",
    swatches: [
      ["bg", "Paper"],
      ["accent", "Ink"],
      ["primary", "Line"],
      ["danger", "Red"],
    ],
    colors: {
      bg: "#EFE8DB",
      depth: "#D6D0C4",
      surface: "#F8F3EA",
      panel: "#FFFDF8",
      primary: "#7F858C",
      accent: "#181A1D",
      danger: "#B33B35",
      parchment: "#F6EFE4",
      text: "#1D1C1A",
      muted: "#706B63",
      buttonText: "#FFFFFF",
      paperInk: "#191715",
    },
  },
  {
    id: "parchment-bronze-archive",
    name: "Parchment Bronze Archive",
    verdict: "Warm en historisch, maar gecontroleerd: geen modderige bruinmuur.",
    mood: "Archive paper, bronze, ink blue, blood red.",
    swatches: [
      ["bg", "Archive"],
      ["primary", "Bronze"],
      ["accent", "Ink Blue"],
      ["danger", "Blood"],
    ],
    colors: {
      bg: "#E8DCC9",
      depth: "#C9B69C",
      surface: "#F5ECDE",
      panel: "#FFF8ED",
      primary: "#9A7340",
      accent: "#26384A",
      danger: "#A83B32",
      parchment: "#F2E7D7",
      text: "#231D16",
      muted: "#74675A",
      buttonText: "#FFF8ED",
      paperInk: "#211A13",
    },
  },
  {
    id: "bronze-archive-ink",
    name: "Bronze Archive Ink",
    verdict: "Zelfde basis, maar koeler en serieuzer door sterker ink blue.",
    mood: "Archive paper, bronze trim, ink blue, blood seal.",
    swatches: [
      ["bg", "Archive"],
      ["primary", "Bronze"],
      ["accent", "Ink Blue"],
      ["danger", "Seal"],
    ],
    colors: {
      bg: "#E9DEC9",
      depth: "#C8B99F",
      surface: "#F6EEDF",
      panel: "#FFF9EF",
      primary: "#8F6B3D",
      accent: "#1F3348",
      danger: "#A33A33",
      parchment: "#F3E8D8",
      text: "#221D17",
      muted: "#70675C",
      buttonText: "#FFF9EF",
      paperInk: "#1C2632",
    },
  },
  {
    id: "bronze-archive-light",
    name: "Bronze Archive Light",
    verdict: "Lichter en schoner. Meer premium notebook dan oude tombe.",
    mood: "Clean parchment, pale bronze, charcoal ink, controlled red.",
    swatches: [
      ["bg", "Parchment"],
      ["primary", "Pale Bronze"],
      ["accent", "Charcoal"],
      ["danger", "Red Wax"],
    ],
    colors: {
      bg: "#F0E7D8",
      depth: "#D7CBB8",
      surface: "#FAF4EA",
      panel: "#FFFCF5",
      primary: "#A98653",
      accent: "#272B2F",
      danger: "#A94238",
      parchment: "#F6EDE0",
      text: "#25201A",
      muted: "#7A7064",
      buttonText: "#FFF8EE",
      paperInk: "#24201A",
    },
  },
  {
    id: "bronze-archive-red",
    name: "Bronze Archive Red",
    verdict: "Iets dramatischer. Rood krijgt meer rol zonder de rust te breken.",
    mood: "Parchment, antique bronze, red seal, black ink.",
    swatches: [
      ["bg", "Parchment"],
      ["danger", "Red Seal"],
      ["primary", "Bronze"],
      ["accent", "Ink"],
    ],
    colors: {
      bg: "#EADDC7",
      depth: "#C9B69D",
      surface: "#F6ECDD",
      panel: "#FFF7EA",
      primary: "#916D3E",
      accent: "#201C18",
      danger: "#B13C34",
      parchment: "#F1E5D4",
      text: "#241E18",
      muted: "#766757",
      buttonText: "#FFF7EA",
      paperInk: "#211915",
    },
  },
  {
    id: "bronze-archive-map",
    name: "Bronze Archive Map",
    verdict: "Meer kaartentafel en expeditie. Goed als Chult centraal moet voelen.",
    mood: "Aged map, route bronze, jungle slate, red clay.",
    swatches: [
      ["bg", "Aged Map"],
      ["primary", "Route Bronze"],
      ["accent", "Jungle Slate"],
      ["danger", "Red Clay"],
    ],
    colors: {
      bg: "#E6D8BF",
      depth: "#C0AE90",
      surface: "#F3E7D2",
      panel: "#FFF4DF",
      primary: "#98713C",
      accent: "#40575A",
      danger: "#A74A35",
      parchment: "#F0E2CB",
      text: "#231D14",
      muted: "#706755",
      buttonText: "#FFF4DF",
      paperInk: "#1F211B",
    },
  },
  {
    id: "bronze-archive-night",
    name: "Bronze Archive Night",
    verdict: "Hybride: lichte parchment content met donkere top/nav energie.",
    mood: "Night ink, parchment panels, bronze action, red warning.",
    swatches: [
      ["bg", "Night Ink"],
      ["panel", "Parchment"],
      ["primary", "Bronze"],
      ["danger", "Warning"],
    ],
    colors: {
      bg: "#15120E",
      depth: "#2C241A",
      surface: "#E9DDC9",
      panel: "#FFF7EA",
      primary: "#A47A40",
      accent: "#242A31",
      danger: "#B54538",
      parchment: "#F3E6D2",
      text: "#251E16",
      muted: "#776C5E",
      buttonText: "#FFF7EA",
      paperInk: "#211A13",
    },
  },
  {
    id: "bronze-archive-tyr",
    name: "Bronze Archive Tyr",
    verdict: "Heiliger en rechterlijker. Past goed bij Tyr, Runara en oude pacten.",
    mood: "Temple parchment, judicial bronze, holy blue, oath red.",
    swatches: [
      ["bg", "Temple"],
      ["primary", "Judgment"],
      ["accent", "Holy Blue"],
      ["danger", "Oath"],
    ],
    colors: {
      bg: "#EDE3D2",
      depth: "#CBC0AE",
      surface: "#F8EFE2",
      panel: "#FFF9F0",
      primary: "#96764B",
      accent: "#4D647B",
      danger: "#9F3932",
      parchment: "#F4E9D9",
      text: "#242019",
      muted: "#736B61",
      buttonText: "#FFF9F0",
      paperInk: "#211D17",
    },
  },
  {
    id: "bronze-archive-aged",
    name: "Bronze Archive Aged",
    verdict: "Meer oud papier, meer character. Mooi, maar iets minder clean.",
    mood: "Aged parchment, tarnished bronze, soot ink, dried blood.",
    swatches: [
      ["bg", "Aged Paper"],
      ["primary", "Tarnished"],
      ["accent", "Soot"],
      ["danger", "Dried Blood"],
    ],
    colors: {
      bg: "#DFCFB2",
      depth: "#B9A484",
      surface: "#EBDDCA",
      panel: "#F7EAD3",
      primary: "#85683D",
      accent: "#2B2924",
      danger: "#913A32",
      parchment: "#EADABD",
      text: "#241D14",
      muted: "#6E6250",
      buttonText: "#F7EAD3",
      paperInk: "#211A12",
    },
  },
  {
    id: "bronze-archive-clean-blue",
    name: "Bronze Archive Clean Blue",
    verdict: "Mijn meest praktische variant: bronze sfeer, maar met goede UI-helderheid.",
    mood: "Parchment, bronze, clean blue controls, red seal.",
    swatches: [
      ["bg", "Parchment"],
      ["primary", "Blue Control"],
      ["accent", "Bronze"],
      ["danger", "Seal"],
    ],
    colors: {
      bg: "#EDE4D4",
      depth: "#CBD2D7",
      surface: "#F8F1E8",
      panel: "#FFFAF2",
      primary: "#4F6F8F",
      accent: "#9A7340",
      danger: "#A83B32",
      parchment: "#F4E9D9",
      text: "#211E19",
      muted: "#6E6A63",
      buttonText: "#FFFAF2",
      paperInk: "#1E242B",
    },
  },
  {
    id: "white-map-table",
    name: "White Map Table",
    verdict: "Bijna een fysieke tafelkaart. Erg helder voor travel en hex planning.",
    mood: "White map, route blue, red pin, grey contour.",
    swatches: [
      ["bg", "White Map"],
      ["primary", "Route"],
      ["danger", "Pin"],
      ["muted", "Contour"],
    ],
    colors: {
      bg: "#F3F5F4",
      depth: "#D6DEE4",
      surface: "#FBFCFB",
      panel: "#FFFFFF",
      primary: "#426C95",
      accent: "#1D252D",
      danger: "#B8423A",
      parchment: "#F5F6F5",
      text: "#1B2229",
      muted: "#7B858D",
      buttonText: "#FFFFFF",
      paperInk: "#1C242C",
    },
  },
  {
    id: "darkfall-triad",
    name: "Darkfall Triad",
    verdict: "De dichtste match met je Darkfall gevoel: koel, volwassen en heel rustig.",
    mood: "Blue, red, white, black. Bijna geen extra kleurfamilies.",
    swatches: [
      ["primary", "Blue"],
      ["danger", "Red"],
      ["accent", "White"],
      ["bg", "Black"],
    ],
    colors: {
      bg: "#070A10",
      surface: "#101720",
      panel: "#151E29",
      primary: "#6F8FAF",
      accent: "#D8E6F2",
      danger: "#B6463F",
      parchment: "#EEF1F4",
      text: "#F4F7FA",
      muted: "#9AA3AE",
    },
  },
  {
    id: "blood-bone-ink",
    name: "Blood / Bone / Ink",
    verdict: "Occult en The Red Below. Minder modern, meer campaign-journal.",
    mood: "Blood red, bone white, ash grey, black ink.",
    swatches: [
      ["danger", "Blood"],
      ["accent", "Bone"],
      ["primary", "Ash"],
      ["bg", "Ink"],
    ],
    colors: {
      bg: "#070605",
      surface: "#12100E",
      panel: "#1B1713",
      primary: "#8F969C",
      accent: "#E7DED0",
      danger: "#A7332D",
      parchment: "#E9DFCF",
      text: "#F3EDE4",
      muted: "#9F978E",
    },
  },
  {
    id: "storm-bronze",
    name: "Storm / Bronze",
    verdict: "D&D-dragon relic sfeer zonder dat alles bruin wordt.",
    mood: "Storm navy, aged bronze, bone, ember red.",
    swatches: [
      ["bg", "Storm"],
      ["primary", "Bronze"],
      ["accent", "Bone"],
      ["danger", "Ember"],
    ],
    colors: {
      bg: "#080D17",
      surface: "#111823",
      panel: "#181F2A",
      primary: "#A8793E",
      accent: "#E0D7C6",
      danger: "#B94735",
      parchment: "#E5DAC6",
      text: "#F0EBDD",
      muted: "#9BA2A8",
    },
  },
  {
    id: "astral-void",
    name: "Astral Void",
    verdict: "Kosmisch, magisch en Black Nights-achtig. Meer mysterie, minder grit.",
    mood: "Void, moon violet, astral blue, pale white.",
    swatches: [
      ["bg", "Void"],
      ["primary", "Violet"],
      ["danger", "Red"],
      ["accent", "White"],
    ],
    colors: {
      bg: "#060814",
      surface: "#111225",
      panel: "#171933",
      primary: "#9A88D6",
      accent: "#F0ECFA",
      danger: "#C13D38",
      parchment: "#EEEAF3",
      text: "#F0ECFA",
      muted: "#A7A9BC",
    },
  },
  {
    id: "mezro-relic",
    name: "Mezro Relic",
    verdict: "Chult/ruins zonder fel jungle-groen. Mooi voor hex map en travel.",
    mood: "Ancient stone, oxidized blue-green, clay red, pale dust.",
    swatches: [
      ["bg", "Stone"],
      ["primary", "Relic"],
      ["danger", "Clay"],
      ["accent", "Dust"],
    ],
    colors: {
      bg: "#081012",
      surface: "#10191A",
      panel: "#172324",
      primary: "#6F9DA3",
      accent: "#DDD7C8",
      danger: "#B54538",
      parchment: "#E2DACA",
      text: "#EFE6D5",
      muted: "#95A4A2",
    },
  },
  {
    id: "red-wizard-ash",
    name: "Red Wizard Ash",
    verdict: "Antagonist-heavy. Heel goed als je DM-only druk visueel sterker wil.",
    mood: "Ash black, ember, blood, pale smoke.",
    swatches: [
      ["bg", "Ash"],
      ["primary", "Ember"],
      ["danger", "Blood"],
      ["accent", "Smoke"],
    ],
    colors: {
      bg: "#090608",
      surface: "#160E11",
      panel: "#211419",
      primary: "#B94A43",
      accent: "#E5DCD8",
      danger: "#E05245",
      parchment: "#E9DFDA",
      text: "#F3E6DC",
      muted: "#A58F8C",
    },
  },
  {
    id: "moonlit-steel",
    name: "Moonlit Steel",
    verdict: "De meest premium tool-look. Erg rustig, weinig fantasy-ruis.",
    mood: "Moon white, steel blue, navy glass, signal red.",
    swatches: [
      ["primary", "Steel"],
      ["accent", "Moon"],
      ["danger", "Signal"],
      ["bg", "Navy"],
    ],
    colors: {
      bg: "#050912",
      surface: "#0E1622",
      panel: "#151F2F",
      primary: "#A9C2D9",
      accent: "#EEF4F8",
      danger: "#C94943",
      parchment: "#E8EEF3",
      text: "#EEF4F8",
      muted: "#9AA8B7",
    },
  },
  {
    id: "chult-night",
    name: "Chult Night",
    verdict: "Iets avontuurlijker, maar nog steeds maar vier kleurrollen.",
    mood: "Volcanic black, canopy teal, torch ochre, red clay.",
    swatches: [
      ["bg", "Volcanic"],
      ["primary", "Canopy"],
      ["accent", "Torch"],
      ["danger", "Clay"],
    ],
    colors: {
      bg: "#080807",
      surface: "#111311",
      panel: "#18201D",
      primary: "#5F8792",
      accent: "#D09A45",
      danger: "#B64A35",
      parchment: "#E1D6C5",
      text: "#F0E5D2",
      muted: "#A49A8A",
    },
  },
  {
    id: "tyr-candlelight",
    name: "Tyr Candlelight",
    verdict: "Rustig en heilig. Meer temple archive dan jungle tool.",
    mood: "Black stone, candle ivory, judicial blue, oath red.",
    swatches: [
      ["bg", "Stone"],
      ["accent", "Candle"],
      ["primary", "Justice"],
      ["danger", "Oath"],
    ],
    colors: {
      bg: "#0A0A0C",
      surface: "#141416",
      panel: "#1E1D1A",
      primary: "#8E9AA6",
      accent: "#E6DAC6",
      danger: "#A93A34",
      parchment: "#E8DDCA",
      text: "#F1EADF",
      muted: "#A49F97",
    },
  },
  {
    id: "port-nyanzaru-night",
    name: "Port Nyanzaru Night",
    verdict: "De kleurrijkste optie, maar nog steeds begrensd tot vier rollen.",
    mood: "Indigo night, lagoon teal, coral red, ivory.",
    swatches: [
      ["bg", "Indigo"],
      ["primary", "Lagoon"],
      ["danger", "Coral"],
      ["accent", "Ivory"],
    ],
    colors: {
      bg: "#070812",
      surface: "#111525",
      panel: "#1A2034",
      primary: "#4F9EAD",
      accent: "#F1E8D8",
      danger: "#C94B40",
      parchment: "#EEE5D6",
      text: "#F1E8D8",
      muted: "#A6A8B7",
    },
  },
  {
    id: "infernal-gate",
    name: "Infernal Gate",
    verdict: "Donker en scherp. Past bij portals, Thay en onderwereld-lore.",
    mood: "Black iron, infernal red, cold blue, bone.",
    swatches: [
      ["bg", "Iron"],
      ["danger", "Infernal"],
      ["primary", "Cold Blue"],
      ["accent", "Bone"],
    ],
    colors: {
      bg: "#050608",
      surface: "#111318",
      panel: "#191C23",
      primary: "#668AA8",
      accent: "#E4DED4",
      danger: "#D24539",
      parchment: "#E7E0D6",
      text: "#F1EEE9",
      muted: "#9BA0A8",
    },
  },
  {
    id: "high-contrast-table",
    name: "High Contrast Table",
    verdict: "Het meest praktisch tijdens sessies: extreem scanbaar, minder sfeervol.",
    mood: "Almost black, electric blue, bright white, hard warning red.",
    swatches: [
      ["bg", "Black"],
      ["primary", "Blue"],
      ["accent", "White"],
      ["danger", "Warning"],
    ],
    colors: {
      bg: "#030508",
      surface: "#0B1118",
      panel: "#101923",
      primary: "#79AEE8",
      accent: "#D2D8E0",
      danger: "#E04A42",
      parchment: "#E8EEF3",
      text: "#F7F9FB",
      muted: "#9AA7B5",
    },
  },
  {
    id: "deep-ocean-red",
    name: "Deep Ocean Red",
    verdict: "Diep en kalm, met rood als heel duidelijke dreiging.",
    mood: "Abyss blue, foam white, signal red, black water.",
    swatches: [
      ["bg", "Abyss"],
      ["primary", "Ocean"],
      ["accent", "Foam"],
      ["danger", "Signal"],
    ],
    colors: {
      bg: "#031018",
      surface: "#0B1A25",
      panel: "#122635",
      primary: "#3F83A8",
      accent: "#DDEDF4",
      danger: "#D2473E",
      parchment: "#E8F0F3",
      text: "#F0F7FA",
      muted: "#91A6B3",
    },
  },
  {
    id: "black-glass-crimson",
    name: "Black Glass Crimson",
    verdict: "Heel strak en premium. Minder D&D, meer cinematic command surface.",
    mood: "Black glass, crimson, steel white, cold graphite.",
    swatches: [
      ["bg", "Glass"],
      ["danger", "Crimson"],
      ["accent", "Steel White"],
      ["primary", "Graphite"],
    ],
    colors: {
      bg: "#050609",
      surface: "#0D1016",
      panel: "#151A22",
      primary: "#697482",
      accent: "#E9EEF2",
      danger: "#C73732",
      parchment: "#ECEFF2",
      text: "#F4F6F8",
      muted: "#9099A4",
    },
  },
];

const fallbackSwatches = [
  ["primary", "Primary"],
  ["danger", "Danger"],
  ["accent", "Light"],
  ["bg", "Dark"],
];

function getSwatches(palette) {
  return palette.swatches || fallbackSwatches;
}

function previewVars(palette) {
  return {
    "--preview-bg": palette.colors.bg,
    "--preview-depth": palette.colors.depth || "#02040a",
    "--preview-surface": palette.colors.surface,
    "--preview-panel": palette.colors.panel,
    "--preview-primary": palette.colors.primary,
    "--preview-accent": palette.colors.accent,
    "--preview-danger": palette.colors.danger,
    "--preview-paper": palette.colors.parchment,
    "--preview-text": palette.colors.text,
    "--preview-muted": palette.colors.muted,
    "--preview-button-text": palette.colors.buttonText || palette.colors.bg,
    "--preview-paper-ink": palette.colors.paperInk || "#21170d",
  };
}

export function PaletteLab() {
  const [selectedId, setSelectedId] = useState("bronze-archive-map");
  const selected = palettes.find((palette) => palette.id === selectedId) || palettes[0];

  return (
    <main className="workspace palette-lab">
      <section className="palette-lab__hero">
        <div>
          <span className="label">Design direction</span>
          <h1>Kleur Lab</h1>
          <p>
            Klik een richting aan en kijk naar de blokken, states en een mini-DM surface. Iedere optie gebruikt bewust
            maar vier hoofdkleuren, maar de opzet verschilt per idee.
          </p>
        </div>
        <div className="palette-lab__current">
          <span>Actieve preview</span>
          <strong>{selected.name}</strong>
          <p>{selected.verdict}</p>
        </div>
      </section>

      <section className="palette-lab__layout">
        <div className="palette-lab__grid" aria-label="Kleurpaletten">
          {palettes.map((palette) => (
            <button
              className={palette.id === selected.id ? "palette-card palette-card--active" : "palette-card"}
              key={palette.id}
              type="button"
              onClick={() => setSelectedId(palette.id)}
            >
              <span className="palette-card__head">
                <strong>{palette.name}</strong>
                {palette.id === selected.id ? <Check size={16} /> : null}
              </span>
              <span className="palette-card__mood">{palette.mood}</span>
              <span className="palette-card__swatches">
                {getSwatches(palette).map(([key, label]) => (
                  <span key={key} title={label} style={{ background: palette.colors[key] }} />
                ))}
              </span>
              <span className="palette-card__verdict">{palette.verdict}</span>
            </button>
          ))}
        </div>

        <section className="palette-preview" style={previewVars(selected)} aria-label={`Preview van ${selected.name}`}>
          <div className="palette-preview__nav">
            <strong>The Red Below</strong>
            <span>Home</span>
            <span className="is-active">Travel</span>
            <span>Initiative</span>
            <span>Player View</span>
          </div>

          <div className="palette-preview__surface">
            <article className="palette-preview__panel palette-preview__panel--main">
              <span>Tonight's Table</span>
              <h2>Reach Firefinger</h2>
              <p>
                Dichte jungle, warme regen, geen sterren. De party volgt Azaka's spoor terwijl de Red Wizards verder
                trekken richting Mezro.
              </p>
              <div className="palette-preview__actions">
                <button type="button"><Eye size={15} /> Start Session</button>
                <button type="button"><ScrollText size={15} /> Prep Notes</button>
              </div>
            </article>

            <article className="palette-preview__paper">
              <span>Read-aloud parchment</span>
              <p>
                The canopy closes like a cathedral of rain-dark glass. Somewhere above, wings scrape against stone.
              </p>
            </article>

            <article className="palette-preview__panel palette-preview__panel--danger">
              <span><ShieldAlert size={15} /> DM-only pressure</span>
              <strong>Threat clock critical</strong>
              <p>Zorath's expedition gains a day unless the party pushes pace.</p>
            </article>
          </div>

          <div className="palette-preview__swatch-table">
            {getSwatches(selected).map(([key, label]) => (
              <div key={key}>
                <span style={{ background: selected.colors[key] }} />
                <strong>{label}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
