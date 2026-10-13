/** High-score list: pure helpers plus guarded localStorage access. */

// Namespaced: GitHub Pages shares localStorage across all of a user's projects.
const STORAGE_KEY = "pokemon-games:hangman-scores";
const MAX_SCORES = 10;
const MAX_NAME_LENGTH = 20;

/** Returns a new list, highest score first (ties keep the earlier entry first). */
export function addScore(scores, name, score) {
  const entry = { name: name.trim().slice(0, MAX_NAME_LENGTH), score };
  return [...scores, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES);
}

function isValidEntry(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    typeof entry.name === "string" &&
    Number.isFinite(entry.score)
  );
}

export function loadScores() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored.filter(isValidEntry) : [];
  } catch {
    return []; // storage blocked or corrupted: start with an empty list
  }
}

export function saveScores(scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // storage unavailable (private mode, quota): scores last for this visit only
  }
}
