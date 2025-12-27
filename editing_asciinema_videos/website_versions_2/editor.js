console.log("EDITOR JS LOADED");

const fileInput = document.getElementById("fileInput");
const playerBox = document.getElementById("player");
const timeline = document.getElementById("timeline");
const ruler = document.getElementById("timelineRuler");
const playhead = document.getElementById("playhead");

let castData = null;
let duration = 0;
let playerInstance = null;
let isScrubbing = false;

/* LOAD CAST */

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const header = JSON.parse(lines[0]);
    const stdout = lines.slice(1).map(l => JSON.parse(l));

    castData = { ...header, stdout };
    duration = stdout.at(-1)[0];

    loadPlayer();
    
    requestAnimationFrame(() => {
      setTimeout(drawTimeline, 50);
    });
    
    timelineObserver.observe(timeline);
   }
  reader.readAsText(file);
});

/* PLAYER */

function loadPlayer() {
  playerBox.innerHTML = "";

  let text = JSON.stringify({
    version: castData.version,
    width: castData.width,
    height: castData.height,
    idle_time_limit: null
  }) + "\n";

  castData.stdout.forEach(e => text += JSON.stringify(e) + "\n");

  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  playerInstance = AsciinemaPlayer.create(url, playerBox, {
    autoplay: false,
    controls: true
  });

  playerInstance.addEventListener("time", e => {
    if (!isScrubbing) updatePlayhead(e.detail.time);
  });
}

function updatePlayhead(time) {
  playhead.style.left =
    `${(time / duration) * timeline.clientWidth}px`;
}

/* TIMELINE */

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function drawTimeline() {
  ruler.innerHTML = "";

  const width = timeline.offsetWidth;
  if (!width || !duration) return;

  const pxPerSec = width / duration;
  let step = Math.max(1, Math.round(80 / pxPerSec));

  for (let t = 0; t <= duration; t += step) {
    const tick = document.createElement("div");
    tick.className = "timeline-tick";
    tick.style.left = `${(t / duration) * width}px`;
    tick.textContent = formatTime(t);
    ruler.appendChild(tick);
  }

  console.log("Timeline labels drawn ✔");
}

/* PLAYHEAD SCRUB */

playhead.addEventListener("mousedown", e => {
  isScrubbing = true;
  e.preventDefault();
});

document.addEventListener("mouseup", () => isScrubbing = false);

document.addEventListener("mousemove", e => {
  if (!isScrubbing || !playerInstance) return;

  const rect = timeline.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  playhead.style.left = `${x}px`;
  playerInstance.seek((x / rect.width) * duration);
});

timeline.addEventListener("click", e => {
  if (!playerInstance || isScrubbing) return;

  const rect = timeline.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const time = (x / rect.width) * duration;

  updatePlayhead(time);
  playerInstance.seek(time);
});
