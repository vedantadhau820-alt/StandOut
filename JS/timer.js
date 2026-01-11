/* =========================================================
   FULLSCREEN TIMER MODULE
========================================================= */

/* -------------------------
   STATE
------------------------- */
let timerInterval = null;
let playlist = [];
let currentTrackIndex = 0;
let currentMusic = null;
let music = new Audio();
let musicMode = "preset"; // "preset" | "playlist"


/* -------------------------
   OPEN / CLOSE FULLSCREEN
------------------------- */
document.getElementById("timerIcon").onclick = () => {
  document.getElementById("timerScreen").style.display = "block";
  document.querySelector(".top-navbar").style.display = "none";
  document.querySelector(".bottom-nav").style.display = "none";
};

document.getElementById("timerCloseBtn").onclick = () => {
  document.getElementById("timerScreen").style.display = "none";
  document.querySelector(".top-navbar").style.display = "flex";
  document.querySelector(".bottom-nav").style.display = "flex";

  clearInterval(timerInterval);
  stopAllMusic();
};


/* -------------------------
   MUSIC CONTROLS
------------------------- */
function stopAllMusic() {
  if (!music) return;
  music.pause();
  music.currentTime = 0;
  music.onended = null;
}


/* -------------------------
   MUSIC MODAL
------------------------- */
document.getElementById("timerMusicBtn").onclick = () => {
  document.getElementById("musicModal").classList.add("active");
  if (musicMode === "preset") showPresetUI();
};

function closeMusicModal() {
  document.getElementById("musicModal").classList.remove("active");
}


/* -------------------------
   PRESET MUSIC
------------------------- */
function setSelectedMusic() {
  stopAllMusic();

  const file = document.getElementById("musicSelect").value;
  if (!file) return;

  musicMode = "preset";
  playlist = [];
  currentTrackIndex = 0;

  showPresetUI();

  music.src = file;
  music.loop = true;
  music.volume = document.getElementById("musicVolume").value;

  music.play().catch(() => {});
  closeMusicModal();
}


/* -------------------------
   PLAYLIST MUSIC
------------------------- */
function openFolderPicker() {
  const picker = document.getElementById("folderPicker");
  if (picker) picker.click();
}

document
  .getElementById("folderPicker")
  .addEventListener("change", e => {
    stopAllMusic();

    const files = Array.from(e.target.files)
      .filter(f => f.type.startsWith("audio/"));

    if (!files.length) {
      customAlert("No audio files found in this folder.");
      return;
    }

    playlist = files;
    musicMode = "playlist";
    currentTrackIndex = 0;

    customConfirm(
      `Play ${playlist.length} songs from this folder?`,
      () => {
        playCurrentTrack();
        closeMusicModal();
      }
    );

    e.target.value = "";
  });


function playCurrentTrack() {
  if (musicMode !== "playlist") return;
  if (!playlist[currentTrackIndex]) return;

  const file = playlist[currentTrackIndex];
  music.src = URL.createObjectURL(file);
  music.loop = false;
  music.volume = document.getElementById("musicVolume").value;

  music.play().catch(() => resumeMusicOnUserGesture());

  music.onended = () => {
    if (musicMode !== "playlist") return;
    currentTrackIndex =
      (currentTrackIndex + 1) % playlist.length;
    playCurrentTrack();
  };
}


/* -------------------------
   AUTOPLAY FIX
------------------------- */
function resumeMusicOnUserGesture() {
  const resume = () => {
    music.play().catch(() => {});
    document.removeEventListener("click", resume);
    document.removeEventListener("touchstart", resume);
  };

  document.addEventListener("click", resume);
  document.addEventListener("touchstart", resume);
}


/* -------------------------
   PRESET UI
------------------------- */
function showPresetUI() {
  document.getElementById("presetControls").style.display = "block";
}

function hidePresetUI() {
  document.getElementById("presetControls").style.display = "none";
}


/* -------------------------
   TIMER SETTINGS MODAL
------------------------- */
document.getElementById("timerSettingsBtn").onclick = () => {
  document.getElementById("timerSettingModal")
    .classList.add("active");
};

function closeTimerSettingModal() {
  document.getElementById("timerSettingModal")
    .classList.remove("active");
}

function applyTimerSettings() {
  const h = parseInt(
    document.getElementById("setH").value
  );
  const m = parseInt(
    document.getElementById("setM").value
  );
  const s = parseInt(
    document.getElementById("setS").value
  );

  startStaticTimer(h, m, s);
  closeTimerSettingModal();
}


/* -------------------------
   TIMER CORE
------------------------- */
function startStaticTimer(h, m, s) {
  clearInterval(timerInterval);

  let total = h * 3600 + m * 60 + s;

  document.getElementById("h").textContent =
    h.toString().padStart(2, "0");
  document.getElementById("m").textContent =
    m.toString().padStart(2, "0");
  document.getElementById("s").textContent =
    s.toString().padStart(2, "0");

  timerInterval = setInterval(() => {
    if (total <= 0) {
      clearInterval(timerInterval);
      stopAllMusic();
      return;
    }

    total--;

    const hh = Math.floor(total / 3600);
    const mm = Math.floor((total % 3600) / 60);
    const ss = total % 60;

    document.getElementById("h").textContent =
      hh.toString().padStart(2, "0");
    document.getElementById("m").textContent =
      mm.toString().padStart(2, "0");
    document.getElementById("s").textContent =
      ss.toString().padStart(2, "0");
  }, 1000);
}
