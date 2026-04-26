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
    startup: "Well well well. Good {time} Danker. The diesel lives again.",
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
  cyber: {
    label: "Cyber Blue",
    className: "",
    line: "Cyber blue theme activated."
  },
  stealth: {
    label: "Night Stealth",
    className: "theme-stealth",
    line: "Night stealth theme activated."
  },
  raceRed: {
    label: "Race Red",
    className: "theme-raceRed",
    line: "Race red theme activated."
  },
  dieselAmber: {
    label: "Diesel Amber",
    className: "theme-dieselAmber",
    line: "Diesel amber theme activated."
  },
  oemBlue: {
    label: "OEM Blue",
    className: "theme-oemBlue",
    line: "O E M blue theme activated."
  }
};

let availableVoices = [];
let selectedSystemVoice = null;
let currentVoiceMode = localStorage.getItem("jettVoiceMode") || "deepCommand";
let currentThemeMode = localStorage.getItem("jettThemeMode") || "cyber";
let alertsEnabled = localStorage.getItem("jettAlertsEnabled") !== "false";

let tripStart = Date.now();
let speedSamples = [];
let topSpeed = 0;
let lastAlertTimes = {};

function getTimeGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function fillLine(text) {
  return text.replace("{time}", getTimeGreeting());
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

  if (selectedSystemVoice) {
    msg.voice = selectedSystemVoice;
  }

  msg.rate = mode.rate;
  msg.pitch = mode.pitch;
  msg.volume = 1;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(msg);
}

function speakModeLine(type) {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  const line = mode[type] || "System ready.";
  speak(line);
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

  if (label) {
    label.textContent = `Current Voice: ${voiceModes[currentVoiceMode].label}`;
  }
}

function testCurrentVoice() {
  const mode = voiceModes[currentVoiceMode];
  speak(`${mode.label} selected. Jetta T D I Black Diesel command system is online.`);
}

function speakCurrentStartup() {
  const mode = voiceModes[currentVoiceMode] || voiceModes.deepCommand;
  speak(mode.startup);
}

function setThemeMode(themeName) {
  if (!themeModes[themeName]) return;

  currentThemeMode = themeName;
  localStorage.setItem("jettThemeMode", themeName);

  applyTheme();
  speak(themeModes[themeName].line);
}

function applyTheme() {
  document.body.className = themeModes[currentThemeMode].className;

  const label = document.getElementById("currentThemeLabel");
  if (label) {
    label.textContent = `Current Theme: ${themeModes[currentThemeMode].label}`;
  }
}

function toggleAlerts() {
  alertsEnabled = !alertsEnabled;
  localStorage.setItem("jettAlertsEnabled", alertsEnabled ? "true" : "false");

  updateAlertLabel();
  speak(alertsEnabled ? "Driving alerts enabled." : "Driving alerts disabled.");
}

function updateAlertLabel() {
  const label = document.getElementById("alertStatus");
  if (label) {
    label.textContent = `Driving Alerts: ${alertsEnabled ? "Enabled" : "Disabled"}`;
  }
}

function alertOnce(key, text, cooldownMs = 12000) {
  if (!alertsEnabled) return;

  const now = Date.now();
  const last = lastAlertTimes[key] || 0;

  if (now - last < cooldownMs) return;

  lastAlertTimes[key] = now;
  speak(text);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = value;
}

function markAlert(id, active) {
  const el = document.getElementById(id);
  if (!el) return;

  if (active) {
    el.classList.add("value-alert");
  } else {
    el.classList.remove("value-alert");
  }
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
}

function updateSpeedStats(speed) {
  topSpeed = Math.max(topSpeed, speed);
  speedSamples.push(speed);

  if (speedSamples.length > 300) {
    speedSamples.shift();
  }

  const avg = Math.round(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length);

  setValue("avgSpeed", `${avg} MPH`);
}

function demoGauges() {
  const speed = Math.floor(Math.random() * 95);
  const rpm = Math.floor(850 + Math.random() * 3400);
  const boost = Number((Math.random() * 21).toFixed(1));
  const coolant = Math.floor(170 + Math.random() * 55);

  setValue("speedValue", speed);
  setValue("rpmValue", rpm);
  setValue("boostValue", boost.toFixed(1));
  setValue("coolantValue", coolant);

  setValue("gpsStatus", "DEMO");
  setValue("sourceStatus", "SIM");

  updateSpeedStats(speed);
  checkDrivingAlerts(speed, rpm, boost, coolant);
}

function speakStatus() {
  const speed = document.getElementById("speedValue").textContent;
  const rpm = document.getElementById("rpmValue").textContent;
  const boost = document.getElementById("boostValue").textContent;
  const coolant = document.getElementById("coolantValue").textContent;

  speak(`Current speed ${speed} miles per hour. Engine speed ${rpm} R P M. Boost pressure ${boost} P S I. Coolant temperature ${coolant} degrees.`);
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

  recognition.onerror = () => {
    speak("Voice command failed. Try again.");
  };

  setTimeout(() => {
    recognition.start();
  }, 600);
}

function handleVoiceCommand(command) {
  if (command.includes("boost")) {
    speakModeLine("boost");
    return;
  }

  if (command.includes("coolant") || command.includes("temp") || command.includes("temperature")) {
    speakModeLine("coolant");
    return;
  }

  if (command.includes("gps") || command.includes("speed")) {
    speakModeLine("gps");
    return;
  }

  if (command.includes("status") || command.includes("systems")) {
    speakStatus();
    return;
  }

  if (command.includes("music") || command.includes("youtube")) {
    openYouTubeMusic();
    return;
  }

  if (command.includes("race")) {
    setVoiceMode("race");
    return;
  }

  if (command.includes("sport")) {
    setVoiceMode("sport");
    return;
  }

  if (command.includes("mechanic")) {
    setVoiceMode("mechanic");
    return;
  }

  if (command.includes("sarcastic") || command.includes("funny")) {
    setVoiceMode("sarcastic");
    return;
  }

  if (command.includes("stealth")) {
    setThemeMode("stealth");
    return;
  }

  if (command.includes("red")) {
    setThemeMode("raceRed");
    return;
  }

  if (command.includes("amber") || command.includes("orange") || command.includes("gold")) {
    setThemeMode("dieselAmber");
    return;
  }

  if (command.includes("blue")) {
    setThemeMode("cyber");
    return;
  }

  if (command.includes("fullscreen") || command.includes("full screen")) {
    goFullscreen();
    return;
  }

  speak(`Command not recognized. I heard ${command}.`);
}

function startSystem() {
  document.getElementById("bootStatus").textContent = "SYSTEM ONLINE";
  document.getElementById("bootScreen").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  updateVoiceLabel();
  applyTheme();
  updateAlertLabel();

  setTimeout(() => {
    speakCurrentStartup();
  }, 500);
}

function showTab(tabName) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  const selected = document.getElementById(`${tabName}Tab`);

  if (selected) {
    selected.classList.add("active");
  }

  const titles = {
    dash: "BLACK DIESEL COMMAND",
    performance: "PERFORMANCE SYSTEMS",
    media: "MEDIA CENTER",
    settings: "SYSTEM SETTINGS"
  };

  const pageTitle = document.getElementById("pageTitle");
  if (pageTitle) {
    pageTitle.textContent = titles[tabName] || "BLACK DIESEL COMMAND";
  }
}

function openYouTubeMusic() {
  speak("Opening YouTube Music.");
  window.open("https://music.youtube.com", "_blank");
}

function goFullscreen() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  }
}

function updateTripTime() {
  const seconds = Math.floor((Date.now() - tripStart) / 1000);
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  setValue("tripTime", `${mins}:${secs}`);
}

function resetTrip() {
  tripStart = Date.now();
  speedSamples = [];
  topSpeed = 0;

  setValue("tripTime", "00:00");
  setValue("avgSpeed", "0 MPH");

  speak("Trip data reset.");
}

let wakeListening = false;
let wakeRecognition = null;

function startWakeWord() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    speak("Wake word is not supported in this browser.");
    return;
  }

  if (wakeListening) {
    speak("Hey Jett wake word is already active.");
    return;
  }

  wakeRecognition = new SpeechRecognition();
  wakeRecognition.lang = "en-US";
  wakeRecognition.continuous = true;
  wakeRecognition.interimResults = false;

  wakeRecognition.onresult = (event) => {
    const transcript =
      event.results[event.results.length - 1][0].transcript.toLowerCase();

    console.log("Wake heard:", transcript);

    if (
      transcript.includes("hey jett") ||
      transcript.includes("hey jet") ||
      transcript.includes("black diesel") ||
      transcript.includes("jett command") ||
      transcript.includes("jet command")
    ) {
      speak("Awaiting command.");

      setTimeout(() => {
        listenCommand();
      }, 1000);
    }
  };

  wakeRecognition.onerror = () => {
    wakeListening = false;

    setTimeout(() => {
      startWakeWord();
    }, 1500);
  };

  wakeRecognition.onend = () => {
    if (wakeListening) {
      setTimeout(() => {
        try {
          wakeRecognition.start();
        } catch (error) {}
      }, 1000);
    }
  };

  wakeListening = true;

  try {
    wakeRecognition.start();
    speak("Hey Jett wake word active.");
  } catch (error) {
    speak("Wake word could not start.");
  }
}

function stopWakeWord() {
  wakeListening = false;

  if (wakeRecognition) {
    wakeRecognition.stop();
  }

  speak("Hey Jett wake word disabled.");
}
setInterval(updateTripTime, 1000);

document.addEventListener("DOMContentLoaded", () => {
  updateVoiceLabel();
  applyTheme();
  updateAlertLabel();
  updateTripTime();
});