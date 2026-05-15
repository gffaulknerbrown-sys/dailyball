// ------------------------------
// 1. PLAYER DATA
// ------------------------------
const players = window.players;
const leagueMap = window.leagueMap;
const continentMap = window.continentMap;


// ------------------------------
// 2. DAILY MODE TARGET PLAYER
// ------------------------------
function getDailyIndex() {
  const today = new Date();
  const start = new Date(2026, 0, 1);
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return diff % players.length;
}

const targetPlayer = players[getDailyIndex()];

document.body.insertAdjacentHTML("afterbegin", `
  <div style="
    background:#111;
    color:#0f0;
    padding:10px;
    font-size:18px;
    font-family:monospace;
  ">
    TARGET PLAYER (DEV MODE): ${targetPlayer.name} (Index: ${getDailyIndex()})
  </div>
`);


// ------------------------------
// 3. DOM ELEMENTS
// ------------------------------
const guessInput = document.getElementById("guess-input");
const guessButton = document.getElementById("guess-button");
const suggestionsBox = document.getElementById("suggestions");


// ------------------------------
// 4. AUTOCOMPLETE
// ------------------------------
guessInput.addEventListener("input", () => {
  const text = guessInput.value.toLowerCase();

  if (!text) {
    suggestionsBox.style.display = "none";
    return;
  }

  const matches = players.filter(p =>
    p.name.toLowerCase().includes(text)
  );

  if (matches.length === 0) {
    suggestionsBox.style.display = "none";
    return;
  }

  suggestionsBox.innerHTML = matches
    .map(p => `<div class="suggestion-item">${p.name}</div>`)
    .join("");

  suggestionsBox.style.display = "block";

  document.querySelectorAll(".suggestion-item").forEach(item => {
    item.addEventListener("click", () => {
      guessInput.value = item.textContent;
      suggestionsBox.style.display = "none";
    });
  });
});

document.addEventListener("click", (e) => {
  if (!suggestionsBox.contains(e.target) && e.target !== guessInput) {
    suggestionsBox.style.display = "none";
  }
});


// ------------------------------
// 5. HANDLE GUESS
// ------------------------------
guessButton.addEventListener("click", handleGuess);
guessInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleGuess();
});

function handleGuess() {
  const value = guessInput.value.trim();
  if (!value) return;

  const guessedPlayer = findPlayerByName(value);

  if (!guessedPlayer) {
    guessInput.classList.add("shake");
    setTimeout(() => guessInput.classList.remove("shake"), 300);
    return;
  }

  const result = comparePlayers(guessedPlayer, targetPlayer);
  addGuessRow(guessedPlayer, result);

  if (guessedPlayer.name === targetPlayer.name) {
    setTimeout(() => alert("You found the mystery player!"), 200);
  }

  guessInput.value = "";
}


// ------------------------------
// 6. FIND PLAYER BY NAME
// ------------------------------
function findPlayerByName(name) {
  const lower = name.toLowerCase();
  return players.find(p => p.name.toLowerCase() === lower);
}


// ------------------------------
// 7. POSITION GROUPS
// ------------------------------
const positionGroups = {
  "GK": "GK",
  "CB": "DEF", "RB": "DEF", "LB": "DEF",
  "RWB": "DEF", "LWB": "DEF",
  "CDM": "MID", "CM": "MID", "CAM": "MID",
  "RW": "ATT", "LW": "ATT", "ST": "ATT", "CF": "ATT"
};

function samePositionGroup(pos1, pos2) {
  return positionGroups[pos1] === positionGroups[pos2];
}


// ------------------------------
// 8. COMPARISON HELPERS
// ------------------------------
function compareClubs(guessClubs, targetClubs) {
  return guessClubs.map(club => {
    if (targetClubs.includes(club)) return "green";

    const guessLeague = leagueMap[club];
    const targetLeagues = targetClubs.map(c => leagueMap[c]).filter(Boolean);

    if (!guessLeague) return "grey";
    if (targetLeagues.includes(guessLeague)) return "yellow";

    return "grey";
  });
}

function comparePositions(guessPositions, targetPositions) {
  return guessPositions.map(pos => {
    if (targetPositions.includes(pos)) return "green";
    return targetPositions.some(tp => samePositionGroup(pos, tp))
      ? "yellow"
      : "grey";
  });
}

function compareNationality(guessNat, targetNat) {
  if (guessNat === targetNat) return "green";

  const guessCont = continentMap[guessNat];
  const targetCont = continentMap[targetNat];

  return guessCont && targetCont && guessCont === targetCont
    ? "yellow"
    : "grey";
}

function compareAge(guessYear, targetYear) {
  if (guessYear === targetYear) return { color: "green", arrow: "" };

  const close = Math.abs(guessYear - targetYear) <= 2;
  return {
    color: close ? "yellow" : "grey",
    arrow: guessYear < targetYear ? "↑" : "↓"
  };
}

function compareFoot(guess, target) {
  return guess === target ? "green" : "grey";
}

function compareStatus(guess, target) {
  return guess === target ? "green" : "grey";
}


// ------------------------------
// 9. MASTER COMPARISON
// ------------------------------
function comparePlayers(guess, target) {
  return {
    clubs: compareClubs(guess.clubs, target.clubs),
    positions: comparePositions(guess.positions, target.positions),
    nationality: compareNationality(guess.nationality, target.nationality),
    age: compareAge(guess.YearOfBirth, target.YearOfBirth),
    strongFoot: compareFoot(guess.strongFoot, target.strongFoot),
    status: compareStatus(guess.status, target.status)
  };
}


// ------------------------------
// 10. RENDER GUESS CARD (WITH HERO IMAGE)
// ------------------------------
function addGuessRow(player, result) {
  const card = document.createElement("div");
  card.classList.add("guess-card");

  card.innerHTML = `
    <div class="guess-header">
      <img class="player-hero" src="${player.image}" alt="${player.name}">

      <div class="header-info">
        <div class="player-name">${player.name}</div>
        <div class="clubs">
          ${player.clubs.map((club, i) =>
            `<span class="tag ${result.clubs[i]}">${club}</span>`
          ).join("")}
        </div>
      </div>
    </div>

    <div class="stats-grid">

      <div class="stat-block ${result.nationality}">
        <div class="section-title">Nationality</div>
        <div class="stat-value">${player.nationality}</div>
      </div>

      <div class="stat-block">
        <div class="section-title">Positions</div>
        <div>
          ${player.positions.map((pos, i) =>
            `<span class="tag ${result.positions[i]}">${pos}</span>`
          ).join("")}
        </div>
      </div>

      <div class="stat-block ${result.age.color}">
        <div class="section-title">Year</div>
        <div class="stat-value">${player.YearOfBirth} ${result.age.arrow}</div>
      </div>

      <div class="stat-block ${result.strongFoot}">
        <div class="section-title">Foot</div>
        <div class="stat-value">${player.strongFoot}</div>
      </div>

      <div class="stat-block ${result.status}">
        <div class="section-title">Status</div>
        <div class="stat-value">${player.status}</div>
      </div>

    </div>
  `;

  document.getElementById("guesses-container").prepend(card);
}

