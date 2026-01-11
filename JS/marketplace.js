/* =========================================================
   MARKETPLACE MODULE
========================================================= */

/* -------------------------
   OWNED CARDS STATE
------------------------- */
let ownedCards = JSON.parse(localStorage.getItem("ownedCards")) || {};


/* -------------------------
   DATE FORMATTER
------------------------- */
function formatDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


/* -------------------------
   EXPIRY CHECK
------------------------- */
function isExpired(card) {
  if (!card.limited || !card.expiresAt) return false;

  const now = window.__timeTravelNow || Date.now();
  return new Date(card.expiresAt).getTime() < now;
}


/* -------------------------
   GRADE SORTING
------------------------- */
const GRADE_ORDER = ["E", "D", "C", "B", "A", "X", "S", "SS"];

function gradeRank(grade) {
  return GRADE_ORDER.indexOf(grade) + 1;
}


/* -------------------------
   RENDER MARKETPLACE
------------------------- */
function renderMarketplace(filterGrade = "ALL") {
  const shop = document.getElementById("cardShop");
  if (!shop) return;

  shop.innerHTML = "";

  let cards = [...window.cardCatalog];

  // Filter
  if (filterGrade !== "ALL") {
    cards = cards.filter(c => c.grade === filterGrade);
  }

  // Single safe sort
  cards.sort((a, b) => {
    const aLimited = a.limited ? 1 : 0;
    const bLimited = b.limited ? 1 : 0;
    if (aLimited !== bLimited) return bLimited - aLimited;

    const aOwned = ownedCards[a.id] ? 1 : 0;
    const bOwned = ownedCards[b.id] ? 1 : 0;
    if (aOwned !== bOwned) return bOwned - aOwned;

    const aCanBuy = completedMissions >= a.cost ? 1 : 0;
    const bCanBuy = completedMissions >= b.cost ? 1 : 0;
    if (aCanBuy !== bCanBuy) return bCanBuy - aCanBuy;

    return gradeRank(b.grade) - gradeRank(a.grade);
  });

  cards.forEach(card => {
    const isOwned = !!ownedCards[card.id];
    const expired = isExpired(card);

    // Hide expired limited cards if not owned
    if (expired && !isOwned) return;

    const canBuy = completedMissions >= card.cost;

    const mintDate =
      isOwned && ownedCards[card.id]?.mintedAt
        ? formatDate(ownedCards[card.id].mintedAt)
        : "";

    const div = document.createElement("div");
    div.className = `
      flex-card
      grade-${card.grade.toLowerCase()}
      ${isOwned ? "owned" : "locked"}
      ${card.limited ? "limited" : ""}
    `;

    div.innerHTML = `
      <img src="${card.image}" alt="${card.title}">
      <span class="grade-badge">${card.grade}</span>

      ${card.limited ? `<span class="limited-badge">LIMITED</span>` : ""}

      ${expired && isOwned ? `<div class="expired-overlay">EXPIRED</div>` : ""}

      <div class="card-body">
        <h3>${card.title}</h3>
        <p class="card-quote">${card.quote}</p>

        ${
          isOwned
            ? `<button class="buy-btn" disabled>OWNED</button>`
            : expired
              ? `<button class="buy-btn" disabled>EXPIRED</button>`
              : `<button class="buy-btn" ${!canBuy ? "disabled" : ""}>
                    ${card.cost} pts
                 </button>`
        }

        ${
          isOwned && mintDate
            ? `<div class="mint-date">Minted on ${mintDate}</div>
               <div class="mint-date">Card Cost ${card.cost} pts</div>`
            : ""
        }
      </div>
    `;

    if (!isOwned && canBuy && !expired) {
      div.querySelector(".buy-btn").onclick = () => buyCard(card.id);
    }

    shop.appendChild(div);
  });
}


/* -------------------------
   BUY / MINT CARD
------------------------- */
function buyCard(cardId) {
  const card = window.cardCatalog.find(c => c.id === cardId);
  if (!card) return;

  if (card.limited && isExpired(card)) {
    customAlert("This limited edition card is no longer available.");
    return;
  }

  if (completedMissions < card.cost) {
    customAlert("Not enough Improvement Points.");
    return;
  }

  customConfirm(
    `Mint "${card.title}" for ${card.cost} points?\nThis is permanent.`,
    () => {
      completedMissions -= card.cost;
      document.getElementById("missionCounter").textContent = completedMissions;

      ownedCards[card.id] = {
        mintedAt: new Date().toISOString()
      };

      localStorage.setItem("ownedCards", JSON.stringify(ownedCards));
      localStorage.setItem("completedMissions", completedMissions);

      renderMarketplace();
      renderMyCards();

      showSmartNotification(
        "Card Minted",
        `"${card.title}" is now part of your identity.`
      );
    }
  );
}


/* -------------------------
   RENDER OWNED CARDS
------------------------- */
function renderMyCards() {
  const container = document.getElementById("ownedCards");
  if (!container) return;

  container.innerHTML = "";

  const ownedList = window.cardCatalog
    .filter(card => ownedCards[card.id])
    .sort((a, b) => gradeRank(b.grade) - gradeRank(a.grade));

  if (ownedList.length === 0) {
    container.innerHTML = `<p style="opacity:.6;">No cards minted yet.</p>`;
    return;
  }

  ownedList.forEach(card => {
    const data = ownedCards[card.id];

    const div = document.createElement("div");
    div.className = `flex-card owned grade-${card.grade.toLowerCase()}`;

    div.innerHTML = `
      <img src="${card.image}" alt="${card.title}">
      <span class="grade-badge">${card.grade}</span>

      <div class="card-body">
        <h3>${card.title}</h3>
        <p class="card-quote">${card.quote}</p>
        <p class="mint-date">
          Minted on ${formatDate(data.mintedAt)}
        </p>
      </div>
    `;

    container.appendChild(div);
  });
}


/* -------------------------
   FILTER BUTTONS
------------------------- */
document.querySelectorAll(".card-filters button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".card-filters button")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    const grade = btn.textContent === "All"
      ? "ALL"
      : btn.textContent;

    renderMarketplace(grade);
  };
});


/* -------------------------
   INITIAL RENDER
------------------------- */
window.addEventListener("load", () => {
  renderMarketplace();
  renderMyCards();
});
