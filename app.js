const voiceModes = {
  male: {
    label: "Male",
    rate: 0.9,
    pitch: 0.85,
    startup: "Good evening Danker. Black diesel systems online."
  },

  female: {
    label: "Female",
    rate: 1,
    pitch: 1.15,
    startup: "Good evening Danker. Black diesel systems online."
  },

  robot: {
    label: "Robot",
    rate: 0.72,
    pitch: 0.55,
    startup: "System online. Diesel command interface active."
  },

  deepCommand: {
    label: "Deep Command",
    rate: 0.82,
    pitch: 0.65,
    startup: "Danker. Black diesel system online. Awaiting command."
  },

  sarcastic: {
    label: "Funny / Sarcastic",
    rate: 1,
    pitch: 0.95,
    startup: "Well well well. The diesel lives again. Welcome back, Danker."
  },

  mechanic: {
    label: "Mechanic Mode",
    rate: 0.95,
    pitch: 0.8,
    startup: "Engine systems online. Watching boost, coolant, voltage, and driver behavior."
  },

  butler: {
    label: "Butler Mode",
    rate: 0.85,
    pitch: 0.9,
    startup: "Good evening, sir. Your black diesel is ready."
  },

  drill: {
    label: "Diesel Drill Sergeant",
    rate: 1.05,
    pitch: 0.7,
    startup: "Listen up, Danker. Diesel system online. Stay sharp."
  },

  race: {
    label: "Race Mode",
    rate: 1.1,
    pitch: 0.78,
    startup: "Race mode armed. Boost pressure standing by. Keep it controlled."
  },

  sport: {
    label: "Sport Mode",
    rate: 1,
    pitch: 0.75,
    startup: "Sport mode online. Throttle discipline recommended."
  }
};

let availableVoices = [];
let selectedSystemVoice = null;
let currentVoiceMode = localStorage.getItem("jettVoiceMode") || "deepCommand";

function loadSystemVoices() {
  availableVoices = window.speechSynthesis.getVoices();

  const mode = voiceModes[currentVoiceMode];

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

  speak(`${mode.label} selected. JETT T D Black Diesel command system is online.`);
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