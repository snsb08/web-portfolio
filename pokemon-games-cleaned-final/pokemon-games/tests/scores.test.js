import { afterEach, describe, expect, it, vi } from "vitest";
import { addScore, loadScores, saveScores } from "../scores.js";

afterEach(() => vi.unstubAllGlobals());

const stubStorage = (overrides) =>
  vi.stubGlobal("localStorage", {
    getItem: () => null,
    setItem: () => {},
    ...overrides,
  });

describe("addScore", () => {
  it("sorts highest first and does not mutate the input", () => {
    const original = [{ name: "Ash", score: 5 }];
    const result = addScore(original, "Misty", 9);
    expect(result.map((entry) => entry.name)).toEqual(["Misty", "Ash"]);
    expect(original).toHaveLength(1);
  });

  it("sorts numerically, so 10 beats 9", () => {
    const result = addScore(addScore([], "nine", 9), "ten", 10);
    expect(result[0].name).toBe("ten");
  });

  it("keeps the earlier entry first on a tie", () => {
    const result = addScore(addScore([], "first", 5), "second", 5);
    expect(result.map((entry) => entry.name)).toEqual(["first", "second"]);
  });

  it("keeps only the top 10", () => {
    let scores = [];
    for (let i = 1; i <= 15; i++) scores = addScore(scores, `p${i}`, i);
    expect(scores).toHaveLength(10);
    expect(scores[0].score).toBe(15);
    expect(scores.at(-1).score).toBe(6);
  });

  it("trims and limits long names", () => {
    const [entry] = addScore([], `  ${"x".repeat(40)}  `, 1);
    expect(entry.name).toBe("x".repeat(20));
  });
});

describe("loadScores", () => {
  it("returns an empty list when nothing is stored", () => {
    stubStorage({});
    expect(loadScores()).toEqual([]);
  });

  it("returns stored scores", () => {
    const stored = [{ name: "Ash", score: 3 }];
    stubStorage({ getItem: () => JSON.stringify(stored) });
    expect(loadScores()).toEqual(stored);
  });

  it("drops malformed entries", () => {
    const stored = [
      { name: "Ash", score: 3 },
      { name: 5 },
      null,
      "oops",
      { name: "x", score: "9" },
    ];
    stubStorage({ getItem: () => JSON.stringify(stored) });
    expect(loadScores()).toEqual([{ name: "Ash", score: 3 }]);
  });

  it("recovers from corrupted JSON or non-array data", () => {
    stubStorage({ getItem: () => "{not json" });
    expect(loadScores()).toEqual([]);
    stubStorage({ getItem: () => '{"a":1}' });
    expect(loadScores()).toEqual([]);
  });

  it("recovers when storage is blocked", () => {
    stubStorage({
      getItem: () => {
        throw new Error("blocked");
      },
    });
    expect(loadScores()).toEqual([]);
  });
});

describe("saveScores", () => {
  it("writes JSON to storage", () => {
    const setItem = vi.fn();
    stubStorage({ setItem });
    saveScores([{ name: "Ash", score: 3 }]);
    expect(setItem).toHaveBeenCalledWith(
      expect.any(String),
      '[{"name":"Ash","score":3}]',
    );
  });

  it("does not throw when storage is full or blocked", () => {
    stubStorage({
      setItem: () => {
        throw new Error("quota");
      },
    });
    expect(() => saveScores([])).not.toThrow();
  });
});
