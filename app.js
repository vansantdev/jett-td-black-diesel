let gpsWatchId = null;
let voiceEnabled = true;
let themeIndex = 0;
let currentSpeed = 0;
let topSpeed = 0;
let speedSamples = [];
let tripStart = Date.now();

const themes = ["color", "gold", "stealth"];

const pageTitles = {
  dashboard: "BLACK DIESEL COMMAND",
  performance: "PERFORMANCE SYSTEMS",
  media: "MEDIA CENTER",
  maps: "GPS / MAP SYSTEM",
  diagnostics: "DIAGNOSTIC CORE",
  settings: "SYSTEM SETTINGS"
};

function talk(text) {
  if (!voiceEnabled) return;

  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 0.9;
  msg.pitch = 0.8;
  msg.volume = 1;
  speechSynthesis.speak(msg);
}

function startSystem() {
  document.getElementById("status").textContent = "BLACK DIESEL SYSTEMS ONLINE";
  talk("Good evening Danker. Black Diesel systems online.");

  setTimeout(() => {
    document.getElementById("startup").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
  }, 1600);
}

function backToStartup() {
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("startup").classList.remove("hidden");
}

function switchTab(tabName) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active-page"));
  document.getElementById(`${tabName}Page`).classList.add("active-page");

  document.getElementById("pageTitle").textContent = pageTitles[tabName];

  const buttons = document.querySelectorAll(".bottom-nav button");
  buttons.forEach(button => button.classList.remove("active"));

  const tabIndex = Object.keys(pageTitles).indexOf(tabName);
  buttons[tabIndex].classList.add("active");

  document.getElementById("dashStatus").textContent = tabName.toUpperCase();
}

function updateClock() {
  const now = new Date();

  document.getElementById("clock").textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });

  document.getElementById("dateText").textContent = now.toLocaleDateString([], {
    weekday: "long"
  });

  updateTripTime();
}

setInterval(updateClock, 1000);
updateClock();

function updateTripTime() {
  const seconds = Math.floor((Date.now() - tripStart) / 1000);
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  document.getElementById("tripTime").textContent = `${mins}:${secs}`;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  el.textContent = value;
  el.classList.add("value-pop");

  setTimeout(() => el.classList.remove("value-pop"), 220);
}

function updateSpeedStats(speed) {
  currentSpeed = speed;
  topSpeed = Math.max(topSpeed, speed);
  speedSamples.push(speed);

  if (speedSamples.length > 300) speedSamples.shift();

  const avg = Math.round(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length);

  setValue("topSpeed", `${topSpeed} MPH`);
  setValue("avgSpeed", `${avg} MPH`);
}

function demoGauges() {
  const speed = Math.floor(Math.random() * 85);
  const rpm = Math.floor(850 + Math.random() * 3200);
  const boost = (Math.random() * 19).toFixed(1);
  const coolant = Math.floor(170 + Math.random() * 28);

  setValue("speed", speed);
  setValue("rpm", rpm);
  setValue("boost", boost);
  setValue("coolant", coolant);
  setValue("peakBoost", `${boost} PSI`);
  setValue("rpmSweep", `${rpm} RPM`);
  setValue("batteryVoltage", `${(13.4 + Math.random()).toFixed(1)} V`);

  updateSpeedStats(speed);

  if (boost > 15) talk("Turbo pressure elevated.");
}

function speakStatus() {
  const speed = document.getElementById("speed").textContent;
  const rpm = document.getElementById("rpm").textContent;
  const boost = document.getElementById("boost").textContent;
  const coolant = document.getElementById("coolant").textContent;

  talk(`Current speed ${speed} miles per hour. Engine speed ${rpm} RPM. Boost pressure ${boost} PSI. Coolant temperature ${coolant} degrees.`);
}

function startGpsSpeed() {
  if (!navigator.geolocation) {
    talk("GPS is not available on this device.");
    return;
  }

  talk("GPS speed mode activated.");

  if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);

  gpsWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const metersPerSecond = position.coords.speed;
      const lat = position.coords.latitude.toFixed(5);
      const lon = position.coords.longitude.toFixed(5);

      document.getElementById("gpsStatus").textContent = "GPS ACTIVE";
      document.getElementById("gpsCoords").textContent = `LAT ${lat} // LON ${lon}`;
      document.getElementById("speedSource").textContent = "GPS";
      document.getElementById("dashStatus").textContent = "GPS ACTIVE";

      document.getElementById("mapFrame").src = `https://www.google.com/maps?q=${lat},${lon}&output=embed`;

      if (metersPerSecond !== null) {
        const mph = Math.round(metersPerSecond * 2.23694);
        setValue("speed", mph);
        updateSpeedStats(mph);

        if (mph > 80) talk("Speed warning. You are over eighty miles per hour.");
      }
    },
    () => {
      document.getElementById("dashStatus").textContent = "GPS UNAVAILABLE";
      document.getElementById("gpsStatus").textContent = "GPS UNAVAILABLE";
      document.getElementById("gpsCoords").textContent = "Permission denied or GPS unavailable.";
      talk("GPS permission denied or unavailable.");
    },
    {
      enableHighAccuracy: true,
      maximumAge: 500,
      timeout: 10000
    }
  );
}

function openGoogleMaps() {
  window.open("https://www.google.com/maps", "_blank");
}

function fakeMusic() {
  const tracks = [
    "Black Diesel Drive Mode",
    "Night Run Protocol",
    "Turbo Spool Playlist",
    "BRM Systems Audio",
    "JETT TD Cruise Mode"
  ];

  const pick = tracks[Math.floor(Math.random() * tracks.length)];
  document.getElementById("mediaMain").textContent = pick;
  talk(`${pick} activated.`);
}

function loadAudio(event) {
  const file = event.target.files[0];
  if (!file) return;

  const audio = document.getElementById("audioPlayer");
  audio.src = URL.createObjectURL(file);
  document.getElementById("mediaMain").textContent = file.name;
  talk("Audio file loaded.");
}

function playAudio() {
  document.getElementById("audioPlayer").play();
}

function pauseAudio() {
  document.getElementById("audioPlayer").pause();
}

function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  document.getElementById("voiceStatus").textContent = voiceEnabled ? "ENABLED" : "DISABLED";
  if (voiceEnabled) talk("Voice system enabled.");
}

function cycleTheme() {
  themeIndex = (themeIndex + 1) % themes.length;
  document.body.className = themes[themeIndex] === "color" ? "" : themes[themeIndex];

  const label = themes[themeIndex] === "color"
    ? "COLOR SHIFT"
    : themes[themeIndex].toUpperCase();

  document.getElementById("themeStatus").textContent = label;
  talk(`${label} theme activated.`);
}

function goFullscreen() {
  document.documentElement.requestFullscreen();
}

function resetTrip() {
  tripStart = Date.now();
  topSpeed = 0;
  speedSamples = [];

  setValue("topSpeed", "0 MPH");
  setValue("avgSpeed", "0 MPH");
  setValue("tripTime", "00:00");

  talk("Trip data reset.");
}