console.log("EDITOR LOADED");

const fileInput = document.getElementById("fileInput");
const playerBox = document.getElementById("player");
const timeline = document.getElementById("timeline");
const ruler = document.getElementById("timelineRuler");
const playhead = document.getElementById("playhead");

const startHandle = document.querySelector(".handle.start");
const endHandle   = document.querySelector(".handle.end");
const cutRegion   = document.querySelector(".cut-region");
const applyCutBtn = document.getElementById("applyCutBtn");

let castData = null;
let duration = 0;
let player = null;
let dragging = null;
let scrubbing = false;

/* ================= LOAD CAST ================= */

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const lines = reader.result.split("\n").filter(Boolean);
    const header = JSON.parse(lines[0]);
    const stdout = lines.slice(1).map(l => JSON.parse(l));

    castData = { ...header, stdout };
    duration = stdout.at(-1)[0];

    loadPlayer();
    setTimeout(() => {
      drawTimeline();
      resetTrimHandles();
    }, 100);
  };
  reader.readAsText(file);
});

/* ================= PLAYER ================= */

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

  player = AsciinemaPlayer.create(url, playerBox, {
    autoplay: false,
    controls: true
  });

  player.addEventListener("time", e => {
    if (!scrubbing) updatePlayhead(e.detail.time);
  });
}

function updatePlayhead(time) {
  playhead.style.left =
    (time / duration) * timeline.clientWidth + "px";
}

/* ================= TIMELINE ================= */

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function drawTimeline() {
  ruler.innerHTML = "";
  const w = timeline.clientWidth;
  if (!w || !duration) return;

  const pxPerSec = w / duration;
  let step = Math.ceil(80 / pxPerSec);
  step = Math.max(1, Math.min(step, 60));

  for (let t = 0; t <= duration; t += step) {
    const tick = document.createElement("div");
    tick.className = "timeline-tick";
    tick.style.left = (t / duration) * w + "px";
    tick.textContent = formatTime(t);
    ruler.appendChild(tick);
  }
}

/* ================= TRIM ================= */

function resetTrimHandles() {
  const w = timeline.clientWidth;
  startHandle.style.left = "0px";
  endHandle.style.left = (w - 8) + "px";
  updateCutRegion();
}

function updateCutRegion() {
  const s = startHandle.offsetLeft;
  const e = endHandle.offsetLeft;
  cutRegion.style.left = s + "px";
  cutRegion.style.width = (e - s) + "px";
}

[startHandle, endHandle].forEach(h => {
  h.addEventListener("mousedown", e => {
    dragging = h;
    e.stopPropagation();
  });
});

document.addEventListener("mouseup", () => dragging = null);

document.addEventListener("mousemove", e => {
  if (!dragging) return;

  const rect = timeline.getBoundingClientRect();
  let x = e.clientX - rect.left;
  x = Math.max(0, Math.min(rect.width, x));
  dragging.style.left = x + "px";

  if (startHandle.offsetLeft > endHandle.offsetLeft) {
    if (dragging === startHandle)
      endHandle.style.left = startHandle.style.left;
    else
      startHandle.style.left = endHandle.style.left;
  }

  updateCutRegion();
});

/* ================= APPLY CUT ================= */

applyCutBtn.onclick = () => {
  const w = timeline.clientWidth;
  const startTime = (startHandle.offsetLeft / w) * duration;
  const endTime   = (endHandle.offsetLeft / w) * duration;

  castData.stdout = castData.stdout
    .filter(e => e[0] < startTime || e[0] > endTime)
    .map(e => e[0] > endTime
      ? [e[0] - (endTime - startTime), e[1], e[2]]
      : e);

  duration = castData.stdout.at(-1)[0];

  loadPlayer();
  drawTimeline();
  resetTrimHandles();
};

/* ================= PLAYHEAD ================= */

playhead.addEventListener("mousedown", e => {
  scrubbing = true;
  e.stopPropagation();
});

document.addEventListener("mouseup", () => scrubbing = false);

document.addEventListener("mousemove", e => {
  if (!scrubbing || !player) return;

  const rect = timeline.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
  playhead.style.left = x + "px";
  player.seek((x / rect.width) * duration);
});

timeline.addEventListener("click", e => {
  if (!player) return;

  const rect = timeline.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const time = (x / rect.width) * duration;

  updatePlayhead(time);
  player.seek(time);
});
