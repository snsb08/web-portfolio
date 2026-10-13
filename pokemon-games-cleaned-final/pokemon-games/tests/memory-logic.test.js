import { describe, expect, it } from "vitest";
import {
  canFlip,
  createGame,
  flipCard,
  isMatch,
  isTurnComplete,
  isWon,
  resolveTurn,
  shuffle,
} from "../memory-logic.js";

const POKEMON = [
  { id: "a", name: "Alpha", img: "a.png" },
  { id: "b", name: "Beta", img: "b.png" },
  { id: "c", name: "Gamma", img: "c.png" },
];

/** The two card ids that belong to a pair. */
const idsOf = (state, pairId) =>
  state.cards.filter((card) => card.pairId === pairId).map((card) => card.id);

describe("shuffle", () => {
  it("returns the same items without changing the input", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).not.toBe(input);
    expect([...result].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it("is deterministic for a given random source", () => {
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1]);
  });
});

describe("createGame", () => {
  it("builds a deck with exactly two cards per Pokémon", () => {
    const { cards } = createGame(POKEMON);
    expect(cards).toHaveLength(POKEMON.length * 2);
    for (const { id } of POKEMON) {
      expect(cards.filter((card) => card.pairId === id)).toHaveLength(2);
    }
  });

  it("uses each card's index as its id", () => {
    const { cards } = createGame(POKEMON);
    expect(cards.map((card) => card.id)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("starts with nothing flipped, matched, or counted", () => {
    const state = createGame(POKEMON);
    expect(state).toMatchObject({ flipped: [], matched: [], moves: 0 });
  });
});

describe("flipCard", () => {
  it("flips a face-down card without mutating the old state", () => {
    const state = createGame(POKEMON);
    const next = flipCard(state, 0);
    expect(next.flipped).toEqual([0]);
    expect(state.flipped).toEqual([]);
  });

  it("ignores a card that is already face up", () => {
    const once = flipCard(createGame(POKEMON), 0);
    expect(flipCard(once, 0)).toBe(once);
  });

  it("does not allow a third card while a turn is unresolved", () => {
    let state = createGame(POKEMON);
    state = flipCard(flipCard(state, 0), 1);
    expect(canFlip(state, 2)).toBe(false);
    expect(flipCard(state, 2)).toBe(state);
  });

  it("ignores matched cards", () => {
    let state = createGame(POKEMON);
    const [first, second] = idsOf(state, "a");
    state = resolveTurn(flipCard(flipCard(state, first), second));
    expect(flipCard(state, first)).toBe(state);
  });
});

describe("turns", () => {
  it("detects a match and keeps both cards matched", () => {
    let state = createGame(POKEMON);
    const [first, second] = idsOf(state, "a");
    state = flipCard(flipCard(state, first), second);
    expect(isTurnComplete(state)).toBe(true);
    expect(isMatch(state)).toBe(true);

    state = resolveTurn(state);
    expect(state.matched).toEqual([first, second]);
    expect(state.flipped).toEqual([]);
    expect(state.moves).toBe(1);
  });

  it("flips a mismatch back and still counts the move", () => {
    let state = createGame(POKEMON);
    state = flipCard(
      flipCard(state, idsOf(state, "a")[0]),
      idsOf(state, "b")[0],
    );
    expect(isMatch(state)).toBe(false);

    state = resolveTurn(state);
    expect(state.matched).toEqual([]);
    expect(state.flipped).toEqual([]);
    expect(state.moves).toBe(1);
  });

  it("is not a match or resolvable with only one card flipped", () => {
    const state = flipCard(createGame(POKEMON), 0);
    expect(isMatch(state)).toBe(false);
    expect(resolveTurn(state)).toBe(state);
  });
});

describe("isWon", () => {
  it("is true only after every pair is matched", () => {
    let state = createGame(POKEMON);
    expect(isWon(state)).toBe(false);

    for (const { id } of POKEMON) {
      const [first, second] = idsOf(state, id);
      expect(isWon(state)).toBe(false);
      state = resolveTurn(flipCard(flipCard(state, first), second));
    }
    expect(isWon(state)).toBe(true);
    expect(state.moves).toBe(POKEMON.length);
  });
});
