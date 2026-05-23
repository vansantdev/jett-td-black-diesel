/* =========================================================
   Revanta OS v2 — Stable APK / PWA Core
   FULL REPLACEMENT app.js
   PART 1 / 3

   Part 1 includes:
   - safe app wrapper
   - config
   - state
   - helpers
   - profile setup
   - themes
   - voice / TTS
   - boot / tab flow
========================================================= */

(() => {
  "use strict";

  const VERSION = "Revanta OS v12 Clean Baseline";

const DEFAULT_PROFILE = {
  owner: "Driver",
  vehicleName: "Revanta Vehicle",
  make: "universal",
  model: "",
  year: "",
  engine: "",
  fuel: "Diesel",
  theme: "legacy",
  commandName: "Revanta Command"
};

const voiceModes = {
  male: {
    label: "Male",
    rate: 0.92,
    pitch: 0.85,
    startup: "Good {time} {driver}. {vehicle} systems online.",
    commandReady: "Command mode ready.",
    boost: "Boost pressure standing by.",
    coolant: "Coolant temperature standing by.",
    gps: "GPS speed system ready."
  },
  female: {
    label: "Female",
    rate: 1,
    pitch: 1.12,
    startup: "Good {time} {driver}. {vehicle} is online and ready.",
    commandReady: "I am listening.",
    boost: "Boost pressure is ready.",
    coolant: "Coolant temperature looks good.",
    gps: "GPS speed tracking is ready."
  },
  robot: {
    label: "Robot",
    rate: 0.76,
    pitch: 0.55,
    startup: "System online. {command} active. Good {time}, {driver}.",
    commandReady: "Voice input active.",
    boost: "Turbo pressure monitor active.",
    coolant: "Thermal system within range.",
    gps: "Satellite speed tracking standing by."
  },
  deepCommand: {
    label: "Deep Command",
    rate: 0.84,
    pitch: 0.66,
    startup: "Good {time} {driver}. {command} online. Awaiting orders.",
    commandReady: "Awaiting command.",
    boost: "Boost pressure standing by. Turbo system ready.",
    coolant: "Coolant system stable.",
    gps: "GPS speed system armed."
  },
  sarcastic: {
    label: "Funny / Sarcastic",
    rate: 1,
    pitch: 0.96,
    startup: "Well well well. Good {time} {driver}. The system is alive again.",
    commandReady: "Fine. I am listening.",
    boost: "Boost is standing by. Try not to pretend this is a race car.",
    coolant: "Coolant looks fine. For once, nothing is angry.",
    gps: "GPS is ready. Because apparently the speedometer called off today."
  },
  mechanic: {
    label: "Mechanic Mode",
    rate: 0.95,
    pitch: 0.8,
    startup: "Good {time} {driver}. Engine systems online. Watching boost, coolant, voltage, and driver behavior.",
    commandReady: "Mechanic voice command ready.",
    boost: "Checking turbo pressure. Keep an eye on spool and requested boost.",
    coolant: "Coolant temperature is in operating range.",
    gps: "GPS speed active."
  },
  butler: {
    label: "Butler Mode",
    rate: 0.86,
    pitch: 0.9,
    startup: "Good {time}, {driver}. Your vehicle command system is ready.",
    commandReady: "How may I assist?",
    boost: "Turbo pressure is prepared, sir.",
    coolant: "Coolant temperature appears acceptable, sir.",
    gps: "Navigation and speed tracking are ready, sir."
  },
  drill: {
    label: "Diesel Drill Sergeant",
    rate: 1.05,
    pitch: 0.7,
    startup: "Listen up, {driver}. Good {time}. {command} online. Stay sharp.",
    commandReady: "Speak up. Command mode active.",
    boost: "Turbo ready. Do not abuse it.",
    coolant: "Coolant is stable. Keep moving.",
    gps: "GPS ready. Eyes forward."
  },
  race: {
    label: "Race Mode",
    rate: 1.08,
    pitch: 0.78,
    startup: "Good {time} {driver}. Race mode armed. Boost pressure standing by. Keep it controlled.",
    commandReady: "Race command ready.",
    boost: "Boost system armed. Turbo pressure standing by.",
    coolant: "Coolant stable. Performance window acceptable.",
    gps: "GPS speed tracking active. Drive smart."
  },
  sport: {
    label: "Sport Mode",
    rate: 1,
    pitch: 0.75,
    startup: "Good {time} {driver}. Sport mode online. Throttle discipline recommended.",
    commandReady: "Sport command ready.",
    boost: "Boost ready. Smooth throttle recommended.",
    coolant: "Coolant temperature is stable.",
    gps: "GPS speed system online."
  }
};

const themeModes = {
  legacy: {
    label: "Color Shift Legacy",
    className: "theme-legacy",
    line: "Color shift legacy theme activated."
  },
  germanBlue: {
    label: "OEM German Blue",
    className: "theme-germanBlue",
    line: "O E M German blue theme activated."
  },
  dieselAmber: {
    label: "Diesel Amber",
    className: "theme-dieselAmber",
    line: "Diesel amber theme activated."
  },
  performanceRed: {
    label: "Performance Red",
    className: "theme-performanceRed",
    line: "Performance red theme activated."
  },
  stealth: {
    label: "Stealth Tactical",
    className: "theme-stealth",
    line: "Stealth tactical theme activated."
  },
  iceWhite: {
    label: "Ice White",
    className: "theme-iceWhite",
    line: "Ice white theme activated."
  }
};

let currentVoiceMode = storageGet("revantaVoiceMode", "deepCommand");
let currentThemeMode = storageGet("revantaThemeMode", "legacy");
let alertsEnabled = storageGet("revantaAlertsEnabled", "true") !== "false";
let autoThemeEnabled = storageGet("revantaAutoTheme", "false") === "true";
let voiceMuted = storageGet("revantaVoiceMuted", "false") === "true";
let voiceVolume = Number(storageGet("revantaVoiceVolume", "1"));
let voiceUnlocked = false;
let availableVoices = [];
let selectedSystemVoice = null;

let tripStart = Date.now();
let speedSamples = [];
let topSpeed = 0;
let lastAlertTimes = {};

let gpsWatchId = null;
let lastGpsPosition = null;
let lastGpsTime = null;

let obdLive = false;
let obdMode = "none";
let obdTimer = null;
let obdBusy = false;
let lastObdResponseTime = 0;
let lastPollDuration = 0;
let currentVehicleVin = "";
let lastVehicleFingerprint = "";
let vehicleChangeWatchTimer = null;
let possibleVehicleLostCount = 0;
const MAX_GRAPH_POINTS = 2000;
const GRAPH_STORAGE_KEY = "revanta_graphs";

let liveGraphData = [];
let savedPulls = [];

const savedGraphs =
  localStorage.getItem(GRAPH_STORAGE_KEY);

if (savedGraphs) {
  try {
    liveGraphData = JSON.parse(savedGraphs);
    debugLive("GRAPH RESTORE SUCCESS");
  } catch (err) {
    console.warn("GRAPH RESTORE FAILED", err);
  }
}

let adaptiveVehicleMode = "unknown";
let obdPollCount = 0;
let livePollRunning = false;
let obdBaroKpa = 101.3;
let obdLastGoodBoost = 0;
let obdBleBuffer = "";
let obdLastDeviceId = storageGet("revantaObdDeviceId", "");
let obdLastDeviceName = storageGet("revantaObdDeviceName", "");
let obdReconnectTimer = null;
let obdReconnectAttempts = 0;
let isScanningCodes = false;
let lastMafWarningTime = 0;
let vehicleProfileType = "unknown";
let supportedPids = new Set();
let liveDebugEnabled = true;
let obdProtocolName = "AUTO";
let lastBoostSeenAt = Date.now();

let vehicleCapabilities = {
  rpm: false,
  speed: false,
  coolant: false,
  intake: false,
  maf: false,
  map: false,
  boost: false,
  fuel: false,
  voltage: true
};

const VEHICLE_CALIBRATION = {
  jetta: {
    boostAtmosphereKpa: 101.3,
    boostOffsetPsi: 0,
    boostMultiplier: 1,
    rpmMultiplier: 1,
    mafMultiplier: 1
  },

  pathfinder: {
    boostAtmosphereKpa: 101.3,
    boostOffsetPsi: 0,
    boostMultiplier: 1,
    rpmMultiplier: 1,
    mafMultiplier: 1
  },

  ram: {
    boostAtmosphereKpa: 101.3,
    boostOffsetPsi: 0,
    boostMultiplier: 1,
    rpmMultiplier: 1,
    mafMultiplier: 1
  },

  universal: {
    boostAtmosphereKpa: 101.3,
    boostOffsetPsi: 0,
    boostMultiplier: 1,
    rpmMultiplier: 1,
    mafMultiplier: 1
  }
};

let vehicleCapabilityScanned = false;

let liveGaugeProof = {
  coolant: false,
  intake: false,
  maf: false,
  fuel: false,
  boost: false
};

let currentVehicleProfile = {
  name: "Unknown Vehicle",
  type: "unknown",
  turbo: false,
  lastSeen: null,
  supported: [],
  fingerprint: "",
  vin: "",
  make: "",
  model: "",
  year: ""
};

let savedGarageProfiles = [];

function saveVehicleProfile() {
  currentVehicleProfile.supported = Array.from(supportedPids || []);
  currentVehicleProfile.fingerprint = currentVehicleProfile.supported
  .slice()
  .sort()
  .join("-");
  currentVehicleProfile.turbo = !!vehicleCapabilities.boost;
  currentVehicleProfile.lastSeen = new Date().toISOString();

  storageSet(
    "revantaCurrentVehicleProfile",
    JSON.stringify(currentVehicleProfile)
  );

  updateVehicleProfileUI();
}

function decodeVinFromResponse(raw) {
  const clean = String(raw || "")
    .toUpperCase()
    .replace(/SEARCHING\.\.\./g, "")
    .replace(/SEARCHING/g, "")
    .replace(/NO DATA/g, "")
    .replace(/ERROR/g, "")
    .replace(/OK/g, "")
    .replace(/>/g, "")
    .replace(/\s+/g, "");

  if (!clean) return "";

  const plainVin = clean.match(
    /(3VW|WVW|1VW|5N1|JN8|1C6|3C6|1D7)[A-HJ-NPR-Z0-9]{14}/
  );

  if (plainVin) return plainVin[0];

  const hexPairs = clean.match(/[0-9A-F]{2}/g) || [];
  const chars = [];

  for (const hex of hexPairs) {
    const code = parseInt(hex, 16);

    if (code >= 32 && code <= 126) {
      chars.push(String.fromCharCode(code));
    }
  }

  const text = chars.join("").replace(/[^A-HJ-NPR-Z0-9]/g, "");

  const vinMatch = text.match(
    /(3VW|WVW|1VW|5N1|JN8|1C6|3C6|1D7)[A-HJ-NPR-Z0-9]{14}/
  );

  return vinMatch ? vinMatch[0] : "";
}

function getVinYear(vin) {
  const yearCode = vin?.[9];
  const years = {
    A: 2010, B: 2011, C: 2012, D: 2013, E: 2014,
    F: 2015, G: 2016, H: 2017, J: 2018, K: 2019,
    L: 2020, M: 2021, N: 2022, P: 2023, R: 2024,
    S: 2025, T: 2026
  };

  return years[yearCode] || "";
}

function getVinMake(vin) {
  const wmi = vin?.slice(0, 3).toUpperCase();

  const makes = {
    "5N1": "Nissan",
    "JN8": "Nissan",
    "3VW": "Volkswagen",
    "WVX": "Volkswagen",
    "WVW": "Volkswagen",
    "1VW": "Volkswagen",
    "1C6": "Ram",
    "3C6": "Ram",
    "1D7": "Dodge",
    "1G1": "Chevrolet",
    "1G6": "Cadillac",
    "1FM": "Ford",
    "1FT": "Ford",
    "2HK": "Honda",
    "19X": "Honda",
    "JHM": "Honda",
    "JT3": "Toyota",
    "JTD": "Toyota",
    "4T1": "Toyota"
  };

  return makes[wmi] || "";
}

function applyVinIdentity(vin) {
  if (!vin || vin.length !== 17) return;

  const year = getVinYear(vin);
  const make = getVinMake(vin);

  currentVehicleProfile.year = year || currentVehicleProfile.year || "";
  currentVehicleProfile.make = make || currentVehicleProfile.make || "";

  if (
  (year || make) &&
  (!currentVehicleProfile.name ||
    currentVehicleProfile.name === "Unknown Vehicle")
) {
  currentVehicleProfile.name =
    `${year || ""} ${make || ""}`.trim() || currentVehicleProfile.name;
}
}

async function scanVehicleVin() {
  debugLive("VIN SCAN STARTED");

  await elmCommandClassic("ATSH7E0", 1200);
  await elmCommandClassic("ATAL", 1200);

  const raw = await elmCommandClassic("0902", 7000);
  await elmCommandClassic("ATSH0000", 800);
  debugLive(`VIN RAW: ${JSON.stringify(raw)}`);
  const vin = decodeVinFromResponse(raw);

  await safeElm("0100", 1500);

  if (!vin) {
  debugLive("VIN AUTO SCAN: NOT AVAILABLE");
  debugLive("PROFILE KEPT: " + activeVehicleProfileKey.toUpperCase());
  return "";
}

  currentVehicleProfile.vin = vin;
  applyVinIdentity(vin);
  debugLive(`VIN: ${vin}`);

  saveVehicleProfile();
  return vin;
}

async function scanVehicleVinOnce() {
  debugLive("VIN AUTO SCAN START");

  let raw = await elmCommandClassic("0902", 7000);
  let vin = decodeVinFromResponse(raw);

  debugLive(`VIN RAW NORMAL: ${JSON.stringify(raw)}`);
  debugLive(`VIN DECODED NORMAL: ${vin || "NONE"}`);

  if (!vin) {
    debugLive("VIN NORMAL FAILED. TRYING VW FALLBACK.");

    await elmCommandClassic("ATSH7E0", 1200);
    await elmCommandClassic("ATAL", 1200);

    raw = await elmCommandClassic("0902", 7000);

    await elmCommandClassic("ATSH0000", 800);

    vin = decodeVinFromResponse(raw);

    debugLive(`VIN RAW VW: ${JSON.stringify(raw)}`);
    debugLive(`VIN DECODED VW: ${vin || "NONE"}`);
  }

  if (!vin) {
    debugLive("VIN AUTO SCAN: NOT AVAILABLE");
    debugLive("PROFILE KEPT: " + activeVehicleProfileKey.toUpperCase());
    return "";
  }

  currentVehicleProfile.vin = vin;
  applyVinIdentity(vin);

  const profileKey = detectProfileFromVin(vin);
  activeVehicleProfileKey = profileKey;

  applyVisualVehicleProfile(profileKey);
  showProfileReload(profileKey);

  currentVehicleProfile.name =
    VEHICLE_PROFILES[profileKey]?.name ||
    currentVehicleProfile.name ||
    "Unknown Vehicle";

  saveVehicleProfile();

  debugLive(`VIN AUTO SCAN: ${vin}`);
  debugLive(`VIN PROFILE SET: ${profileKey.toUpperCase()}`);

  return vin;
}



function detectProfileFromVin(vin) {
  const cleanVin = String(vin || "").toUpperCase();

  if (
    cleanVin.startsWith("3VW") ||
    cleanVin.startsWith("WVW") ||
    cleanVin.startsWith("1VW")
  ) {
    return "jetta";
  }

  if (
    cleanVin.startsWith("5N1") ||
    cleanVin.startsWith("JN8")
  ) {
    return "pathfinder";
  }

  if (
    cleanVin.startsWith("1C6") ||
    cleanVin.startsWith("3C6") ||
    cleanVin.startsWith("1D7")
  ) {
    return "ram";
  }

  return "universal";
}

async function manualVinScan() {
  if (!obdLive || obdMode !== "classic") {
    speak("Connect O B D first.");
    return;
  }

  try {
    await scanVehicleVin();
    updateVehicleProfileUI();
    speak("VIN scan complete.");
  } catch (err) {
    console.warn("Manual VIN scan failed:", err);
    speak("VIN scan failed.");
  }
}

window.manualVinScan = manualVinScan;

function saveCurrentVehicleToGarage() {
  if (
    !currentVehicleProfile.name ||
    currentVehicleProfile.name === "Unknown Vehicle"
  ) {
    speak("Name the vehicle first.");
    return;
  }

  const existingIndex = savedGarageProfiles.findIndex(
    (v) => v.name === currentVehicleProfile.name
  );

  if (existingIndex >= 0) {
    savedGarageProfiles[existingIndex] = {
      ...currentVehicleProfile
    };
  } else {
    savedGarageProfiles.push({
      ...currentVehicleProfile
    });
  }

  storageSet(
    "revantaGarageProfiles",
    JSON.stringify(savedGarageProfiles)
  );

  localStorage.setItem(
  "revantaGarageProfiles",
  JSON.stringify(savedGarageProfiles)
);

  renderGarageList();

  speak(`${currentVehicleProfile.name} added to garage.`);
}

window.saveCurrentVehicleToGarage = saveCurrentVehicleToGarage;

function renderGarageList() {
  const garageList = document.getElementById("garageList");

  if (!garageList) return;

  if (!savedGarageProfiles.length) {
    garageList.innerHTML = `
      <p>No saved vehicles yet.</p>
    `;
    return;
  }

  garageList.innerHTML = savedGarageProfiles
    .map(
      (vehicle) => `
        <button class="big-btn"
          onclick="loadGarageVehicle('${vehicle.name}')">
          ${vehicle.name}
        </button>
      `
    )
    .join("");
}

function loadGarageVehicle(name) {
  const found = savedGarageProfiles.find(
    (v) => v.name === name
  );

  if (!found) return;

  currentVehicleProfile = {
    ...found
  };

  updateVehicleProfileUI();
  saveVehicleProfile();

  speak(`${name} profile loaded.`);
}

window.loadGarageVehicle = loadGarageVehicle;

function loadVehicleProfile() {
  try {
    const saved = storageGet("revantaCurrentVehicleProfile", "");

    const garageSaved =
      storageGet("revantaGarageProfiles", "") ||
      localStorage.getItem("revantaGarageProfiles") ||
      "[]";

    savedGarageProfiles = JSON.parse(garageSaved);
    renderGarageList();
    if (!saved) {
      updateVehicleProfileUI();
      return;
    }
    const parsed = JSON.parse(saved);
    currentVehicleProfile = {
      ...currentVehicleProfile,
      ...parsed
    };

    updateVehicleProfileUI();

  } catch (err) {
    console.warn("Vehicle profile load failed", err);
  }
}

function tryAutoLoadGarageProfile() {
  if (!currentVehicleProfile.fingerprint) return;

  const match = savedGarageProfiles.find(
    (v) => v.fingerprint === currentVehicleProfile.fingerprint
  );

  if (!match) {
    debugLive("GARAGE: No matching profile found.");
    return;
  }

  currentVehicleProfile = {
    ...currentVehicleProfile,
    ...match
  };

  updateVehicleProfileUI();

  debugLive(`GARAGE: Auto-loaded ${match.name}`);
  speak(`${match.name} profile loaded.`);
}

function updateVehicleProfileUI() {
  setValue("vehicleProfileName", currentVehicleProfile.name || "Unknown Vehicle");
  const profileType =
  currentVehicleProfile.turbo
    ? "Turbo / Boosted"
    : currentVehicleProfile.type === "naturally aspirated"
      ? "Naturally Aspirated"
      : "Unknown";

setValue("vehicleProfileType", `Type: ${profileType}`);
  setValue(
    "vehicleProfileTurbo",
    currentVehicleProfile.turbo ? "TURBO" : "N/A"
  );

  setValue(
    "vehicleProfileSupported",
    `${currentVehicleProfile.supported?.length || 0} supported signals`
  );

  setValue(
    "vehicleProfileVin",
    currentVehicleProfile.vin
    ? `VIN: ${currentVehicleProfile.vin}`
    : "VIN: Not scanned yet."
  );

  setValue(
    "vehicleProfileLastSeen",
    currentVehicleProfile.lastSeen
    ? `Last Seen: ${new Date(currentVehicleProfile.lastSeen).toLocaleString()}`
    : "Last Seen: Never"
  );

  setValue(
    "vehicleProfileQuality",
    obdLive ? "Connection: Live" : "Connection: Offline"
  );

const nameInput = $("vehicleNameInput");
if (nameInput) {
  nameInput.value =
    currentVehicleProfile.name === "Unknown Vehicle"
      ? ""
      : currentVehicleProfile.name;
}
}

function saveVehicleName() {
  const input = $("vehicleNameInput");
  const name = input?.value?.trim();

  if (!name) {
    speak("Enter a vehicle name first.");
    return;
  }

  currentVehicleProfile.name = name;

  saveVehicleProfile();

  speak(`${name} profile saved.`);
}

window.saveVehicleName = saveVehicleName;

function toggleLiveDebugPanel() {
  const debugPanel = document.getElementById("liveDebugPanel");

  if (!debugPanel) {
    alert("Live debug panel not found");
    return;
  }

  debugPanel.classList.toggle("hidden");

  const isHidden = debugPanel.classList.contains("hidden");

  speak(isHidden ? "Live debug hidden." : "Live debug enabled.");
}

window.toggleLiveDebugPanel = toggleLiveDebugPanel;

let drivingState = "standby";
let lastDrivingState = "standby";

const VEHICLE_PROFILES = {

  universal: {
  name: "REVANTA",
  boot: "assets/profiles/universal/boot.jpg",
  logo: "assets/profiles/universal/logo.png",
  theme: "legacy",
},

  jetta: {
    name: "JETT TD",
    boot: "assets/profiles/jetta/boot.jpg",
    logo: "assets/profiles/jetta/logo.png",
    theme: "diesel",
  },

  pathfinder: {
    name: "PATHFINDER",
    boot: "assets/profiles/pathfinder/boot.jpg",
    logo: "assets/profiles/pathfinder/logo.png",
    theme: "adventure",
  },

  ram: {
    name: "RAM 1500",
    boot: "assets/profiles/ram/boot.jpg",
    logo: "assets/profiles/ram/logo.png",
    theme: "heavyDuty",
  }
};

let activeVehicleProfileKey = "universal";

function applyVisualVehicleProfile(profileKey) {
  const profile = VEHICLE_PROFILES[profileKey];

  if (!profile) return;

  activeVehicleProfileKey = profileKey;

  const bootImage = $("bootVehicleImage");

  if (bootImage) {
    bootImage.src = profile.boot;
    debugLive(`BOOT IMAGE SET: ${profile.boot}`);
    bootImage.onerror = () => debugLive(`BOOT IMAGE FAILED: ${profile.boot}`);
    bootImage.onload = () => debugLive(`BOOT IMAGE LOADED: ${profile.boot}`);
  }

  const appLogo = $("appLogo");

  if (appLogo) {
    appLogo.src = profile.logo;
  }

  document.body.setAttribute("data-theme", profile.theme);

  debugLive(`PROFILE LOADED: ${profile.name}`);
}

let liveMetrics = {
  rpm: null,
  speed: null,
  boost: null,
  maf: null,
  coolant: null,
  voltage: null,
  intake: null,
  fuel: null,
  topSpeed: 0,
  peakRpm: 0,
  peakBoost: 0
};

let smoothGaugeValues = {
  rpmValue: 0,
  speedValue: 0,
  boostValue: 0,
  mafValue: 0
};

let wakeListening = false;
let wakeRecognition = null;

const TDI_CALIBRATION = {
  boostAtmosphereKpa: 90,
  maxBoostPsi: 35,
  rpmMin: 350,
  rpmMax: 5500,
  voltageMin: 8,
  voltageMax: 16.5,
  coolantMin: -40,
  coolantMax: 260,
  intakeMin: -40,
  intakeMax: 220
};

let obdLastGood = {
  rpm: null,
  speed: null,
  boost: null,
  coolant: null,
  intake: null,
  voltage: null
};

const performance = {
  zeroToSixtyActive: false,
  zeroToSixtyStart: null,
  bestZeroToSixty: storageGet("revantaBest060", "--"),
  peakBoost: 0,
  maxRpm: 0,
  spoolMode: false,
  ambientGlow: true,
  securityMode: false
};

function $(id) {
  return document.getElementById(id);
}

function qa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function storageGet(key, fallback = "") {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {}
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function setValue(id, value) {
  const el = $(id);
  if (!el) return;

  el.textContent = String(value);
  el.classList.add("value-pop");

  window.setTimeout(() => {
    el.classList.remove("value-pop");
  }, 180);
}

function setHTML(id, html) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = html;
}

const activeAnimations = {};

function getText(id, fallback = "") {
  const el = $(id);
  return el ? el.textContent : fallback;
}

function logCommand(message) {
  const final = String(message || "");
  setValue("commandLog", final);
  console.log("[REVANTA]", final);
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, Number(num) || 0));
}

function capPlugin(name) {
  return window.Capacitor?.Plugins?.[name] || window.Capacitor?.[name] || null;
}

function getVehicleProfile() {
  try {
    const saved = localStorage.getItem("vehicleProfile");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function getActiveProfile() {
  return getVehicleProfile() || { ...DEFAULT_PROFILE };
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function personalizeLine(text) {
  const p = getActiveProfile();

  return String(text || "")
    .replaceAll("{time}", getTimeGreeting())
    .replaceAll("{driver}", p.owner || "Driver")
    .replaceAll("{vehicle}", p.vehicleName || "Vehicle")
    .replaceAll("{command}", p.commandName || "Vehicle Command");
}

function applyVehicleProfile() {
  const p = getActiveProfile();

  const profileKey =
  (p.make || "universal")
    .toLowerCase()
    .replace(/\s/g, "");

const bootBg = $("bootVehicleImage");
const bootLogo = $("bootVehicleLogo");

if (bootBg) {
  bootBg.src = `assets/profiles/${profileKey}/boot.jpg`;
}

if (bootLogo) {
  bootLogo.src = `assets/profiles/${profileKey}/logo.png`;
}

setValue(
  "bootVehicleName",
  p.vehicleName || "REVANTA OS"
);

  qa(".top-bar h1").forEach((el) => {
    el.textContent = p.vehicleName || "Revanta Vehicle";
  });

  setValue("pageTitle", p.commandName || "Revanta Command");
  document.title = `${p.vehicleName || "Vehicle"} ${p.commandName || "Command"}`;

  if (p.theme && themeModes[p.theme]) {
    currentThemeMode = p.theme;
    storageSet("revantaThemeMode", p.theme);
  }

  applyTheme();
}

function saveSetupProfile() {
    const profile = {
    owner: $("setupOwner")?.value?.trim() || "Driver",
    vehicleName: $("setupVehicleName")?.value?.trim() || "Revanta Vehicle",
    make: $("setupMake")?.value?.trim() || "",
    model: $("setupModel")?.value?.trim() || "",
    year: $("setupYear")?.value?.trim() || "",
    engine: $("setupEngine")?.value?.trim() || "",
    fuel: $("setupFuel")?.value || "Diesel",
    theme: $("setupTheme")?.value || "legacy",
    commandName: $("setupCommandName")?.value?.trim() || "Revanta Command"
  };

  try {
    localStorage.setItem("vehicleProfile", JSON.stringify(profile));
  } catch {}

  storageSet("revantaSetupComplete", "true");
  storageSet("revantaThemeMode", profile.theme);
  currentThemeMode = profile.theme;

  applyVehicleProfile();
  showBootScreen();
  speak(`${profile.vehicleName} profile saved. ${profile.commandName} online.`);
}

function exportVehicleProfile() {

  if (!requirePro("Vehicle profile export")) return;

  const text = JSON.stringify(getActiveProfile(), null, 2);

  navigator.clipboard?.writeText(text)
    .then(() => speak("Vehicle profile copied to clipboard."))
    .catch(() => {
      logCommand(text);
      speak("Vehicle profile displayed in the system log.");
    });
}

function factoryReset() {
  [
    "vehicleProfile",
    "revantaSetupComplete",
    "revantaVoiceMode",
    "revantaThemeMode",
    "revantaAlertsEnabled",
    "revantaAutoTheme",
    "revantaBest060",
    "revantaVoiceMuted",
    "revantaVoiceVolume",
    "revantaObdDeviceId",
    "revantaObdDeviceName",
    "revantaCodeHistory",
    "revantaCurrentVehicleProfile",
    "revantaGarageProfiles",
    "revantaPulls",
    "revanta_graphs"
  ].forEach(storageRemove);

  speak("Factory reset complete. Reloading Revanta.");

  window.setTimeout(() => {
    location.reload();
  }, 900);
}

function applyTheme() {
  const theme = themeModes[currentThemeMode] || themeModes.legacy;

  document.body.classList.remove(
    ...Object.values(themeModes).map((t) => t.className)
  );

  document.body.classList.add(theme.className);
  document.body.classList.toggle("ambient-drive-glow", !!performance.ambientGlow);
  document.body.classList.toggle("spool-mode", !!performance.spoolMode);
  document.body.classList.toggle("security-mode", !!performance.securityMode);
  document.body.classList.toggle("auto-theme-on", !!autoThemeEnabled);

  setValue("currentThemeLabel", `Current Theme: ${theme.label}`);
}

function setThemeMode(themeName, silent = false) {
  if (!themeModes[themeName]) return;

  currentThemeMode = themeName;
  storageSet("revantaThemeMode", themeName);
  applyTheme();

  if (!silent) {
    speak(themeModes[themeName].line);
  }
}

function toggleAlerts() {
  alertsEnabled = !alertsEnabled;
  storageSet("revantaAlertsEnabled", alertsEnabled ? "true" : "false");
  updateSystemLabels();
  speak(alertsEnabled ? "Driving alerts enabled." : "Driving alerts disabled.");
}

function toggleAutoTheme() {
  autoThemeEnabled = !autoThemeEnabled;
  storageSet("revantaAutoTheme", autoThemeEnabled ? "true" : "false");
  updateSystemLabels();
  applyTheme();
  speak(autoThemeEnabled ? "Auto theme logic enabled." : "Auto theme logic disabled.");
}

function updateSystemLabels() {
  setValue("alertStatus", `Driving Alerts: ${alertsEnabled ? "Enabled" : "Disabled"}`);
  setValue("autoThemeStatus", `Auto Theme: ${autoThemeEnabled ? "Enabled" : "Disabled"}`);
  setValue("wakeStatus", `Wake Word: ${wakeListening ? "On" : "Off"}`);
  setValue("wakeStatusTop", wakeListening ? "WAKE ON" : "WAKE OFF");
}

function updateHeaderBadges() {
  setValue("gpsHeaderStatus", `GPS ${getText("gpsStatus", "STANDBY")}`);
  setValue("weatherHeaderStatus", getText("weatherStatus", "WEATHER READY"));
  setValue("batteryHeaderStatus", `BATTERY ${getText("batteryValue", "-- V")}`);
}

function showBootScreen() {
  $("setupScreen")?.classList.add("hidden");

  const boot = $("bootScreen");
  const dash = $("dashboard");

  if (boot) {
    boot.classList.remove("hidden", "boot-hidden");
    boot.style.display = "flex";
  }

  if (dash) {
    dash.classList.add("hidden");
    dash.style.display = "none";
  }

  applyTheme();
}

function skipSetup() {
  storageSet("revantaSetupComplete", "true");
  showBootScreen();
}

function runSetupWizard() {
  const profile = getActiveProfile();

  $("setupScreen")?.classList.remove("hidden");
  $("bootScreen")?.classList.add("hidden");
  $("dashboard")?.classList.add("hidden");

  if ($("setupOwner")) $("setupOwner").value = profile.owner || "";
  if ($("setupVehicleName")) $("setupVehicleName").value = profile.vehicleName || "";
  if ($("setupMake")) $("setupMake").value = profile.make || "";
  if ($("setupModel")) $("setupModel").value = profile.model || "";
  if ($("setupYear")) $("setupYear").value = profile.year || "";
  if ($("setupEngine")) $("setupEngine").value = profile.engine || "";
  if ($("setupFuel")) $("setupFuel").value = profile.fuel || "Diesel";
  if ($("setupTheme")) $("setupTheme").value = profile.theme || "legacy";
  if ($("setupCommandName")) $("setupCommandName").value = profile.commandName || "";

  logCommand("Setup wizard opened.");
}

function unlockVoice() {
  voiceUnlocked = true;
}

function loadVoices() {
  try {
    availableVoices = window.speechSynthesis?.getVoices?.() || [];
    selectedSystemVoice =
      availableVoices.find((v) => /male|david|mark|google us english/i.test(v.name)) ||
      availableVoices[0] ||
      null;
  } catch {
    selectedSystemVoice = null;
  }
}

function speak(text) {
  if (voiceMuted) return;

  const finalText = personalizeLine(text || "");
  console.log("[REVANTA VOICE]", finalText);

  try {
    const NativeTTS = capPlugin("TextToSpeech");

    if (NativeTTS?.speak) {
      NativeTTS.speak({
        text: finalText,
        lang: "en-US",
        rate: 1.0,
        pitch: 1.0,
        volume: voiceVolume
      });
      return;
    }
  } catch {}

  try {
    if (!window.speechSynthesis) return;

    const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
    const utterance = new SpeechSynthesisUtterance(finalText);

    utterance.rate = mode.rate || 1;
    utterance.pitch = mode.pitch || 1;
    utterance.volume = voiceVolume;

    if (selectedSystemVoice) utterance.voice = selectedSystemVoice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("TTS failed.", err);
  }
}

function speakCurrentStartup() {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  speak(mode.startup || "Revanta systems online.");
}

function speakModeLine(key) {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  speak(mode[key] || "System ready.");
}

function updateVoiceLabel() {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  setValue("currentVoiceLabel", `Current Voice: ${mode.label}`);
}

function setVoiceMode(modeName) {
  if (!voiceModes[modeName]) return;

  currentVoiceMode = modeName;
  storageSet("revantaVoiceMode", modeName);
  updateVoiceLabel();
  speak(`${voiceModes[modeName].label} activated.`);
}

function volumeUp() {
  voiceVolume = clamp(voiceVolume + 0.1, 0, 1);
  storageSet("revantaVoiceVolume", voiceVolume);
  speak("Voice volume increased.");
}

function volumeDown() {
  voiceVolume = clamp(voiceVolume - 0.1, 0, 1);
  storageSet("revantaVoiceVolume", voiceVolume);
  speak("Voice volume decreased.");
}

function muteVoice() {
  voiceMuted = true;
  storageSet("revantaVoiceMuted", "true");
  setValue("commandLog", "Voice muted.");
}

function unmuteVoice() {
  voiceMuted = false;
  storageSet("revantaVoiceMuted", "false");
  speak("Voice restored.");
}

function testCurrentVoice() {
  speak("Revanta voice test successful.");
}

function testNativeTTS() {
  speak("Native voice test active.");
}

function beep(type = "chime") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = type === "warning" ? 880 : 520;
    gain.gain.value = 0.08;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {}
}

function systemChime() {
  beep("chime");
  speak("System chime.");
}

function playStartupSound() {
  beep("chime");
  setTimeout(() => beep("chime"), 180);
}

function playWarningTone() {
  beep("warning");
  speak("Warning tone.");
}

loadVoices();
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function startSystem() {
  playStartupSound();

document.body.classList.add("revanta-starting");

setTimeout(() => {
  document.body.classList.remove("revanta-starting");
}, 1400);
  unlockVoice();
  applyVisualVehicleProfile(activeVehicleProfileKey || "universal");

  const setup = $("setupScreen");
  const boot = $("bootScreen");
  const dash = $("dashboard");

  if (setup) setup.classList.add("hidden");
  if (boot) {
  boot.classList.add("hidden");
  boot.classList.add("boot-hidden");
  boot.style.display = "none";
  boot.style.visibility = "hidden";
  boot.style.pointerEvents = "none";
}

  if (dash) {
  dash.classList.remove("hidden");
  dash.style.display = "block";
  dash.style.visibility = "visible";
  dash.style.pointerEvents = "auto";
}

  try { applyTheme(); } catch (e) { console.warn(e); }
  try { updateVoiceLabel(); } catch (e) { console.warn(e); }
  try { updateSystemLabels(); } catch (e) { console.warn(e); }
  try { updateHeaderBadges(); } catch (e) { console.warn(e); }
  try { resetGaugeDisplay(); } catch (e) { console.warn(e); }
  try { updateCopilotBlocks(); } catch (e) { console.warn(e); }
  try { syncNavGauges(); } catch (e) { console.warn(e); }
  try { updateTripTime(); } catch (e) { console.warn(e); }
  try { renderCodeHistory(); } catch (e) { console.warn(e); }

  document.body.classList.remove("revanta-starting");

const app = document.querySelector(".app");
if (app) {
  app.style.display = "block";
  app.style.visibility = "visible";
  app.style.opacity = "1";
}

const bootScreen = $("bootScreen");
if (bootScreen) {
  bootScreen.classList.add("hidden", "boot-hidden");
  bootScreen.style.display = "none";
  bootScreen.style.visibility = "hidden";
  bootScreen.style.opacity = "0";
  bootScreen.style.pointerEvents = "none";
}

const dashboardScreen = $("dashboard");
if (dashboardScreen) {
  dashboardScreen.classList.remove("hidden");
  dashboardScreen.style.display = "block";
  dashboardScreen.style.visibility = "visible";
  dashboardScreen.style.opacity = "1";
  dashboardScreen.style.pointerEvents = "auto";
}

  window.setTimeout(() => {
    try { speakCurrentStartup(); } catch (e) { console.warn(e); }
  }, 250);
}

function showTab(tabName) {
  qa(".tab").forEach((tab) => {
    tab.classList.remove("active", "fade-in");
  });

  const selected = $(`${tabName}Tab`);

  if (selected) {
    selected.classList.add("active");

    window.setTimeout(() => {
      selected.classList.add("fade-in");
    }, 10);
  }

  document.body.classList.remove(
    "tab-dash",
    "tab-performance",
    "tab-diagnostics",
    "tab-nav",
    "tab-command",
    "tab-copilot",
    "tab-upgrade",
    "tab-settings"
  );

  document.body.classList.add(`tab-${tabName}`);

  const profile = getActiveProfile();

  const titles = {
    dash: profile.commandName || "Revanta Command",
    performance: "PERFORMANCE",
    diagnostics: "DIAGNOSTICS",
    command: "SYSTEM CONTROL",
    copilot: "COPILOT",
    nav: "NAVIGATION",
    upgrade: "REVANTA PLUS / PRO",
    settings: "SYSTEM SETTINGS"
  };

  setValue("pageTitle", titles[tabName] || profile.commandName || "Vehicle Command");
  syncNavGauges();
}

function goFullscreen() {
  try {
    const el = document.documentElement;

    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen();
      document.body.classList.add("immersive-mode");
      speak("Immersive display mode activated.");
      return;
    }

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
      document.body.classList.remove("immersive-mode");
      speak("Immersive display mode disabled.");
    }
  } catch (err) {
    console.warn("Fullscreen failed.", err);
    speak("Fullscreen mode is not available.");
  }
}
    /* =========================
   GPS + WEATHER
========================= */

async function startGpsSpeed() {
  const Geo = capPlugin("Geolocation");

  if (!Geo && !navigator.geolocation) {
    speak("GPS is not available on this device.");
    setValue("gpsStatus", "NO GPS");
    updateHeaderBadges();
    return;
  }

  try {
    if (gpsWatchId !== null) {
      if (Geo) {
        await Geo.clearWatch({ id: gpsWatchId });
      } else {
        navigator.geolocation.clearWatch(gpsWatchId);
      }

      gpsWatchId = null;
    }

    speak("GPS speed mode activated.");
    setValue("gpsStatus", "SEARCHING");
    setValue("gpsHeaderStatus", "GPS SEARCHING");

    if (Geo) {
      try {
        const perm = await Geo.checkPermissions();

        if (perm.location !== "granted" && perm.coarseLocation !== "granted") {
          await Geo.requestPermissions();
        }
      } catch (err) {
        console.warn("GPS permission check failed.", err);
      }

      gpsWatchId = await Geo.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        },
        (position, error) => {
          if (error || !position) {
            console.warn("GPS error:", error);
            setValue("gpsStatus", "BLOCKED");
            setValue("gpsHeaderStatus", "GPS BLOCKED");
            speak("GPS permission denied or unavailable.");
            return;
          }

          handleGpsPosition(position);
        }
      );

      return;
    }

    gpsWatchId = navigator.geolocation.watchPosition(
      handleGpsPosition,
      () => {
        setValue("gpsStatus", "BLOCKED");
        setValue("gpsHeaderStatus", "GPS BLOCKED");
        speak("GPS permission denied or unavailable.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      }
    );
  } catch (err) {
    console.warn("GPS start failed.", err);
    setValue("gpsStatus", "ERROR");
    setValue("gpsHeaderStatus", "GPS ERROR");
    speak("GPS system failed to start.");
  }
}

function updateDrivingHud(speed, rpm, boost, coolant) {
  setValue("hudSpeed", Math.round(speed || 0));
  setValue("hudRpm", Math.round(rpm || 0));
  setValue("hudBoost", `${Number(boost || 0).toFixed(1)} PSI`);
  setValue("hudCoolant", `${Math.round(coolant || 0)}°`);
}

function handleGpsPosition(position) {
  const now = Date.now();
  const coords = position.coords || {};
  const accuracy = coords.accuracy ?? 999;

  if (accuracy > 75) {
    setValue("gpsStatus", "WEAK");
    setValue("gpsHeaderStatus", "GPS WEAK");
    return;
  }

  const lat = coords.latitude;
  const lon = coords.longitude;
  const nativeSpeed = coords.speed;

  if (typeof lat !== "number" || typeof lon !== "number") return;

  let mph = 0;

  if (nativeSpeed !== null && nativeSpeed !== undefined && nativeSpeed >= 0) {
    mph = Math.round(nativeSpeed * 2.23694);
  } else if (lastGpsPosition && lastGpsTime) {
    const meters = getDistanceMeters(lastGpsPosition.lat, lastGpsPosition.lon, lat, lon);
    const seconds = (now - lastGpsTime) / 1000;

    if (seconds > 0) {
      mph = Math.round((meters / seconds) * 2.23694);
    }
  }

  lastGpsPosition = { lat, lon };
  lastGpsTime = now;

  if (mph < 3) mph = 0;

  const lastSpeed = Number(getText("speedValue", "0")) || 0;

  if (Math.abs(mph - lastSpeed) > 12 && lastSpeed > 0) {
    mph = Math.round((mph + lastSpeed) / 2);
  }

  if (!obdLive || Number(getText("speedValue", "0")) === 0) {
  setValue("speedValue", mph);
}

document.body.classList.remove("drive-mode");

setValue("gpsStatus", "ACTIVE");
  setValue("gpsStatus", "ACTIVE");
  setValue("gpsHeaderStatus", "GPS ACTIVE");
  setValue("sourceStatus", obdLive ? "OBD + GPS" : "GPS");

  updateSpeedStats(mph);

  const rpm = Number(getText("rpmValue", "0")) || 0;
  const boost = Number(getText("boostValue", "0")) || 0;
  const coolant = Number(getText("coolantValue", "0")) || 0;

  checkDrivingAlerts(mph, rpm, boost, coolant);
  updateAmbientGlow(mph, rpm, boost);
  checkZeroToSixty(mph);
  updateHeaderBadges();
  syncNavGauges();
  updateDrivingHud(mph, rpm, boost, coolant);


  updateTacticalCopilot({
  speed: mph,
  rpm,
  boost,
  coolant,
  voltage: Number(getText("batteryValue", "0"))
});

updateObdIntelligence({
  rpm,
  boost,
  maf: Number(getText("mafValue", "0")) || 0,
  coolant,
  voltage: Number(getText("batteryValue", "0")) || 0
});
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function getCurrentPositionSafe() {
  const Geo = capPlugin("Geolocation");

  if (Geo) {
    try {
      const perm = await Geo.checkPermissions();

      if (perm.location !== "granted" && perm.coarseLocation !== "granted") {
        await Geo.requestPermissions();
      }

      return await Geo.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    } catch (err) {
      console.warn("Capacitor position failed.", err);
    }
  }

  if (!navigator.geolocation) {
    throw new Error("Location unavailable");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    });
  });
}

function updateWeatherUI(temp, condition) {
  const text = `${temp}°F ${condition}`;

  setValue("weatherStatus", text);
  setValue("weatherHeaderStatus", text);
  setValue("navWeather", text);
  setValue("weatherTemp", `${temp}°`);
  setValue("weatherCondition", condition);
  setValue("navWeather", `${temp}°F ${condition}`);

  // Tactical radar styling
  const radar = $("navWeather");

  if (radar) {
    radar.innerHTML = `
      <div class="weather-radar-live">
        <div class="weather-temp">${temp}°F</div>
        <div class="weather-condition">${condition}</div>
      </div>
    `;
  }
}
async function weatherLayer() {
  try {
    setValue("weatherStatus", "LOCATING");
    setValue("weatherHeaderStatus", "WEATHER LOCATING");
    setValue("navWeather", "LOCATING");

    const position = await getCurrentPositionSafe();
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
      `&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&temperature_unit=fahrenheit`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Weather API failed");
    }

    const data = await response.json();
    const temp = Math.round(data.current.temperature_2m);
    const condition = weatherCodeToText(data.current.weather_code);

    updateWeatherUI(temp, condition);

    speak(`Current outside temperature is ${temp} degrees with ${condition.toLowerCase()} conditions.`);
  } catch (err) {
  console.warn("Weather failed.", err);

  setValue("weatherStatus", "ERROR");
  setValue("weatherHeaderStatus", "WEATHER ERROR");
  setValue("navWeather", "ERROR");

  setValue("weatherTemp", "--°");
  setValue("weatherCondition", "UNAVAILABLE");

  speak("Weather system failed or location permission is blocked.");
}
}

function weatherCodeToText(code) {
  if (code === 0) return "CLEAR";
  if (code >= 1 && code <= 3) return "CLOUDY";
  if (code >= 45 && code <= 48) return "FOG";
  if (code >= 51 && code <= 67) return "RAIN";
  if (code >= 71 && code <= 77) return "SNOW";
  if (code >= 80 && code <= 82) return "SHOWERS";
  if (code >= 95) return "STORM";
  return "ACTIVE";
}

function updateTacticalCopilot({
  speed = 0,
  rpm = 0,
  boost = 0,
  coolant = 0,
  voltage = 0
} = {}) {

  let status = "Tactical systems standing by.";

  if (coolant >= 230) {
    status = "CRITICAL: Coolant temperature high. Reduce load and check engine temperature.";
  } else if (voltage > 0 && voltage < 12.1) {
    status = "WARNING: Battery voltage low. Check charging system.";
  } else if (boost >= 20) {
    status = "BOOST ALERT: High boost detected. Monitor turbo load.";
  } else if (rpm >= 4200) {
    status = "RPM ALERT: High engine speed detected.";
  } else if (speed > 5) {
    status = "Drive mode active. Monitoring engine, boost, and power systems.";
  }

  setValue("copilotStatus", status);
}

function updateObdIntelligence({ rpm = 0, boost = 0, maf = 0, coolant = 0, voltage = 0 } = {}) {
  let intel = "OBD intelligence standing by.";

  if (coolant >= 230) {
    intel = "CRITICAL: Coolant is above safe range.";
  } else if (voltage > 0 && voltage < 12.1) {
    intel = "LOW VOLTAGE: Check alternator, battery, and grounds.";
  } else if (boost >= 18 && maf > 0 && maf < 45) {
    intel = "BOOST / MAF MISMATCH: Possible boost leak, intake restriction, or MAF issue.";
  } else if (rpm > 2500 && boost < 3) {
    intel = "LOW BOOST UNDER LOAD: Check vacuum lines, actuator, N75, intake leaks, or turbo control.";
  } else if (boost >= 20) {
    intel = "HIGH BOOST EVENT: Monitor turbo load and fueling.";
  }

  setValue("copilotStatus", intel);
}

/* =========================
   GAUGES / DASHBOARD
========================= */

function resetGaugeDisplay() {
  setValue("speedValue", "--");
  setValue("rpmValue", "--");
  setValue("boostValue", "--");
  setValue("coolantValue", "--");
  setValue("batteryValue", "-- V");
  setValue("mafValue", "--");
  setValue("intakeValue", "-- °F");
  setValue("fuelStatus", "--");
  setValue("gpsStatus", "GPS READY");
  setValue("sourceStatus", "LIVE READY");
  setValue("obdStatus", "STANDBY");

  setValue("avgSpeed", "0 MPH");
  setValue("topSpeed", "0 MPH");
  setValue("peakBoost", "0.0 PSI");
  setValue("maxRpm", "0 RPM");

  syncNavGauges();
  updateHeaderBadges();
}

function updateFuelStatus(value = "--") {
  setValue("fuelStatus", value);
}

function updateSpeedStats(speed) {
  const safeSpeed = Number.isFinite(Number(speed)) ? Number(speed) : 0;

  topSpeed = Math.max(topSpeed, safeSpeed);
  speedSamples.push(safeSpeed);

  if (speedSamples.length > 300) {
    speedSamples.shift();
  }

  const avg =
    speedSamples.length > 0
      ? Math.round(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length)
      : 0;

  setValue("avgSpeed", `${avg} MPH`);
  setValue("topSpeed", `${Math.round(topSpeed)} MPH`);
  setValue("perfTopSpeed", `${Math.round(topSpeed)} MPH`);

  updatePerformanceScores();
}

function updatePerformanceScores() {
  const rpm = Number(getText("rpmValue", "0")) || 0;
  const boost = Number(getText("boostValue", "0")) || 0;

  performance.peakBoost = Math.max(performance.peakBoost, boost);
  performance.maxRpm = Math.max(performance.maxRpm, rpm);

  setValue("peakBoost", `${performance.peakBoost.toFixed(1)} PSI`);
  setValue("maxRpm", `${Math.round(performance.maxRpm)} RPM`);

  updateCopilotBlocks();
}

function alertOnce(key, text, cooldownMs = 12000) {
  if (!alertsEnabled) return;

  const now = Date.now();
  const last = lastAlertTimes[key] || 0;

  if (now - last < cooldownMs) return;

  lastAlertTimes[key] = now;

  beep("warning");
  speak(text);
}

function markAlert(id, active) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle("value-alert", !!active);
}

function checkDrivingAlerts(speed, rpm, boost, coolant) {
  markAlert("speedValue", speed >= 80);
  markAlert("rpmValue", rpm >= 3600);
  markAlert("boostValue", boost >= 18);
  markAlert("coolantValue", coolant >= 215);

  if (speed >= 80) {
    alertOnce("speed", "Speed warning. You are over eighty miles per hour.");
  }

  if (rpm >= 3600) {
    alertOnce("rpm", "R P M warning. Shift or ease off.");
  }

  if (boost >= 18) {
    alertOnce("boost", "Turbo pressure elevated.");
  }

  if (coolant >= 215) {
    alertOnce("coolant", "Warning. Coolant temperature is high.");
  }

  autoThemeLogic(speed, rpm, boost, coolant);
  updateCopilotBlocks();
}

function checkBatteryAlert(voltage) {
  const number = Number(voltage);

  if (!Number.isFinite(number)) return;
  if (number < 8 || number > 16.5) return;

  const lowBattery = number < 12.2;

  markAlert("batteryValue", lowBattery);

  if (lowBattery) {
    alertOnce("battery", `Battery voltage low. ${number.toFixed(1)} volts.`);
  }

  updateCopilotBlocks();
  updateHeaderBadges();
}

function autoThemeLogic(speed, rpm, boost, coolant) {
  if (!autoThemeEnabled) return;

  if (coolant >= 215 || speed >= 80 || boost >= 18) {
    setThemeMode("performanceRed", true);
    return;
  }

  const hour = new Date().getHours();

  if (hour >= 20 || hour < 6) {
    setThemeMode("dieselAmber", true);
  } else if (rpm < 1100 && speed < 5) {
    setThemeMode("stealth", true);
  } else {
    setThemeMode("germanBlue", true);
  }
}

function updateAmbientGlow(speed, rpm, boost) {
  document.body.classList.remove(
    "drive-idle",
    "drive-active",
    "drive-hard",
    "drive-insane"
  );

  if (boost > 20 || rpm > 4200 || speed > 90) {
    document.body.classList.add("drive-insane");
    return;
  }

  if (boost > 12 || rpm > 3200 || speed > 65) {
    document.body.classList.add("drive-hard");
    return;
  }

  if (boost > 2 || rpm > 1800 || speed > 15) {
    document.body.classList.add("drive-active");
    return;
  }

  document.body.classList.add("drive-idle");
}

function resetTrip() {
  tripStart = Date.now();
  speedSamples = [];
  topSpeed = 0;

  performance.peakBoost = 0;
  performance.maxRpm = 0;

  setValue("avgSpeed", "0 MPH");
  setValue("topSpeed", "0 MPH");
  setValue("perfTopSpeed", "0 MPH");
  setValue("peakBoost", "0.0 PSI");
  setValue("maxRpm", "0 RPM");

  speak("Trip data reset.");
}

function updateTripTime() {
  const seconds = Math.floor((Date.now() - tripStart) / 1000);
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  setValue("tripTime", `${mins}:${secs}`);
}

window.setInterval(updateTripTime, 1000);

/* =========================
   COPILOT / SECURITY
========================= */

function updateCopilotBlocks() {
  const rpm = Number(getText("rpmValue", "0")) || 0;
  const coolant = Number(getText("coolantValue", "0")) || 0;
  const boost = Number(getText("boostValue", "0")) || 0;

  const batteryRaw = getText("batteryValue", "-- V").replace("V", "").trim();
  const battery = Number(batteryRaw);

  if (coolant >= 215) {
    setValue("engineHealthStatus", "HOT");
    setValue("engineHealthNote", "Coolant elevated. Ease off and monitor.");
  } else if (rpm >= 3600) {
    setValue("engineHealthStatus", "HIGH RPM");
    setValue("engineHealthNote", "RPM elevated. Shift or back off.");
  } else if (rpm > 0 || coolant > 0) {
    setValue("engineHealthStatus", "STABLE");
    setValue("engineHealthNote", "Coolant and RPM normal.");
  } else {
    setValue("engineHealthStatus", "WAITING");
    setValue("engineHealthNote", "Waiting for engine data.");
  }

  if (boost >= 18) {
    setValue("turboHealthStatus", "HIGH BOOST");
    setValue("turboHealthNote", "Turbo pressure elevated.");
  } else if (boost > 0) {
    setValue("turboHealthStatus", "ACTIVE");
    setValue("turboHealthNote", `Boost currently ${boost.toFixed(1)} PSI.`);
  } else {
    setValue("turboHealthStatus", "READY");
    setValue("turboHealthNote", "Boost monitor standing by.");
  }

  if (!Number.isFinite(battery)) {
    setValue("powerHealthStatus", "UNKNOWN");
    setValue("powerHealthNote", "Waiting for battery voltage.");
  } else if (battery < 12.2) {
    setValue("powerHealthStatus", "LOW");
    setValue("powerHealthNote", "Battery voltage is low.");
  } else if (battery >= 13.2) {
    setValue("powerHealthStatus", "CHARGING");
    setValue("powerHealthNote", "Alternator voltage looks good.");
  } else {
    setValue("powerHealthStatus", "OK");
    setValue("powerHealthNote", "Battery voltage acceptable.");
  }

  const warnings = [];

  if (coolant >= 215) warnings.push("coolant");
  if (boost >= 18) warnings.push("boost");
  if (rpm >= 3600) warnings.push("RPM");

  if (warnings.length) {
    setValue("driveHealthStatus", "CAUTION");
    setValue("driveHealthNote", `Watch ${warnings.join(", ")}.`);
  } else {
    setValue("driveHealthStatus", "READY");
    setValue("driveHealthNote", "No active warnings.");
  }
}

function copilotReport() {

  if (!requirePlus("Advanced copilot")) return;
  
  updateCopilotBlocks();

  const message =
    `Copilot report. Engine ${getText("engineHealthStatus", "waiting")}. ` +
    `Turbo ${getText("turboHealthStatus", "ready")}. ` +
    `Power ${getText("powerHealthStatus", "unknown")}. ` +
    `Drive status ${getText("driveHealthStatus", "ready")}.`;

  setValue("copilotOutput", message);
  speak(message);
}

function activateSecurityMode() {
  performance.securityMode = true;
  applyTheme();
  speak("Security scanner armed. Vehicle watch mode active.");
}

function disableSecurityMode() {
  performance.securityMode = false;
  applyTheme();
  speak("Security scanner disabled.");
}

function toggleSecurityMode() {
  if (performance.securityMode) {
    disableSecurityMode();
  } else {
    activateSecurityMode();
  }
}

function triggerSecurityScan() {
  beep("warning");

  const message = "Security scan complete. No motion threats detected.";

  setValue("copilotOutput", message);
  speak(message);
}

/* =========================
   PERFORMANCE MODES
========================= */

function startZeroSixty() {
  performance.zeroToSixtyActive = true;
  performance.zeroToSixtyStart = null;

  setValue("zeroSixtyTime", "ARMED");
  setValue("zeroSixtyStatus", "Start from 0 MPH");

  speak("Zero to sixty timer armed. Start from a stop.");
}

function startZeroToSixty() {
  startZeroSixty();
}

function checkZeroToSixty(speed) {
  if (!performance.zeroToSixtyActive) return;

  if (speed <= 3 && performance.zeroToSixtyStart === null) {
    performance.zeroToSixtyStart = Date.now();
    setValue("zeroSixtyTime", "RUNNING");
    setValue("zeroSixtyStatus", "Timer active");
  }

  if (speed >= 60 && performance.zeroToSixtyStart !== null) {
    const time = ((Date.now() - performance.zeroToSixtyStart) / 1000).toFixed(2);

    performance.zeroToSixtyActive = false;

    setValue("zeroSixtyTime", `${time}s`);
    setValue("zeroSixtyStatus", "Complete");

    if (performance.bestZeroToSixty === "--" || Number(time) < Number(performance.bestZeroToSixty)) {
      performance.bestZeroToSixty = time;
      storageSet("revantaBest060", time);
      speak(`New best zero to sixty. ${time} seconds.`);
    } else {
      speak(`Zero to sixty complete. ${time} seconds.`);
    }
  }
}

function resetZeroSixty() {
  performance.zeroToSixtyActive = false;
  performance.zeroToSixtyStart = null;

  setValue("zeroSixtyTime", "READY");
  setValue("zeroSixtyStatus", "Waiting");

  speak("Zero to sixty timer reset.");
}

function toggleSpoolMode() {
  performance.spoolMode = !performance.spoolMode;
  applyTheme();
  speak(performance.spoolMode ? "Turbo spool mode armed." : "Turbo spool mode disabled.");
}

function toggleAmbientGlow() {
  performance.ambientGlow = !performance.ambientGlow;
  applyTheme();
  speak(performance.ambientGlow ? "Ambient drive glow enabled." : "Ambient drive glow disabled.");
}

function speakPerformance() {
  speak(
    `Peak boost ${performance.peakBoost.toFixed(1)} P S I. ` +
    `Max R P M ${Math.round(performance.maxRpm)}. ` +
    `Top speed ${Math.round(topSpeed)} miles per hour. ` +
    `Best zero to sixty ${performance.bestZeroToSixty} seconds.`
  );
}

function speakStatus() {
  speak(
    `Current speed ${getText("speedValue", "unknown")} miles per hour. ` +
    `Engine speed ${getText("rpmValue", "unknown")} R P M. ` +
    `Boost pressure ${getText("boostValue", "unknown")} P S I. ` +
    `Coolant temperature ${getText("coolantValue", "unknown")} degrees. ` +
    `Battery ${getText("batteryValue", "-- V")}. ` +
    `Fuel ${getText("fuelStatus", "--")}. ` +
    `Weather ${getText("weatherStatus", "ready")}.`
  );
}

/* =========================
   NAVIGATION
========================= */

function syncNavGauges() {
  setValue("navSpeed", `${getText("speedValue", "--")} MPH`);
  setValue("navRpm", getText("rpmValue", "--"));
  setValue("navBoost", `${getText("boostValue", "--")} PSI`);
  setValue("navIntake", getText("intakeValue", "-- °F"));
  setValue("navWeather", getText("weatherStatus", "READY"));
}

function loadDestination() {
  const input = $("navSearchInput");
  const destination = input?.value?.trim();

  if (!destination) {
    speak("Enter a destination first.");
    return;
  }

  const encoded = encodeURIComponent(destination);

  const embedUrl =
    `https://www.google.com/maps?output=embed&q=${encoded}`;

  if ($("mapFrame")) {
    $("mapFrame").src = embedUrl;
  }

  const miniMap = $("navMapEmbed");

  if (miniMap) {
    miniMap.innerHTML = `
      <iframe
        src="${embedUrl}"
        loading="lazy"
        allowfullscreen
        style="
          width:100%;
          height:220px;
          border:0;
          border-radius:18px;
        ">
      </iframe>
    `;
  }

  setValue("navDirectionStatus", "ROUTE ACTIVE");
  setValue("navNextTurn", `Navigate to ${destination}`);
  setValue("navEta", "Calculating");
  setValue("navDistance", "--");

  setValue("copilotStatus", `Destination loaded: ${destination}`);

  speak(`Navigation loaded inside Revanta. ${destination}.`);
}

function openFullGoogleMaps() {
  const destination = $("navSearchInput")?.value?.trim() || "current location";
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  window.open(url, "_blank");
}

function goHomeNav() {
  const homeDestination = storageGet("revantaHomeDestination", "home");

  if ($("navSearchInput")) {
    $("navSearchInput").value = homeDestination;
  }

  loadDestination();
}

function navNightMode() {
  setThemeMode("stealth");
  speak("Navigation night mode active.");
}

    /* =========================
   VOICE COMMANDS
========================= */

async function requestMicAccess() {
  try {
    // Already granted previously
    if (navigator.permissions?.query) {
      try {
        const result = await navigator.permissions.query({
          name: "microphone"
        });

        if (result.state === "granted") {
          return true;
        }
      } catch {}
    }

    // Try direct media request
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      stream.getTracks().forEach((track) => track.stop());

      return true;
    }

    // Android WebView fallback
    return true;
  } catch (err) {
    console.warn("Mic permission failed.", err);

    // Fallback because Android WebView lies sometimes
    if (
      String(err).includes("Permission") ||
      String(err).includes("denied") ||
      String(err).includes("NotAllowedError")
    ) {
      return true;
    }

    setValue("commandLog", "Microphone unavailable.");
    return false;
  }
}

function openCommandModal() {
  const modal = $("commandModal");
  const input = $("commandInput");

  if (!modal || !input) return;

  modal.classList.remove("hidden");

  setTimeout(() => {
    input.focus();
  }, 100);
}

function closeCommandModal() {
  $("commandModal")?.classList.add("hidden");
}

function submitCommandModal() {
  const input = $("commandInput");

  if (!input) return;

  const value = input.value.trim();

  closeCommandModal();

  if (value) {
    handleVoiceCommand(value);
  }

  input.value = "";
}

async function listenCommand() {
  unlockVoice();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    const typed = openCommandModal();
    if (typed) handleVoiceCommand(typed);
    return;
  }

  const typedFallbackTimer = setTimeout(() => {
    const typed = openCommandModal();
    if (typed) handleVoiceCommand(typed);
  }, 1800);

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    document.body.classList.add("voice-listening");
    setValue("commandLog", "Listening...");
  };

  recognition.onresult = (event) => {
    clearTimeout(typedFallbackTimer);
    document.body.classList.remove("voice-listening");

    const command = event.results[0][0].transcript.toLowerCase();
    handleVoiceCommand(command);
  };

  recognition.onerror = (event) => {
    clearTimeout(typedFallbackTimer);
    document.body.classList.remove("voice-listening");

    const typed = openCommandModal();
    if (typed) handleVoiceCommand(typed);
  };

  recognition.onend = () => {
    document.body.classList.remove("voice-listening");
  };

  try {
    speak("Command mode ready.");
    setTimeout(() => recognition.start(), 900);
  } catch {
    clearTimeout(typedFallbackTimer);
    const typed = openCommandModal();
    if (typed) handleVoiceCommand(typed);
  }
}

function handleVoiceCommand(command) {
  command = String(command || "").toLowerCase().trim();
  logCommand(`Heard: ${command}`);

  
  if (command.includes("connect obd") || command.includes("connect o b d")) return connectOBD();
  if (command.includes("disconnect obd") || command.includes("disconnect o b d")) return disconnectOBD();
  if (command.includes("scan codes") || command.includes("check codes") || command.includes("diagnostic")) return scanCodes();

  if (command.includes("navigate home")) return goHomeNav();
  if (command.includes("open maps") || command.includes("google maps")) return openFullGoogleMaps();
  if (command.includes("navigation night") || command.includes("nav night")) return navNightMode();

  if (command.includes("navigate to")) {
    const destination = command.replace("navigate to", "").trim();

    if ($("navSearchInput") && destination) {
      $("navSearchInput").value = destination;
      return loadDestination();
    }
  }

  if (command.includes("battery") || command.includes("voltage")) {
    return speak(`Battery voltage is ${getText("batteryValue", "unknown")}.`);
  }

  if (command.includes("fuel")) {
    return speak(`Fuel status is ${getText("fuelStatus", "unknown")}.`);
  }

  if (command.includes("intake")) {
    return speak(`Intake temperature is ${getText("intakeValue", "unknown")}.`);
  }

  if (command.includes("boost") || command.includes("turbo")) return speakModeLine("boost");
  if (command.includes("coolant") || command.includes("temp") || command.includes("temperature")) return speakModeLine("coolant");
  if (command.includes("gps") || command.includes("speed")) return speakModeLine("gps");
  if (command.includes("status") || command.includes("systems") || command.includes("how is the car")) return speakStatus();
  if (command.includes("copilot") || command.includes("how's it looking")) return copilotReport();
  if (command.includes("performance") || command.includes("score")) return speakPerformance();
  if (command.includes("weather") || command.includes("outside")) return weatherLayer();

  if (command.includes("spool")) return toggleSpoolMode();
  if (command.includes("glow")) return toggleAmbientGlow();
  if (command.includes("zero to sixty") || command.includes("0 to 60")) return startZeroSixty();
  if (command.includes("security")) return toggleSecurityMode();
  if (command.includes("auto theme")) return toggleAutoTheme();

  if (command.includes("race")) return setVoiceMode("race");
  if (command.includes("sport")) return setVoiceMode("sport");
  if (command.includes("mechanic")) return setVoiceMode("mechanic");
  if (command.includes("sarcastic") || command.includes("funny")) return setVoiceMode("sarcastic");
  if (command.includes("butler")) return setVoiceMode("butler");
  if (command.includes("robot")) return setVoiceMode("robot");
  if (command.includes("drill")) return setVoiceMode("drill");

  if (command.includes("stealth")) return setThemeMode("stealth");
  if (command.includes("red")) return setThemeMode("performanceRed");
  if (command.includes("amber") || command.includes("orange") || command.includes("gold")) return setThemeMode("dieselAmber");
  if (command.includes("blue")) return setThemeMode("germanBlue");
  if (command.includes("ice") || command.includes("white")) return setThemeMode("iceWhite");
  if (command.includes("legacy") || command.includes("color shift")) return setThemeMode("legacy");
  if (command.includes("fullscreen") || command.includes("full screen")) return goFullscreen();
  if (command.includes("show dash") || command.includes("dashboard")) return showTab("dash");
  if (command.includes("show performance")) return showTab("performance");
  if (command.includes("show diagnostics")) return showTab("diagnostics");
  if (command.includes("show system")) return showTab("command");
  if (command.includes("show copilot")) return showTab("copilot");
  if (command.includes("show navigation")) return showTab("nav");
  if (command.includes("show settings")) return showTab("settings");

  if (command.includes("start gps") || command.includes("gps on")) return startGpsSpeed();
  if (command.includes("weather report") || command.includes("check weather")) return weatherLayer();
  if (command.includes("reset trip")) return resetTrip();
  if (command.includes("mute voice")) return muteVoice();
  if (command.includes("unmute voice")) return unmuteVoice();

  speak(`Command not recognized. I heard ${command}.`);
}

async function startWakeWord() {
  const micAllowed = await requestMicAccess();

  if (!micAllowed) {
    speak("Microphone permission is blocked.");
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    speak("Wake word is not supported in this Android WebView.");
    setValue("wakeStatus", "Wake Word: Unsupported");
    setValue("wakeStatusTop", "WAKE N/A");
    return;
  }

  if (wakeListening) {
    speak("Wake word is already active.");
    return;
  }

  wakeRecognition = new SpeechRecognition();
  wakeRecognition.lang = "en-US";
  wakeRecognition.continuous = false;
  wakeRecognition.interimResults = false;

  wakeRecognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
    const wakeName = (getActiveProfile().commandName || "revanta").toLowerCase();

    if (
      transcript.includes("hey revanta") ||
      transcript.includes("hey jett") ||
      transcript.includes(wakeName) ||
      transcript.includes("vehicle command") ||
      transcript.includes("command system")
    ) {
      wakeListening = false;
      updateSystemLabels();

      try {
        wakeRecognition.stop();
      } catch {}

      speak("Awaiting command.");

      window.setTimeout(() => {
        listenCommand();
      }, 1500);
    }
  };

  wakeRecognition.onerror = () => {
    wakeListening = false;
    updateSystemLabels();
  };

  wakeRecognition.onend = () => {
    if (wakeListening) {
      window.setTimeout(() => {
        try {
          wakeRecognition.start();
        } catch {}
      }, 1400);
    }
  };

  wakeListening = true;
  updateSystemLabels();

  try {
    wakeRecognition.start();
    speak("Wake word active.");
  } catch {
    wakeListening = false;
    updateSystemLabels();
    speak("Wake word could not start.");
  }
}

function stopWakeWord() {
  wakeListening = false;

  try {
    wakeRecognition?.stop();
  } catch {}

  updateSystemLabels();
  speak("Wake word disabled.");
}

/* =========================
   OBD CLASSIC BLUETOOTH
========================= */

function obdStatus(source, status, log = "") {
  setValue("sourceStatus", source);
  setValue("obdStatus", status);
  setValue("diagObdStatus", status);

  const connected = status === "LIVE" || source.includes("LIVE");
  const connecting = source.includes("INIT") || source.includes("CONNECTING") || source.includes("SEARCHING");
  const failed = source.includes("FAIL") || status === "OFF";

  document.body.classList.remove("obd-connected", "obd-connecting", "obd-failed");

  if (connected) document.body.classList.add("obd-connected");
  else if (connecting) document.body.classList.add("obd-connecting");
  else if (failed) document.body.classList.add("obd-failed");

  if (log) {
    setValue("commandLog", log);

    const bootLog = $("bootLog");
    if (bootLog) {
      bootLog.innerHTML += `<div>${log}</div>`;
    }
  }
}

function getDeviceId(device) {
  return device.id || device.address || device.deviceId || "";
}

function getDeviceName(device, fallback = "Unknown Device") {
  return device.name || device.localName || device.deviceId || device.address || device.id || fallback;
}

function isLikelyObdDevice(device) {
  const name = String(device.name || device.localName || "").toUpperCase();
  const id = String(device.id || device.deviceId || device.address || "").toUpperCase();

  return (
    name.includes("VGATE") ||
    name.includes("VLINKER") ||
    name.includes("V-LINK") ||
    name.includes("OBD") ||
    name.includes("OBDII") ||
    name.includes("ELM") ||
    name.includes("MC-ANDROID") ||
    id.includes("OBD")
  );
}

function sortObdDevices(devices) {
  return [...devices].sort((a, b) => {
    const aId = getDeviceId(a);
    const bId = getDeviceId(b);
    const aName = getDeviceName(a);
    const bName = getDeviceName(b);

    if (aId === obdLastDeviceId || aName === obdLastDeviceName) return -1;
    if (bId === obdLastDeviceId || bName === obdLastDeviceName) return 1;

    const aScore = isLikelyObdDevice(a) ? 0 : 1;
    const bScore = isLikelyObdDevice(b) ? 0 : 1;

    return aScore - bScore;
  });
}

function chooseDeviceFromList(devices) {
  const sorted = sortObdDevices(devices);

  const listText = sorted
    .map((d, i) => {
      const name = getDeviceName(d, `Unknown Device ${i + 1}`);
      const id = getDeviceId(d);
      const last = id === obdLastDeviceId || name === obdLastDeviceName ? " ⭐ LAST" : "";
      const obd = isLikelyObdDevice(d) ? " 🚗" : "";

      return `${i + 1}. ${name}${obd}${last}${id && id !== name ? ` (${id})` : ""}`;
    })
    .join("\n");

  const defaultChoice =
    sorted.findIndex((d) => getDeviceId(d) === obdLastDeviceId || getDeviceName(d) === obdLastDeviceName) + 1;

  const choice = prompt(
    "Select OBD Device:\n\n" +
      listText +
      "\n\nType the number of your adapter:" +
      (defaultChoice > 0 ? `\n\nLast used: ${defaultChoice}` : ""),
    defaultChoice > 0 ? String(defaultChoice) : "1"
  );

  if (!choice) return null;

  const index = Number(choice.trim()) - 1;

  if (!Number.isInteger(index) || index < 0 || index >= sorted.length) {
    alert("Invalid selection.");
    return null;
  }

  return sorted[index];
}

function rememberObdDevice(device) {
  obdLastDeviceId = getDeviceId(device);
  obdLastDeviceName = getDeviceName(device);

  storageSet("revantaObdDeviceId", obdLastDeviceId);
  storageSet("revantaObdDeviceName", obdLastDeviceName);
}

async function connectOBD(auto = false) {
  obdStatus("OBD INIT", "SEARCHING", auto ? "Auto reconnecting OBD..." : "Searching paired Bluetooth OBD devices...");
  setValue("obdStatus", "PAIRING");
setValue("sourceStatus", "BT LINK");

  if (!auto) {
    obdReconnectAttempts = 0;
  }

  if (!window.bluetoothSerial) {
    obdStatus("NO PLUGIN", "OFF", "Bluetooth Serial plugin not found in this build.");
    speak("Bluetooth serial plugin not found. O B D will not work in this APK until the plugin is installed.");
    return;
  }

  try {
    const devices = await new Promise((resolve, reject) => {
      window.bluetoothSerial.list(resolve, reject);
    });

    if (!devices || !devices.length) {
      obdStatus("NO DEVICES", "OFF", "No paired Bluetooth devices found.");
      speak("No paired Bluetooth O B D devices found.");
      return;
    }

    let target = null;

    if (auto && obdLastDeviceId) {
      target = devices.find((d) => getDeviceId(d) === obdLastDeviceId);
    }

    if (!target) {
      target = chooseDeviceFromList(devices);
    }

    if (!target) {
      obdStatus("CANCELLED", "OFF", "OBD connection cancelled.");
      return;
    }

    obdStatus("CLASSIC FOUND", "CONNECTING", `Connecting to ${getDeviceName(target)}...`);

    await new Promise((resolve, reject) => {
      window.bluetoothSerial.connect(getDeviceId(target), resolve, reject);
    });

    obdMode = "classic";
    obdLive = true;
    obdBleBuffer = "";

    rememberObdDevice(target);

    try {
      window.bluetoothSerial.subscribe(
        "\r>",
        (data) => {
          obdBleBuffer += data;
        },
        (err) => {
          console.warn("Classic subscribe error.", err);
        }
      );
    } catch (err) {
      console.warn("Classic subscribe failed.", err);
    }

    obdStatus("CLASSIC INIT", "ECU INIT", "Initializing ELM327...");

    await elmCommandClassic("ATZ", 3000);
    await elmCommandClassic("ATE0", 1000);
    await elmCommandClassic("ATL0", 1000);
    await elmCommandClassic("ATS0", 1000);
    await elmCommandClassic("ATH0", 1000);
    await elmCommandClassic("ATAT1", 1000);
    await elmCommandClassic("ATST64", 1000);
    await elmCommandClassic("ATSP0", 2000);

    let protocolTest = await elmCommandClassic("0100", 4000);
    setValue("commandLog", `0100 AUTO RAW: ${protocolTest || "EMPTY"}`);

    if (
      !protocolTest ||
      protocolTest.includes("NO DATA") ||
      protocolTest.includes("UNABLE") ||
      protocolTest.includes("STOPPED")
    ) {
      await elmCommandClassic("ATSP6", 2000);
      protocolTest = await elmCommandClassic("0100", 4000);
      setValue("commandLog", `0100 CAN RAW: ${protocolTest || "EMPTY"}`);
    }

    const voltageTest = await elmCommandClassic("ATRV", 2500);
    setValue("commandLog", `CONNECT TEST VOLTAGE: ${voltageTest || "none"}`);

    // Read VIN once before live polling starts
    try {
  const vin = await scanVehicleVinOnce();

  if (vin) {
    const profileKey = detectProfileFromVin(vin);

    applyVisualVehicleProfile(profileKey);

    debugLive(`AUTO PROFILE: ${profileKey.toUpperCase()}`);
  } else {
    debugLive(
      `AUTO PROFILE KEPT: ${activeVehicleProfileKey.toUpperCase()}`
    );
  }

} catch (err) {
  debugLive(`VIN PROFILE SKIPPED: ${err?.message || err}`);
}

    await detectSupportedPids();

    obdStatus("CLASSIC LIVE", "LIVE", `${getDeviceName(target)} connected. Live OBD active.`);
    setValue("obdStatus", "LIVE");
    setValue("sourceStatus", "OBD LIVE");
    speak("Classic Bluetooth O B D connected.");

    
    startOBDPolling();
    startObdReconnectWatchdog();
    startVehicleChangeWatchdog();

  } catch (err) {
    console.warn("OBD connect failed.", err);

    obdLive = false;
    obdMode = "none";

    const msg =
      err?.message ||
      err?.errorMessage ||
      err?.error ||
      JSON.stringify(err) ||
      String(err);

    obdStatus("CONNECT FAIL", "OFF", `OBD connection failed: ${msg}`);
    setValue("commandLog", `OBD connection failed: ${msg}`);
    setValue("rawDtcOutput", `OBD connection failed: ${msg}`);
    speak("O B D connection failed.");
  }
}

function disconnectOBD() {
  document.body.classList.add("revanta-shutdown");

setTimeout(() => {
  document.body.classList.remove("revanta-shutdown");
}, 900);
  if (obdTimer) {
    clearInterval(obdTimer);
    obdTimer = null;
  }

  stopObdReconnectWatchdog();
  stopVehicleChangeWatchdog();

  vehicleCapabilityScanned = false;
  supportedPids.clear();

  currentVehicleProfile.supported = [];
  currentVehicleProfile.fingerprint = "";

  setValue("vehicleProfileSupported", "Scanning...");
  setValue("vehicleProfileVin", "VIN: Waiting...");

  try {
    window.bluetoothSerial?.unsubscribe?.();
  } catch {}

  try {
    window.bluetoothSerial?.disconnect?.();
  } catch {}

  obdLive = false;
  obdMode = "none";
  obdBleBuffer = "";

  obdStatus("READY", "OFF", "OBD disconnected.");
  setValue("obdStatus", "OFFLINE");
setValue("sourceStatus", "STANDBY");
  resetGaugeDisplay();
  speak("O B D disconnected.");
}

function startObdReconnectWatchdog() {
  if (obdReconnectTimer) clearInterval(obdReconnectTimer);

  obdReconnectTimer = setInterval(() => {
    if (obdLive && obdMode !== "none") return;
    if (!obdLastDeviceId) return;
    if (obdReconnectAttempts >= 999) return;

    obdReconnectAttempts++;

    obdStatus(
      "OBD LOST",
      "RETRYING",
      `Reconnect attempt ${obdReconnectAttempts}`
    );

    connectOBD(true);
  }, 4000);
}

function stopObdReconnectWatchdog() {
  if (obdReconnectTimer) {
    clearInterval(obdReconnectTimer);
    obdReconnectTimer = null;
  }
}

async function elmCommandClassic(command, waitMs = 700) {
  obdBleBuffer = "";

  await new Promise((resolve, reject) => {
    window.bluetoothSerial.write(`${command}\r`, resolve, reject);
  });

  await new Promise((resolve) => setTimeout(resolve, waitMs));

  return cleanElmResponse(obdBleBuffer);
}

async function safeElm(command, timeout = 2500, force = false) {
  debugLive(`SAFE ELM SEND: ${command}`);

  if (obdBusy && !force) {
    debugLive(`SAFE ELM BLOCKED BUSY: ${command}`);
    return null;
  }

  obdBusy = true;

  try {
    const raw = await elmCommandClassic(command, timeout);
    const cleaned = cleanElmResponse(raw);

    debugLive(`SAFE ELM RESPONSE: ${command} = ${cleaned}`);

    if (!cleaned) {
      debugLive(`SAFE ELM EMPTY: ${command}`);
      return null;
    }

    return cleaned;
  } catch (err) {
    debugLive(`SAFE ELM ERROR ${command}: ${err?.message || err}`);
    return null;
  } finally {
    obdBusy = false;
  }
}

function cleanElmResponse(raw) {
  return String(raw || "")
    .replaceAll("\r", "")
    .replaceAll("\n", "")
    .replaceAll(">", "")
    .replaceAll("SEARCHING...", "")
    .trim()
    .toUpperCase();
}

function hasPid(pid) {
  return supportedPids.has(String(pid).toUpperCase());
}

function decodeSupportedPids(raw, baseHex) {
  const clean = cleanElmResponse(raw).replace(/\s+/g, "");
  const marker = `41${baseHex}`;
  const idx = clean.indexOf(marker);

  if (idx === -1) return;

  const data = clean.slice(idx + 4, idx + 12);
  if (data.length < 8) return;

  const value = parseInt(data, 16);
  if (!Number.isFinite(value)) return;

  const base = parseInt(baseHex, 16);

  for (let bit = 0; bit < 32; bit++) {
    if (value & (1 << (31 - bit))) {
      const pidNum = base + bit + 1;
      supportedPids.add(
        pidNum.toString(16).toUpperCase().padStart(2, "0")
      );
    }
  }
}

async function detectSupportedPids() {
  supportedPids.clear();

  const pids0100 = await elmCommandClassic("0100", 4000);
  decodeSupportedPids(pids0100, "00");

  if (hasPid("20")) {
    const pids0120 = await elmCommandClassic("0120", 4000);
    decodeSupportedPids(pids0120, "20");
  }

  if (hasPid("40")) {
    const pids0140 = await elmCommandClassic("0140", 4000);
    decodeSupportedPids(pids0140, "40");
  }

  setValue(
    "commandLog",
    `SUPPORTED PIDS: ${Array.from(supportedPids).join(", ")}`
  );
}

function parsePidNumber(response, pid) {
  const clean = cleanElmResponse(response).replace(/\s+/g, "");
  const index = clean.indexOf(`41${pid}`);

  if (index === -1) return null;

  const hex = clean.slice(index + 4);

  if (hex.length < 2) return null;

  return hex;
}

function parseRPM(response) {
  const hex = parsePidNumber(response, "0C");
  if (!hex || hex.length < 4) return null;

  const a = parseInt(hex.slice(0, 2), 16);
  const b = parseInt(hex.slice(2, 4), 16);

  return ((a * 256) + b) / 4;
}

function parseSpeed(response) {
  const hex = parsePidNumber(response, "0D");
  if (!hex || hex.length < 2) return null;

  const kph = parseInt(hex.slice(0, 2), 16);
  return Math.round(kph * 0.621371);
}

function parseCoolant(response) {
  const hex = parsePidNumber(response, "05");
  if (!hex || hex.length < 2) return null;

  const celsius = parseInt(hex.slice(0, 2), 16) - 40;
  return Math.round((celsius * 9) / 5 + 32);
}

function parseIntakeTemp(response) {
  const hex = parsePidNumber(response, "0F");
  if (!hex || hex.length < 2) return null;

  const celsius = parseInt(hex.slice(0, 2), 16) - 40;
  return Math.round((celsius * 9) / 5 + 32);
}

function parseMapKpa(response) {
  const hex = parsePidNumber(response, "0B");
  if (!hex || hex.length < 2) return null;

  const mapKpa = parseInt(hex.slice(0, 2), 16);

  if (!Number.isFinite(mapKpa)) return null;
  if (mapKpa < 20 || mapKpa > 255) return null;

  return mapKpa;
}

function parseBaroKpa(response) {
  const hex = parsePidNumber(response, "33");
  if (!hex || hex.length < 2) return null;

  const baroKpa = parseInt(hex.slice(0, 2), 16);

  if (!Number.isFinite(baroKpa)) return null;
  if (baroKpa < 80 || baroKpa > 110) return null;

  return baroKpa;
}

function parseMaf(response) {
  const hex = parsePidNumber(response, "10");
  if (!hex || hex.length < 4) return null;

  const a = parseInt(hex.slice(0, 2), 16);
  const b = parseInt(hex.slice(2, 4), 16);

  const maf = ((a * 256) + b) / 100;

  if (!Number.isFinite(maf)) return null;
  if (maf < 0 || maf > 300) return null;

  return maf;
}

function canShowMafWarning() {
  const now = Date.now();
  const cooldown = 20000;

  if (now - lastMafWarningTime < cooldown) return false;

  lastMafWarningTime = now;
  return true;
}

function expectedMafRange(rpm, boostPsi) {
  if (rpm < 1000) return { min: 4, max: 10, label: "idle" };
  if (rpm >= 1000 && rpm < 1800) return { min: 8, max: 25, label: "light throttle" };
  if (rpm >= 1800 && boostPsi < 5) return { min: 15, max: 40, label: "low boost" };

  if (rpm >= 1800 && boostPsi >= 5 && boostPsi < 12) {
    return { min: 35, max: 75, label: "medium boost" };
  }

  if (rpm >= 2200 && boostPsi >= 12) {
    return { min: 60, max: 130, label: "high boost" };
  }

  return { min: 5, max: 120, label: "general" };
}

function detectVehicleProfile(boostPsi, fuelType = "") {
  const fuel = String(fuelType || "").toLowerCase();

  if (fuel.includes("diesel") && Number(boostPsi) > 2) {
    return "turbo_diesel";
  }

  if (fuel.includes("gas") && Number(boostPsi) > 2) {
    return "turbo_gas";
  }

  if (fuel.includes("hybrid")) {
    return "hybrid";
  }

  if (fuel.includes("ev")) {
    return "ev";
  }

  return "na_gas";
}

function checkMafHealth(maf, rpm, boostPsi) {
  if (!Number.isFinite(maf) || !Number.isFinite(rpm) || !Number.isFinite(boostPsi)) return;

  const isBoostedEngine =
  vehicleProfileType === "turbo_diesel" ||
  vehicleProfileType === "turbo_gas";

  // Skip turbo/diesel MAF logic on naturally aspirated vehicles
  if (!isBoostedEngine) {
    return;
  }

  const range = expectedMafRange(rpm, boostPsi);

  if (maf < range.min) {
    if (!canShowMafWarning()) return;

    const message =
      `⚠ MAF LOW FOR CURRENT RPM/BOOST\n` +
      `Condition: ${range.label}\n` +
      `Expected: ${range.min}-${range.max} g/s\n` +
      `Actual: ${maf.toFixed(1)} g/s\n\n` +
      `Possible causes:\n` +
      `- MAF underreporting\n` +
      `- Boost leak / intake leak\n` +
      `- Intake restriction\n` +
      `- MAF wiring or connector issue\n` +
      `- EGR airflow mismatch`;

    setValue("diagnosticResults", message);
    speak("Mass air flow looks low for current boost and R P M.");
    return;
  }
}

function getActiveCalibration() {
  return (
    VEHICLE_CALIBRATION[activeVehicleProfileKey] ||
    VEHICLE_CALIBRATION.universal
  );
}

  function calculateBoostPsi(mapKpa) {
  if (!Number.isFinite(mapKpa)) return null;

  const cal = getActiveCalibration();

  const rawPsi =
    (mapKpa - cal.boostAtmosphereKpa) * 0.145038;

  const calibrated =
    (rawPsi * cal.boostMultiplier) +
    cal.boostOffsetPsi;

  const safeBoost = Number(
    Math.max(0, calibrated).toFixed(1)
  );

  if (safeBoost >= 0 && safeBoost <= 40) {
    obdLastGoodBoost = safeBoost;
    return safeBoost;
  }

  return obdLastGoodBoost;
}

function keepGoodReading(key, value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return obdLastGood[key];
  }

  if (number < min || number > max) {
    return obdLastGood[key];
  }

  obdLastGood[key] = number;
  return number;
}

function parseVoltage(response) {
  const clean = cleanElmResponse(response);
  const match = clean.match(/(\d{2}\.\d)\s*V/);

  if (!match) return null;

  const voltage = Number(match[1]);

  if (voltage < 8 || voltage > 16.5) return null;

  return voltage;
}

function parseFuel(response) {
  const hex = parsePidNumber(response, "2F");
  if (!hex || hex.length < 2) return null;

  const a = parseInt(hex.slice(0, 2), 16);
  return Math.round((a * 100) / 255);
}

let liveDebugLines = [];

function debugLive(message) {
  liveDebugLines.push(String(message));

  if (liveDebugLines.length > 8) {
    liveDebugLines.shift();
  }

  const text = liveDebugLines.join("\n");

  setValue("liveDebug", text);

  const commandLog = document.getElementById("commandLog");
  if (commandLog) commandLog.innerText = text;
}

async function scanVehicleCapabilities() {
  debugLive("CAPABILITY SCAN STARTED");
  setValue("vehicleProfileSupported", "Scanning vehicle systems...");

  try {
    const pid0100 = await safeElm("0100", 2000);
    decodeSupportedPids(pid0100, "00");

    const pid0120 = await safeElm("0120", 2000);
    decodeSupportedPids(pid0120, "20");

    vehicleCapabilities.rpm = hasPid("0C");
    vehicleCapabilities.speed = hasPid("0D");
    vehicleCapabilities.coolant = hasPid("05");
    vehicleCapabilities.intake = hasPid("0F");
    vehicleCapabilities.maf = hasPid("10");
    vehicleCapabilities.map = hasPid("0B");

    vehicleCapabilities.boost = vehicleCapabilities.map;

    vehicleCapabilities.fuel = hasPid("2F");

    vehicleCapabilityScanned = true;

    // await scanVehicleVin();

    currentVehicleProfile.type = vehicleCapabilities.boost
      ? "turbo"
      : "naturally aspirated";

    saveVehicleProfile();
    // tryAutoLoadGarageProfile();

    setValue(
      "vehicleProfileSupported",
      `${currentVehicleProfile.supported?.length || 0} supported signals`
    );

    debugLive("CAPABILITY SCAN COMPLETE");

    debugLive(
      `SUPPORTED: ${Array.from(supportedPids).join(", ")}`
    );

  } catch (err) {
    console.warn("Capability scan failed:", err);
    debugLive("CAPABILITY SCAN FAILED");
  }
}

function startVehicleChangeWatchdog() {
  if (vehicleChangeWatchTimer) {
    clearInterval(vehicleChangeWatchTimer);
  }

  vehicleChangeWatchTimer = setInterval(async () => {
    if (!obdLive || obdMode !== "classic") return;
    if (isScanningCodes || livePollRunning || obdBusy) return;

    const secondsSinceGood =
      lastObdResponseTime ? (Date.now() - lastObdResponseTime) / 1000 : 0;

    if (secondsSinceGood > 8) {
      possibleVehicleLostCount++;

      debugLive(`ECU WATCH: possible disconnect ${possibleVehicleLostCount}`);

      if (possibleVehicleLostCount >= 2) {
        debugLive("ECU WATCH: ECU lost or vehicle changed.");
        setValue("sourceStatus", "ECU LOST");
        setValue("obdStatus", "RECHECK");

        possibleVehicleLostCount = 0;

        try {
          await scanVehicleVinOnce();
        } catch (err) {
          debugLive(`ECU WATCH VIN CHECK FAILED: ${err?.message || err}`);
        }
      }

      return;
    }

    possibleVehicleLostCount = 0;
  }, 5000);
}

function stopVehicleChangeWatchdog() {
  if (vehicleChangeWatchTimer) {
    clearInterval(vehicleChangeWatchTimer);
    vehicleChangeWatchTimer = null;
  }
}

function startOBDPolling() {
  if (obdTimer) {
    clearInterval(obdTimer);
    obdTimer = null;
  }

  // FORCE RESET
  livePollRunning = false;
  obdBusy = false;
  isScanningCodes = false;

  debugLive("STARTING LIVE POLL");

  setValue("sourceStatus", "CLASSIC LIVE");
  setValue("obdStatus", "LIVE");

  liveGaugeProof.coolant = false;
  liveGaugeProof.maf = false;
  liveGaugeProof.intake = false;
  liveGaugeProof.boost = false;
  liveGaugeProof.fuel = false;

  updateGaugeVisibility();

  // DIRECT TEST CALL
  debugLive("CALLING readOBDLiveClassic");

  readOBDLiveClassic();

  obdTimer = setInterval(() => {
    debugLive(
      `POLL CHECK live=${obdLive} mode=${obdMode} running=${livePollRunning} busy=${obdBusy} scanning=${isScanningCodes}`
    );

    if (
      obdLive &&
      obdMode === "classic" &&
      !livePollRunning &&
      !obdBusy &&
      !isScanningCodes
    ) {
      debugLive("LIVE POLL LOOP");
      readOBDLiveClassic();
    }
  }, 900);
}

function updateGaugeVisibility() {
  const showGauge = (id, supported, proof) => {
    const gauge = $(id);
    if (!gauge) return;

    gauge.style.display = "";
  };

  showGauge("boostGauge", vehicleCapabilities.boost, liveGaugeProof.boost);
  showGauge("coolantGauge", vehicleCapabilities.coolant, liveGaugeProof.coolant);
  showGauge("mafGauge", vehicleCapabilities.maf, liveGaugeProof.maf);
  showGauge("intakeGauge", vehicleCapabilities.intake, liveGaugeProof.intake);
  showGauge("fuelGauge", vehicleCapabilities.fuel, liveGaugeProof.fuel);
}

function smoothSetGauge(id, target, decimals = 0) {
  if (target === null || target === undefined || Number.isNaN(target)) {
    setValue(id, "--");
    return;
  }

  const current = smoothGaugeValues[id] ?? target;
  const next = current + (target - current) * 0.45;

  smoothGaugeValues[id] = next;

  const display =
    decimals > 0 ? next.toFixed(decimals) : Math.round(next);

  setValue(id, display);
}

function updateDrivingState() {
  const rpm = liveMetrics.rpm || 0;
  const speed = liveMetrics.speed || 0;
  const boost = liveMetrics.boost || 0;

  lastDrivingState = drivingState;

  if (!obdLive) {
    drivingState = "standby";
  } else if (speed < 2 && rpm > 500) {
    drivingState = "idle";
  } else if (rpm > 2600 || boost > 6) {
    drivingState = "pull";
  } else if (speed > 10 && rpm > 900) {
    drivingState = "cruise";
  } else {
    drivingState = "active";
  }

  if (drivingState !== lastDrivingState) {
    debugLive(`STATE: ${drivingState.toUpperCase()}`);
  }

  if (drivingState === "pull") {
    document.body.classList.add("drive-pull");
  } else {
    document.body.classList.remove("drive-pull");
  }
}

function updateLiveMetrics({ rpm, speed, boost, maf, coolant, voltage, intake, fuel }) {
  if (rpm !== null && rpm !== undefined) {
    liveMetrics.rpm = rpm;
    liveMetrics.peakRpm = Math.max(liveMetrics.peakRpm, rpm);
  }

  if (speed !== null && speed !== undefined) {
    liveMetrics.speed = speed;
    liveMetrics.topSpeed = Math.max(liveMetrics.topSpeed, speed);
  }

  if (boost !== null && boost !== undefined) {
    liveMetrics.boost = boost;
    liveMetrics.peakBoost = Math.max(liveMetrics.peakBoost, boost);
  }

  if (maf !== null && maf !== undefined) liveMetrics.maf = maf;
  if (coolant !== null && coolant !== undefined) liveMetrics.coolant = coolant;
  if (voltage !== null && voltage !== undefined) liveMetrics.voltage = voltage;
  if (intake !== null && intake !== undefined) liveMetrics.intake = intake;
  if (fuel !== null && fuel !== undefined) liveMetrics.fuel = fuel;

  detectAdaptiveVehicleMode();

  saveGraphPoint(liveMetrics);
  updateDrivingState();
}

function saveGraphPoint(metrics) {
  if (!metrics) return;

  const point = {
    time: Date.now(),
    rpm: metrics.rpm ?? null,
    speed: metrics.speed ?? null,
    boost: metrics.boost ?? null,
    maf: metrics.maf ?? null,
    coolant: metrics.coolant ?? null,
    voltage: metrics.voltage ?? null,
    intake: metrics.intake ?? null
  };

  liveGraphData.push(point);

  if (liveGraphData.length > MAX_GRAPH_POINTS) {
    liveGraphData.shift();
  }

  localStorage.setItem(
  "revanta_graphs",
  JSON.stringify(liveGraphData)
);

  try {
    localStorage.setItem(GRAPH_STORAGE_KEY, JSON.stringify(liveGraphData));
  } catch (err) {
    console.warn("Graph save failed", err);
  }

  renderLiveGraphs();
}

function getActiveGarageVehicleName() {
  return localStorage.getItem("revantaActiveGarageVehicle")
    || "Revanta Vehicle";
}

function getVehiclePullKey(vehicleName) {
  return `revantaPulls_${
    vehicleName.replace(/\s+/g, "_").toLowerCase()
  }`;
}

function getActiveVehiclePulls() {
  const vehicleName = getActiveGarageVehicleName();

  return JSON.parse(
    localStorage.getItem(
      getVehiclePullKey(vehicleName)
    ) || "[]"
  );
}

function saveActiveVehiclePulls(pulls) {
  const vehicleName = getActiveGarageVehicleName();

  localStorage.setItem(
    getVehiclePullKey(vehicleName),
    JSON.stringify(pulls)
  );
}

window.saveActiveVehiclePulls = saveActiveVehiclePulls;
window.getActiveVehiclePulls = getActiveVehiclePulls;

function savePullSnapshot() {

  if (!requirePlus("Pull history")) return;

  const snapshot = {
    timestamp: Date.now(),
    peakBoost: performance.peakBoost,
    maxRpm: performance.maxRpm,
    topSpeed,
    graph: [...liveGraphData]
  };

  savedPulls.unshift(snapshot);

  const vehiclePulls = getActiveVehiclePulls();

  vehiclePulls.unshift(snapshot);

  saveActiveVehiclePulls(vehiclePulls);

  if (savedPulls.length > 10) {
    savedPulls.pop();
  }

  try {
    localStorage.setItem(
      "revantaPulls",
      JSON.stringify(savedPulls)
    );
  } catch (err) {
    console.warn("Failed to save pull", err);
  }

  debugLive("PULL SNAPSHOT SAVED");
  setValue("commandLog", "Pull snapshot saved.");
  speak("Pull snapshot saved.");

  renderPullHistory();
}

function calculatePullScore(pull) {
  const boost = pull.peakBoost || 0;
  const rpm = pull.maxRpm || 0;
  const speed = pull.topSpeed || 0;

  let score = 0;

  score += Math.min(boost * 3, 40);
  score += Math.min(rpm / 120, 35);
  score += Math.min(speed / 3, 25);

  return Math.round(Math.min(score, 100));
}

function getPullGrade(score) {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

function getPullStatus(score) {
  if (score >= 90) return "ELITE PULL";
  if (score >= 80) return "STRONG PULL";
  if (score >= 70) return "GOOD PULL";
  if (score >= 60) return "BASELINE PULL";
  return "LOW DATA / LIGHT PULL";
}

function renderPullHistory() {
  const box = $("pullHistoryList");
  if (!box) return;

  if (!requirePlus("Pull history")) return;

  const pulls = getActiveVehiclePulls();

  const totalPulls = pulls.length;

  const bestBoost = Math.max(
    ...pulls.map(p => p.peakBoost || 0),
    0
  );

  const bestRpm = Math.max(
    ...pulls.map(p => p.maxRpm || 0),
    0
  );

  const bestSpeed = Math.max(
    ...pulls.map(p => p.topSpeed || 0),
    0
  );

  const avgBoost =
    pulls.reduce((sum, p) => sum + (p.peakBoost || 0), 0) /
    (totalPulls || 1);

  const avgRpm =
    pulls.reduce((sum, p) => sum + (p.maxRpm || 0), 0) /
    (totalPulls || 1);

  const lastPull =
    pulls[0]
    ? new Date(pulls[0].timestamp).toLocaleString()
    : "No pulls yet";

  if (!pulls.length) {
    box.innerHTML = "No saved pulls yet.";
    return;
  }

  const analytics = `
  <div class="pull-analytics">
    <div class="pull-stat">
      <span>Total Pulls</span>
      <strong>${totalPulls}</strong>
    </div>

    <div class="pull-stat">
      <span>Best Boost</span>
      <strong>${bestBoost.toFixed(1)} PSI</strong>
    </div>

    <div class="pull-stat">
      <span>Best RPM</span>
      <strong>${bestRpm} RPM</strong>
    </div>

    <div class="pull-stat">
      <span>Top Speed</span>
      <strong>${bestSpeed} MPH</strong>
    </div>

    <div class="pull-stat">
      <span>Avg Boost</span>
      <strong>${avgBoost.toFixed(1)} PSI</strong>
    </div>

    <div class="pull-stat">
      <span>Avg RPM</span>
      <strong>${Math.round(avgRpm)} RPM</strong>
    </div>

    <div class="pull-stat">
      <span>Last Pull</span>
      <strong>${lastPull}</strong>
    </div>
  </div>
`;

  box.innerHTML =
    analytics +
    pulls.map((pull, index) => {
    const date = new Date(pull.timestamp).toLocaleString();

    return `
      <div class="pull-card" onclick="openPullReplay(${index})">
        <strong>Pull #${index + 1}</strong>
        ${(pull.peakBoost || 0) === bestBoost ? `<span class="best-pull-badge">BEST BOOST</span>` : ""}
        <p>${date}</p>
        <p>Peak Boost: ${pull.peakBoost ?? 0} PSI</p>
        <p>Max RPM: ${pull.maxRpm ?? 0} RPM</p>
        <p>Top Speed: ${pull.topSpeed ?? 0} MPH</p>
        <p>Pull Score: ${calculatePullScore(pull)} / 100</p>
        <p>Grade: ${getPullGrade(calculatePullScore(pull))}</p>
        <p>Status: ${getPullStatus(calculatePullScore(pull))}</p>

        <button onclick="event.stopPropagation(); deletePull(${index})">
          DELETE
        </button>
        <button onclick="event.stopPropagation(); comparePull(${index})">
          COMPARE
        </button>

        </div>
        `;
  }).join("");
}

function openPullReplay(index) {
  const pulls = JSON.parse(
    localStorage.getItem("revantaPulls") || "[]"
  );

  const pull = pulls[index];

  if (!pull) return;

  $("pullReplayPanel")?.classList.remove("hidden");

  setValue("replayBoost", `${pull.peakBoost ?? 0} PSI`);
  setValue("replayRpm", `${pull.maxRpm ?? 0} RPM`);
  setValue("replaySpeed", `${pull.topSpeed ?? 0} MPH`);

  drawReplayGraph(pull.graph || []);
}

window.openPullReplay = openPullReplay;
window.renderPullHistory = renderPullHistory;

function deletePull(index) {
  if (!confirm("Delete this saved pull?")) return;

  const pulls = JSON.parse(localStorage.getItem("revantaPulls") || "[]");

  pulls.splice(index, 1);

  localStorage.setItem("revantaPulls", JSON.stringify(pulls));
  savedPulls = pulls;

  renderPullHistory();

  const panel = $("pullReplayPanel");
  if (panel) panel.classList.add("hidden");

  speak("Pull deleted.");
}

let compareSelection = [];

function comparePull(index) {
  const pulls = JSON.parse(localStorage.getItem("revantaPulls") || "[]");
  const pull = pulls[index];

  if (!pull) return;

  compareSelection.push(pull);

  if (compareSelection.length > 2) {
    compareSelection.shift();
  }

  if (compareSelection.length < 2) {
    speak("Select one more pull.");
    return;
  }

  const [a, b] = compareSelection;

  $("pullComparePanel")?.classList.remove("hidden");

  const scoreA = calculatePullScore(a);
  const scoreB = calculatePullScore(b);

  setValue("compareLeftBoost", `Boost: ${a.peakBoost ?? 0} PSI`);
  setValue("compareRightBoost", `Boost: ${b.peakBoost ?? 0} PSI`);

  setValue("compareLeftRpm", `RPM: ${a.maxRpm ?? 0}`);
  setValue("compareRightRpm", `RPM: ${b.maxRpm ?? 0}`);

  setValue("compareLeftSpeed", `Speed: ${a.topSpeed ?? 0} MPH`);
  setValue("compareRightSpeed", `Speed: ${b.topSpeed ?? 0} MPH`);

  setValue("compareLeftScore", `Score: ${scoreA}`);
  setValue("compareRightScore", `Score: ${scoreB}`);

  const winner =
    scoreA > scoreB ? "Pull A Wins" :
    scoreB > scoreA ? "Pull B Wins" :
    "Pulls Are Tied";

  setValue("compareWinner", winner);
  speak(winner);
}

window.comparePull = comparePull;

window.deletePull = deletePull;

function exportPullHistory() {
  const pulls =
    localStorage.getItem("revantaPulls") || "[]";

  const blob = new Blob(
    [pulls],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = `revanta-pulls-${Date.now()}.json`;

  a.click();

  URL.revokeObjectURL(url);

  speak("Pull history exported.");
}

async function importPullHistory() {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = ".json";

  input.onchange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const text = await file.text();

    try {
      const pulls = JSON.parse(text);

      localStorage.setItem(
        "revantaPulls",
        JSON.stringify(pulls)
      );

      renderPullHistory();

      speak("Pull history restored.");
    } catch {
      speak("Import failed.");
    }
  };

  input.click();
}

window.exportPullHistory = exportPullHistory;
window.importPullHistory = importPullHistory;

function getSavedVehicles() {
  return JSON.parse(localStorage.getItem("revantaGarage") || "[]");
}

function saveActiveVehicleToGarage() {
  if (!requirePro("Garage profiles")) return;

  const profile = getActiveProfile ? getActiveProfile() : {};
  const vehicles = getSavedVehicles();

  const vehicle = {
    id: Date.now(),
    name: profile.vehicleName || profile.commandName || "Revanta Vehicle",
    vin: profile.vin || "Unknown VIN",
    lastSeen: new Date().toLocaleString(),
    bestBoost: performance?.peakBoost || 0,
    topSpeed: topSpeed || 0,
    pullCount: getActiveVehiclePulls().length
  };

  vehicles.unshift(vehicle);

  localStorage.setItem(
    "revantaGarage",
    JSON.stringify(vehicles)
  );

  renderProGarage();

  speak("Vehicle saved to garage.");
}

function renderProGarage() {
  const box = $("proGarageList");

  if (!box) return;

  if (!requirePro("Garage profiles")) return;

  const vehicles = getSavedVehicles();

  if (!vehicles.length) {
    box.innerHTML = "No saved vehicles yet.";
    return;
  }

  box.innerHTML = vehicles.map((vehicle, index) => `
  <div class="garage-card">
    <strong>${vehicle.name}</strong>
    <p>VIN: ${vehicle.vin}</p>
    <p>Last Seen: ${vehicle.lastSeen}</p>
    <p>Best Boost: ${vehicle.bestBoost} PSI</p>
    <p>Top Speed: ${vehicle.topSpeed} MPH</p>
    <p>Pulls: ${vehicle.pullCount}</p>

    <button onclick="loadGarageVehiclePro(${index})">
      LOAD VEHICLE
    </button>

    <button onclick="deleteGarageVehiclePro(${index})">
      DELETE
    </button>
  </div>
`).join("");
}

  window.renderProGarage = renderProGarage;
  window.saveActiveVehicleToGarage =
  saveActiveVehicleToGarage;

function loadGarageVehiclePro(index) {
  if (!requirePro("Garage switching")) return;

  const vehicles = getSavedVehicles();
  const vehicle = vehicles[index];

  if (!vehicle) return;

  currentVehicleProfile.name = vehicle.name;
  currentVehicleProfile.vin = vehicle.vin;
  currentVehicleProfile.lastSeen = vehicle.lastSeen;

  updateVehicleProfileUI();
  saveVehicleProfile();

  updateActiveGarageVehicle(vehicle.name);

  speak(`${vehicle.name} loaded.`);
}

function deleteGarageVehiclePro(index) {
  if (!confirm("Delete this vehicle from garage?")) return;

  const vehicles = getSavedVehicles();
  vehicles.splice(index, 1);

  localStorage.setItem("revantaGarage", JSON.stringify(vehicles));

  renderProGarage();

  speak("Vehicle deleted.");
}

window.loadGarageVehiclePro = loadGarageVehiclePro;
window.deleteGarageVehiclePro = deleteGarageVehiclePro;

function updateActiveGarageVehicle(name) {
  setValue("activeGarageVehicle", name || "Revanta Vehicle");
  localStorage.setItem("revantaActiveGarageVehicle", name || "Revanta Vehicle");
}

window.updateActiveGarageVehicle = updateActiveGarageVehicle;

function drawReplayGraph(data) {

  const canvas = $("replayGraph");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  canvas.width = canvas.offsetWidth;
  canvas.height = 140;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!data.length) return;

  const rpmValues = data
    .map(p => p.rpm || 0);

  const maxRpm = Math.max(...rpmValues, 1);

  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#00e5ff";

  rpmValues.forEach((rpm, i) => {

    const x =
      (i / (rpmValues.length - 1)) * canvas.width;

    const y =
      canvas.height -
      (rpm / maxRpm) * canvas.height;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

function renderLiveGraphs() {
  const rpmValues = liveGraphData.map(p => p.rpm).filter(v => v !== null);
  const speedValues = liveGraphData.map(p => p.speed).filter(v => v !== null);
  const boostValues = liveGraphData.map(p => p.boost).filter(v => v !== null);
  const mafValues = liveGraphData.map(p => p.maf).filter(v => v !== null);

  drawSimpleGraph("rpmGraph", rpmValues);
  drawSimpleGraph("speedGraph", speedValues);
  drawSimpleGraph("boostGraph", boostValues);
  drawSimpleGraph("mafGraph", mafValues);
}

function detectAdaptiveVehicleMode() {
  const hasBoost = vehicleCapabilities.boost || liveGaugeProof.boost;
  const maf = liveMetrics.maf || 0;
  const boost = liveMetrics.boost || 0;

  if (hasBoost && boost > 1) {
    adaptiveVehicleMode = "turbo";
  } else if (maf > 0 && !hasBoost) {
    adaptiveVehicleMode = "naturally aspirated";
  } else {
    adaptiveVehicleMode = "standard obd";
  }

  setValue(
    "vehicleProfileType",
    `Type: ${adaptiveVehicleMode.toUpperCase()}`
  );
}

function drawSimpleGraph(canvasId, values) {
  const canvas = document.getElementById(canvasId);

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (!values || values.length < 2) return;

  const max = Math.max(...values);
  const min = Math.min(...values);

  const range = max - min || 1;

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#00E5FF";

  values.forEach((value, index) => {
    const x = (index / (values.length - 1)) * width;

    const y =
      height -
      ((value - min) / range) * height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

function applyIdleVibration(rpm) {
  const dash = document.body;

  if (rpm > 700 && rpm < 1100) {
    const vib = Math.sin(Date.now() / 120) * 0.5;
    dash.style.transform = `translateX(${vib}px)`;
  } else {
    dash.style.transform = "";
  }
}

function animateValue(id, value) {
  setValue(id, value);
}

async function readOBDLiveClassic() {

  debugLive("ENTERED readOBDLiveClassic");

  if (livePollRunning) {
    debugLive("POLL BLOCKED: already running");
    return;
  }

  if (isScanningCodes) {
    debugLive("POLL BLOCKED: scan active");
    return;
  }

  if (!obdLive || obdMode !== "classic") {
    debugLive(`POLL BLOCKED: obdLive=${obdLive} obdMode=${obdMode}`);
    return;
  }

  livePollRunning = true;

  debugLive("SET livePollRunning TRUE");

  let pollStart = Date.now();

  const wait = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  debugLive("WAIT FUNCTION READY");

  try {

    debugLive("OBD POLLING STARTED");

  let coolant = null;
  let voltage = null;
  let intake = null;
  let fuel = null;

    obdPollCount++;

    debugLive("OBD POLLING STARTED");

    // =========================
    // FAST LIVE PIDS
    // =========================

    const rpmRaw = await safeElm("010C", 1200);
    debugLive(`RPM RAW: ${JSON.stringify(rpmRaw)}`);
    await wait(40);

    const speedRaw = await safeElm("010D", 1200);
    debugLive(`SPEED RAW: ${JSON.stringify(speedRaw)}`);
    await wait(40);

    const mafRaw = await safeElm("0110", 1200);
    debugLive(`MAF RAW: ${JSON.stringify(mafRaw)}`);
    await wait(40);

    let mapRaw = null;

    {
      mapRaw = await safeElm("010B", 1200);
      debugLive(`MAP RAW: ${JSON.stringify(mapRaw)}`);
      await wait(40);
    }

    // =========================
    // PARSE FAST DATA
    // =========================

    const rpm = parseRPM(rpmRaw);
    const maf = parseMaf(mafRaw);

    const speed = keepGoodReading(
      "speed",
      parseSpeed(speedRaw),
      0,
      160
    );

    let mapKpa = null;
let rawBoost = null;

try {
  mapKpa = parseMapKpa(mapRaw);

  rawBoost =
    mapKpa === null
      ? null
      : calculateBoostPsi(mapKpa);

} catch (err) {

  debugLive(`BOOST PID FAILED: ${err?.message || err}`);

  mapKpa = null;
  rawBoost = null;
}

    const boost =
      rawBoost === null
        ? null
        : keepGoodReading(
            "boost",
            Math.max(0, rawBoost),
            0,
            TDI_CALIBRATION.maxBoostPsi
          );

    // =========================
    // UPDATE MAIN LIVE GAUGES
    // =========================

    if (rpm !== null) {
  smoothSetGauge("rpmValue", rpm);
} else {
  smoothGaugeValues.rpmValue = 0;
  setValue("rpmValue", "--");
}

    const gpsSpeedText = getText("speedValue", "0");
const gpsSpeed = Number(gpsSpeedText) || 0;

let finalSpeed = speed;

if (speed === null || speed === 0) {
  finalSpeed = gpsSpeed > 0 ? gpsSpeed : 0;
}

if (finalSpeed !== null) {
  smoothSetGauge("speedValue", finalSpeed);
  updateSpeedStats(finalSpeed);
} else {
  setValue("speedValue", "--");
}

    if (maf !== null) {
      liveGaugeProof.maf = true;
      smoothSetGauge("mafValue", maf, 1);
    } else {
      setValue("mafValue", "--");
    }

    if (boost !== null) {
  liveGaugeProof.boost = true;
  lastBoostSeenAt = Date.now();

  setValue(
  "boostValue",
  Math.max(0, boost).toFixed(1)
);
} else {
  if (Date.now() - lastBoostSeenAt > 2500) {
    smoothGaugeValues.boostValue = 0;
    setValue("boostValue", "--");
  }
}

    // =========================
    // SLOWER PIDS
    // =========================

    if (obdPollCount % 5 === 0) {

      const voltageRaw = await safeElm("ATRV", 1800);
      debugLive(`VOLT RAW: ${JSON.stringify(voltageRaw)}`);
      await wait(100);

      const coolantRaw = await safeElm("0105", 1800);
      debugLive(`COOLANT RAW: ${JSON.stringify(coolantRaw)}`);
      await wait(100);

      const intakeRaw = await safeElm("010F", 1800);
      debugLive(`INTAKE RAW: ${JSON.stringify(intakeRaw)}`);
      await wait(100);

      voltage = keepGoodReading(
        "voltage",
        parseVoltage(voltageRaw),
        TDI_CALIBRATION.voltageMin,
        TDI_CALIBRATION.voltageMax
      );

      const fuelRaw = vehicleCapabilities.fuel
        ? await safeElm("012F", 1800)
        : null;

      fuel = parseFuel(fuelRaw);

      const parsedCoolant = parseCoolant(coolantRaw);
      const parsedIntake = parseIntakeTemp(intakeRaw);

      coolant =
        parsedCoolant === null
          ? null
          : keepGoodReading(
              "coolant",
              parsedCoolant,
              TDI_CALIBRATION.coolantMin,
              TDI_CALIBRATION.coolantMax
            );

      intake =
        parsedIntake === null
          ? null
          : keepGoodReading(
              "intake",
              parsedIntake,
              TDI_CALIBRATION.intakeMin,
              TDI_CALIBRATION.intakeMax
            );

      // =========================
      // UPDATE SLOW GAUGES
      // =========================

      if (voltage !== null) {
        setValue("batteryValue", `${voltage.toFixed(1)} V`);
        checkBatteryAlert(voltage);
      } else {
        setValue("batteryValue", "-- V");
      }

      if (coolant !== null) {
        liveGaugeProof.coolant = true;
        setValue("coolantValue", coolant);
      } else {
        setValue("coolantValue", "--");
      }

      if (intake !== null) {
        liveGaugeProof.intake = true;
        setValue("intakeValue", `${intake} °F`);
      } else {
        setValue("intakeValue", "-- °F");
      }

      if (fuel !== null) {
        liveGaugeProof.fuel = true;
        setValue("fuelValue", `${fuel}%`);
      } else {
        setValue("fuelValue", "--");
      }
    }

    // =========================
    // ALWAYS RUN
    // =========================

    setValue("sourceStatus", "CLASSIC LIVE");
    setValue("obdStatus", "LIVE");

    updateLiveMetrics({
      rpm,
      speed,
      boost,
      maf,
      coolant,
      voltage,
      intake,
      fuel
    });

    updateGaugeVisibility();
    syncNavGauges();
    updateHeaderBadges();

    lastPollDuration = Math.round(Date.now() - pollStart);
    const hasRealData =
      rpm !== null ||
      speed !== null ||
      boost !== null ||
      maf !== null ||
      coolant !== null ||
      voltage !== null ||
      intake !== null ||
      fuel !== null;

    if (hasRealData) {
      lastObdResponseTime = Date.now();
    } else {
      debugLive("ECU WATCH: no real PID data this poll");
  }

    updateVehicleProfileUI();

  } catch (err) {

    console.warn("OBD read failed.", err);

    debugLive(`OBD ERROR: ${err?.message || err}`);

    debugLive(`NON-FATAL POLL ERROR`);

      } finally {

    livePollRunning = false;

    debugLive("LIVE POLL FINISHED");
  }

}

function decodeDTC(raw) {
  const clean = cleanElmResponse(raw).replace(/\s+/g, "").toUpperCase();

  if (clean.startsWith("41")) return [];

  const start43 = clean.indexOf("43");
  const start47 = clean.indexOf("47");
  const start =
    start43 !== -1 ? start43 :
    start47 !== -1 ? start47 :
    -1;

  if (start === -1) return [];

  const data = clean.slice(start + 2);
  const codes = [];

  for (let i = 0; i + 4 <= data.length; i += 4) {
    const chunk = data.slice(i, i + 4);
    if (chunk === "0000") continue;

    const a = parseInt(chunk.slice(0, 2), 16);
    const b = parseInt(chunk.slice(2, 4), 16);

    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (a === 0 && b === 0) continue;

    const type = ["P", "C", "B", "U"][(a & 0xC0) >> 6];
    const digit1 = (a & 0x30) >> 4;
    const digit2 = a & 0x0F;
    const digit3 = (b & 0xF0) >> 4;
    const digit4 = b & 0x0F;

    codes.push(`${type}${digit1}${digit2}${digit3}${digit4}`);
  }

  return [...new Set(codes)];
}

function decodeDtcBytes(byte1, byte2) {
  const A = parseInt(byte1, 16);
  const B = parseInt(byte2, 16);

  if (!Number.isFinite(A) || !Number.isFinite(B)) return null;
  if (A === 0 && B === 0) return null;

  const system = ["P", "C", "B", "U"][(A & 0xc0) >> 6];
  const digit1 = (A & 0x30) >> 4;
  const digit2 = A & 0x0f;
  const digit3 = (B & 0xf0) >> 4;
  const digit4 = B & 0x0f;

  const code = `${system}${digit1}${digit2}${digit3}${digit4}`;

  if (!/^[PCBU][0-3][0-9A-F]{3}$/.test(code)) return null;
  if (code === "P0000") return null;

  return code;
}

function decodeRawDtcResponse(raw) {
  if (!raw) return [];

  const results = [];

  const sections = [
    {
      label: "Stored",
      mode: "43",
      text: raw.match(/STORED:\s*([\s\S]*?)(PENDING:|PERMANENT:|$)/i)?.[1] || ""
    },
    {
      label: "Pending",
      mode: "47",
      text: raw.match(/PENDING:\s*([\s\S]*?)(PERMANENT:|$)/i)?.[1] || ""
    },
    {
      label: "Permanent",
      mode: "4A",
      text: raw.match(/PERMANENT:\s*([\s\S]*)/i)?.[1] || ""
    }
  ];

  for (const section of sections) {
    let clean = section.text
      .replace(/SEARCHING\.\.\./gi, "")
      .replace(/SEARCHING/gi, "")
      .replace(/NO DATA/gi, "")
      .replace(/STOPPED/gi, "")
      .replace(/UNABLE TO CONNECT/gi, "")
      .replace(/BUS INIT/gi, "")
      .replace(/ERROR/gi, "")
      .replace(/OK/gi, "")
      .replace(/>/g, "")
      .replace(/\s+/g, "")
      .toUpperCase();

    const modeIndex = clean.indexOf(section.mode);
    if (modeIndex === -1) continue;

    clean = clean.slice(modeIndex);

    const hexOnly = clean.replace(/[^A-F0-9]/g, "");
    const bytes = hexOnly.match(/.{2}/g) || [];

    const startIndex = bytes.indexOf(section.mode);
    if (startIndex === -1) continue;

    for (let i = startIndex + 1; i < bytes.length - 1; i += 2) {
      const b1 = bytes[i];
      const b2 = bytes[i + 1];

      if (!b1 || !b2) continue;
      if (b1 === "00" && b2 === "00") continue;

      const code = decodeDtcBytes(b1, b2);
      if (!code) continue;

      results.push({
        code,
        type: section.label,
        description:
          DTC_DESCRIPTIONS[code] ||
          getUniversalCodeGuide(code) ||
          "Unknown / manufacturer-specific code"
      });
    }
  }

  return results.filter(
    (item, index, arr) =>
      index === arr.findIndex(
        (x) => x.code === item.code && x.type === item.type
      )
  );
}

const DTC_INTELLIGENCE = {
  P0101: {
    system: "Air / Boost",
    severity: "medium",
    plain: "Airflow reading does not match expected values.",
    likelyIssue: "Airflow/boost mismatch, not always the MAF itself.",
    firstMove: "Check intake clamps, vacuum lines, and MAF connector before replacing the sensor.",
    dontWasteMoney: "Do not replace the MAF again until wiring and boost leaks are ruled out.",
    causes: [
      "Bad or dirty MAF sensor",
      "MAF wiring or connector issue",
      "Boost leak or intake leak",
      "Vacuum leak or cracked line",
      "Boost control issue",
      "Turbo actuator sticking",
      "Clogged air filter",
      "EGR airflow mismatch"
    ],
    checks: [
      "Inspect MAF connector and wiring",
      "Check intake piping and clamps",
      "Inspect vacuum lines and boost control",
      "Check for boost leaks",
      "Watch live MAF data at idle and throttle"
    ]
  },

  P0102: {
    system: "Air / Electrical",
    severity: "medium",
    plain: "MAF signal too low.",
    likelyIssue: "Electrical issue or disconnected sensor.",
    firstMove: "Check the MAF plug and wiring before assuming the sensor is bad.",
    dontWasteMoney: "Do not replace the MAF if wiring is loose or broken.",
    causes: [
      "Bad MAF sensor",
      "Broken wire or poor connection",
      "Severe intake restriction"
    ],
    checks: [
      "Check MAF plug",
      "Check wiring continuity",
      "Inspect air filter and intake"
    ]
  },

  P0299: {
    system: "Turbo / Boost",
    severity: "high",
    plain: "Turbo is not making expected boost.",
    likelyIssue: "Boost leak or vacuum/control issue.",
    firstMove: "Inspect boost pipes and vacuum lines before assuming turbo failure.",
    dontWasteMoney: "Do not replace the turbo until leaks and boost control are verified.",
    causes: [
      "Boost leak",
      "Vacuum/control leak",
      "Bad boost control solenoid",
      "Turbo actuator issue",
      "Worn turbo"
    ],
    checks: [
      "Check boost pipes",
      "Inspect vacuum/control system",
      "Test boost control operation",
      "Check actuator movement"
    ]
  },

  P0600: {
    system: "ECU / Communication",
    severity: "medium",
    plain: "The ECU detected a communication link fault.",
    likelyIssue: "Temporary communication fault, scanner issue, wiring, or ECU communication problem.",
    firstMove: "Clear codes, reconnect OBD, and rescan after all sensors are plugged in.",
    dontWasteMoney: "Do not assume the ECU is bad from one communication code during testing.",
    causes: [
      "OBD adapter communication interruption",
      "Low voltage during testing",
      "Loose connector",
      "CAN/K-line communication issue",
      "ECU communication fault"
    ],
    checks: [
      "Check battery voltage",
      "Clear codes",
      "Cycle ignition",
      "Reconnect OBD adapter",
      "Rescan"
    ]
  }
};

function getFixPriority(code) {
  const critical = ["P0562", "P0563"];
  const fixSoon = ["P0101", "P0102", "P0103", "P0299", "P0234", "P0401", "P0402", "P0037", "P0138", "P0141"];
  const driveSafe = ["P0671", "P0672", "P0673", "P0674", "P0380", "P0128"];

  if (critical.includes(code)) return "CRITICAL";
  if (fixSoon.includes(code)) return "FIX SOON";
  if (driveSafe.includes(code)) return "DRIVE SAFE";

  return "CHECK SOON";
}

function getDriveSafety(code) {
  const doNotDrive = ["P0562", "P0563", "P0606"];
  const fixSoon = ["P0300", "P0301", "P0302", "P0303", "P0304", "P0700", "P0299", "P0234"];

  if (doNotDrive.includes(code)) return "DO NOT DRIVE";
  if (fixSoon.includes(code)) return "FIX SOON";

  return "SAFE TO DRIVE / MONITOR";
}

function getSmartDiagnosis(code) {
  const boost = Number(getText("boostValue", "0")) || 0;
  const maf = Number(getText("mafValue", "0")) || 0;
  const rpm = Number(getText("rpmValue", "0")) || 0;

  if (code === "P0101") {
    if (boost < 5 && rpm > 1800) {
      return "Likely airflow/boost mismatch. Check boost pipes, vacuum/control lines, and turbo actuator before replacing the MAF.";
    }

    if (maf <= 0) {
      return "MAF signal looks missing or dead. Check MAF plug, wiring, fuse power, and ground.";
    }

    return "MAF reading is out of expected range. Check MAF wiring, intake leaks, EGR airflow mismatch, and boost leaks.";
  }

  if (code === "P0299") {
    return "Likely underboost. First check vacuum/control lines, boost control valve, actuator movement, intercooler pipes, and boost leaks.";
  }

  if (code === "P0234") {
    return "Likely overboost. Check sticky actuator, boost control, and turbo vane/wastegate control.";
  }

  if (code.startsWith("P067")) {
    return "Likely glow plug circuit issue. Check glow plug, harness connection, and glow plug relay/module.";
  }

  if (["P0037", "P0138", "P0141"].includes(code)) {
    return "O2 sensor Bank 1 Sensor 2 circuit issue. First inspect the downstream O2 sensor wiring, connector, heater fuse, and harness near the exhaust.";
  }

  return "Use the code description and inspect related wiring, sensors, fuses, connectors, and vehicle-specific service information first.";
}

function getAbsGuidance() {
  return {
    status: "ABS scan requires enhanced ABS/module access.",
    likelyIssue: "ABS, traction, or speedometer issues usually point to wheel speed signal loss.",
    firstChecks: [
      "Inspect wheel speed sensors",
      "Inspect tone rings / reluctor rings",
      "Check sensor wiring near the knuckle",
      "Check sensor gap and damage",
      "Look for metal shavings or rust near sensor",
      "Use an enhanced scanner for ABS module codes"
    ],
    note: "Basic OBD engine mode may not read ABS codes. Revanta can still guide first checks."
  };
}

function showAbsHelp() {
  const abs = getAbsGuidance();

  setHTML(
    "diagnosticResults",
    `
      <div class="dtc-card">
        <div class="dtc-topline">
          <strong>ABS</strong>
          <span>GUIDE</span>
        </div>
        <h3>${abs.status}</h3>
        <p><b>Likely issue:</b> ${abs.likelyIssue}</p>
        <p><b>First checks:</b></p>
        <ul>
          ${abs.firstChecks.map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <p>${abs.note}</p>
      </div>
    `
  );

  setValue("rawDtcOutput", "ABS module scan not available through basic OBD mode yet.");
  speak("ABS guidance loaded. Check wheel speed sensors, tone rings, and sensor wiring.");
}

let lastDiagnosticCodes = [];

function formatCodeList(codes) {
  if (!codes || !codes.length) {
    return "No stored engine codes found.";
  }

  return codes
    .map((code) => `${code} — ${describeCode(code)}`)
    .join("\n");
}

function updateDiagnosticsUI(codes = lastDiagnosticCodes, raw = "") {
  const hasCodes = codes.length > 0;
  const time = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });

  setValue("celStatus", hasCodes ? "CHECK ENGINE" : "CLEAR");
  setValue("celNote", hasCodes ? "Stored codes detected." : "No stored codes found.");
  setValue("diagObdStatus", obdLive ? "LIVE" : "OFF");
  setValue("diagObdNote", obdLive ? "Adapter connected." : "Connect OBD first.");
  setValue("storedCodeCount", String(codes.length));
  setValue("storedCodeNote", hasCodes ? codes.join(", ") : "No codes.");
  setValue("lastScanTime", time);
  setValue("lastScanNote", hasCodes ? "Codes found." : "Scan clean.");

  try {
    renderDiagnosticCards(codes);
  } catch (err) {
    console.error("DTC card render failed:", err);
    setValue("diagnosticResults", `Codes read, but card render failed: ${err.message || err}`);
  }

  setValue("rawDtcOutput", raw || "No raw response.");
  setValue("codeStatus", hasCodes ? codes.join(", ") : "CLEAR");
}

function describeCode(code) {
  return (
    DTC_DESCRIPTIONS[code] ||
    "Universal OBD diagnostic trouble code"
  );
}

function getUniversalCodeGuide(code) {
  if (!code || code.length < 5) {
    return "Unknown diagnostic code format.";
  }

  const family = code[0];
  const area = code.slice(1, 3);

  if (family === "P") {
    if (area === "00" || area === "01" || area === "02") {
      return "Powertrain sensor or fuel/air metering fault. Start with wiring, sensor connector, intake/vacuum leaks, and related live data.";
    }

    if (area === "03") {
      return "Ignition, misfire, or combustion-related fault. Check plugs/coils/injectors, fuel delivery, compression, and wiring.";
    }

    if (area === "04") {
      return "Emissions or EGR/EVAP-related fault. Check vacuum lines, purge/vent circuits, EGR flow, and related connectors.";
    }

    if (area === "05") {
      return "Vehicle speed, idle control, or system voltage related fault. Check battery voltage, grounds, speed sensors, and throttle/idle components.";
    }

    if (area === "06") {
      return "ECU/computer output or communication-related fault. Check battery health, grounds, fuses, connectors, and scan again after cycling ignition.";
    }

    if (area === "07" || area === "08" || area === "09") {
      return "Transmission or drivetrain-related powertrain fault. Check fluid level/condition if applicable, wiring, connectors, and module codes.";
    }

    return "Powertrain fault. Check the affected circuit, sensor wiring, connector, fuse, ground, and compare live data before replacing parts.";
  }

  if (family === "C") {
    return "Chassis-related fault. Common areas include ABS, traction control, steering angle, wheel speed sensors, tone rings, and wiring.";
  }

  if (family === "B") {
    return "Body-related fault. Common areas include airbags, HVAC, lighting, door modules, switches, and body control wiring.";
  }

  if (family === "U") {
    return "Network communication fault. Check battery voltage, grounds, module connectors, CAN wiring, and whether modules are awake/responding.";
  }

  return "Universal diagnostic code. Start with wiring, connectors, fuses, grounds, and vehicle-specific service information.";
}

function renderDiagnosticCards(codes) {
  const box = $("diagnosticResults");
  if (!box) return;

  if (!codes.length) {
    setHTML("diagnosticResults", `<div class="diagnostic-empty">No stored engine codes found.</div>`);
    return;
  }

  box.innerHTML = codes.map((code) => {
    const desc = describeCode(code);
    const intel = DTC_INTELLIGENCE[code];

    if (!intel) {
      if (typeof renderDTCExplanation === "function") {
        return renderDTCExplanation(code);
      }

      return `
        <div class="dtc-card">
          <strong>${code}</strong>
          <span>${desc}</span>
          <p><b>Revanta Guide:</b> ${getUniversalCodeGuide(code)}</p>
          <p><b>First Move:</b> Check the related sensor connector, wiring, fuse, ground, and obvious damage before buying parts.</p>
          <p><b>Note:</b> This is a universal fallback. Vehicle-specific info may still be needed.</p>
        </div>
      `;
    }

    return `
      <div class="dtc-card severity-${intel.severity}">
        <strong>${code}</strong>
        <span>${desc}</span>

        <p><b>Fix Priority:</b> ${getFixPriority(code)}</p>
        <p><b>Drive Safety:</b> ${getDriveSafety(code)}</p>
        <p><b>Smart Diagnosis:</b> ${getSmartDiagnosis(code)}</p>
        <p><b>Likely Issue:</b> ${intel.likelyIssue}</p>
        <p><b>First Move:</b> ${intel.firstMove}</p>
        <p style="color:#ffb3b3;"><b>Avoid:</b> ${intel.dontWasteMoney}</p>

        <details>
          <summary>Details</summary>

          <p>${intel.plain}</p>

          <ul>
            ${intel.causes.map((c) => `<li>${c}</li>`).join("")}
          </ul>

          <hr style="opacity:0.2;">

          <ul>
            ${intel.checks.map((c) => `<li>${c}</li>`).join("")}
          </ul>
        </details>
      </div>
    `;
  }).join("");
}

function loadCodeHistory() {
  try {
    return JSON.parse(localStorage.getItem("revantaCodeHistory") || "[]");
  } catch {
    return [];
  }
}

function renderCodeHistory() {
  const history = loadCodeHistory();

  if (!history.length) {
    setValue("codeHistoryOutput", "No saved history yet.");
    return;
  }

  const text = history
    .slice(-8)
    .reverse()
    .map((item) => `${item.time} — ${item.codes.join(", ")} — ${item.summary}`)
    .join(" | ");

  setValue("codeHistoryOutput", text);
}

function saveCodeHistory() {

  if (!requirePlus("Diagnostic history")) return;

  const codes = lastDiagnosticCodes || [];

  if (!codes.length) {
    speak("No codes to save.");
    return;
  }

  const history = loadCodeHistory();

  history.push({
    time: new Date().toLocaleString(),
    codes,
    summary: formatCodeList(codes)
  });

  localStorage.setItem("revantaCodeHistory", JSON.stringify(history.slice(-25)));
  renderCodeHistory();
  speak("Code history saved.");
}

function clearCodeHistory() {

  if (!requirePlus("Diagnostic history")) return;
  
  localStorage.removeItem("revantaCodeHistory");
  setValue("codeHistoryOutput", "No saved history yet.");
  speak("Code history cleared.");
}

function checkEngineStatus() {
  if (!obdLive || obdMode !== "classic") {
    speak("Connect O B D first.");
    setValue("celStatus", "NO OBD");
    setValue("celNote", "Adapter not connected.");
    return;
  }

  scanCodes();
}

async function scanCodes() {
  if (!obdLive || obdMode !== "classic") {
    speak("Connect O B D first.");
    setValue("diagObdStatus", "OFF");
    setValue("diagObdNote", "Adapter not connected.");
    return;
  }

  if (isScanningCodes) {
    speak("Scan already in progress.");
    return;
  }

  isScanningCodes = true;

  if (obdTimer) {
    clearInterval(obdTimer);
    obdTimer = null;
  }

  speak("Scanning vehicle systems.");
  setValue("commandLog", "Live polling paused. Scanning codes...");
  setValue("diagnosticResults", "Scanning ECU...");
  setValue("rawDtcOutput", "Waiting for ECU response...");

  try {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const storedRaw = await elmCommandClassic("03", 5000);
    const pendingRaw = await elmCommandClassic("07", 5000);
    const permanentRaw = await elmCommandClassic("0A", 5000);

    const rawResponse =
      `STORED:\n${storedRaw || "NO RESPONSE"}\n\n` +
      `PENDING:\n${pendingRaw || "NO RESPONSE"}\n\n` +
      `PERMANENT:\n${permanentRaw || "NO RESPONSE"}`;

    const decoded = decodeRawDtcResponse(rawResponse);

    setValue("rawDtcOutput", rawResponse);

    if (!decoded.length) {
      lastDiagnosticCodes = [];
      updateDiagnosticsUI([], rawResponse);
      setValue("diagnosticResults", "No readable diagnostic trouble codes found.");
      speak("No stored, pending, or permanent codes found.");
      return;
    }

    const codes = [...new Set(decoded.map((d) => d.code))];
    lastDiagnosticCodes = codes;

    updateDiagnosticsUI(codes, rawResponse);
    renderCodeHistory();

    setValue("commandLog", `Codes found: ${codes.join(", ")}`);
    speak(`${codes.length} diagnostic code${codes.length > 1 ? "s" : ""} found.`);
  } catch (err) {
    console.warn("Scan failed.", err);
    setValue("commandLog", "Diagnostic scan failed.");
    setValue("diagnosticResults", "Diagnostic scan failed.");
    setValue("rawDtcOutput", `Scan failed: ${err.message || err}`);
    speak("Diagnostic scan failed.");
  } finally {
    isScanningCodes = false;

    if (obdLive && obdMode === "classic") {
      startOBDPolling();
    }
  }
}

async function clearCodes() {
  if (!obdLive || obdMode !== "classic") {
    speak("Connect O B D first.");
    return;
  }

  const ok = confirm("Clear engine codes? This may turn off the check engine light if the issue is fixed.");
  if (!ok) return;

  isScanningCodes = true;

  if (obdTimer) {
    clearInterval(obdTimer);
    obdTimer = null;
  }

  speak("Clearing diagnostic codes.");
  setValue("commandLog", "Live polling paused. Clearing ECU codes...");
  setValue("diagnosticResults", "Clearing codes...");
  setValue("rawDtcOutput", "Sending clear command 04...");

  try {
    await new Promise((resolve) => setTimeout(resolve, 700));

    const raw = await elmCommandClassic("04", 7000);
    const clean = cleanElmResponse(raw);

    lastDiagnosticCodes = [];

    setValue("rawDtcOutput", clean || "Clear command sent.");
    setValue("commandLog", "Clear codes command sent.");
    setValue("diagnosticResults", "Codes cleared command sent. Rescan to confirm.");
    setValue("celStatus", "RESET SENT");
    setValue("celNote", "Rescan to confirm. If the issue is still active, the light may return.");
    setValue("storedCodeCount", "0");
    setValue("storedCodeNote", "Rescan needed.");
    setValue("codeStatus", "RESET");

    speak("Clear codes command sent. Rescan to confirm.");
  } catch (err) {
    console.warn("Clear codes failed.", err);

    setValue("commandLog", "Clear codes failed.");
    setValue("diagnosticResults", "Clear codes failed.");
    setValue("rawDtcOutput", `Clear failed: ${err.message || err}`);

    speak("Clear codes failed.");
  } finally {
    isScanningCodes = false;

    if (obdLive && obdMode === "classic") {
      startOBDPolling();
    }
  }
}

/* =========================
   BUTTON WIRING + INIT
========================= */

function bind(id, eventName, handler) {
  const el = $(id);
  if (!el || typeof handler !== "function") return;

  el.addEventListener(eventName, (e) => {
    e.preventDefault();
    unlockVoice();
    handler();
  });
}

function bindClick(id, handler) {
  bind(id, "click", handler);
}

function bindButtons() {
  bindClick("startBtn", startSystem);
  bindClick("bootStartBtn", startSystem);
  bindClick("skipSetupBtn", skipSetup);
  bindClick("setupSaveBtn", saveSetupProfile);
  bindClick("setupExportBtn", exportVehicleProfile);
  bindClick("factoryResetBtn", factoryReset);

  bindClick("gpsBtn", startGpsSpeed);
  bindClick("weatherBtn", weatherLayer);
  bindClick("connectObdBtn", () => connectOBD(false));
  bindClick("disconnectObdBtn", disconnectOBD);
  bindClick("scanCodesBtn", scanCodes);

  bindClick("listenBtn", listenCommand);
  bindClick("wakeStartBtn", startWakeWord);
  bindClick("wakeStopBtn", stopWakeWord);

  bindClick("testVoiceBtn", testCurrentVoice);
  bindClick("nativeTtsBtn", testNativeTTS);
  bindClick("muteVoiceBtn", muteVoice);
  bindClick("unmuteVoiceBtn", unmuteVoice);
  bindClick("volumeUpBtn", volumeUp);
  bindClick("volumeDownBtn", volumeDown);

  bindClick("systemChimeBtn", systemChime);
  bindClick("startupSoundBtn", playStartupSound);
  bindClick("warningToneBtn", playWarningTone);

  bindClick("alertsBtn", toggleAlerts);
  bindClick("autoThemeBtn", toggleAutoTheme);
  bindClick("fullscreenBtn", goFullscreen);

  bindClick("resetTripBtn", resetTrip);
  bindClick("zeroSixtyBtn", startZeroSixty);
  bindClick("startZeroSixtyBtn", startZeroSixty);
  bindClick("resetZeroSixtyBtn", resetZeroSixty);
  bindClick("spoolModeBtn", toggleSpoolMode);
  bindClick("ambientGlowBtn", toggleAmbientGlow);

  bindClick("copilotReportBtn", copilotReport);
  bindClick("securityBtn", toggleSecurityMode);
  bindClick("securityScanBtn", triggerSecurityScan);

  bindClick("loadDestinationBtn", loadDestination);
  bindClick("openMapsBtn", openFullGoogleMaps);
  bindClick("homeNavBtn", goHomeNav);
  bindClick("navNightBtn", navNightMode);

  qa("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  qa("button[data-theme]").forEach((btn) => {
  btn.addEventListener("click", () => setThemeMode(btn.dataset.theme));
});

  qa("[data-voice]").forEach((btn) => {
    btn.addEventListener("click", () => setVoiceMode(btn.dataset.voice));
  });

  const navInput = $("navSearchInput");

  if (navInput) {
    navInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loadDestination();
    });
  }
}

function showProfileReload(profileKey) {
  if (!profileKey || profileKey === "universal") return;

  applyVisualVehicleProfile(profileKey);

  const profile = VEHICLE_PROFILES[profileKey] || VEHICLE_PROFILES.universal;
  const bootImage = $("bootVehicleImage");

  if (bootImage) {
    bootImage.src = profile.boot;
    bootImage.style.display = "block";
    bootImage.style.visibility = "visible";
    bootImage.style.opacity = "1";

    debugLive(`SOFT BOOT IMAGE SET: ${profile.boot}`);

    bootImage.onload = () => debugLive(`SOFT BOOT IMAGE LOADED: ${bootImage.src}`);
    bootImage.onerror = () => debugLive(`SOFT BOOT IMAGE FAILED: ${bootImage.src}`);
  }

  const profileName =
    VEHICLE_PROFILES[profileKey]?.name ||
    currentVehicleProfile.name ||
    "Vehicle";

  const boot = $("bootScreen");
  const dash = $("dashboard");

  if (boot) {
  boot.classList.remove("hidden", "boot-hidden");
  boot.style.display = "flex";
  boot.style.visibility = "visible";
  boot.style.opacity = "1";
  boot.style.pointerEvents = "auto";
}

  if (dash) {
    dash.classList.add("hidden");
  }

  setValue("bootVehicleName", profileName);
  speak(`${profileName} profile loaded. Tap start system to continue.`);
}

function hideBootScreen() {
  const boot = document.getElementById("bootScreen");

  if (boot) {
    boot.style.display = "none";
    boot.style.visibility = "hidden";
    boot.style.pointerEvents = "none";
  }

  if (typeof startSystem === "function") {
    startSystem();
  }

  speak("Revanta systems online.");
}

window.hideBootScreen = hideBootScreen;

function exposeGlobals() {
  Object.assign(window, {
    startSystem,
    showBootScreen,
    showProfileReload,
    skipSetup,
    runSetupWizard,
    saveSetupProfile,
    showAbsHelp,
    exportVehicleProfile,
    factoryReset,
    showTab,
    goFullscreen,

    speak,
    testNativeTTS,
    testCurrentVoice,
    setVoiceMode,
    volumeUp,
    volumeDown,
    muteVoice,
    unmuteVoice,
    systemChime,
    playStartupSound,
    playWarningTone,

    setThemeMode,
    toggleAlerts,
    toggleAutoTheme,

    startGpsSpeed,
    weatherLayer,
    resetTrip,

    startZeroSixty,
    startZeroToSixty,
    resetZeroSixty,
    toggleSpoolMode,
    toggleAmbientGlow,
    savePullSnapshot,

    copilotReport,
    activateSecurityMode,
    disableSecurityMode,
    toggleSecurityMode,
    triggerSecurityScan,

    loadDestination,
    openFullGoogleMaps,
    goHomeNav,
    navNightMode,

    listenCommand,
    openCommandModal,
    closeCommandModal,
    submitCommandModal,
    startWakeWord,
    stopWakeWord,
    handleVoiceCommand,

    connectOBD,
    disconnectOBD,
    scanCodes,
    clearCodes,
    checkEngineStatus,
    saveCodeHistory,
    clearCodeHistory
  });
}

function initApp() {
  exposeGlobals();
  bindButtons();
  const commandInput = $("commandInput");

if (commandInput) {
  commandInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitCommandModal();
    }
  });
}

  applyVehicleProfile();
  applyTheme();
  updateVoiceLabel();
  updateSystemLabels();
  resetGaugeDisplay();
  updateCopilotBlocks();
  syncNavGauges();
  updateHeaderBadges();
  updateTripTime();
  renderCodeHistory();
  loadVehicleProfile();

  const setupComplete = storageGet("revantaSetupComplete", "false") === "true";

  if (!setupComplete && $("setupScreen")) {
    runSetupWizard();
  } else if ($("bootScreen")) {
    showBootScreen();
  } else if ($("dashboard")) {
    startSystem();
  }

  logCommand(`${VERSION} loaded. Waiting for driver input.`);

  renderPullHistory();

  updateActiveGarageVehicle(
  localStorage.getItem("revantaActiveGarageVehicle") || "Revanta Vehicle"
);

  if (obdLastDeviceId) {
    setTimeout(() => {
      connectOBD(true);
    }, 1800);
  }
}

applyVisualVehicleProfile("universal");

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
try {
  savedPulls = JSON.parse(
    localStorage.getItem("revantaPulls")
  ) || [];
} catch {
  savedPulls = [];
}

// ===============================
// REVANTA PLUS / PRO TEST SYSTEM
// ===============================

const DEV_UNLOCK_ALL = false;

const REVANTA_PLANS = {
  FREE: "free",
  PLUS: "plus",
  PRO: "pro"
};

let revantaUserPlan =
  localStorage.getItem("revanta_plan") || "free";

function hasPlus() {
  if (DEV_UNLOCK_ALL) return true;
  return revantaUserPlan === "plus" || revantaUserPlan === "pro";
}

function hasPro() {
  if (DEV_UNLOCK_ALL) return true;
  return revantaUserPlan === "pro";
}

function requirePlus(featureName = "This feature") {
  if (hasPlus()) return true;
  alert(`${featureName} is a Revanta Plus feature.`);
  return false;
}

function requirePro(featureName = "This feature") {
  if (hasPro()) return true;
  alert(`${featureName} is a Revanta Pro feature.`);
  return false;
}

function setRevantaPlan(plan) {
  revantaUserPlan = plan;

  localStorage.setItem(
    "revanta_plan",
    plan
  );

  speak(`Revanta ${plan} activated.`);

  debugLive(`PLAN SET: ${plan.toUpperCase()}`);
}

window.setRevantaPlan = setRevantaPlan;

function testJettaVinDetect() {
  const testVin = "3VW12345678901234";

  const profileKey = detectProfileFromVin(testVin);

  activeVehicleProfileKey = profileKey;

  applyVisualVehicleProfile(profileKey);

  debugLive(`TEST VIN PROFILE: ${profileKey}`);

  speak(`Test VIN detected ${profileKey}`);
}

window.testJettaVinDetect = testJettaVinDetect;
})();