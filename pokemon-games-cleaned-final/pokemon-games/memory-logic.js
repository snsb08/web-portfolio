/**
 * Pure game logic for the Memory game: no DOM, no timers, no globals.
 * Every function takes a state and returns a new state, which makes the
 * rules easy to test and keeps memory.js focused on rendering.
 *
 * @typedef {{ id: number, pairId: string, name: string, img: string }} Card
 * @typedef {{
 *   cards: Card[],       // shuffled deck; a card's id is its index
 *   flipped: number[],   // ids face up this turn (0-2)
 *   matched: number[],   // ids already matched
 *   moves: number        // completed turns
 * }} GameState
 */

/** Fisher-Yates shuffle. Returns a new array; `random` is injectable for tests. */
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Start a new game from a list of `{ id, name, img }` Pokémon.
 * Each Pokémon appears twice in the shuffled deck.
 * @returns {GameState}
 */
export function createGame(pokemon, random = Math.random) {
  const pairs = pokemon.flatMap((p) => [p, p]);
  const cards = shuffle(pairs, random).map((p, index) => ({
    id: index,
    pairId: p.id,
    name: p.name,
    img: p.img,
  }));
  return { cards, flipped: [], matched: [], moves: 0 };
}

export function canFlip(state, cardId) {
  return (
    state.flipped.length < 2 &&
    !state.flipped.includes(cardId) &&
    !state.matched.includes(cardId)
  );
}

/** Flip a card face up. Returns the same state object if the move is not allowed. */
export function flipCard(state, cardId) {
  if (!canFlip(state, cardId)) return state;
  return { ...state, flipped: [...state.flipped, cardId] };
}

export function isTurnComplete(state) {
  return state.flipped.length === 2;
}

export function isMatch(state) {
  if (!isTurnComplete(state)) return false;
  const [first, second] = state.flipped.map((id) => state.cards[id]);
  return first.pairId === second.pairId;
}

/** Finish a two-card turn: keep matches, flip mismatches back, count the move. */
export function resolveTurn(state) {
  if (!isTurnComplete(state)) return state;
  return {
    ...state,
    flipped: [],
    matched: isMatch(state)
      ? [...state.matched, ...state.flipped]
      : state.matched,
    moves: state.moves + 1,
  };
}

export function isWon(state) {
  return state.matched.length === state.cards.length;
}
