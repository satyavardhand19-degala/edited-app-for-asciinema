console.log("EDITOR JS LOADED");

const fileInput = document.getElementById("fileInput");
const playerBox = document.getElementById("player");
const timeline = document.getElementById("timeline");
const ruler = document.getElementById("timelineRuler");
const playhead = document.getElementById("playhead");

let castData = null;
let duration = 0;
let draggingPlayhead = false;

/* ---------- LOAD CAST ---------- */

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const lines = reader.result
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

      const header = JSON.parse(lines[0]);
      const stdout = lines.slice(1).map(l => JSON.parse(l));

      castData = {
        version: header.version || 2,
        width: header.width || 80,
        height: header.height || 24,
        idle_time_limit: null,
        stdout
      };

      duration = stdout.at(-1)[0];

      loadPlayer();
      requestAnimationFrame(drawTimeline);

    } catch (e) {
      alert("Invalid .cast file");
      console.error(e);
    }
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

  for (const e of castData.stdout) {
    text += JSON.stringify(e) + "\n";
  }

  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  AsciinemaPlayer.create(url, playerBox, {
    autoplay: false,
    controls: true
  });

  playerBox.addEventListener("asciinema:time", e => {
    updatePlayhead(e.detail.time);
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
  if (!duration) return;

  const width = timeline.clientWidth;
  if (!width) return;

  const pixelsPerSecond = width / duration;
  let step = Math.ceil(80 / pixelsPerSecond);
  if (step < 1) step = 1;
  if (step > 60) step = 60;

  for (let t = 0; t <= duration; t += step) {
    const x = (t / duration) * width;
    const tick = document.createElement("div");
    tick.className = "timeline-tick";
    tick.style.left = `${x}px`;
    tick.textContent = formatTime(t);
    ruler.appendChild(tick);
  }
}

function updatePlayhead(time) {
  if (!duration) return;
  const x = (time / duration) * timeline.clientWidth;
  playhead.style.left = `${x}px`;
}

/* ---------- DRAG PLAYHEAD ---------- */

playhead.addEventListener("mousedown", e => {
  draggingPlayhead = true;
  e.stopPropagation();
});

document.addEventListener("mouseup", () => {
  draggingPlayhead = false;
});

document.addEventListener("mousemove", e => {
  if (!draggingPlayhead || !duration) return;

  const rect = timeline.getBoundingClientRect();
  let x = e.clientX - rect.left;
  x = Math.max(0, Math.min(rect.width, x));

  playhead.style.left = `${x}px`;

  const time = (x / rect.width) * duration;
  const player = playerBox.querySelector("asciinema-player");
  if (player?.seek) player.seek(time);
});
