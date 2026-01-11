/* =========================================================
   FULLSCREEN TIMER MODULE
========================================================= */

/* -------------------------
   STATE
------------------------- */
let fullscreenTimerInterval = null;
let playlist = [];
let currentTrackIndex = 0;
let music = new Audio();
let musicMode = "preset"; // "preset" | "playlist"


/* -------------------------
   DOM SAFE BINDINGS
------------------------- */
window.addEventListener("load", () => {
  const timerIcon = document.getElementById("timerIcon");
  const timerCloseBtn = document.getElementById("timerCloseBtn");
  const musicBtn = document.getElementById("timerMusicBtn");
  const settingsBtn = document.getElementById("timerSettingsBtn");
  const folderPicker = document.getElementById("folderPicker");

  if (timerIcon) {
    timerIcon.onclick = openFullscreenTimer;
  }

  if (timerCloseBtn) {
    timerCloseBtn.onclick = closeFullscreenTimer;
  }

  if (musicBtn) {
    musicBtn.onclick = openMusicModal;
  }

  if (settingsBtn) {
    settingsBtn.onclick = openTimerSettings;
  }

  if (folderPicker) {
    folderPicker.addEventListener("change", handleFolderPick);
  }
});


/* -------------------------
   FULLSCREEN OPEN / CLOSE
------------------------- */
function openFullscreenTimer() {
  document.getElementById("timerScreen").style.display = "block";
  document.querySelector(".top-navbar").style.display = "none";
  document.querySelector(".bottom-nav").style.display = "none";
}

function closeFullscreenTimer() {
  document.getElementById("timerScreen").style.display = "none";
  document.querySelector(".top-navbar").style.display = "flex";
  document.querySelector(".bottom-nav").style.display = "flex";

  clearInterval(fullscreenTimerInterval);
  stopAllMusic();
}


/* -------------------------
   MUSIC CORE
------------------------- */
function stopAllMusic() {
  music.pause();
  music.currentTime = 0;
  music.onended = null;
}


/* -------------------------
   MUSIC MODAL
------------------------- */
function openMusicModal() {
  document.getElementById("musicModal").classList.add("active");

  if (musicMode === "preset") {
    showPresetUI();
  } else {
    hidePresetUI();
  }
}

window.closeMusicModal = function () {
  document.getElementById("musicModal").classList.remove("active");
};


/* -------------------------
   PRESET MUSIC
------------------------- */
window.setSelectedMusic = function () {
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
};


/* -------------------------
   PLAYLIST MUSIC
------------------------- */
window.openFolderPicker = function () {
  document.getElementById("folderPicker")?.click();
};

function handleFolderPick(e) {
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
  hidePresetUI();

  customConfirm(
    `Play ${playlist.length} songs from this folder?`,
    () => {
      playCurrentTrack();
      closeMusicModal();
    }
  );

  e.target.value = "";
}

function playCurrentTrack() {
  if (musicMode !== "playlist") return;
  if (!playlist[currentTrackIndex]) return;

  const file = playlist[currentTrackIndex];
  music.src = URL.createObjectURL(file);
  music.loop = false;
  music.volume = document.getElementById("musicVolume").value;

  music.play().catch(resumeMusicOnUserGesture);

  music.onended = () => {
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
  const el = document.getElementById("presetControls");
  if (el) el.style.display = "block";
}

function hidePresetUI() {
  const el = document.getElementById("presetControls");
  if (el) el.style.display = "none";
}


/* -------------------------
   TIMER SETTINGS
------------------------- */
function openTimerSettings() {
  document
    .getElementById("timerSettingModal")
    .classList.add("active");
}

window.closeTimerSettingModal = function () {
  document
    .getElementById("timerSettingModal")
    .classList.remove("active");
};

window.applyTimerSettings = function () {
  const h = parseInt(document.getElementById("setH").value) || 0;
  const m = parseInt(document.getElementById("setM").value) || 0;
  const s = parseInt(document.getElementById("setS").value) || 0;

  startStaticTimer(h, m, s);
  closeTimerSettingModal();
};


/* -------------------------
   TIMER CORE
------------------------- */
function startStaticTimer(h, m, s) {
  clearInterval(fullscreenTimerInterval);

  let total = h * 3600 + m * 60 + s;

  updateTimerUI(h, m, s);

  fullscreenTimerInterval = setInterval(() => {
    if (total <= 0) {
      clearInterval(fullscreenTimerInterval);
      stopAllMusic();
      return;
    }

    total--;

    updateTimerUI(
      Math.floor(total / 3600),
      Math.floor((total % 3600) / 60),
      total % 60
    );
  }, 1000);
}

function updateTimerUI(h, m, s) {
  document.getElementById("h").textContent =
    h.toString().padStart(2, "0");
  document.getElementById("m").textContent =
    m.toString().padStart(2, "0");
  document.getElementById("s").textContent =
    s.toString().padStart(2, "0");
}
