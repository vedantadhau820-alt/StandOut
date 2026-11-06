/**
 * Music player feature.
 * Owns preset playback, local folder playlists, and preset audio caching.
 * Existing global names remain available for inline HTML and legacy features.
 */

let playlist = [];
let currentTrackIndex = 0;
let musicMode = "preset"; // "preset" | "playlist" | "none"
const music = new Audio();

const MUSIC_CACHE_NAME = "mission-app-music-v1";
const MUSIC_FILES = [
    "Music/m1.mp3",
    "Music/m2.mp3",
    "Music/m3.mp3",
    "Music/m4.mp3",
    "Music/m5.mp3",
    "Music/m6.mp3"
];

async function cacheAllMusic() {
    try {
        const cache = await caches.open(MUSIC_CACHE_NAME);
        for (const file of MUSIC_FILES) {
            try {
                if (await cache.match(file)) continue;
                await cache.add(file);
                console.log("Music cached:", file);
            } catch (error) {
                console.warn("Could not cache music:", file, error);
            }
        }
        console.log("Preset music cache ready.");
    } catch (error) {
        console.warn("Music cache unavailable:", error);
    }
}

async function getCachedMusicURL(file) {
    try {
        const cache = await caches.open(MUSIC_CACHE_NAME);
        let response = await cache.match(file);
        if (!response) {
            console.log("Music not cached yet. Downloading:", file);
            response = await fetch(file);
            if (!response.ok) throw new Error(`Failed to load music: ${response.status}`);
            await cache.put(file, response.clone());
        }
        return URL.createObjectURL(await response.blob());
    } catch (error) {
        console.warn("Cached music failed, using normal URL:", error);
        return file;
    }
}

function stopAllMusic() {
    music.pause();
    music.onended = null;
    music.onerror = null;
    music.removeAttribute("src");
    music.load();
}

function openFolderPicker() {
    const picker = document.getElementById("folderPicker");
    if (picker) picker.click();
    else console.error("folderPicker not found");
}

function handleFolderSelection(event) {
    stopAllMusic();
    const files = Array.from(event.target.files || [])
        .filter(file => file.type.startsWith("audio/"));

    if (files.length === 0) {
        window.customAlert?.("No audio files found in this folder.");
        return;
    }

    playlist = files;
    musicMode = "playlist";
    currentTrackIndex = 0;
    window.customConfirm?.(`Play ${playlist.length} songs from this folder?`, () => {
        playCurrentTrack();
        closeMusicModal();
    });
    event.target.value = "";
}

function resumeMusicOnUserGesture() {
    const resume = () => {
        music.play().catch(() => {});
        document.removeEventListener("click", resume);
        document.removeEventListener("touchstart", resume);
    };
    document.addEventListener("click", resume);
    document.addEventListener("touchstart", resume);
}

function playCurrentTrack() {
    window.stopAllAppAudio?.();
    if (musicMode !== "playlist" || !playlist[currentTrackIndex]) return;

    const file = playlist[currentTrackIndex];
    music.src = URL.createObjectURL(file);
    music.loop = false;
    music.volume = document.getElementById("musicVolume")?.value ?? 1;
    music.play().catch(() => resumeMusicOnUserGesture());

    music.onended = () => {
        if (musicMode !== "playlist") return;
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        playCurrentTrack();
    };
}

async function setSelectedMusic() {
    const select = document.getElementById("musicSelect");
    const file = select?.value || "";
    window.stopAllAppAudio?.();

    if (!file) {
        musicMode = "none";
        playlist = [];
        currentTrackIndex = 0;
        closeMusicModal();
        return;
    }

    musicMode = "preset";
    playlist = [];
    currentTrackIndex = 0;
    music.src = await getCachedMusicURL(file);
    music.loop = true;
    music.volume = document.getElementById("musicVolume")?.value ?? 1;
    music.load();

    try {
        await music.play();
    } catch (error) {
        console.warn("Music playback waiting for user gesture:", error);
    }
    closeMusicModal();
}

function showPresetUI() {
    const controls = document.getElementById("presetControls");
    if (controls) controls.style.display = "block";
}

function hidePresetUI() {
    const controls = document.getElementById("presetControls");
    if (controls) controls.style.display = "none";
}

function openMusicModal() {
    document.getElementById("musicModal")?.classList.add("active");
    if (musicMode === "preset") showPresetUI();
}

function closeMusicModal() {
    document.getElementById("musicModal")?.classList.remove("active");
}

function initialize() {
    document.getElementById("folderPicker")?.addEventListener("change", handleFolderSelection);
    document.getElementById("timerMusicBtn")?.addEventListener("click", openMusicModal);
}

const musicFeature = Object.freeze({
    initialize,
    get playlist() { return playlist; },
    get currentTrackIndex() { return currentTrackIndex; },
    get mode() { return musicMode; },
    get audio() { return music; },
    cacheAllMusic,
    getCachedMusicURL,
    stopAllMusic,
    openFolderPicker,
    resumeMusicOnUserGesture,
    playCurrentTrack,
    setSelectedMusic,
    showPresetUI,
    hidePresetUI,
    openMusicModal,
    closeMusicModal
});

// Classic scripts already expose compatibility wrappers for the legacy
// global function names. Do not redefine those properties here: a classic
// global function can be non-configurable, and redefining it would abort the
// entire bootstrap module graph. The focus timer only needs the shared audio
// element, so expose that one reference without replacing any existing API.
if (!Object.prototype.hasOwnProperty.call(window, "music")) {
    window.music = music;
}

export { musicFeature as music };
