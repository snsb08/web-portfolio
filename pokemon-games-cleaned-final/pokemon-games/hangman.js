import {
  MAX_WRONG_GUESSES,
  calculateScore,
  createGame,
  getMaskedWord,
  getStatus,
  guessLetter,
  isCorrectGuess,
  wrongGuessCount,
} from "./hangman-logic.js";
import { fetchRandomPokemon } from "./pokeapi.js";
import { LOCAL_POKEMON } from "./pokemon-data.js";
import { addScore, loadScores, saveScores } from "./scores.js";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

const el = {
  scene: document.getElementById("scene"),
  wrongCount: document.getElementById("wrong-count"),
  maxWrong: document.getElementById("max-wrong"),
  reveal: document.getElementById("reveal"),
  word: document.getElementById("word"),
  keyboard: document.getElementById("keyboard"),
  message: document.getElementById("message"),
  srMessage: document.getElementById("sr-message"),
  score: document.getElementById("score"),
  playAgain: document.getElementById("play-again"),
  scoreForm: document.getElementById("score-form"),
  nameInput: document.getElementById("player-name"),
  saveButton: document.getElementById("save-score"),
  scoreList: document.getElementById("score-list"),
  scoresEmpty: document.getElementById("scores-empty"),
};

let game = null; // null while a Pokémon is loading
let pokemon = null; // { name, img } for the current round
let score = 0; // points in the current run (a loss ends the run)
let scores = loadScores();
let roundId = 0; // lets us ignore a slow response from an abandoned round

const keyButtons = ALPHABET.map(createKey);

/* ---------- Helpers ---------- */

const formatName = (name) => name.charAt(0).toUpperCase() + name.slice(1);

// `text` is shown on screen. `spokenExtra` is read aloud by screen readers only.
function setMessage(text, spokenExtra = "") {
  el.message.textContent = text;
  el.srMessage.textContent = spokenExtra ? `${text} ${spokenExtra}` : text;
}

/** "blank, a, blank": how a screen reader should hear the word. */
function spokenWord(letters) {
  return letters.map((char) => (char === "_" ? "blank" : char)).join(", ");
}

function pickLocalPokemon() {
  const choice =
    LOCAL_POKEMON[Math.floor(Math.random() * LOCAL_POKEMON.length)];
  return { name: choice.name.toLowerCase(), img: choice.img };
}

/* ---------- Rendering ---------- */

function createKey(letter) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.letter = letter;
  button.textContent = letter;
  button.setAttribute("aria-label", letter.toUpperCase());
  return button;
}

function renderWord() {
  if (!game) {
    el.word.textContent = "Loading…";
    el.word.classList.remove("word--lost");
    return;
  }
  const lost = getStatus(game) === "lost";
  const letters = getMaskedWord(game, lost);

  const visible = document.createElement("span");
  visible.setAttribute("aria-hidden", "true");
  visible.textContent = letters.join(" ");

  const spoken = document.createElement("span");
  spoken.className = "visually-hidden";
  spoken.textContent = `Word: ${spokenWord(letters)}`;

  el.word.replaceChildren(visible, spoken);
  el.word.classList.toggle("word--lost", lost);
}

// Keys use aria-disabled (not `disabled`) so keyboard focus isn't lost after a guess.
function renderKeyboard() {
  const playing = game !== null && getStatus(game) === "playing";
  for (const button of keyButtons) {
    const letter = button.dataset.letter;
    const guessed = game?.guessed.includes(letter) ?? false;
    const correct = guessed && isCorrectGuess(game, letter);

    button.setAttribute("aria-disabled", String(!playing || guessed));
    button.classList.toggle("key--correct", correct);
    button.classList.toggle("key--wrong", guessed && !correct);
    button.setAttribute(
      "aria-label",
      guessed
        ? `${letter.toUpperCase()}, ${correct ? "correct" : "incorrect"}`
        : letter.toUpperCase(),
    );
  }
}

function renderScene() {
  const status = game ? getStatus(game) : "playing";
  const wrong = game ? wrongGuessCount(game) : 0;

  if (status === "won") {
    el.scene.src = "images/team2pikaWin.jpg";
    el.scene.alt = "Scene: Pikachu escaped from Team Rocket.";
  } else {
    // Wrong guesses 0 and 1 share the first image, as in the original game.
    el.scene.src = `images/team2pika${Math.max(1, wrong)}.jpg`;
    el.scene.alt =
      status === "lost"
        ? "Scene: Team Rocket has captured Pikachu."
        : `Scene: Team Rocket is closing in on Pikachu (${wrong} of ${MAX_WRONG_GUESSES} wrong guesses).`;
  }
}

function renderReveal() {
  const finished = game !== null && getStatus(game) !== "playing";
  if (!finished || !pokemon.img) {
    el.reveal.replaceChildren();
    return;
  }
  const img = document.createElement("img");
  img.src = pokemon.img;
  img.alt = formatName(pokemon.name);
  img.width = 96;
  img.height = 96;
  el.reveal.replaceChildren(img);
}

function renderScore() {
  el.score.textContent = score;
  el.saveButton.disabled = score === 0;
}

function renderScores() {
  el.scoreList.replaceChildren(
    ...scores.map((entry) => {
      const item = document.createElement("li");
      item.textContent = `${entry.name} \u2014 ${entry.score}`;
      return item;
    }),
  );
  el.scoresEmpty.hidden = scores.length > 0;
}

function render() {
  el.wrongCount.textContent = game ? wrongGuessCount(game) : 0;
  renderWord();
  renderKeyboard();
  renderScene();
  renderReveal();
  renderScore();
}

/* ---------- Game flow ---------- */

async function startRound() {
  const thisRound = ++roundId;

  // Losing ends a run, so the next round starts from zero.
  if (game && getStatus(game) === "lost") score = 0;

  game = null;
  render();
  setMessage("Finding a Pokémon…");

  let nextPokemon;
  let usedFallback = false;
  try {
    nextPokemon = await fetchRandomPokemon();
  } catch (error) {
    console.warn("PokéAPI unavailable, using a local Pokémon:", error);
    nextPokemon = pickLocalPokemon();
    usedFallback = true;
  }
  if (thisRound !== roundId) return; // a newer round has started

  pokemon = nextPokemon;
  game = createGame(pokemon.name);
  render();
  setMessage(
    usedFallback
      ? "Couldn't reach PokéAPI, so this one is from the local list. Pick a letter."
      : "New game. Pick a letter.",
  );
}

function handleGuess(letter) {
  if (!game) return;
  const nextGame = guessLetter(game, letter);
  if (nextGame === game) return; // already guessed, invalid, or game over

  game = nextGame;
  const label = letter.toUpperCase();
  const name = formatName(pokemon.name);
  const status = getStatus(game);

  if (status === "won") {
    const points = calculateScore(game);
    score += points;
    setMessage(`You won! It was ${name}. +${points} points. Score: ${score}.`);
  } else if (status === "lost") {
    setMessage(
      `Oh no! Team Rocket caught Pikachu. The Pokémon was ${name}. Final score: ${score}.`,
    );
  } else {
    const left = MAX_WRONG_GUESSES - wrongGuessCount(game);
    const result = isCorrectGuess(game, letter)
      ? `Yes, ${label} is in the word.`
      : `No, ${label} is not in the word.`;
    setMessage(
      `${result} ${left} wrong ${left === 1 ? "guess" : "guesses"} left.`,
      `Word: ${spokenWord(getMaskedWord(game))}.`,
    );
  }
  render();
}

function handleScoreSubmit(event) {
  event.preventDefault();
  const name = el.nameInput.value.trim();
  if (!name || score === 0) return;

  scores = addScore(scores, name, score);
  saveScores(scores);
  setMessage(`Saved ${name}'s score of ${score}.`);
  score = 0; // the points are banked; start a fresh run
  el.nameInput.value = "";
  renderScore();
  renderScores();
}

/* ---------- Init ---------- */

el.keyboard.append(...keyButtons);
el.maxWrong.textContent = MAX_WRONG_GUESSES;

el.keyboard.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.getAttribute("aria-disabled") === "true") return;
  handleGuess(button.dataset.letter);
});

// Physical keyboard, but never while typing a name in the form.
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.target.closest("input, textarea, select")) return;
  const letter = event.key.toLowerCase();
  if (ALPHABET.includes(letter)) handleGuess(letter);
});

el.playAgain.addEventListener("click", startRound);
el.scoreForm.addEventListener("submit", handleScoreSubmit);

renderScores();
startRound();
