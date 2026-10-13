const API_URL = "https://pokeapi.co/api/v2/pokemon";
const POKEDEX_SIZE = 151; // original 151: recognizable names
const TIMEOUT_MS = 5000;

/**
 * Fetch one random Pokémon: a single request by id.
 * @returns {Promise<{ name: string, img: string | null }>}
 * @throws on network failure, timeout, or a non-OK response
 */
export async function fetchRandomPokemon(random = Math.random) {
  const id = Math.floor(random() * POKEDEX_SIZE) + 1;
  const response = await fetch(`${API_URL}/${id}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`PokéAPI responded with ${response.status}`);
  }
  const data = await response.json();
  return { name: data.name, img: data.sprites?.front_default ?? null };
}
