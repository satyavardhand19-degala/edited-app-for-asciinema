console.log("EDITOR JS LOADED");

const fileInput = document.getElementById("fileInput");
const playerBox = document.getElementById("player");
const timeline = document.getElementById("timeline");
const ruler = document.getElementById("timelineRuler");
const playhead = document.getElementById("playhead");

let castData = null;
let duration = 0;
let dragging = false;

/* ---------- LOAD CAST ---------- */

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
    requestAnimationFrame(drawTimeline);
  };

  reader.readAsText(file);
});

/* ---------- PLAYER ---------- */

function loadPlayer() {
  playerBox.innerHTML = "";

  let text = JSON.stringify({
    version: castData.version,
    width: castData.width,
    height: castData.height,
    idle_time_limit: null
  }) + "\n";

  castData.stdout.forEach(e => {
    text += JSON.stringify(e) + "\n";
  });

  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  AsciinemaPlayer.create(url, playerBox, {
    autoplay: false,
    controls: true
  });
}

/* ---------- TIMELINE ---------- */

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function drawTimeline() {
  ruler.innerHTML = "";
  const width = timeline.clientWidth;
  if (!width || !duration) return;

  const pxPerSec = width / duration;
  let step = Math.max(1, Math.round(80 / pxPerSec));

  for (let t = 0; t <= duration; t += step) {
    const x = (t / duration) * width;
    const tick = document.createElement("div");
    tick.className = "timeline-tick";
    tick.style.left = `${x}px`;
    tick.textContent = formatTime(t);
    ruler.appendChild(tick);
  }
}

/* ---------- PLAYHEAD ---------- */

playhead.addEventListener("mousedown", e => {
  dragging = true;
  e.preventDefault();
});

document.addEventListener("mouseup", () => dragging = false);

document.addEventListener("mousemove", e => {
  if (!dragging || !duration) return;

  const rect = timeline.getBoundingClientRect();
  let x = e.clientX - rect.left;
  x = Math.max(0, Math.min(rect.width, x));

  playhead.style.left = `${x}px`;
});
