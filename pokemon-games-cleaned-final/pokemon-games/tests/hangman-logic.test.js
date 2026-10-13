import { describe, expect, it } from "vitest";
import {
  MAX_WRONG_GUESSES,
  calculateScore,
  createGame,
  getMaskedWord,
  getStatus,
  guessLetter,
  isCorrectGuess,
  wrongGuessCount,
} from "../hangman-logic.js";

/** Apply several guesses in order. */
const guessAll = (state, letters) =>
  [...letters].reduce((current, letter) => guessLetter(current, letter), state);

describe("createGame", () => {
  it("lowercases the answer and starts with no guesses", () => {
    const state = createGame("Pikachu");
    expect(state).toEqual({
      answer: "pikachu",
      guessed: [],
      maxWrong: MAX_WRONG_GUESSES,
    });
  });
});

describe("guessLetter", () => {
  it("records a guess without mutating the old state", () => {
    const state = createGame("eevee");
    const next = guessLetter(state, "e");
    expect(next.guessed).toEqual(["e"]);
    expect(state.guessed).toEqual([]);
  });

  it("normalizes uppercase letters", () => {
    expect(guessLetter(createGame("eevee"), "E").guessed).toEqual(["e"]);
  });

  it("ignores repeats and non-letters", () => {
    const state = guessLetter(createGame("eevee"), "e");
    expect(guessLetter(state, "e")).toBe(state);
    expect(guessLetter(state, "1")).toBe(state);
    expect(guessLetter(state, "ee")).toBe(state);
    expect(guessLetter(state, "-")).toBe(state);
  });

  it("ignores guesses after the game is over", () => {
    const lost = guessAll(createGame("a", 1), "z");
    expect(getStatus(lost)).toBe("lost");
    expect(guessLetter(lost, "a")).toBe(lost);
  });
});

describe("getMaskedWord", () => {
  it("hides unguessed letters and shows guessed ones", () => {
    const state = guessLetter(createGame("eevee"), "v");
    expect(getMaskedWord(state)).toEqual(["_", "_", "v", "_", "_"]);
  });

  it("can reveal the whole answer", () => {
    expect(getMaskedWord(createGame("eevee"), true).join("")).toBe("eevee");
  });

  it("shows non-letter characters for free", () => {
    expect(getMaskedWord(createGame("nidoran-f"))).toContain("-");
  });
});

describe("status and scoring", () => {
  it("counts only wrong guesses against the player", () => {
    const state = guessAll(createGame("eevee"), "exz");
    expect(isCorrectGuess(state, "e")).toBe(true);
    expect(wrongGuessCount(state)).toBe(2);
    expect(getStatus(state)).toBe("playing");
  });

  it("is won once every letter is guessed", () => {
    expect(getStatus(guessAll(createGame("eevee"), "ev"))).toBe("won");
  });

  it("is lost at the maximum number of wrong guesses", () => {
    expect(getStatus(guessAll(createGame("a", 2), "xy"))).toBe("lost");
  });

  it("can be won even with hyphenated names", () => {
    const state = guessAll(createGame("nidoran-f"), "nidoranf");
    expect(getStatus(state)).toBe("won");
  });

  it("scores more points for fewer wrong guesses", () => {
    const perfect = guessAll(createGame("eevee", 8), "ev");
    const sloppy = guessAll(createGame("eevee", 8), "xyzqwev");
    expect(calculateScore(perfect)).toBe(8);
    expect(calculateScore(sloppy)).toBe(3);
  });

  it("always awards at least 1 point for a win", () => {
    const state = guessAll(createGame("a", 3), "xya");
    expect(getStatus(state)).toBe("won");
    expect(calculateScore(state)).toBe(1);
  });

  it("awards nothing for a loss or an unfinished game", () => {
    expect(calculateScore(guessAll(createGame("a", 1), "x"))).toBe(0);
    expect(calculateScore(createGame("eevee"))).toBe(0);
  });
});
