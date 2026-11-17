import { describe, expect, it } from "vitest";
import { listAnswered, markWord, wasCorrect, wordKey } from "./progress.ts";

describe("markWord", () => {
  it("一度正解した星は、あとから外れない", () => {
    const once = markWord({}, "jua|15|apple", true);
    const again = markWord(once, "jua|15|apple", false);
    expect(again["jua|15|apple"]).toEqual({ answered: true, correct: true });
  });
});

describe("wasCorrect", () => {
  it("その難易度とフォントで正解したときだけ真", () => {
    let book = markWord({}, wordKey("jua", 15, "apple"), true);
    book = markWord(book, wordKey("jua", 20, "apple"), false);
    expect(wasCorrect(book, "jua", 15, "apple")).toBe(true);
    expect(wasCorrect(book, "jua", 20, "apple")).toBe(false);
    expect(wasCorrect(book, "tinos-bold", 15, "apple")).toBe(false);
  });
});

describe("listAnswered", () => {
  it("選んだ条件の回答済みだけを単語順に返す", () => {
    let book = markWord({}, wordKey("jua", 15, "moon"), false);
    book = markWord(book, wordKey("jua", 15, "apple"), true);
    book = markWord(book, wordKey("tinos-bold", 15, "fish"), true);
    expect(listAnswered(book, "jua", 15, ["apple", "book", "moon", "fish"])).toEqual([
      { word: "apple", correct: true },
      { word: "moon", correct: false },
    ]);
  });
});