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
  const label = document.getElementById("currentVoiceLabel");
  if (label) label.textContent = `Current Voice: ${voiceModes[currentVoiceMode].label}`;
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

  const label = document.getElementById("currentThemeLabel");
  if (label) label.textContent = `Current Theme: ${themeModes[currentThemeMode].label}`;
}

function toggleAlerts() {
  alertsEnabled = !alertsEnabled;
  localStorage.setItem("jettAlertsEnabled", alertsEnabled ? "true" : "false");
  updateAlertLabel();
  speak(alertsEnabled ? "Driving alerts enabled." : "Driving alerts disabled.");
}

function updateAlertLabel() {
  const label = document.getElementById("alertStatus");
  if (label) label.textContent = `Driving Alerts: ${alertsEnabled ? "Enabled" : "Disabled"}`;
}

function toggleAutoTheme() {
  autoThemeEnabled = !autoThemeEnabled;
  localStorage.setItem("jettAutoTheme", autoThemeEnabled ? "true" : "false");
  updateAutoThemeLabel();
  applyTheme();
  speak(autoThemeEnabled ? "Auto theme logic enabled." : "Auto theme logic disabled.");
}

function updateAutoThemeLabel() {
  const label = document.getElementById("autoThemeStatus");
  if (label) label.textContent = `Auto Theme: ${autoThemeEnabled ? "Enabled" : "Disabled"}`;
}

function updateWakeLabels() {
  const label = document.getElementById("wakeStatus");
  const top = document.getElementById("wakeStatusTop");
  if (label) label.textContent = `Wake Word: ${wakeListening ? "On" : "Off"}`;
  if (top) top.textContent = wakeListening ? "WAKE ON" : "WAKE OFF";
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
}

function checkBatteryAlert(voltage) {
  if (voltage === null || voltage === undefined || Number.isNaN(Number(voltage))) return;

  const lowBattery = Number(voltage) < 12.2;
  markAlert("batteryValue", lowBattery);

  if (lowBattery) alertOnce("battery", "Battery voltage low.");
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
  const rpm = Number(document.getElementById("rpmValue")?.textContent || 850);
  const boost = Number(document.getElementById("boostValue")?.textContent || 0);

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

  if (performance.spoolMode && boost > 12) beep("spool");

  checkZeroToSixty(speed);
}

function startGpsSpeed() {
  if (!navigator.geolocation) {
    speak("GPS is not available on this device.");
    return;
  }

  if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);

  speak("GPS speed mode activated.");

  gpsWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const metersPerSecond = position.coords.speed;
      setValue("gpsStatus", "ACTIVE");

      if (metersPerSecond !== null) {
        const mph = Math.round(metersPerSecond * 2.23694);

        setValue("speedValue", mph);
        setValue("sourceStatus", obdLive ? "OBD + GPS" : "GPS");

        updateSpeedStats(mph);

        const rpm = Number(document.getElementById("rpmValue").textContent || 0);
        const boost = Number(document.getElementById("boostValue").textContent || 0);
        const coolant = Number(document.getElementById("coolantValue").textContent || 0);

        checkDrivingAlerts(mph, rpm, boost, coolant);
        updateAmbientGlow(mph, rpm, boost);
        checkZeroToSixty(mph);
      }
    },
    () => {
      setValue("gpsStatus", "UNAVAILABLE");
      speak("GPS permission denied or unavailable.");
    },
    { enableHighAccuracy: true, maximumAge: 500, timeout: 10000 }
  );
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

      let condition = "clear";
      if (code >= 1 && code <= 3) condition = "cloudy";
      if (code >= 51 && code <= 67) condition = "rain";
      if (code >= 71 && code <= 77) condition = "snow";
      if (code >= 95) condition = "storm";

      setValue("weatherStatus", `${temp}°F ${condition.toUpperCase()}`);
      speak(`Current outside temperature is ${temp} degrees with ${condition} conditions.`);
    } catch (error) {
      setValue("weatherStatus", "ERROR");
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

    const speed = Number(document.getElementById("speedValue").textContent || 0);
    const rpm = Number(document.getElementById("rpmValue").textContent || 0);
    const boost = Number(document.getElementById("boostValue").textContent || 0);
    const coolant = Number(document.getElementById("coolantValue").textContent || 0);

    checkDrivingAlerts(speed, rpm, boost, coolant);
    checkBatteryAlert(data.voltage);
    updateAmbientGlow(speed, rpm, boost);
    checkZeroToSixty(speed);
  } catch (error) {
    setValue("sourceStatus", "BRIDGE LOST");
    setValue("obdStatus", "LOST");
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

let showModeActive = false;

function activateShowMode() {
  showModeActive = !showModeActive;

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
}

function speakPerformance() {
  speak(`Peak boost ${performance.peakBoost.toFixed(1)} P S I. Max R P M ${Math.round(performance.maxRpm)}. Driving score ${performance.drivingScore}. Economy score ${performance.ecoScore}. Best zero to sixty ${performance.bestZeroToSixty} seconds.`);
}

function speakStatus() {
  const speed = document.getElementById("speedValue").textContent;
  const rpm = document.getElementById("rpmValue").textContent;
  const boost = document.getElementById("boostValue").textContent;
  const coolant = document.getElementById("coolantValue").textContent;
  const battery = document.getElementById("batteryValue").textContent;

  speak(`Current speed ${speed} miles per hour. Engine speed ${rpm} R P M. Boost pressure ${boost} P S I. Coolant temperature ${coolant} degrees. Battery ${battery}.`);
}

function copilotReport() {
  const coolant = Number(document.getElementById("coolantValue").textContent);
  const boost = Number(document.getElementById("boostValue").textContent);
  const rpm = Number(document.getElementById("rpmValue").textContent);
  const output = document.getElementById("copilotOutput");

  let message = "Copilot report. Systems look stable. Coolant normal. Boost normal. No active warnings.";

  if (coolant >= 215) message = "Copilot report. Coolant temperature is elevated. Ease off and monitor temperature.";
  else if (boost >= 18) message = "Copilot report. Turbo pressure is high. Keep it controlled.";
  else if (rpm >= 3600) message = "Copilot report. R P M is high. Shift or back off.";

  if (output) output.textContent = message;
  speak(message);
}

function activateSecurityMode() {
  if (!performance.securityMode) {
    performance.securityMode = true;
    applyTheme();
    setValue("securityStatus", "ARMED");
    speak("Security scanner armed. Black diesel watch mode active.");
  } else {
    speak("Security mode already active.");
  }
}

function disableSecurityMode() {
  if (performance.securityMode) {
    performance.securityMode = false;
    applyTheme();
    setValue("securityStatus", "OFF");
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
  const output = document.getElementById("copilotOutput");
  const message = "Security scan complete. No motion threats detected.";
  if (output) output.textContent = message;
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
  if (command.includes("connect obd") || command.includes("connect o b d")) return connectOBD();
  if (command.includes("disconnect obd") || command.includes("disconnect o b d")) return disconnectOBD();
  if (command.includes("scan codes") || command.includes("check codes") || command.includes("diagnostic")) return scanCodes();

  if (command.includes("battery") || command.includes("voltage")) {
    const voltage = document.getElementById("batteryValue")?.textContent || "unknown";
    return speak(`Battery voltage is ${voltage}.`);
  }

  if (command.includes("intake")) {
    const intake = document.getElementById("intakeValue")?.textContent || "unknown";
    return speak(`Intake temperature is ${intake}.`);
  }

  if (command.includes("boost") || command.includes("turbo")) return speakModeLine("boost");
  if (command.includes("coolant") || command.includes("temp") || command.includes("temperature")) return speakModeLine("coolant");
  if (command.includes("gps") || command.includes("speed")) return speakModeLine("gps");
  if (command.includes("status") || command.includes("systems") || command.includes("how's the car")) return speakStatus();
  if (command.includes("copilot") || command.includes("how is the car") || command.includes("how's it looking")) return copilotReport();
  if (command.includes("performance") || command.includes("score")) return speakPerformance();
  if (command.includes("weather") || command.includes("outside")) return weatherLayer();
  if (command.includes("music") || command.includes("youtube")) return openYouTubeMusic();
  if (command.includes("spool")) return toggleSpoolMode();
  if (command.includes("glow")) return toggleAmbientGlow();
  if (command.includes("zero to sixty") || command.includes("0 to 60")) return startZeroToSixty();
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
      updateWakeLabels();

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
  updateWakeLabels();
};

  wakeRecognition.onend = () => {
    if (wakeListening) {
      setTimeout(() => {
        try { wakeRecognition.start(); } catch (error) {}
      }, 1000);
    }
  };

  wakeListening = true;
  updateWakeLabels();

  try {
    wakeRecognition.start();
    speak("Hey Jett wake word active.");
  } catch (error) {
    wakeListening = false;
    updateWakeLabels();
    speak("Wake word could not start.");
  }
}

function stopWakeWord() {
  wakeListening = false;
  if (wakeRecognition) wakeRecognition.stop();
  updateWakeLabels();
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
        updateAlertLabel();
        updateAutoThemeLabel();
        updateWakeLabels();

        speakCurrentStartup();
      }, 450);
    }
  }, 420);
}

function startSystem() {
  cinematicStartup();
}

function showTab(tabName) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));

  const selected = document.getElementById(`${tabName}Tab`);
  if (selected) selected.classList.add("active");

  const titles = {
    dash: "BLACK DIESEL COMMAND",
    performance: "PERFORMANCE SYSTEMS",
    media: "MEDIA CENTER",
    copilot: "AI COPILOT",
    settings: "SYSTEM SETTINGS"
  };

  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) pageTitle.textContent = titles[tabName] || "BLACK DIESEL COMMAND";
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

function syncNavGauges() {
  setValue("navSpeed", `${document.getElementById("speedValue").textContent} MPH`);
  setValue("navRpm", document.getElementById("rpmValue").textContent);
  setValue("navBoost", `${document.getElementById("boostValue").textContent} PSI`);
  setValue("navIntake", document.getElementById("intakeValue").textContent);
  setValue("navWeather", document.getElementById("weatherStatus").textContent);
}

setInterval(syncNavGauges, 1000);

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

document.addEventListener("DOMContentLoaded", () => {
  updateVoiceLabel();
  applyTheme();
  updateAlertLabel();
  updateAutoThemeLabel();
  updateWakeLabels();
  updateTripTime();
});