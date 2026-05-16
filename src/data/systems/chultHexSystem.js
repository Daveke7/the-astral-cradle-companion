export const CHULT_HEX_COLUMNS = 72;
export const CHULT_HEX_ROWS = 85;

export const CHULT_HEX_STATUSES = [
  { id: "unknown", label: "Onbekend", tone: "neutral" },
  { id: "scouted", label: "Gescout", tone: "warning" },
  { id: "discovered", label: "Ontdekt", tone: "safe" },
  { id: "visited", label: "Bezocht", tone: "safe" },
  { id: "danger", label: "Gevaar", tone: "danger" },
  { id: "objective", label: "Objective", tone: "warning" },
];

export const CHULT_HEX_OVERLAYS = [
  { id: "route", label: "Route", defaultVisible: true, playerSafe: true },
  { id: "discovered", label: "Ontdekt", defaultVisible: true, playerSafe: true },
  { id: "locationPins", label: "Locaties", defaultVisible: true, playerSafe: true },
  { id: "notes", label: "Notities", defaultVisible: true, playerSafe: false },
  { id: "danger", label: "Gevaar", defaultVisible: true, playerSafe: false },
  { id: "dmSecrets", label: "DM secrets", defaultVisible: true, playerSafe: false },
];

export const CHULT_GRID_CALIBRATION = {
  firstCenterX: 4.22,
  lastCenterX: 95.72,
  firstCenterY: 3.15,
  lastCenterY: 96.55,
  evenColumnOffsetRows: 0.5,
};

export const CHULT_LOCATION_PINS = [
  {
    id: "port-nyanzaru",
    hex: "4122",
    label: "Port Nyanzaru",
    kind: "safe",
    playerSafe: true,
  },
  {
    id: "firefinger",
    hex: "4332",
    label: "Firefinger",
    kind: "objective",
    playerSafe: true,
  },
  {
    id: "mezro",
    hex: "5028",
    label: "Mezro",
    kind: "mystery",
    playerSafe: false,
  },
  {
    id: "fort-beluarian",
    hex: "4515",
    label: "Fort Beluarian",
    kind: "safe",
    playerSafe: true,
  },
  {
    id: "camp-vengeance",
    hex: "3028",
    label: "Camp Vengeance",
    kind: "safe",
    playerSafe: true,
  },
  {
    id: "zorath-trail",
    hex: "4923",
    label: "Thay spoor",
    kind: "danger",
    playerSafe: false,
  },
  {
    id: "orulunga",
    hex: "1834",
    label: "Orolunga",
    kind: "mystery",
    playerSafe: false,
  },
  {
    id: "kir-sabal",
    hex: "6047",
    label: "Kir Sabal",
    kind: "mystery",
    playerSafe: false,
  },
];

export const CHULT_ROUTE_PRESETS = [
  {
    id: "port-firefinger",
    name: "Port Nyanzaru -> Firefinger",
    waypoints: ["4122", "4123", "4224", "4225", "4230", "4332"],
  },
  {
    id: "direct-port-firefinger",
    name: "Direct: Port -> Firefinger",
    waypoints: ["4122", "4332"],
  },
  {
    id: "firefinger-mezro-scout",
    name: "Firefinger -> Mezro scout",
    waypoints: ["4332", "4529", "4828", "5028"],
  },
];

export function defaultChultMapOverlays() {
  return Object.fromEntries(CHULT_HEX_OVERLAYS.map((overlay) => [overlay.id, overlay.defaultVisible]));
}

export function formatHexId(column, row) {
  const safeColumn = clampNumber(Number(column) || 1, 1, CHULT_HEX_COLUMNS);
  const safeRow = clampNumber(Number(row) || 1, 1, CHULT_HEX_ROWS);
  return `${String(safeColumn).padStart(2, "0")}${String(safeRow).padStart(2, "0")}`;
}

export function parseHexId(hexId) {
  const value = String(hexId || "").trim();
  if (!/^\d{4}$/.test(value)) return null;
  const column = Number(value.slice(0, 2));
  const row = Number(value.slice(2, 4));
  if (column < 1 || column > CHULT_HEX_COLUMNS || row < 1 || row > CHULT_HEX_ROWS) return null;
  return { column, row, id: formatHexId(column, row) };
}

export function clampHexId(hexId, fallback = "4332") {
  const parsed = parseHexId(hexId) || parseHexId(fallback) || { column: 43, row: 32 };
  return formatHexId(parsed.column, parsed.row);
}

export function getHexPosition(column, row) {
  const parsedColumn = clampNumber(Number(column) || 1, 1, CHULT_HEX_COLUMNS);
  const parsedRow = clampNumber(Number(row) || 1, 1, CHULT_HEX_ROWS);
  const columnStep =
    (CHULT_GRID_CALIBRATION.lastCenterX - CHULT_GRID_CALIBRATION.firstCenterX) / (CHULT_HEX_COLUMNS - 1);
  const rowStep =
    (CHULT_GRID_CALIBRATION.lastCenterY - CHULT_GRID_CALIBRATION.firstCenterY) / (CHULT_HEX_ROWS - 1);
  const offset = parsedColumn % 2 === 0 ? rowStep * CHULT_GRID_CALIBRATION.evenColumnOffsetRows : 0;

  return {
    x: clampNumber(CHULT_GRID_CALIBRATION.firstCenterX + (parsedColumn - 1) * columnStep, 0, 100),
    y: clampNumber(CHULT_GRID_CALIBRATION.firstCenterY + (parsedRow - 1) * rowStep + offset, 0, 100),
  };
}

export function getHexPositionById(hexId) {
  const parsed = parseHexId(hexId) || parseHexId("4332");
  return getHexPosition(parsed.column, parsed.row);
}

export function positionToHexId(percentX, percentY) {
  const columnStep =
    (CHULT_GRID_CALIBRATION.lastCenterX - CHULT_GRID_CALIBRATION.firstCenterX) / (CHULT_HEX_COLUMNS - 1);
  const rowStep =
    (CHULT_GRID_CALIBRATION.lastCenterY - CHULT_GRID_CALIBRATION.firstCenterY) / (CHULT_HEX_ROWS - 1);
  const column = clampNumber(
    Math.round((Number(percentX) - CHULT_GRID_CALIBRATION.firstCenterX) / columnStep) + 1,
    1,
    CHULT_HEX_COLUMNS
  );
  const offset = column % 2 === 0 ? rowStep * CHULT_GRID_CALIBRATION.evenColumnOffsetRows : 0;
  const row = clampNumber(
    Math.round((Number(percentY) - CHULT_GRID_CALIBRATION.firstCenterY - offset) / rowStep) + 1,
    1,
    CHULT_HEX_ROWS
  );

  return formatHexId(column, row);
}

export function getNeighborHexIds(hexId) {
  const parsed = parseHexId(hexId);
  if (!parsed) return [];
  const { column, row } = parsed;
  const diagonalDelta = column % 2 === 0 ? 0 : -1;
  const candidates = [
    [column, row - 1],
    [column, row + 1],
    [column - 1, row + diagonalDelta],
    [column - 1, row + diagonalDelta + 1],
    [column + 1, row + diagonalDelta],
    [column + 1, row + diagonalDelta + 1],
  ];

  return candidates
    .filter(([candidateColumn, candidateRow]) =>
      candidateColumn >= 1 &&
      candidateColumn <= CHULT_HEX_COLUMNS &&
      candidateRow >= 1 &&
      candidateRow <= CHULT_HEX_ROWS
    )
    .map(([candidateColumn, candidateRow]) => formatHexId(candidateColumn, candidateRow));
}

export function findHexPath(startHexId, endHexId) {
  const start = parseHexId(startHexId)?.id;
  const end = parseHexId(endHexId)?.id;
  if (!start || !end) return [];
  if (start === end) return [start];

  const endPosition = getHexPositionById(end);
  const queue = [start];
  const cameFrom = new Map([[start, null]]);
  let cursor = 0;

  while (cursor < queue.length) {
    const current = queue[cursor];
    cursor += 1;

    const neighbors = getNeighborHexIds(current).sort((left, right) => {
      const leftPosition = getHexPositionById(left);
      const rightPosition = getHexPositionById(right);
      const leftDistance = squaredDistance(leftPosition, endPosition);
      const rightDistance = squaredDistance(rightPosition, endPosition);
      return leftDistance - rightDistance;
    });

    for (const neighbor of neighbors) {
      if (cameFrom.has(neighbor)) continue;
      cameFrom.set(neighbor, current);

      if (neighbor === end) {
        return reconstructHexPath(cameFrom, end);
      }

      queue.push(neighbor);
    }
  }

  return [start, end];
}

export function expandHexRoute(routeHexes = []) {
  const waypoints = normalizeHexPath(routeHexes);
  if (waypoints.length <= 1) return waypoints;

  return waypoints.slice(1).reduce(
    (path, waypoint) => {
      const segment = findHexPath(path[path.length - 1], waypoint);
      return segment.length ? [...path, ...segment.slice(1)] : path;
    },
    [waypoints[0]]
  );
}

export function createDefaultHexNote(hexId) {
  return {
    title: "",
    status: "unknown",
    terrainProfileId: "",
    terrain: "",
    travelCost: "1 dagdeel",
    playerSafe: "",
    dmNotes: "",
    encounterSeed: "",
    mapPromptSeed: "",
    tags: [],
    updatedAt: "",
    hexId: clampHexId(hexId),
  };
}

export function createDefaultChultMapState() {
  return {
    mode: "dm",
    routeTool: "select",
    selectedHex: "4332",
    zoom: 1,
    overlays: defaultChultMapOverlays(),
    discoveredHexes: ["4122", "4123", "4224", "4225", "4230", "4332"],
    publishedRouteHexes: ["4122"],
    routeHexes: ["4122", "4123", "4224", "4225", "4230", "4332"],
    routePresets: CHULT_ROUTE_PRESETS,
    activeRoutePresetId: "port-firefinger",
    pins: CHULT_LOCATION_PINS,
    notesByHex: {
      4122: {
        ...createDefaultHexNote("4122"),
        title: "Port Nyanzaru",
        status: "visited",
        terrainProfileId: "settlement",
        terrain: "Stad / kust",
        playerSafe: "De Merchant Princes hebben Cobra Kai als Envoys uitgezonden.",
        dmNotes: "Cassian is ontmaskerd maar waarschijnlijk niet dood. J'Kaar vult het machtsvacuum.",
        tags: ["hub", "merchant-princes"],
      },
      4332: {
        ...createDefaultHexNote("4332"),
        title: "Firefinger",
        status: "objective",
        terrainProfileId: "firefinger",
        terrain: "Jungle / ruine / hoogte",
        playerSafe: "Een oude Chultaanse signaaltoren steekt boven het bladerdak uit.",
        dmNotes: "Azaka's familie-masker ligt hier. Pterafolk houden de toren bezet.",
        encounterSeed: "Verticale infiltratie, pterafolk scouts, wind, valgevaar.",
        mapPromptSeed:
          "oude Chultaanse signaaltoren\nklifrichels en valgevaar\npterafolk roost platforms\ndicht bladerdak rond de toren",
        tags: ["azaka", "objective", "pterafolk"],
      },
      4923: {
        ...createDefaultHexNote("4923"),
        title: "Thayaans spoor",
        status: "danger",
        terrainProfileId: "ruins",
        terrain: "Jungle / ruinespoor",
        playerSafe: "",
        dmNotes: "Mogelijke route van Zorath's parallelle expeditie richting Mezro.",
        encounterSeed: "Uitgebrande meetcirkel, sporen gewist met conjuration magic.",
        tags: ["thay", "zorath", "dm-only"],
      },
      5028: {
        ...createDefaultHexNote("5028"),
        title: "Mezro",
        status: "unknown",
        terrainProfileId: "ruins",
        terrain: "Lost city",
        playerSafe: "",
        dmNotes: "Lange termijn bestemming. Astral Cradle niet bij naam noemen aan spelers.",
        tags: ["mezro", "astral-cradle", "dm-only"],
      },
    },
  };
}

export function normalizeChultMapState(value = {}, defaults = createDefaultChultMapState()) {
  const map = value && typeof value === "object" ? value : {};
  return {
    ...defaults,
    ...map,
    mode: map.mode === "player" ? "player" : "dm",
    routeTool: ["select", "draw", "erase"].includes(map.routeTool) ? map.routeTool : defaults.routeTool,
    selectedHex: clampHexId(map.selectedHex, defaults.selectedHex),
    zoom: clampNumber(Number(map.zoom || defaults.zoom), 0.65, 2.75),
    overlays:
      map.overlays && typeof map.overlays === "object"
        ? { ...defaults.overlays, ...map.overlays }
        : defaults.overlays,
    discoveredHexes: normalizeHexList(map.discoveredHexes, defaults.discoveredHexes),
    publishedRouteHexes: normalizeHexList(map.publishedRouteHexes, defaults.publishedRouteHexes),
    routeHexes: normalizeHexPath(map.routeHexes ?? defaults.routeHexes),
    routePresets: normalizeRoutePresets(map.routePresets, defaults.routePresets),
    activeRoutePresetId: map.activeRoutePresetId || defaults.activeRoutePresetId,
    pins: Array.isArray(map.pins) ? map.pins.map(normalizePin).filter(Boolean) : defaults.pins,
    notesByHex: normalizeNotesByHex(map.notesByHex, defaults.notesByHex),
  };
}

function normalizePin(pin) {
  const parsed = parseHexId(pin?.hex);
  if (!parsed) return null;
  const hex = parsed.id;
  return {
    id: pin.id || `pin-${hex}`,
    hex,
    label: pin.label || hex,
    kind: pin.kind || "safe",
    playerSafe: pin.playerSafe !== false,
  };
}

function normalizeNotesByHex(notesByHex = {}, defaults = {}) {
  const merged = { ...defaults, ...(notesByHex && typeof notesByHex === "object" ? notesByHex : {}) };
  return Object.fromEntries(
    Object.entries(merged)
      .map(([hexId, note]) => {
        const parsed = parseHexId(hexId);
        if (!parsed) return null;
        const normalizedHex = parsed.id;
        return [
          normalizedHex,
          {
            ...createDefaultHexNote(normalizedHex),
            ...(note && typeof note === "object" ? note : {}),
            hexId: normalizedHex,
            status: CHULT_HEX_STATUSES.some((status) => status.id === note?.status) ? note.status : "unknown",
            terrainProfileId: note?.terrainProfileId || "",
            tags: Array.isArray(note?.tags) ? note.tags.map(String).filter(Boolean) : [],
          },
        ];
      })
      .filter(Boolean)
  );
}

function normalizeHexList(values, fallback = []) {
  const source = Array.isArray(values) ? values : fallback;
  return Array.from(new Set(source.map((value) => parseHexId(value)?.id).filter(Boolean)));
}

function normalizeRoutePresets(values, fallback = CHULT_ROUTE_PRESETS) {
  const source = Array.isArray(values) && values.length ? values : fallback;
  return source
    .map((preset) => {
      const waypoints = normalizeHexPath(preset?.waypoints || preset?.routeHexes || []);
      if (!waypoints.length) return null;
      return {
        id: preset.id || `route-${waypoints.join("-")}`,
        name: preset.name || "Naamloze route",
        waypoints,
        updatedAt: preset.updatedAt || "",
      };
    })
    .filter(Boolean);
}

function normalizeHexPath(values = []) {
  return values
    .map((value) => parseHexId(value)?.id)
    .filter(Boolean)
    .filter((hexId, index, allHexes) => index === 0 || hexId !== allHexes[index - 1]);
}

function reconstructHexPath(cameFrom, end) {
  const path = [end];
  let current = cameFrom.get(end);

  while (current) {
    path.push(current);
    current = cameFrom.get(current);
  }

  return path.reverse();
}

function squaredDistance(left, right) {
  return (left.x - right.x) ** 2 + (left.y - right.y) ** 2;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
