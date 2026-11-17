import { describe, expect, it } from "vitest";
import { QUIZ_WORDS } from "./quizWords.ts";

const EARLIER_QUIZ_WORDS = [
  "apple",
  "book",
  "moon",
  "little",
  "dragon",
  "fish",
  "mountain",
  "eye",
  "school",
  "happy",
  "bridge",
  "puzzle",
  "leg",
];

describe("QUIZ_WORDS", () => {
  it("授業で出てきやすい500語で、これまでの授業語も含む", () => {
    expect(QUIZ_WORDS).toHaveLength(500);
    expect(new Set(QUIZ_WORDS).size).toBe(QUIZ_WORDS.length);
    expect(QUIZ_WORDS.every((word) => /^[a-z]{3,12}$/.test(word))).toBe(true);
    expect([...QUIZ_WORDS].sort()).toEqual([...QUIZ_WORDS]);
    for (const word of EARLIER_QUIZ_WORDS) {
      expect(QUIZ_WORDS).toContain(word);
    }
  });
});
