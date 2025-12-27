console.log("EDITOR JS LOADED");

const fileInput = document.getElementById("fileInput");
const playerBox = document.getElementById("player");

let castData = null;

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

      // header
      const header = JSON.parse(lines[0]);

      // events
      const stdout = lines.slice(1).map(l => JSON.parse(l));

      castData = {
        version: header.version || 2,
        width: header.width || 80,
        height: header.height || 24,
        idle_time_limit: null,
        stdout
      };

      loadPlayer();

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
  for (const e of castData.stdout) {
    text += JSON.stringify(e) + "\n";
  }

  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  AsciinemaPlayer.create(url, playerBox, {
    autoplay: false,
    controls: true
  });
}
