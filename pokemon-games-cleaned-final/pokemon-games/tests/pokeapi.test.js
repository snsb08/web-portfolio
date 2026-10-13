import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRandomPokemon } from "../pokeapi.js";

afterEach(() => vi.unstubAllGlobals());

const stubFetch = (response) => {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const okResponse = (data) => ({ ok: true, json: async () => data });

describe("fetchRandomPokemon", () => {
  it("returns the name and front sprite", async () => {
    stubFetch(
      okResponse({ name: "eevee", sprites: { front_default: "eevee.png" } }),
    );
    await expect(fetchRandomPokemon()).resolves.toEqual({
      name: "eevee",
      img: "eevee.png",
    });
  });

  it("requests an id between 1 and 151", async () => {
    const fetchMock = stubFetch(okResponse({ name: "x", sprites: {} }));
    await fetchRandomPokemon(() => 0);
    await fetchRandomPokemon(() => 0.999999);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/pokemon\/1$/);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/pokemon\/151$/);
  });

  it("returns img: null when there is no sprite", async () => {
    stubFetch(okResponse({ name: "mew", sprites: { front_default: null } }));
    await expect(fetchRandomPokemon()).resolves.toEqual({
      name: "mew",
      img: null,
    });
  });

  it("throws on a non-OK response so the game can fall back", async () => {
    stubFetch({ ok: false, status: 503 });
    await expect(fetchRandomPokemon()).rejects.toThrow("503");
  });

  it("propagates network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(fetchRandomPokemon()).rejects.toThrow("offline");
  });
});
