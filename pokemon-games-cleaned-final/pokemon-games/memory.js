import {
  createGame,
  flipCard,
  isMatch,
  isTurnComplete,
  isWon,
  resolveTurn,
} from "./memory-logic.js";
import { LOCAL_POKEMON as POKEMON } from "./pokemon-data.js";

const FACE_DOWN_IMG = "images/back_pattern.png";
const MATCHED_IMG = "images/ball.png";
const RESOLVE_DELAY_MS = 800; // how long a pair stays visible before it resolves

const board = document.getElementById("board");
const foundOutput = document.getElementById("result");
const totalOutput = document.getElementById("total");
const movesOutput = document.getElementById("moves");
const message = document.getElementById("message");
const restartButton = document.getElementById("restart");

let state;
let cardButtons = [];
let resolveTimer;

/* ---------- Setup ---------- */

function startGame() {
  clearTimeout(resolveTimer);
  state = createGame(POKEMON);
  cardButtons = state.cards.map(createCardButton);
  board.replaceChildren(...cardButtons);
  totalOutput.textContent = POKEMON.length;
  message.textContent = "";
  render();
}

function createCardButton(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "card";
  button.dataset.id = card.id;

  const img = document.createElement("img");
  img.alt = ""; // the button's aria-label carries the meaning
  img.width = 100;
  img.height = 100;
  button.append(img);

  return button;
}

function preloadImages() {
  [FACE_DOWN_IMG, MATCHED_IMG, ...POKEMON.map((p) => p.img)].forEach((src) => {
    new Image().src = src;
  });
}

/* ---------- Rendering ---------- */

function render() {
  state.cards.forEach((card, index) => {
    const button = cardButtons[index];
    const isMatched = state.matched.includes(card.id);
    const isFaceUp = state.flipped.includes(card.id);
    const position = `Card ${card.id + 1}`;

    button.querySelector("img").src = isMatched
      ? MATCHED_IMG
      : isFaceUp
        ? card.img
        : FACE_DOWN_IMG;

    button.setAttribute(
      "aria-label",
      isMatched
        ? `${position}, ${card.name}, matched`
        : isFaceUp
          ? `${position}, ${card.name}`
          : `${position}, face down`,
    );
    button.setAttribute("aria-disabled", String(isMatched));
    button.classList.toggle("card--matched", isMatched);
    button.classList.toggle("card--up", isFaceUp);
  });

  foundOutput.textContent = state.matched.length / 2;
  movesOutput.textContent = state.moves;
}

/* ---------- Game flow ---------- */

function handleBoardClick(event) {
  const button = event.target.closest(".card");
  if (!button) return;

  const cardId = Number(button.dataset.id);
  const nextState = flipCard(state, cardId);
  if (nextState === state) return; // matched, already flipped, or turn in progress

  state = nextState;
  render();

  const card = state.cards[cardId];
  if (!isTurnComplete(state)) {
    message.textContent = `Card ${card.id + 1}: ${card.name}. Pick one more card.`;
    return;
  }

  // Announce the result right away; keep the cards visible briefly before resolving.
  const [first, second] = state.flipped.map((id) => state.cards[id]);
  message.textContent = isMatch(state)
    ? `Match! You found ${card.name}.`
    : `No match: ${first.name} and ${second.name}. Try again.`;

  resolveTimer = setTimeout(finishTurn, RESOLVE_DELAY_MS);
}

function finishTurn() {
  state = resolveTurn(state);
  render();

  if (isWon(state)) {
    message.textContent = `Congratulations! You caught them all in ${state.moves} moves.`;
  }
}

/* ---------- Init ---------- */

board.addEventListener("click", handleBoardClick);
restartButton.addEventListener("click", startGame);
preloadImages();
startGame();
