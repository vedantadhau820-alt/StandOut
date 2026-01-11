/* =========================================================
   NAVIGATION SYSTEM
========================================================= */

/* -------------------------
   PAGE SWITCHING
------------------------- */
window.showPage = function (pageId) {
  // Hide all sections
  document.querySelectorAll("section").forEach(sec =>
    sec.classList.remove("active")
  );

  // Show selected section
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");

  // Bottom nav active state
  document.querySelectorAll(".bottom-nav > button")
    .forEach(b => b.classList.remove("active"));

  const btn = document.getElementById("nav-" + pageId);
  if (btn) btn.classList.add("active");

  updatePlusBtn(pageId);

  // Marketplace state (GLOBAL from app.js)
  window.isMarketplaceOpen = (pageId === "marketplace-cards");

  // Lazy renders
  if (pageId === "account") {
    renderAchievements();
  }
};

/* -------------------------
   PLUS BUTTON HANDLER
------------------------- */
window.updatePlusBtn = function (pageId) {
  const btn = document.getElementById("globalAddBtn");
  if (!btn) return;

  if (pageId === "missions") {
    btn.setAttribute("onclick", "openModal('mission')");
    btn.style.display = "block";
  } 
  else if (pageId === "skillset") {
    btn.setAttribute("onclick", "openModal('skill')");
    btn.style.display = "block";
  } 
  else if (pageId === "goals") {
    btn.setAttribute("onclick", "openModal('goal')");
    btn.style.display = "block";
  } 
  else if (pageId === "time") {
    btn.setAttribute("onclick", "openModal('multi-time')");
    btn.style.display = "block";
  } 
  else {
    btn.style.display = "none";
  }
};

/* -------------------------
   MARKETPLACE ICON TOGGLE
------------------------- */
document.getElementById("marketplaceIcon")
  ?.addEventListener("click", () => {
    if (window.isMarketplaceOpen) {
      showPage("missions");
      window.isMarketplaceOpen = false;
    } else {
      showPage("marketplace-cards");
      window.isMarketplaceOpen = true;
    }
  });

/* -------------------------
   INITIAL PAGE RESOLUTION
------------------------- */
window.addEventListener("load", () => {
  const activePage = document.querySelector("section.active")
    ? document.querySelector("section.active").id
    : "missions";

  showPage(activePage);
});
