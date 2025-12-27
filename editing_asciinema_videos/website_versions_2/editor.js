console.log("EDITOR LOADED");

const fileInput = document.getElementById("fileInput");
const playerBox = document.getElementById("player");
const timeline = document.getElementById("timeline");
const ruler = document.getElementById("timelineRuler");
const playhead = document.getElementById("playhead");

const startHandle = document.querySelector(".handle.start");
const endHandle   = document.querySelector(".handle.end");
const addCutBtn   = document.getElementById("addCutBtn");
const applyCutBtn = document.getElementById("applyCutBtn");

let castData = null;
let duration = 0;
let player = null;

let draggingHandle = null;
let scrubbing = false;

let cuts = []; // {start, end}

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
      resetHandles();
      drawCuts();
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

/* ================= HANDLES ================= */

function resetHandles() {
  const w = timeline.clientWidth;
  startHandle.style.left = "0px";
  endHandle.style.left = (w - 8) + "px";
}

[startHandle, endHandle].forEach(h => {
  h.addEventListener("mousedown", e => {
    draggingHandle = h;
    e.stopPropagation();
  });
});

document.addEventListener("mouseup", () => draggingHandle = null);

document.addEventListener("mousemove", e => {
  if (!draggingHandle) return;

  const rect = timeline.getBoundingClientRect();
  let x = e.clientX - rect.left;
  x = Math.max(0, Math.min(rect.width, x));

  draggingHandle.style.left = x + "px";

  if (startHandle.offsetLeft > endHandle.offsetLeft) {
    if (draggingHandle === startHandle)
      endHandle.style.left = startHandle.style.left;
    else
      startHandle.style.left = endHandle.style.left;
  }
});

/* ================= CUTS ================= */

addCutBtn.onclick = () => {
  const w = timeline.clientWidth;
  const start = (startHandle.offsetLeft / w) * duration;
  const end   = (endHandle.offsetLeft / w) * duration;

  if (end - start < 0.2) return;

  cuts.push({ start, end });
  drawCuts();
};

function drawCuts() {
  document.querySelectorAll(".cut-block").forEach(e => e.remove());

  const w = timeline.clientWidth;
  cuts.forEach(cut => {
    const div = document.createElement("div");
    div.className = "cut-block";
    div.style.left = (cut.start / duration) * w + "px";
    div.style.width =
      ((cut.end - cut.start) / duration) * w + "px";
    timeline.appendChild(div);
  });
}

applyCutBtn.onclick = () => {
  if (cuts.length === 0) return;

  cuts.sort((a, b) => a.start - b.start);

  let newStdout = [];
  let removedTime = 0;
  let cutIndex = 0;

  for (const e of castData.stdout) {
    let t = e[0];

    while (
      cutIndex < cuts.length &&
      t > cuts[cutIndex].end
    ) {
      removedTime += cuts[cutIndex].end - cuts[cutIndex].start;
      cutIndex++;
    }

    if (
      cutIndex < cuts.length &&
      t >= cuts[cutIndex].start &&
      t <= cuts[cutIndex].end
    ) {
      continue;
    }

    newStdout.push([
      t - removedTime,
      e[1],
      e[2]
    ]);
  }

  castData.stdout = newStdout;
  duration = newStdout.at(-1)[0];
  cuts = [];

  loadPlayer();
  drawTimeline();
  resetHandles();
  drawCuts();
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
