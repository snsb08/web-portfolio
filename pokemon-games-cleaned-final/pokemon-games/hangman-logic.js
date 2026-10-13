/**
 * Pure game logic for Hangman: no DOM, no network, no globals.
 *
 * @typedef {{
 *   answer: string,    // lowercase Pokémon name
 *   guessed: string[], // letters guessed so far, in order
 *   maxWrong: number   // wrong guesses allowed before losing
 * }} GameState
 * @typedef {'playing' | 'won' | 'lost'} GameStatus
 */

export const MAX_WRONG_GUESSES = 8;

const LETTER = /^[a-z]$/;

export function createGame(answer, maxWrong = MAX_WRONG_GUESSES) {
  return { answer: answer.toLowerCase(), guessed: [], maxWrong };
}

export function isCorrectGuess(state, letter) {
  return state.answer.includes(letter);
}

export function wrongGuessCount(state) {
  return state.guessed.filter((letter) => !isCorrectGuess(state, letter))
    .length;
}

/** Only letters must be guessed; characters like "-" in "nidoran-f" are shown for free. */
function isSolved(state) {
  return [...state.answer].every(
    (char) => !LETTER.test(char) || state.guessed.includes(char),
  );
}

/** @returns {GameStatus} */
export function getStatus(state) {
  if (wrongGuessCount(state) >= state.maxWrong) return "lost";
  if (isSolved(state)) return "won";
  return "playing";
}

/** Returns the same state object if the guess is not allowed. */
export function guessLetter(state, letter) {
  const normalized = letter.toLowerCase();
  if (
    !LETTER.test(normalized) ||
    state.guessed.includes(normalized) ||
    getStatus(state) !== "playing"
  ) {
    return state;
  }
  return { ...state, guessed: [...state.guessed, normalized] };
}

/**
 * The word as an array of display characters: guessed letters, "_" for
 * hidden ones. Pass `revealAll` to show the answer (after a loss).
 */
export function getMaskedWord(state, revealAll = false) {
  return [...state.answer].map((char) =>
    revealAll || !LETTER.test(char) || state.guessed.includes(char)
      ? char
      : "_",
  );
}

/** Points for a won round: the fewer wrong guesses, the more points (minimum 1). */
export function calculateScore(state) {
  if (getStatus(state) !== "won") return 0;
  return Math.max(1, state.maxWrong - wrongGuessCount(state));
}
