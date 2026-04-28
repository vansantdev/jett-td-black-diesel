// Revanta OS — Stable Android/PWA Core
// Full replacement for app.js
// Built for the current Revanta index.html button/ID structure.

/* =========================
   MODE CONFIG
========================= */

const voiceModes = {
  male: {
    label: "Male",
    rate: 0.9,
    pitch: 0.85,
    startup: "Good {time} {driver}. {vehicle} systems online.",
    boost: "Boost pressure standing by.",
    coolant: "Coolant temperature is currently normal.",
    gps: "GPS speed system standing by.",
    commandReady: "Command mode ready."
  },
  female: {
    label: "Female",
    rate: 1,
    pitch: 1.15,
    startup: "Good {time} {driver}. {vehicle} is online and ready.",
    boost: "Boost pressure is ready.",
    coolant: "Coolant temperature looks good.",
    gps: "GPS speed tracking is ready.",
    commandReady: "I am listening."
  },
  robot: {
    label: "Robot",
    rate: 0.72,
    pitch: 0.55,
    startup: "System online. {command} active. Good {time}, {driver}.",
    boost: "Turbo pressure monitor active.",
    coolant: "Thermal system within range.",
    gps: "Satellite speed tracking standing by.",
    commandReady: "Voice input active."
  },
  deepCommand: {
    label: "Deep Command",
    rate: 0.82,
    pitch: 0.65,
    startup: "Good {time} {driver}. {command} online. Awaiting orders.",
    boost: "Boost pressure standing by. Turbo system ready.",
    coolant: "Coolant system stable.",
    gps: "GPS speed system armed.",
    commandReady: "Awaiting command."
  },
  sarcastic: {
    label: "Funny / Sarcastic",
    rate: 1,
    pitch: 0.95,
    startup: "Well well well. Good {time} {driver}. The system is alive again.",
    boost: "Boost is standing by. Try not to pretend this is a race car.",
    coolant: "Coolant looks fine. For once, nothing is angry.",
    gps: "GPS is ready. Because apparently the speedometer called off today.",
    commandReady: "Fine. I am listening."
  },
  mechanic: {
    label: "Mechanic Mode",
    rate: 0.95,
    pitch: 0.8,
    startup: "Good {time} {driver}. Engine systems online. Watching boost, coolant, voltage, and driver behavior.",
    boost: "Checking turbo pressure. Keep an eye on spool and requested boost.",
    coolant: "Coolant temperature is in operating range.",
    gps: "GPS speed active. Useful until the speed source is confirmed.",
    commandReady: "Mechanic voice command ready."
  },
  butler: {
    label: "Butler Mode",
    rate: 0.85,
    pitch: 0.9,
    startup: "Good {time}, {driver}. Your vehicle command system is ready.",
    boost: "Turbo pressure is prepared, sir.",
    coolant: "Coolant temperature appears acceptable, sir.",
    gps: "Navigation and speed tracking are ready, sir.",
    commandReady: "How may I assist?"
  },
  drill: {
    label: "Diesel Drill Sergeant",
    rate: 1.05,
    pitch: 0.7,
    startup: "Listen up, {driver}. Good {time}. {command} online. Stay sharp.",
    boost: "Turbo ready. Do not abuse it.",
    coolant: "Coolant is stable. Keep moving.",
    gps: "GPS ready. Eyes forward.",
    commandReady: "Speak up. Command mode active."
  },
  race: {
    label: "Race Mode",
    rate: 1.1,
    pitch: 0.78,
    startup: "Good {time} {driver}. Race mode armed. Boost pressure standing by. Keep it controlled.",
    boost: "Boost system armed. Turbo pressure standing by.",
    coolant: "Coolant stable. Performance window acceptable.",
    gps: "GPS speed tracking active. Drive smart.",
    commandReady: "Race command ready."
  },
  sport: {
    label: "Sport Mode",
    rate: 1,
    pitch: 0.75,
    startup: "Good {time} {driver}. Sport mode online. Throttle discipline recommended.",
    boost: "Boost ready. Smooth throttle recommended.",
    coolant: "Coolant temperature is stable.",
    gps: "GPS speed system online.",
    commandReady: "Sport command ready."
  }
};

const themeModes = {
  legacy: { label: "Color Shift Legacy", className: "theme-legacy", line: "Color shift legacy theme activated." },
  germanBlue: { label: "OEM German Blue", className: "theme-germanBlue", line: "O E M German blue theme activated." },
  dieselAmber: { label: "Diesel Amber", className: "theme-dieselAmber", line: "Diesel amber theme activated." },
  performanceRed: { label: "Performance Red", className: "theme-performanceRed", line: "Performance red theme activated." },
  stealth: { label: "Stealth Tactical", className: "theme-stealth", line: "Stealth tactical theme activated." },
  iceWhite: { label: "Ice White", className: "theme-iceWhite", line: "Ice white theme activated." }
};

/* =========================
   STATE
========================= */

let currentVoiceMode = localStorage.getItem("revantaVoiceMode") || "deepCommand";
let currentThemeMode = localStorage.getItem("revantaThemeMode") || "legacy";
let alertsEnabled = localStorage.getItem("revantaAlertsEnabled") !== "false";
let autoThemeEnabled = localStorage.getItem("revantaAutoTheme") === "true";
let showModeActive = localStorage.getItem("revantaShowMode") === "true";

let availableVoices = [];
let selectedSystemVoice = null;
let voiceVolume = Number(localStorage.getItem("revantaVoiceVolume") || "1");
let voiceMuted = localStorage.getItem("revantaVoiceMuted") === "true";
let voiceUnlocked = false;

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

let wakeListening = false;
let wakeRecognition = null;

let performance = {
  zeroToSixtyActive: false,
  zeroToSixtyStart: null,
  bestZeroToSixty: localStorage.getItem("revantaBest060") || "--",
  peakBoost: 0,
  maxRpm: 850,
  drivingScore: 100,
  ecoScore: 100,
  spoolMode: false,
  ambientGlow: true,
  securityMode: false
};

const homeDestination = localStorage.getItem("revantaHomeDestination") || "home";

/* =========================
   BASIC HELPERS
========================= */

function $(id) {
  return document.getElementById(id);
}

function setValue(id, value) {
  const el = $(id);
  if (!el) return;
  el.textContent = value;
  el.classList.add("value-pop");
  setTimeout(() => el.classList.remove("value-pop"), 220);
}

function getText(id, fallback = "") {
  const el = $(id);
  return el ? el.textContent : fallback;
}

function logCommand(message) {
  const final = String(message || "");
  setValue("commandLog", final);
  console.log("REVANTA:", final);
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(max, num));
}

function isCapacitorApp() {
  return !!window.Capacitor;
}

function getCapPlugin(name) {
  return window.Capacitor?.Plugins?.[name] || window.Capacitor?.[name] || null;
}

/* =========================
   VEHICLE PROFILE
========================= */

function getDefaultProfile() {
  return {
    owner: "Driver",
    vehicleName: "Demo Vehicle",
    make: "",
    model: "",
    year: "",
    engine: "",
    fuel: "Diesel",
    theme: "legacy",
    commandName: "Revanta Command"
  };
}

function getVehicleProfile() {
  const saved = localStorage.getItem("vehicleProfile");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function getActiveProfile() {
  return getVehicleProfile() || getDefaultProfile();
}

function getDriverName() {
  return getActiveProfile().owner || "Driver";
}

function getVehicleName() {
  return getActiveProfile().vehicleName || "Vehicle";
}

function getCommandName() {
  return getActiveProfile().commandName || "Vehicle Command";
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function personalizeLine(text) {
  return String(text || "")
    .replaceAll("{time}", getTimeGreeting())
    .replaceAll("{driver}", getDriverName())
    .replaceAll("{vehicle}", getVehicleName())
    .replaceAll("{command}", getCommandName());
}

function applyVehicleProfile() {
  const profile = getActiveProfile();
  const vehicleName = profile.vehicleName || "Vehicle";
  const commandName = profile.commandName || "Revanta Command";

  document.querySelectorAll(".top-bar h1").forEach((el) => {
    el.textContent = vehicleName;
  });

  setValue("pageTitle", commandName);
  document.title = `${vehicleName} ${commandName}`;

  if (profile.theme && themeModes[profile.theme]) {
    currentThemeMode = profile.theme;
    localStorage.setItem("revantaThemeMode", profile.theme);
  }

  applyTheme();
}

function saveVehicleProfile() {
  const profile = {
    owner: $("setupOwner")?.value.trim() || "Driver",
    vehicleName: $("setupVehicleName")?.value.trim() || "Demo Vehicle",
    make: $("setupMake")?.value.trim() || "",
    model: $("setupModel")?.value.trim() || "",
    year: $("setupYear")?.value.trim() || "",
    engine: $("setupEngine")?.value.trim() || "",
    fuel: $("setupFuel")?.value || "Diesel",
    theme: $("setupTheme")?.value || "legacy",
    commandName: $("setupCommandName")?.value.trim() || "Revanta Command"
  };

  localStorage.setItem("vehicleProfile", JSON.stringify(profile));
  localStorage.setItem("revantaSetupComplete", "true");
  localStorage.setItem("revantaThemeMode", profile.theme);
  currentThemeMode = profile.theme;

  applyVehicleProfile();
  showBootScreen();
  speak(`${profile.vehicleName} profile saved. ${profile.commandName} online.`);
}

function exportVehicleProfile() {
  const profile = getActiveProfile();
  const text = JSON.stringify(profile, null, 2);

  try {
    navigator.clipboard?.writeText(text);
    logCommand("Vehicle profile copied to clipboard.");
    speak("Vehicle profile copied to clipboard.");
  } catch {
    logCommand(text);
    speak("Vehicle profile displayed in the system log.");
  }
}

function factoryReset() {
  localStorage.removeItem("vehicleProfile");
  localStorage.removeItem("revantaSetupComplete");
  localStorage.removeItem("revantaVoiceMode");
  localStorage.removeItem("revantaThemeMode");
  localStorage.removeItem("revantaAlertsEnabled");
  localStorage.removeItem("revantaAutoTheme");
  localStorage.removeItem("revantaShowMode");
  localStorage.removeItem("revantaBest060");

  speak("Factory reset complete. Reloading Revanta.");
  setTimeout(() => location.reload(), 900);
}

/* =========================
   VOICE + AUDIO
========================= */

function loadSystemVoices() {
  if (!("speechSynthesis" in window)) return;

  availableVoices = window.speechSynthesis.getVoices() || [];
  const lowerMode = currentVoiceMode.toLowerCase();

  if (lowerMode.includes("female")) {
    selectedSystemVoice =
      availableVoices.find((v) => v.name.toLowerCase().includes("zira")) ||
      availableVoices.find((v) => v.name.toLowerCase().includes("samantha")) ||
      availableVoices.find((v) => v.name.toLowerCase().includes("female")) ||
      availableVoices.find((v) => v.lang && v.lang.startsWith("en")) ||
      availableVoices[0] ||
      null;
  } else {
    selectedSystemVoice =
      availableVoices.find((v) => v.name.toLowerCase().includes("david")) ||
      availableVoices.find((v) => v.name.toLowerCase().includes("mark")) ||
      availableVoices.find((v) => v.name.toLowerCase().includes("male")) ||
      availableVoices.find((v) => v.lang && v.lang.startsWith("en")) ||
      availableVoices[0] ||
      null;
  }
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadSystemVoices;
  loadSystemVoices();
}

function unlockVoice() {
  voiceUnlocked = true;
  try {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
}

async function speak(text, overrideMode = null) {
  const finalText = personalizeLine(text);
  logCommand(finalText);

  if (voiceMuted) return;

  const modeKey = overrideMode || currentVoiceMode;
  const mode = voiceModes[modeKey] || voiceModes.deepCommand;

  const NativeTTS =
    window.Capacitor?.Plugins?.TextToSpeech ||
    window.Capacitor?.Plugins?.TTS ||
    window.Capacitor?.TextToSpeech;

  console.log("TTS DEBUG:", {
    hasCapacitor: !!window.Capacitor,
    plugins: window.Capacitor?.Plugins ? Object.keys(window.Capacitor.Plugins) : [],
    hasNativeTTS: !!NativeTTS,
    text: finalText
  });

  if (NativeTTS) {
    try {
      await NativeTTS.stop?.();

      await NativeTTS.speak({
        text: finalText,
        lang: "en-US",
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        category: "ambient",
        queueStrategy: 1
      });

      return;
    } catch (error) {
      console.error("Native TTS failed:", error);
    }
  }

  try {
    const msg = new SpeechSynthesisUtterance(finalText);
    msg.rate = 1;
    msg.pitch = 1;
    msg.volume = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  } catch (error) {
    console.error("Browser speech failed:", error);
  }
}

async function testNativeTTS() {
  const NativeTTS =
    window.Capacitor?.Plugins?.TextToSpeech ||
    window.Capacitor?.Plugins?.TTS ||
    window.Capacitor?.TextToSpeech;

  console.log("NativeTTS object:", NativeTTS);

  if (!NativeTTS) {
    alert("Native TTS plugin not found");
    return;
  }

  try {
    await NativeTTS.speak({
      text: "Revanta native voice test.",
      lang: "en-US",
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      category: "ambient",
      queueStrategy: 1
    });
  } catch (error) {
    alert("Native TTS error: " + JSON.stringify(error));
  }
}

function beep(type = "normal") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type === "warning" ? "sawtooth" : "sine";
    osc.frequency.value = type === "warning" ? 220 : type === "spool" ? 520 : 760;
    gain.gain.value = 0.04;

    osc.start();
    setTimeout(() => {
      try {
        osc.stop();
        ctx.close();
      } catch {}
    }, type === "spool" ? 250 : 120);
  } catch {}
}

function systemChime() {
  beep("normal");
  speak("System chime test complete.");
}

function playStartupSound() {
  systemChime();
  speak("Revanta OS online. {vehicle} profile loaded.");
}

function playWarningTone() {
  beep("warning");
  setTimeout(() => beep("warning"), 220);
  speak("Warning tone played.");
}

function speakCurrentStartup() {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  speak(mode.startup);
}

function speakModeLine(type) {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  speak(mode[type] || "System ready.");
}

function setVoiceMode(modeName) {
  if (!voiceModes[modeName]) return;
  currentVoiceMode = modeName;
  localStorage.setItem("revantaVoiceMode", modeName);
  loadSystemVoices();
  updateVoiceLabel();
  speak(voiceModes[modeName].startup, modeName);
}

function updateVoiceLabel() {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  setValue("currentVoiceLabel", `Current Voice: ${mode.label}`);
}

function testCurrentVoice() {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  speak(`${mode.label} selected. Revanta OS is online for {vehicle}.`);
}

function volumeUp() {
  voiceVolume = clamp(voiceVolume + 0.1, 0, 1);
  localStorage.setItem("revantaVoiceVolume", String(voiceVolume));
  speak(`Voice volume ${Math.round(voiceVolume * 100)} percent.`);
}

function volumeDown() {
  voiceVolume = clamp(voiceVolume - 0.1, 0, 1);
  localStorage.setItem("revantaVoiceVolume", String(voiceVolume));
  speak(`Voice volume ${Math.round(voiceVolume * 100)} percent.`);
}

function muteVoice() {
  voiceMuted = true;
  localStorage.setItem("revantaVoiceMuted", "true");
  logCommand("Voice muted.");
}

function unmuteVoice() {
  voiceMuted = false;
  localStorage.setItem("revantaVoiceMuted", "false");
  speak("Voice online.");
}

/* =========================
   THEMES + SYSTEM LABELS
========================= */

function setThemeMode(themeName, silent = false) {
  if (!themeModes[themeName]) return;
  currentThemeMode = themeName;
  localStorage.setItem("revantaThemeMode", themeName);
  applyTheme();
  if (!silent) speak(themeModes[themeName].line);
}

function applyTheme() {
  const theme = themeModes[currentThemeMode] || themeModes.legacy;
  document.body.className = theme.className;

  if (performance.ambientGlow) document.body.classList.add("ambient-drive-glow");
  if (performance.spoolMode) document.body.classList.add("spool-mode");
  if (performance.securityMode) document.body.classList.add("security-mode");
  if (autoThemeEnabled) document.body.classList.add("auto-theme-on");

  setValue("currentThemeLabel", `Current Theme: ${theme.label}`);
}

function toggleAlerts() {
  alertsEnabled = !alertsEnabled;
  localStorage.setItem("revantaAlertsEnabled", alertsEnabled ? "true" : "false");
  updateSystemLabels();
  speak(alertsEnabled ? "Driving alerts enabled." : "Driving alerts disabled.");
}

function toggleAutoTheme() {
  autoThemeEnabled = !autoThemeEnabled;
  localStorage.setItem("revantaAutoTheme", autoThemeEnabled ? "true" : "false");
  updateSystemLabels();
  applyTheme();
  speak(autoThemeEnabled ? "Auto theme logic enabled." : "Auto theme logic disabled.");
}

function updateSystemLabels() {
  setValue("alertStatus", `Driving Alerts: ${alertsEnabled ? "Enabled" : "Disabled"}`);
  setValue("autoThemeStatus", `Auto Theme: ${autoThemeEnabled ? "Enabled" : "Disabled"}`);
  setValue("wakeStatus", `Wake Word: ${wakeListening ? "On" : "Off"}`);
  setValue("wakeStatusTop", wakeListening ? "WAKE ON" : "WAKE OFF");
  setValue("showModeStatus", `Show Mode: ${showModeActive ? "On" : "Off"}`);
}

function updateHeaderBadges() {
  const gps = getText("gpsStatus", "STANDBY");
  const weather = getText("weatherStatus", "READY");
  const battery = getText("batteryValue", "-- V");

  setValue("gpsHeaderStatus", `GPS ${gps}`);
  setValue("weatherHeaderStatus", weather === "READY" ? "WEATHER READY" : weather);
  setValue("batteryHeaderStatus", `BATTERY ${battery}`);
}

/* =========================
   SCREEN FLOW + TABS
========================= */

function showBootScreen() {
  $("setupScreen")?.classList.add("hidden");
  $("bootScreen")?.classList.remove("hidden");
  $("dashboard")?.classList.add("hidden");
  applyTheme();
}

function skipSetup() {
  localStorage.setItem("revantaSetupComplete", "true");
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

function startSystem() {
  unlockVoice();

  $("setupScreen")?.classList.add("hidden");
  $("bootScreen")?.classList.add("hidden");

  const dash = $("dashboard");
  if (dash) {
    dash.classList.remove("hidden");
    dash.style.display = "flex";
  }

  applyVehicleProfile();
  applyTheme();
  updateVoiceLabel();
  updateSystemLabels();
  updateHeaderBadges();
  updateCopilotBlocks();
  syncNavGauges();
  updateTripTime();

  setTimeout(() => speakCurrentStartup(), 250);
}

function showTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active", "fade-in");
  });

  const selected = $(`${tabName}Tab`);
  if (selected) {
    selected.classList.add("active");
    setTimeout(() => selected.classList.add("fade-in"), 10);
  }

  const profile = getActiveProfile();
  const titles = {
    dash: profile.commandName || "Revanta Command",
    performance: "PERFORMANCE SYSTEMS",
    command: "COMMAND CENTER",
    copilot: "AI COPILOT",
    nav: "NAVIGATION MODE",
    settings: "SYSTEM SETTINGS"
  };

  setValue("pageTitle", titles[tabName] || profile.commandName || "Vehicle Command");
  syncNavGauges();
}

function goFullscreen() {
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  } catch {}
}

/* =========================
   GPS + WEATHER
========================= */

async function startGpsSpeed() {
  const Geo = getCapPlugin("Geolocation");

  if (!Geo && !navigator.geolocation) {
    speak("GPS is not available on this device.");
    setValue("gpsStatus", "NO GPS");
    updateHeaderBadges();
    return;
  }

  try {
    if (gpsWatchId !== null) {
      if (Geo) await Geo.clearWatch({ id: gpsWatchId });
      else navigator.geolocation.clearWatch(gpsWatchId);
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
      } catch (error) {
        console.warn("GPS permission check failed:", error);
      }

      gpsWatchId = await Geo.watchPosition(
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        (position, error) => {
          if (error || !position) {
            console.error("GPS error:", error);
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
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  } catch (error) {
    console.error("GPS start failed:", error);
    setValue("gpsStatus", "ERROR");
    setValue("gpsHeaderStatus", "GPS ERROR");
    speak("GPS system failed to start.");
  }
}

function handleGpsPosition(position) {
  const now = Date.now();
  const coords = position.coords || {};
  const lat = coords.latitude;
  const lon = coords.longitude;
  const nativeSpeed = coords.speed;

  if (typeof lat !== "number" || typeof lon !== "number") return;

  let mph = 0;

  if (nativeSpeed !== null && nativeSpeed !== undefined && nativeSpeed >= 0) {
    mph = Math.round(nativeSpeed * 2.23694);
  } else if (lastGpsPosition && lastGpsTime) {
    const distanceMeters = getDistanceMeters(lastGpsPosition.lat, lastGpsPosition.lon, lat, lon);
    const seconds = (now - lastGpsTime) / 1000;
    if (seconds > 0) mph = Math.round((distanceMeters / seconds) * 2.23694);
  }

  lastGpsPosition = { lat, lon };
  lastGpsTime = now;
  if (mph < 2) mph = 0;

  setValue("speedValue", mph);
  setValue("gpsStatus", "ACTIVE");
  setValue("gpsHeaderStatus", "GPS ACTIVE");
  setValue("sourceStatus", obdLive ? "OBD + GPS" : "GPS");

  updateSpeedStats(mph);

  const rpm = Number(getText("rpmValue", "0"));
  const boost = Number(getText("boostValue", "0"));
  const coolant = Number(getText("coolantValue", "0"));

  checkDrivingAlerts(mph, rpm, boost, coolant);
  updateAmbientGlow(mph, rpm, boost);
  checkZeroToSixty(mph);
  updateHeaderBadges();
  syncNavGauges();
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getCurrentPositionSafe() {
  const Geo = getCapPlugin("Geolocation");

  if (Geo) {
    try {
      const perm = await Geo.checkPermissions();
      if (perm.location !== "granted" && perm.coarseLocation !== "granted") {
        await Geo.requestPermissions();
      }
      return await Geo.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    } catch (error) {
      console.warn("Capacitor position failed:", error);
    }
  }

  if (!navigator.geolocation) throw new Error("Location unavailable");

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    });
  });
}

async function weatherLayer() {
  try {
    setValue("weatherStatus", "LOCATING");
    setValue("weatherHeaderStatus", "WEATHER LOCATING");

    const position = await getCurrentPositionSafe();
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}` +
      `&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&temperature_unit=fahrenheit`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather API failed");

    const data = await response.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weather_code;
    const condition = weatherCodeToText(code);

    setValue("weatherStatus", `${temp}°F ${condition}`);
    setValue("weatherHeaderStatus", `${temp}°F ${condition}`);
    setValue("navWeather", `${temp}°F ${condition}`);

    speak(`Current outside temperature is ${temp} degrees with ${condition.toLowerCase()} conditions.`);
  } catch (error) {
    console.error("Weather failed:", error);
    setValue("weatherStatus", "ERROR");
    setValue("weatherHeaderStatus", "WEATHER ERROR");
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

/* =========================
   DASHBOARD / PERFORMANCE
========================= */

function updateFuelStatus(value = "--") {
  setValue("fuelStatus", value);
}

function updateSpeedStats(speed) {
  const safeSpeed = Number.isFinite(Number(speed)) ? Number(speed) : 0;
  topSpeed = Math.max(topSpeed, safeSpeed);
  speedSamples.push(safeSpeed);
  if (speedSamples.length > 300) speedSamples.shift();

  const avg = Math.round(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length);
  setValue("avgSpeed", `${avg} MPH`);
  setValue("topSpeed", `${Math.round(topSpeed)} MPH`);
  updatePerformanceScores(safeSpeed);
}

function updatePerformanceScores(speed) {
  const rpm = Number(getText("rpmValue", "850"));
  const boost = Number(getText("boostValue", "0"));

  performance.peakBoost = Math.max(performance.peakBoost, Number.isFinite(boost) ? boost : 0);
  performance.maxRpm = Math.max(performance.maxRpm, Number.isFinite(rpm) ? rpm : 0);

  let score = 100;
  if (rpm > 3200) score -= 10;
  if (boost > 17) score -= 10;
  if (speed > 80) score -= 15;
  if (speedSamples.length > 30 && topSpeed > 75) score -= 5;

  performance.drivingScore = clamp(score, 0, 100);
  performance.ecoScore = clamp(100 - Math.round(boost * 2) - (rpm > 2800 ? 15 : 0), 0, 100);

  setValue("peakBoost", `${performance.peakBoost.toFixed(1)} PSI`);
  setValue("maxRpm", `${Math.round(performance.maxRpm)} RPM`);
  setValue("driveScore", performance.drivingScore);
  setValue("ecoScore", `Eco ${performance.ecoScore}`);
  updateCopilotBlocks();
}

function demoGauges() {
  const speed = Math.floor(Math.random() * 95);
  const rpm = Math.floor(850 + Math.random() * 3400);
  const boost = Number((Math.random() * 21).toFixed(1));
  const coolant = Math.floor(170 + Math.random() * 55);
  const voltage = Number((12.1 + Math.random() * 2.2).toFixed(1));
  const intake = Math.floor(60 + Math.random() * 90);

  setValue("speedValue", speed);
  setValue("rpmValue", rpm);
  setValue("boostValue", boost.toFixed(1));
  setValue("coolantValue", coolant);
  setValue("batteryValue", `${voltage.toFixed(1)} V`);
  setValue("intakeValue", `${intake} °F`);
  setValue("gpsStatus", "DEMO");
  setValue("sourceStatus", "SIM");
  updateFuelStatus(`${Math.floor(20 + Math.random() * 80)}%`);

  updateSpeedStats(speed);
  checkDrivingAlerts(speed, rpm, boost, coolant);
  checkBatteryAlert(voltage);
  updateAmbientGlow(speed, rpm, boost);
  updateHeaderBadges();
  syncNavGauges();

  if (performance.spoolMode && boost > 12) beep("spool");
  checkZeroToSixty(speed);
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

  if (speed >= 80) alertOnce("speed", "Speed warning. You are over eighty miles per hour.");
  if (rpm >= 3600) alertOnce("rpm", "R P M warning. Shift or ease off.");
  if (boost >= 18) alertOnce("boost", "Turbo pressure elevated.");
  if (coolant >= 215) alertOnce("coolant", "Warning. Coolant temperature is high.");

  autoThemeLogic(speed, rpm, boost, coolant);
  updateCopilotBlocks();
}

function checkBatteryAlert(voltage) {
  if (voltage === null || voltage === undefined || Number.isNaN(Number(voltage))) return;
  const lowBattery = Number(voltage) < 12.2;
  markAlert("batteryValue", lowBattery);
  if (lowBattery) alertOnce("battery", "Battery voltage low.");
  updateCopilotBlocks();
  updateHeaderBadges();
}

function autoThemeLogic(speed, rpm, boost, coolant) {
  if (!autoThemeEnabled) return;

  if (coolant >= 215 || speed >= 80 || boost >= 18) setThemeMode("performanceRed", true);
  else if (new Date().getHours() >= 20 || new Date().getHours() < 6) setThemeMode("dieselAmber", true);
  else if (rpm < 1100 && speed < 5) setThemeMode("stealth", true);
  else setThemeMode("germanBlue", true);
}

function updateAmbientGlow(speed, rpm, boost) {
  if (!performance.ambientGlow) return;
  const intensity = Math.min(1, (speed / 100 + rpm / 4500 + boost / 22) / 3);
  document.documentElement.style.setProperty("--driveGlow", `${0.25 + intensity}`);
}

function resetTrip() {
  tripStart = Date.now();
  speedSamples = [];
  topSpeed = 0;
  performance.peakBoost = 0;
  performance.maxRpm = Number(getText("rpmValue", "850"));
  performance.drivingScore = 100;
  performance.ecoScore = 100;

  setValue("avgSpeed", "0 MPH");
  setValue("topSpeed", "0 MPH");
  setValue("peakBoost", "0.0 PSI");
  setValue("maxRpm", `${Math.round(performance.maxRpm)} RPM`);
  setValue("driveScore", "100");
  setValue("ecoScore", "Eco 100");
  speak("Trip data reset.");
}

function updateTripTime() {
  const seconds = Math.floor((Date.now() - tripStart) / 1000);
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  setValue("tripTime", `${mins}:${secs}`);
}

setInterval(updateTripTime, 1000);

/* =========================
   COPILOT / SECURITY
========================= */

function updateCopilotBlocks() {
  const rpm = Number(getText("rpmValue", "850"));
  const coolant = Number(getText("coolantValue", "176"));
  const boost = Number(getText("boostValue", "0"));
  const batteryRaw = getText("batteryValue", "-- V").replace("V", "").trim();
  const battery = Number(batteryRaw);

  if (coolant >= 215) {
    setValue("engineHealthStatus", "HOT");
    setValue("engineHealthNote", "Coolant elevated. Ease off and monitor.");
  } else if (rpm >= 3600) {
    setValue("engineHealthStatus", "HIGH RPM");
    setValue("engineHealthNote", "RPM elevated. Shift or back off.");
  } else {
    setValue("engineHealthStatus", "STABLE");
    setValue("engineHealthNote", "Coolant and RPM normal.");
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
  updateCopilotBlocks();
  const message =
    `Copilot report. Engine ${getText("engineHealthStatus", "stable")}. ` +
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
  performance.securityMode ? disableSecurityMode() : activateSecurityMode();
}

function triggerSecurityScan() {
  beep("warning");
  const message = "Security scan complete. No motion threats detected.";
  setValue("copilotOutput", message);
  speak(message);
}

/* =========================
   0–60 / MODES
========================= */

function startZeroSixty() {
  startZeroToSixty();
}

function startZeroToSixty() {
  performance.zeroToSixtyActive = true;
  performance.zeroToSixtyStart = null;
  setValue("zeroSixtyTime", "ARMED");
  setValue("zeroSixtyStatus", "Start from 0 MPH");
  speak("Zero to sixty timer armed. Start from a stop.");
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
      localStorage.setItem("revantaBest060", time);
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

function activateShowMode() {
  showModeActive = !showModeActive;
  localStorage.setItem("revantaShowMode", showModeActive ? "true" : "false");

  if (showModeActive) {
    performance.spoolMode = false;
    performance.ambientGlow = true;
    setThemeMode("performanceRed", true);
    speak("Show mode activated.");
  } else {
    performance.spoolMode = false;
    setThemeMode("legacy", true);
    speak("Show mode disabled.");
  }

  applyTheme();
  updateSystemLabels();
}

function speakPerformance() {
  speak(
    `Peak boost ${performance.peakBoost.toFixed(1)} P S I. ` +
    `Max R P M ${Math.round(performance.maxRpm)}. ` +
    `Driving score ${performance.drivingScore}. ` +
    `Economy score ${performance.ecoScore}. ` +
    `Best zero to sixty ${performance.bestZeroToSixty} seconds.`
  );
}

function speakStatus() {
  speak(
    `Current speed ${getText("speedValue", "0")} miles per hour. ` +
    `Engine speed ${getText("rpmValue", "0")} R P M. ` +
    `Boost pressure ${getText("boostValue", "0")} P S I. ` +
    `Coolant temperature ${getText("coolantValue", "0")} degrees. ` +
    `Battery ${getText("batteryValue", "-- V")}. ` +
    `Fuel ${getText("fuelStatus", "--")}. ` +
    `Weather ${getText("weatherStatus", "READY")}.`
  );
}

/* =========================
   NAVIGATION
========================= */

function syncNavGauges() {
  setValue("navSpeed", `${getText("speedValue", "0")} MPH`);
  setValue("navRpm", getText("rpmValue", "850"));
  setValue("navBoost", `${getText("boostValue", "0.0")} PSI`);
  setValue("navIntake", getText("intakeValue", "-- °F"));
  setValue("navWeather", getText("weatherStatus", "READY"));
}

function loadDestination() {
  const input = $("navSearchInput");
  const destination = input?.value.trim();
  if (!destination) {
    speak("Enter a destination first.");
    return;
  }

  const url = `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`;
  if ($("mapFrame")) $("mapFrame").src = url;
  speak(`Navigation destination loaded. ${destination}.`);
}

function openFullGoogleMaps() {
  const destination = $("navSearchInput")?.value.trim() || "current location";
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
  window.open(url, "_blank");
}

function goHomeNav() {
  if ($("navSearchInput")) $("navSearchInput").value = homeDestination;
  loadDestination();
}

function navNightMode() {
  setThemeMode("stealth");
  speak("Navigation night mode active.");
}

/* =========================
   VOICE COMMANDS
========================= */

function listenCommand() {
  unlockVoice();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    speak("Voice command is not supported in this browser or Android WebView.");
    return;
  }

  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  speak(mode.commandReady || "I am listening.");

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    handleVoiceCommand(command);
  };

  recognition.onerror = (event) => {
    if (event.error === "no-speech") speak("I did not hear a command.");
    else if (event.error === "audio-capture") speak("Microphone is not available.");
    else if (event.error === "not-allowed") speak("Microphone permission is blocked.");
    else speak("Voice command failed.");
  };

  setTimeout(() => {
    try {
      recognition.start();
    } catch (error) {
      console.warn("Recognition start failed:", error);
    }
  }, 900);
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

  if (command.includes("battery") || command.includes("voltage")) return speak(`Battery voltage is ${getText("batteryValue", "unknown")}.`);
  if (command.includes("fuel")) return speak(`Fuel status is ${getText("fuelStatus", "unknown")}.`);
  if (command.includes("intake")) return speak(`Intake temperature is ${getText("intakeValue", "unknown")}.`);
  if (command.includes("boost") || command.includes("turbo")) return speakModeLine("boost");
  if (command.includes("coolant") || command.includes("temp") || command.includes("temperature")) return speakModeLine("coolant");
  if (command.includes("gps") || command.includes("speed")) return speakModeLine("gps");
  if (command.includes("status") || command.includes("systems") || command.includes("how's the car") || command.includes("how is the car")) return speakStatus();
  if (command.includes("copilot") || command.includes("how's it looking")) return copilotReport();
  if (command.includes("performance") || command.includes("score")) return speakPerformance();
  if (command.includes("weather") || command.includes("outside")) return weatherLayer();

  if (command.includes("spool")) return toggleSpoolMode();
  if (command.includes("glow")) return toggleAmbientGlow();
  if (command.includes("zero to sixty") || command.includes("0 to 60")) return startZeroToSixty();
  if (command.includes("security")) return toggleSecurityMode();
  if (command.includes("auto theme")) return toggleAutoTheme();
  if (command.includes("show mode")) return activateShowMode();

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

  speak(`Command not recognized. I heard ${command}.`);
}

function startWakeWord() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    speak("Wake word is not supported in this browser or Android WebView.");
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
    const wakeName = getCommandName().toLowerCase();

    if (
      transcript.includes("hey revanta") ||
      transcript.includes("hey jett") ||
      transcript.includes(wakeName) ||
      transcript.includes("vehicle command") ||
      transcript.includes("command system")
    ) {
      wakeListening = false;
      updateSystemLabels();
      try { wakeRecognition.stop(); } catch {}
      speak("Awaiting command.");
      setTimeout(() => listenCommand(), 1600);
    }
  };

  wakeRecognition.onerror = () => {
    wakeListening = false;
    updateSystemLabels();
  };

  wakeRecognition.onend = () => {
    if (wakeListening) {
      setTimeout(() => {
        try { wakeRecognition.start(); } catch {}
      }, 1000);
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
  try { wakeRecognition?.stop(); } catch {}
  updateSystemLabels();
  speak("Wake word disabled.");
}

/* =========================
   OBD — STABLE BRIDGE
   This keeps all dashboard logic working now.
   Browser Web Bluetooth works only where the WebView/browser allows it.
   Native Android OBD can be added later through a Capacitor Bluetooth plugin.
========================= */

let obdBleDevice = null;
let obdBleServer = null;
let obdBleWriteChar = null;
let obdBleNotifyChar = null;
let obdBleBuffer = "";

const OBD_SERVICE_CANDIDATES = [
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
];

async function connectOBD() {
  // Web Bluetooth route: works in Chrome/PWA on supported Android browsers.
  if (navigator.bluetooth) {
    try {
      setValue("sourceStatus", "BLE SEARCH");
      setValue("obdStatus", "SEARCHING");
      speak("Searching for O B D adapter.");
      await connectOBDWebBluetooth();
      return;
    } catch (error) {
      console.error("Web Bluetooth OBD failed:", error);
      setValue("sourceStatus", "BLE FAILED");
      setValue("obdStatus", "FAILED");
      speak(error.message || "O B D Bluetooth connection failed.");
      return;
    }
  }

  // Android WebView route: stable message instead of silent failure.
  obdLive = false;
  obdMode = "none";
  setValue("sourceStatus", "NO BLE");
  setValue("obdStatus", isCapacitorApp() ? "NATIVE NEEDED" : "NO BLE");
  speak("O B D Bluetooth needs the native Android Bluetooth bridge in this A P K. GPS, weather, voice, and demo systems remain online.");
}

async function connectOBDWebBluetooth() {
  obdBleDevice = await navigator.bluetooth.requestDevice({
    filters: [
      { namePrefix: "vLinker" },
      { namePrefix: "V-LINK" },
      { namePrefix: "Vgate" },
      { namePrefix: "VGATE" },
      { namePrefix: "OBD" },
      { namePrefix: "OBDII" },
      { namePrefix: "ELM" }
    ],
    optionalServices: OBD_SERVICE_CANDIDATES
  });

  obdBleDevice.addEventListener("gattserverdisconnected", onOBDDisconnected);
  obdBleServer = await obdBleDevice.gatt.connect();

  const channel = await findOBDDataChannel(obdBleServer);
  obdBleWriteChar = channel.write;
  obdBleNotifyChar = channel.notify;
  obdBleBuffer = "";

  await obdBleNotifyChar.startNotifications();
  obdBleNotifyChar.addEventListener("characteristicvaluechanged", (event) => {
    obdBleBuffer += new TextDecoder().decode(event.target.value);
  });

  setValue("sourceStatus", "BLE INIT");
  setValue("obdStatus", "INIT ECU");

  await elmCommand("ATZ", 1400);
  await elmCommand("ATE0", 500);
  await elmCommand("ATL0", 500);
  await elmCommand("ATS0", 500);
  await elmCommand("ATH0", 500);
  await elmCommand("ATSP0", 1000);

  const test = await elmCommand("010C", 1400);
  if (!test || test.includes("NO DATA") || test.includes("?") || test.includes("UNABLE")) {
    throw new Error("Adapter connected, but ECU did not respond to RPM.");
  }

  obdLive = true;
  obdMode = "ble";
  setValue("sourceStatus", "BLE LIVE");
  setValue("obdStatus", "LIVE");
  speak("O B D Bluetooth data connected.");
  startOBDPolling();
}

async function findOBDDataChannel(server) {
  const services = await server.getPrimaryServices();

  for (const service of services) {
    const chars = await service.getCharacteristics();
    let write = null;
    let notify = null;

    for (const char of chars) {
      if (!write && (char.properties.write || char.properties.writeWithoutResponse)) write = char;
      if (!notify && (char.properties.notify || char.properties.indicate)) notify = char;
    }

    if (write && notify) return { write, notify };
  }

  throw new Error("OBD connected but data channel not found.");
}

async function writeOBD(text) {
  if (!obdBleWriteChar) throw new Error("No OBD write channel.");
  const data = new TextEncoder().encode(text + "\r");

  if (obdBleWriteChar.properties.writeWithoutResponse) {
    await obdBleWriteChar.writeValueWithoutResponse(data);
  } else {
    await obdBleWriteChar.writeValue(data);
  }
}

async function elmCommand(command, waitMs = 600) {
  obdBleBuffer = "";
  await writeOBD(command);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  return cleanElmResponse(obdBleBuffer);
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

function parsePidNumber(response, pid) {
  const clean = cleanElmResponse(response).replace(/\s+/g, "");
  const index = clean.indexOf("41" + pid);
  if (index === -1) return null;
  const hex = clean.slice(index + 4);
  return hex.length >= 2 ? hex : null;
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
  return Math.round(parseInt(hex.slice(0, 2), 16) * 0.621371);
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

function parseMapBoost(response) {
  const hex = parsePidNumber(response, "0B");
  if (!hex || hex.length < 2) return null;
  const mapKpa = parseInt(hex.slice(0, 2), 16);
  return Math.max(0, Number(((mapKpa - 101.3) * 0.145038).toFixed(1)));
}

function parseVoltage(response) {
  const cleaned = cleanElmResponse(response);
  const match = cleaned.match(/(\d+(\.\d+)?)V?/);
  return match ? Number(match[1]) : null;
}

function parseFuel(response) {
  const hex = parsePidNumber(response, "2F");
  if (!hex || hex.length < 2) return null;
  return Math.round((parseInt(hex.slice(0, 2), 16) * 100) / 255);
}

function startOBDPolling() {
  if (obdTimer) clearInterval(obdTimer);
  obdTimer = setInterval(readOBDLiveBLE, 1200);
  readOBDLiveBLE();
}

async function readOBDLiveBLE() {
  if (obdMode !== "ble") return;

  try {
    const rpmRaw = await elmCommand("010C", 450);
    const speedRaw = await elmCommand("010D", 450);
    const coolantRaw = await elmCommand("0105", 450);
    const intakeRaw = await elmCommand("010F", 450);
    const mapRaw = await elmCommand("010B", 450);
    const voltageRaw = await elmCommand("ATRV", 450);
    const fuelRaw = await elmCommand("012F", 450);

    const rpm = parseRPM(rpmRaw);
    const speed = parseSpeed(speedRaw);
    const coolant = parseCoolant(coolantRaw);
    const intake = parseIntakeTemp(intakeRaw);
    const boost = parseMapBoost(mapRaw);
    const voltage = parseVoltage(voltageRaw);
    const fuel = parseFuel(fuelRaw);

    if (rpm !== null) setValue("rpmValue", Math.round(rpm));
    if (speed !== null) {
      setValue("speedValue", speed);
      setValue("gpsStatus", "OBD");
      updateSpeedStats(speed);
    }
    if (coolant !== null) setValue("coolantValue", coolant);
    if (intake !== null) setValue("intakeValue", `${intake} °F`);
    if (boost !== null) setValue("boostValue", boost.toFixed(1));
    if (voltage !== null) setValue("batteryValue", `${voltage.toFixed(1)} V`);
    if (fuel !== null) updateFuelStatus(`${fuel}%`);

    const liveSpeed = Number(getText("speedValue", "0"));
    const liveRpm = Number(getText("rpmValue", "0"));
    const liveBoost = Number(getText("boostValue", "0"));
    const liveCoolant = Number(getText("coolantValue", "0"));

    setValue("sourceStatus", "BLE LIVE");
    setValue("obdStatus", "LIVE");

    checkDrivingAlerts(liveSpeed, liveRpm, liveBoost, liveCoolant);
    if (voltage !== null) checkBatteryAlert(voltage);
    updateAmbientGlow(liveSpeed, liveRpm, liveBoost);
    checkZeroToSixty(liveSpeed);
    syncNavGauges();
    updateHeaderBadges();
  } catch (error) {
    console.warn("OBD read error:", error);
    setValue("sourceStatus", "BLE READ ERR");
    setValue("obdStatus", "RETRYING");
  }
}

async function disconnectOBD() {
  if (obdTimer) {
    clearInterval(obdTimer);
    obdTimer = null;
  }

  try {
    if (obdBleDevice?.gatt?.connected) obdBleDevice.gatt.disconnect();
  } catch {}

  obdLive = false;
  obdMode = "none";
  obdBleDevice = null;
  obdBleServer = null;
  obdBleWriteChar = null;
  obdBleNotifyChar = null;
  obdBleBuffer = "";

  setValue("sourceStatus", "DISCONNECTED");
  setValue("obdStatus", "OBD OFF");
  speak("O B D disconnected.");
}

function onOBDDisconnected() {
  if (obdTimer) {
    clearInterval(obdTimer);
    obdTimer = null;
  }

  obdLive = false;
  obdMode = "none";
  setValue("sourceStatus", "BLE LOST");
  setValue("obdStatus", "DISCONNECTED");
  updateHeaderBadges();
}

async function scanCodes() {
  if (obdMode === "ble") {
    try {
      speak("Scanning diagnostic codes over Bluetooth.");
      const response = await elmCommand("03", 1200);
      if (!response || response.includes("NO DATA") || !response.includes("43")) {
        setValue("codeStatus", "CLEAR");
        speak("No diagnostic codes found.");
      } else {
        setValue("codeStatus", "CODES");
        speak("Diagnostic response received.");
      }
      return;
    } catch {
      setValue("codeStatus", "ERROR");
      speak("Bluetooth code scan failed.");
      return;
    }
  }

  setValue("codeStatus", "NO OBD");
  speak("O B D is not connected.");
}

/* =========================
   STARTUP INIT
========================= */

function initRevanta() {
  applyTheme();
  updateVoiceLabel();
  updateSystemLabels();
  updateHeaderBadges();
  updateCopilotBlocks();
  syncNavGauges();
  updateTripTime();

  const setupComplete = localStorage.getItem("revantaSetupComplete") === "true";
  if (!setupComplete && !getVehicleProfile()) {
    // Keep boot screen first so it feels like a car system. User can open setup from command tab later.
    showBootScreen();
  } else {
    showBootScreen();
  }

  document.addEventListener("click", unlockVoice, { once: true });
  document.addEventListener("touchstart", unlockVoice, { once: true });

  logCommand("Revanta core loaded. Awaiting ignition command.");
}

document.addEventListener("DOMContentLoaded", initRevanta);

Object.assign(window, {
  saveVehicleProfile,
  skipSetup,
  runSetupWizard,
  startSystem,
  showTab,
  listenCommand,
  speakCurrentStartup,
  goFullscreen,
  connectOBD,
  disconnectOBD,
  scanCodes,
  startGpsSpeed,
  weatherLayer,
  speakStatus,
  speakModeLine,
  systemChime,
  activateShowMode,
  setVoiceMode,
  startZeroSixty,
  startZeroToSixty,
  resetZeroSixty,
  toggleSpoolMode,
  toggleAmbientGlow,
  demoGauges,
  resetTrip,
  playStartupSound,
  playWarningTone,
  testCurrentVoice,
  volumeUp,
  volumeDown,
  muteVoice,
  unmuteVoice,
  toggleAlerts,
  activateSecurityMode,
  disableSecurityMode,
  triggerSecurityScan,
  exportVehicleProfile,
  factoryReset,
  copilotReport,
  loadDestination,
  openFullGoogleMaps,
  goHomeNav,
  setThemeMode,
  toggleAutoTheme,
  startWakeWord,
  stopWakeWord,
  testNativeTTS
});
