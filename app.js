const voiceModes = {
  male: {
    label: "Male",
    rate: 0.9,
    pitch: 0.85,
    startup: "Good evening Danker. Jett T D black diesel systems online.",
    boost: "Boost pressure standing by.",
    coolant: "Coolant temperature is currently normal.",
    gps: "GPS speed system standing by."
  },

  female: {
    label: "Female",
    rate: 1,
    pitch: 1.15,
    startup: "Good evening Danker. Jett T D black diesel is online and ready.",
    boost: "Boost pressure is ready.",
    coolant: "Coolant temperature looks good.",
    gps: "GPS speed tracking is ready."
  },

  robot: {
    label: "Robot",
    rate: 0.72,
    pitch: 0.55,
    startup: "System online. Diesel command interface active.",
    boost: "Turbo pressure monitor active.",
    coolant: "Thermal system within range.",
    gps: "Satellite speed tracking standing by."
  },

  deepCommand: {
    label: "Deep Command",
    rate: 0.82,
    pitch: 0.65,
    startup: "Danker. Black diesel command system online. Awaiting orders.",
    boost: "Boost pressure standing by. Turbo system ready.",
    coolant: "Coolant system stable.",
    gps: "GPS speed system armed."
  },

  sarcastic: {
    label: "Funny / Sarcastic",
    rate: 1,
    pitch: 0.95,
    startup: "Well well well. The diesel lives again. Welcome back, Danker.",
    boost: "Boost is standing by. Try not to pretend this is a race car.",
    coolant: "Coolant looks fine. For once, nothing is angry.",
    gps: "GPS is ready. Because apparently the speedometer called off today."
  },

  mechanic: {
    label: "Mechanic Mode",
    rate: 0.95,
    pitch: 0.8,
    startup: "Engine systems online. Watching boost, coolant, voltage, and driver behavior.",
    boost: "Checking turbo pressure. Keep an eye on spool and requested boost.",
    coolant: "Coolant temperature is in operating range.",
    gps: "GPS speed active. Useful until that wheel speed issue is fixed."
  },

  butler: {
    label: "Butler Mode",
    rate: 0.85,
    pitch: 0.9,
    startup: "Good evening, sir. Your black diesel is ready.",
    boost: "Turbo pressure is prepared, sir.",
    coolant: "Coolant temperature appears acceptable, sir.",
    gps: "Navigation and speed tracking are ready, sir."
  },

  drill: {
    label: "Diesel Drill Sergeant",
    rate: 1.05,
    pitch: 0.7,
    startup: "Listen up, Danker. Diesel system online. Stay sharp.",
    boost: "Turbo ready. Do not abuse it.",
    coolant: "Coolant is stable. Keep moving.",
    gps: "GPS ready. Eyes forward."
  },

  race: {
    label: "Race Mode",
    rate: 1.1,
    pitch: 0.78,
    startup: "Race mode armed. Boost pressure standing by. Keep it controlled.",
    boost: "Boost system armed. Turbo pressure standing by.",
    coolant: "Coolant stable. Performance window acceptable.",
    gps: "GPS speed tracking active. Drive smart."
  },

  sport: {
    label: "Sport Mode",
    rate: 1,
    pitch: 0.75,
    startup: "Sport mode online. Throttle discipline recommended.",
    boost: "Boost ready. Smooth throttle recommended.",
    coolant: "Coolant temperature is stable.",
    gps: "GPS speed system online."
  }
};

let availableVoices = [];
let selectedSystemVoice = null;
let currentVoiceMode = localStorage.getItem("jettVoiceMode") || "deepCommand";

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

  const msg = new SpeechSynthesisUtterance(text);

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

function startSystem() {
  document.getElementById("bootScreen").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");

  updateVoiceLabel();

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
}

function openYouTubeMusic() {
  speak("Opening YouTube Music.");
  window.open("https://music.youtube.com", "_blank");
}

document.addEventListener("DOMContentLoaded", () => {
  updateVoiceLabel();
});