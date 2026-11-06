// Mission counter initialization remains here because the legacy HTML expects
// this immediate classic-script side effect before the deferred module bootstrap.
document.getElementById("missionCounter").textContent = Number(localStorage.getItem("completedMissions")) || 0;

// Navigation, timer, dialog, mission, points, and scheduler compatibility
// globals are now registered by JS/features/legacy-compatibility.js.
