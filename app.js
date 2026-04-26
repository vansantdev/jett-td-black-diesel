const voiceModes = {
  male: {
    label: "Male",
    rate: 0.9,
    pitch: 0.85,
    startup: "Good {time} Danker. Jett T D black diesel systems online.",
    boost: "Boost pressure standing by.",
    coolant: "Coolant temperature is currently normal.",
    gps: "GPS speed system standing by.",
    commandReady: "Command mode ready."
  },
  female: {
    label: "Female",
    rate: 1,
    pitch: 1.15,
    startup: "Good {time} Danker. Jett T D black diesel is online and ready.",
    boost: "Boost pressure is ready.",
    coolant: "Coolant temperature looks good.",
    gps: "GPS speed tracking is ready.",
    commandReady: "I am listening."
  },
  robot: {
    label: "Robot",
    rate: 0.72,
    pitch: 0.55,
    startup: "System online. Diesel command interface active. Good {time}.",
    boost: "Turbo pressure monitor active.",
    coolant: "Thermal system within range.",
    gps: "Satellite speed tracking standing by.",
    commandReady: "Voice input active."
  },
  deepCommand: {
    label: "Deep Command",
    rate: 0.82,
    pitch: 0.65,
    startup: "Good {time} Danker. Black diesel command system online. Awaiting orders.",
    boost: "Boost pressure standing by. Turbo system ready.",
    coolant: "Coolant system stable.",
    gps: "GPS speed system armed.",
    commandReady: "Awaiting command."
  },
  sarcastic: {
    label: "Funny / Sarcastic",
    rate: 1,
    pitch: 0.95,
    startup: "Well well well. Good {time} Danker. The T D is alive again.",
    boost: "Boost is standing by. Try not to pretend this is a race car.",
    coolant: "Coolant looks fine. For once, nothing is angry.",
    gps: "GPS is ready. Because apparently the speedometer called off today.",
    commandReady: "Fine. I am listening."
  },
  mechanic: {
    label: "Mechanic Mode",
    rate: 0.95,
    pitch: 0.8,
    startup: "Good {time}. Engine systems online. Watching boost, coolant, voltage, and driver behavior.",
    boost: "Checking turbo pressure. Keep an eye on spool and requested boost.",
    coolant: "Coolant temperature is in operating range.",
    gps: "GPS speed active. Useful until that wheel speed issue is fixed.",
    commandReady: "Mechanic voice command ready."
  },
  butler: {
    label: "Butler Mode",
    rate: 0.85,
    pitch: 0.9,
    startup: "Good {time}, sir. Your black diesel is ready.",
    boost: "Turbo pressure is prepared, sir.",
    coolant: "Coolant temperature appears acceptable, sir.",
    gps: "Navigation and speed tracking are ready, sir.",
    commandReady: "How may I assist, sir?"
  },
  drill: {
    label: "Diesel Drill Sergeant",
    rate: 1.05,
    pitch: 0.7,
    startup: "Listen up, Danker. Good {time}. Diesel system online. Stay sharp.",
    boost: "Turbo ready. Do not abuse it.",
    coolant: "Coolant is stable. Keep moving.",
    gps: "GPS ready. Eyes forward.",
    commandReady: "Speak up. Command mode active."
  },
  race: {
    label: "Race Mode",
    rate: 1.1,
    pitch: 0.78,
    startup: "Good {time}. Race mode armed. Boost pressure standing by. Keep it controlled.",
    boost: "Boost system armed. Turbo pressure standing by.",
    coolant: "Coolant stable. Performance window acceptable.",
    gps: "GPS speed tracking active. Drive smart.",
    commandReady: "Race command ready."
  },
  sport: {
    label: "Sport Mode",
    rate: 1,
    pitch: 0.75,
    startup: "Good {time}. Sport mode online. Throttle discipline recommended.",
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

let availableVoices = [];
let selectedSystemVoice = null;

let currentVoiceMode = localStorage.getItem("jettVoiceMode") || "deepCommand";
let currentThemeMode = localStorage.getItem("jettThemeMode") || "legacy";
let alertsEnabled = localStorage.getItem("jettAlertsEnabled") !== "false";
let autoThemeEnabled = localStorage.getItem("jettAutoTheme") === "true";
let showModeActive = localStorage.getItem("jettShowMode") === "true";

let tripStart = Date.now();
let speedSamples = [];
let topSpeed = 0;
let lastAlertTimes = {};
let wakeListening = false;
let wakeRecognition = null;
let gpsWatchId = null;
let obdLive = false;
let obdTimer = null;

let performance = {
  zeroToSixtyActive: false,
  zeroToSixtyStart: null,
  bestZeroToSixty: localStorage.getItem("jettBest060") || "--",
  peakBoost: 0,
  maxRpm: 850,
  drivingScore: 100,
  ecoScore: 100,
  spoolMode: false,
  ambientGlow: true,
  securityMode: false
};

const homeDestination = "home";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function fillLine(text) {
  return text.replaceAll("{time}", getTimeGreeting());
}

function loadSystemVoices() {
  availableVoices = window.speechSynthesis.getVoices();

  if (currentVoiceMode === "female") {
    selectedSystemVoice =
      availableVoices.find(v => v.name.toLowerCase().includes("zira")) ||
      availableVoices.find(v => v.name.toLowerCase().includes("female")) ||
      availableVoices.find(v => v.lang && v.lang.startsWith("en")) ||
      availableVoices[0] ||
      null;
  } else {
    selectedSystemVoice =
      availableVoices.find(v => v.name.toLowerCase().includes("david")) ||
      availableVoices.find(v => v.name.toLowerCase().includes("mark")) ||
      availableVoices.find(v => v.lang && v.lang.startsWith("en")) ||
      availableVoices[0] ||
      null;
  }
}

window.speechSynthesis.onvoiceschanged = loadSystemVoices;
loadSystemVoices();

function speak(text, overrideMode = null) {
  const modeKey = overrideMode || currentVoiceMode;
  const mode = voiceModes[modeKey] || voiceModes.deepCommand;
  const msg = new SpeechSynthesisUtterance(fillLine(text));

  loadSystemVoices();

  if (selectedSystemVoice) msg.voice = selectedSystemVoice;

  msg.rate = mode.rate;
  msg.pitch = mode.pitch;
  msg.volume = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(msg);
}

function beep(type = "normal") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type === "warning" ? "sawtooth" : "sine";
    osc.frequency.value = type === "warning" ? 220 : type === "spool" ? 520 : 760;
    gain.gain.value = 0.04;

    osc.start();

    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, type === "spool" ? 250 : 120);
  } catch (e) {}
}

function systemChime() {
  beep("normal");
  speak("System chime test complete.");
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = value;
  el.classList.add("value-pop");
  setTimeout(() => el.classList.remove("value-pop"), 220);
}

function getText(id, fallback = "") {
  return document.getElementById(id)?.textContent || fallback;
}

function speakModeLine(type) {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  speak(mode[type] || "System ready.");
}

function setVoiceMode(modeName) {
  if (!voiceModes[modeName]) return;

  currentVoiceMode = modeName;
  localStorage.setItem("jettVoiceMode", modeName);

  loadSystemVoices();
  updateVoiceLabel();
  speak(voiceModes[modeName].startup, modeName);
}

function updateVoiceLabel() {
  setValue("currentVoiceLabel", `Current Voice: ${voiceModes[currentVoiceMode].label}`);
}

function testCurrentVoice() {
  const mode = voiceModes[currentVoiceMode];
  speak(`${mode.label} selected. Jett T D Black Diesel command system is online.`);
}

function speakCurrentStartup() {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  speak(mode.startup);
}

function setThemeMode(themeName, silent = false) {
  if (!themeModes[themeName]) return;

  currentThemeMode = themeName;
  localStorage.setItem("jettThemeMode", themeName);
  applyTheme();

  if (!silent) speak(themeModes[themeName].line);
}

function applyTheme() {
  document.body.className = themeModes[currentThemeMode]?.className || "theme-legacy";

  if (performance.ambientGlow) document.body.classList.add("ambient-drive-glow");
  if (performance.spoolMode) document.body.classList.add("spool-mode");
  if (performance.securityMode) document.body.classList.add("security-mode");
  if (autoThemeEnabled) document.body.classList.add("auto-theme-on");

  setValue("currentThemeLabel", `Current Theme: ${themeModes[currentThemeMode].label}`);
}

function toggleAlerts() {
  alertsEnabled = !alertsEnabled;
  localStorage.setItem("jettAlertsEnabled", alertsEnabled ? "true" : "false");
  updateSystemLabels();
  speak(alertsEnabled ? "Driving alerts enabled." : "Driving alerts disabled.");
}

function toggleAutoTheme() {
  autoThemeEnabled = !autoThemeEnabled;
  localStorage.setItem("jettAutoTheme", autoThemeEnabled ? "true" : "false");
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
  const el = document.getElementById(id);
  if (!el) return;

  if (active) el.classList.add("value-alert");
  else el.classList.remove("value-alert");
}

function updateHeaderBadges() {
  const gps = getText("gpsStatus", "STANDBY");
  const weather = getText("weatherStatus", "READY");
  const battery = getText("batteryValue", "-- V");

  setValue("gpsHeaderStatus", `GPS ${gps}`);
  setValue("weatherHeaderStatus", weather === "READY" ? "WEATHER READY" : weather);
  setValue("batteryHeaderStatus", `BATTERY ${battery}`);
}

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
    setValue("turboHealthNote", `Boost currently ${boost.toFixed ? boost.toFixed(1) : boost} PSI.`);
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

function autoThemeLogic(speed, rpm, boost, coolant) {
  if (!autoThemeEnabled) return;

  if (coolant >= 215 || speed >= 80 || boost >= 18) {
    setThemeMode("performanceRed", true);
  } else if (new Date().getHours() >= 20 || new Date().getHours() < 6) {
    setThemeMode("dieselAmber", true);
  } else if (rpm < 1100 && speed < 5) {
    setThemeMode("stealth", true);
  } else {
    setThemeMode("germanBlue", true);
  }
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

function updateSpeedStats(speed) {
  topSpeed = Math.max(topSpeed, speed);
  speedSamples.push(speed);

  if (speedSamples.length > 300) speedSamples.shift();

  const avg = Math.round(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length);

  setValue("avgSpeed", `${avg} MPH`);
  setValue("topSpeed", `${topSpeed} MPH`);

  updatePerformanceScores(speed);
}

function updatePerformanceScores(speed) {
  const rpm = Number(getText("rpmValue", "850"));
  const boost = Number(getText("boostValue", "0"));

  performance.peakBoost = Math.max(performance.peakBoost, boost);
  performance.maxRpm = Math.max(performance.maxRpm, rpm);

  let score = 100;
  if (rpm > 3200) score -= 10;
  if (boost > 17) score -= 10;
  if (speed > 80) score -= 15;
  if (speedSamples.length > 30 && topSpeed > 75) score -= 5;

  performance.drivingScore = Math.max(0, score);
  performance.ecoScore = Math.max(0, 100 - Math.round(boost * 2) - (rpm > 2800 ? 15 : 0));

  setValue("peakBoost", `${performance.peakBoost.toFixed(1)} PSI`);
  setValue("maxRpm", `${Math.round(performance.maxRpm)} RPM`);
  setValue("driveScore", performance.drivingScore);
  setValue("ecoScore", `Eco ${performance.ecoScore}`);

  updateCopilotBlocks();
}

function updateAmbientGlow(speed, rpm, boost) {
  if (!performance.ambientGlow) return;

  const intensity = Math.min(1, (speed / 100 + rpm / 4500 + boost / 22) / 3);
  document.documentElement.style.setProperty("--driveGlow", `${0.25 + intensity}`);
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

  updateSpeedStats(speed);
  checkDrivingAlerts(speed, rpm, boost, coolant);
  checkBatteryAlert(voltage);
  updateAmbientGlow(speed, rpm, boost);
  updateHeaderBadges();

  if (performance.spoolMode && boost > 12) beep("spool");

  checkZeroToSixty(speed);
}

let lastGpsPosition = null;
let lastGpsTime = null;

function startGpsSpeed() {
  if (!navigator.geolocation) {
    speak("GPS is not available on this device.");
    return;
  }

  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
  }

  speak("GPS speed mode activated.");
  setValue("gpsStatus", "SEARCHING");
  setValue("gpsHeaderStatus", "GPS SEARCHING");

  gpsWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const now = Date.now();
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const nativeSpeed = position.coords.speed;

      let mph = 0;

      if (nativeSpeed !== null && nativeSpeed >= 0) {
        mph = Math.round(nativeSpeed * 2.23694);
      } else if (lastGpsPosition && lastGpsTime) {
        const distanceMeters = getDistanceMeters(
          lastGpsPosition.lat,
          lastGpsPosition.lon,
          lat,
          lon
        );

        const seconds = (now - lastGpsTime) / 1000;

        if (seconds > 0) {
          const metersPerSecond = distanceMeters / seconds;
          mph = Math.round(metersPerSecond * 2.23694);
        }
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
    },
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
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = deg => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function weatherLayer() {
  if (!navigator.geolocation) {
    speak("Location services unavailable.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
      const response = await fetch(url);
      const data = await response.json();

      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weather_code;

      let condition = "CLEAR";
      if (code >= 1 && code <= 3) condition = "CLOUDY";
      if (code >= 51 && code <= 67) condition = "RAIN";
      if (code >= 71 && code <= 77) condition = "SNOW";
      if (code >= 95) condition = "STORM";

      setValue("weatherStatus", `${temp}°F ${condition}`);
      setValue("weatherHeaderStatus", `${temp}°F ${condition}`);
      setValue("navWeather", `${temp}°F ${condition}`);

      speak(`Current outside temperature is ${temp} degrees with ${condition.toLowerCase()} conditions.`);
    } catch (error) {
      setValue("weatherStatus", "ERROR");
      setValue("weatherHeaderStatus", "WEATHER ERROR");
      speak("Weather system failed.");
    }
  }, () => {
    speak("Location permission denied.");
  });
}

async function connectOBD() {
  try {
    speak("Connecting to O B D bridge.");

    const res = await fetch("http://127.0.0.1:5050/connect");
    const data = await res.json();

    if (data.connected) {
      obdLive = true;
      setValue("sourceStatus", "OBD LIVE");
      setValue("obdStatus", "OBD LIVE");
      speak("O B D live data connected.");
      startOBDPolling();
    } else {
      obdLive = false;
      setValue("sourceStatus", "OBD OFFLINE");
      setValue("obdStatus", "OBD OFF");
      speak("O B D bridge is online, but the adapter is not connected.");
    }
  } catch (error) {
    obdLive = false;
    setValue("sourceStatus", "NO BRIDGE");
    setValue("obdStatus", "NO BRIDGE");
    speak("O B D bridge not detected. Start the Python server first.");
  }
}

async function disconnectOBD() {
  try {
    await fetch("http://127.0.0.1:5050/disconnect");
  } catch (error) {}

  obdLive = false;

  if (obdTimer) {
    clearInterval(obdTimer);
    obdTimer = null;
  }

  setValue("sourceStatus", "DISCONNECTED");
  setValue("obdStatus", "OBD OFF");
  speak("O B D disconnected.");
}

function startOBDPolling() {
  if (obdTimer) clearInterval(obdTimer);

  obdTimer = setInterval(readOBDLive, 1000);
  readOBDLive();
}

async function readOBDLive() {
  try {
    const res = await fetch("http://127.0.0.1:5050/live");
    const data = await res.json();

    if (!data.connected) {
      setValue("sourceStatus", data.source || "OBD OFFLINE");
      setValue("obdStatus", "OBD OFF");
      updateHeaderBadges();
      return;
    }

    setValue("sourceStatus", "OBD LIVE");
    setValue("obdStatus", "OBD LIVE");

    if (data.rpm !== null) setValue("rpmValue", Math.round(data.rpm));
    if (data.coolant !== null) setValue("coolantValue", Math.round(data.coolant));
    if (data.boost !== null) setValue("boostValue", Number(data.boost).toFixed(1));
    if (data.voltage !== null) setValue("batteryValue", `${Number(data.voltage).toFixed(1)} V`);
    if (data.intakeTemp !== null) setValue("intakeValue", `${Math.round(data.intakeTemp)} °F`);

    if (data.speed !== null && data.speed > 0) {
      setValue("speedValue", Math.round(data.speed));
      setValue("gpsStatus", "OBD");
      updateSpeedStats(Math.round(data.speed));
    }

    const speed = Number(getText("speedValue", "0"));
    const rpm = Number(getText("rpmValue", "0"));
    const boost = Number(getText("boostValue", "0"));
    const coolant = Number(getText("coolantValue", "0"));

    checkDrivingAlerts(speed, rpm, boost, coolant);
    checkBatteryAlert(data.voltage);
    updateAmbientGlow(speed, rpm, boost);
    checkZeroToSixty(speed);
    syncNavGauges();
    updateHeaderBadges();
  } catch (error) {
    setValue("sourceStatus", "BRIDGE LOST");
    setValue("obdStatus", "LOST");
    updateHeaderBadges();
  }
}

async function scanCodes() {
  try {
    speak("Scanning diagnostic codes.");

    const res = await fetch("http://127.0.0.1:5050/codes");
    const data = await res.json();

    if (!data.connected) {
      setValue("codeStatus", "NO OBD");
      speak("O B D not connected.");
      return;
    }

    if (!data.codes || data.codes.length === 0) {
      setValue("codeStatus", "CLEAR");
      speak("No diagnostic codes found.");
      return;
    }

    setValue("codeStatus", `${data.codes.length} CODE`);
    speak(`${data.codes.length} diagnostic code found.`);
  } catch (error) {
    setValue("codeStatus", "ERROR");
    speak("Code scan failed.");
  }
}

function startZeroToSixty() {
  performance.zeroToSixtyActive = true;
  performance.zeroToSixtyStart = null;
  setValue("zeroSixtyTime", "ARMED");
  setValue("zeroSixtyStatus", "Start from stop");
  speak("Zero to sixty timer armed. Begin from a stop.");
}

function startZeroSixty() {
  startZeroToSixty();
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
      localStorage.setItem("jettBest060", time);
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
  localStorage.setItem("jettShowMode", showModeActive ? "true" : "false");

  if (showModeActive) {
    performance.spoolMode = false;
    performance.ambientGlow = true;
    setThemeMode("performanceRed", true);
    document.body.classList.remove("spool-mode");
    applyTheme();
    speak("Show mode activated.");
  } else {
    performance.spoolMode = false;
    document.body.classList.remove("spool-mode");
    setThemeMode("legacy", true);
    applyTheme();
    speak("Show mode disabled.");
  }

  updateSystemLabels();
}

function speakPerformance() {
  speak(`Peak boost ${performance.peakBoost.toFixed(1)} P S I. Max R P M ${Math.round(performance.maxRpm)}. Driving score ${performance.drivingScore}. Economy score ${performance.ecoScore}. Best zero to sixty ${performance.bestZeroToSixty} seconds.`);
}

function speakStatus() {
  const speed = getText("speedValue", "0");
  const rpm = getText("rpmValue", "0");
  const boost = getText("boostValue", "0");
  const coolant = getText("coolantValue", "0");
  const battery = getText("batteryValue", "-- V");
  const weather = getText("weatherStatus", "READY");

  speak(`Current speed ${speed} miles per hour. Engine speed ${rpm} R P M. Boost pressure ${boost} P S I. Coolant temperature ${coolant} degrees. Battery ${battery}. Weather ${weather}.`);
}

function copilotReport() {
  updateCopilotBlocks();

  const engine = getText("engineHealthStatus", "stable");
  const turbo = getText("turboHealthStatus", "ready");
  const power = getText("powerHealthStatus", "unknown");
  const drive = getText("driveHealthStatus", "ready");

  const message = `Copilot report. Engine ${engine}. Turbo ${turbo}. Power ${power}. Drive status ${drive}.`;

  setValue("copilotOutput", message);
  speak(message);
}

function activateSecurityMode() {
  if (!performance.securityMode) {
    performance.securityMode = true;
    applyTheme();
    speak("Security scanner armed. Black diesel watch mode active.");
  } else {
    speak("Security mode already active.");
  }
}

function disableSecurityMode() {
  if (performance.securityMode) {
    performance.securityMode = false;
    applyTheme();
    speak("Security scanner disabled.");
  } else {
    speak("Security mode already disabled.");
  }
}

function toggleSecurityMode() {
  if (performance.securityMode) disableSecurityMode();
  else activateSecurityMode();
}

function triggerSecurityScan() {
  beep("warning");
  const message = "Security scan complete. No motion threats detected.";
  setValue("copilotOutput", message);
  speak(message);
}

function listenCommand() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    speak("Voice command is not supported in this browser.");
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
    try { recognition.start(); } catch (error) {}
  }, 900);
}

function handleVoiceCommand(command) {
  command = command.toLowerCase().trim();

  if (command.includes("connect obd") || command.includes("connect o b d")) return connectOBD();
  if (command.includes("disconnect obd") || command.includes("disconnect o b d")) return disconnectOBD();
  if (command.includes("scan codes") || command.includes("check codes") || command.includes("diagnostic")) return scanCodes();

  if (command.includes("navigate home")) return goHomeNav();

  if (command.includes("open maps") || command.includes("google maps")) {
    return openFullGoogleMaps();
  }

  if (command.includes("navigation night") || command.includes("nav night")) {
    return navNightMode();
  }

  if (command.includes("navigate to")) {
    const destination = command.replace("navigate to", "").trim();
    const input = document.getElementById("navSearchInput");

    if (input && destination) {
      input.value = destination;
      loadDestination();
      return;
    }
  }

  if (command.includes("battery") || command.includes("voltage")) {
    const voltage = getText("batteryValue", "unknown");
    return speak(`Battery voltage is ${voltage}.`);
  }

  if (command.includes("intake")) {
    const intake = getText("intakeValue", "unknown");
    return speak(`Intake temperature is ${intake}.`);
  }

  if (command.includes("boost") || command.includes("turbo")) return speakModeLine("boost");
  if (command.includes("coolant") || command.includes("temp") || command.includes("temperature")) return speakModeLine("coolant");
  if (command.includes("gps") || command.includes("speed")) return speakModeLine("gps");
  if (command.includes("status") || command.includes("systems") || command.includes("how's the car") || command.includes("how is the car")) return speakStatus();
  if (command.includes("copilot") || command.includes("how's it looking")) return copilotReport();
  if (command.includes("performance") || command.includes("score")) return speakPerformance();
  if (command.includes("weather") || command.includes("outside")) return weatherLayer();
  if (command.includes("music") || command.includes("youtube")) return openYouTubeMusic();
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

  if (!SpeechRecognition) return speak("Wake word is not supported in this browser.");
  if (wakeListening) return speak("Hey Jett wake word is already active.");

  wakeRecognition = new SpeechRecognition();
  wakeRecognition.lang = "en-US";
  wakeRecognition.continuous = false;
  wakeRecognition.interimResults = false;

  wakeRecognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();

    if (
      transcript.includes("hey jett") ||
      transcript.includes("hey jet") ||
      transcript.includes("black diesel") ||
      transcript.includes("jett command") ||
      transcript.includes("jet command")
    ) {
      wakeListening = false;
      updateSystemLabels();

      if (wakeRecognition) wakeRecognition.stop();

      speak("Awaiting command.");

      setTimeout(() => {
        listenCommand();
      }, 1600);
    }
  };

  wakeRecognition.onerror = (event) => {
    console.log("Wake word error:", event.error);

    if (event.error === "no-speech") {
      if (wakeListening) {
        setTimeout(() => {
          try { wakeRecognition.start(); } catch (error) {}
        }, 800);
      }
      return;
    }

    wakeListening = false;
    updateSystemLabels();
  };

  wakeRecognition.onend = () => {
    if (wakeListening) {
      setTimeout(() => {
        try { wakeRecognition.start(); } catch (error) {}
      }, 1000);
    }
  };

  wakeListening = true;
  updateSystemLabels();

  try {
    wakeRecognition.start();
    speak("Hey Jett wake word active.");
  } catch (error) {
    wakeListening = false;
    updateSystemLabels();
    speak("Wake word could not start.");
  }
}

function stopWakeWord() {
  wakeListening = false;
  if (wakeRecognition) wakeRecognition.stop();
  updateSystemLabels();
  speak("Hey Jett wake word disabled.");
}

function cinematicStartup() {
  const bootStatus = document.getElementById("bootStatus");
  const bootLog = document.getElementById("bootLog");

  const steps = [
    "IGNITION SIGNAL DETECTED",
    "INITIALIZING CORE",
    "VOICE MATRIX ONLINE",
    "GPS SYSTEM READY",
    "OBD BRIDGE STANDBY",
    "BOOST MONITOR ARMED",
    "WEATHER LAYER READY",
    "BLACK DIESEL ONLINE"
  ];

  let i = 0;
  if (bootLog) bootLog.innerHTML = "";
  beep();

  const interval = setInterval(() => {
    const step = steps[i];

    if (bootStatus) bootStatus.textContent = step;
    if (bootLog) bootLog.innerHTML += `<div>> ${step}</div>`;

    beep();
    i++;

    if (i >= steps.length) {
      clearInterval(interval);

      setTimeout(() => {
        document.getElementById("bootScreen").classList.add("hidden");
        document.getElementById("dashboard").classList.remove("hidden");

        updateVoiceLabel();
        applyTheme();
        updateSystemLabels();
        updateHeaderBadges();
        updateCopilotBlocks();
        syncNavGauges();

        speakCurrentStartup();
      }, 450);
    }
  }, 420);
}

function startSystem() {
  cinematicStartup();
}

function showTab(tabName) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
    tab.classList.remove("fade-in");
  });

  const selected = document.getElementById(`${tabName}Tab`);
  if (selected) {
    selected.classList.add("active");
    setTimeout(() => selected.classList.add("fade-in"), 10);
  }

  const titles = {
    dash: "BLACK DIESEL COMMAND",
    performance: "PERFORMANCE SYSTEMS",
    media: "MEDIA CENTER",
    copilot: "AI COPILOT",
    nav: "NAVIGATION MODE",
    settings: "SYSTEM SETTINGS"
  };

  setValue("pageTitle", titles[tabName] || "BLACK DIESEL COMMAND");
  syncNavGauges();
}

function openYouTubeMusic() {
  speak("Opening YouTube Music.");
  window.open("https://music.youtube.com", "_blank");
}

function goFullscreen() {
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
}

function updateTripTime() {
  const seconds = Math.floor((Date.now() - tripStart) / 1000);
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  setValue("tripTime", `${mins}:${secs}`);
}

function loadDestination() {
  const input = document.getElementById("navSearchInput");

  if (!input || !input.value.trim()) {
    speak("Enter a destination first.");
    return;
  }

  const destination = input.value.trim();
  const map = document.getElementById("mapFrame");

  if (map) {
    map.src = `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`;
  }

  speak(`Navigation map loaded for ${destination}.`);
}

function openFullGoogleMaps() {
  const input = document.getElementById("navSearchInput");
  const destination = input && input.value.trim() ? input.value.trim() : "";

  const url = destination
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
    : "https://www.google.com/maps";

  window.open(url, "_blank");
  speak("Opening full Google Maps.");
}

function goHomeNav() {
  const input = document.getElementById("navSearchInput");

  if (input) input.value = homeDestination;

  const map = document.getElementById("mapFrame");

  if (map) {
    map.src = `https://www.google.com/maps?q=${encodeURIComponent(homeDestination)}&output=embed`;
  }

  speak("Home navigation loaded.");
}

function navNightMode() {
  setThemeMode("dieselAmber");
  speak("Navigation night mode active.");
}

function syncNavGauges() {
  setValue("navSpeed", `${getText("speedValue", "0")} MPH`);
  setValue("navRpm", getText("rpmValue", "850"));
  setValue("navBoost", `${getText("boostValue", "0.0")} PSI`);
  setValue("navIntake", getText("intakeValue", "-- °F"));
  setValue("navWeather", getText("weatherStatus", "READY"));
}

function resetTrip() {
  tripStart = Date.now();
  speedSamples = [];
  topSpeed = 0;
  performance.peakBoost = 0;
  performance.maxRpm = 850;

  setValue("tripTime", "00:00");
  setValue("avgSpeed", "0 MPH");
  setValue("topSpeed", "0 MPH");
  setValue("peakBoost", "0.0 PSI");
  setValue("maxRpm", "850 RPM");

  speak("Trip data reset.");
}

setInterval(updateTripTime, 1000);
setInterval(syncNavGauges, 1000);
setInterval(updateHeaderBadges, 1500);
setInterval(updateCopilotBlocks, 2000);

document.addEventListener("DOMContentLoaded", () => {
  updateVoiceLabel();
  applyTheme();
  updateSystemLabels();
  updateHeaderBadges();
  updateCopilotBlocks();
  updateTripTime();
  syncNavGauges();

  if (showModeActive) {
    currentThemeMode = "performanceRed";
    applyTheme();
  }
});