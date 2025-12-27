console.log("EDITOR JS LOADED");

const fileInput = document.getElementById("fileInput");
const playerBox = document.getElementById("player");
const timeline = document.getElementById("timeline");
const ruler = document.getElementById("timelineRuler");

let castData = null;
let duration = 0;

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

    } catch (err) {
      alert("Invalid .cast file");
      console.error(err);
    }
  };

  reader.readAsText(file);
});

function loadPlayer() {
  playerBox.innerHTML = "";

  const header = {
    version: castData.version,
    width: castData.width,
    height: castData.height,
    idle_time_limit: null
  };

  let text = JSON.stringify(header) + "\n";
  for (const e of castData.stdout) text += JSON.stringify(e) + "\n";

  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  AsciinemaPlayer.create(url, playerBox, {
    autoplay: false,
    controls: true
  });
}

/* -------- TIMELINE VISUAL ONLY -------- */

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function drawTimeline() {
  ruler.innerHTML = "";
  if (!duration) return;

  const width = timeline.clientWidth;
  if (width === 0) return;

  // spacing ~80px
  const pixelsPerSecond = width / duration;
  let step = Math.ceil(80 / pixelsPerSecond);

  if (step <= 1) step = 1;
  else if (step <= 2) step = 2;
  else if (step <= 5) step = 5;
  else if (step <= 10) step = 10;
  else if (step <= 30) step = 30;
  else step = 60;

  for (let t = 0; t <= duration; t += step) {
    const x = (t / duration) * width;

    const tick = document.createElement("div");
    tick.className = "timeline-tick";
    tick.style.left = `${x}px`;
    tick.textContent = formatTime(t);

    ruler.appendChild(tick);
  }
}
