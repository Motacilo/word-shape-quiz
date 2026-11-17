import { describe, expect, it } from "vitest";
import { questionLimit } from "./options.ts";

describe("questionLimit", () => {
  it("全問はそのときある単語の数になる", () => {
    expect(questionLimit("all", 300)).toBe(300);
    expect(questionLimit(100, 300)).toBe(100);
  });

  it("単語数を超える出題数は単語数で止める", () => {
    expect(questionLimit(100, 40)).toBe(40);
    expect(questionLimit(10, 0)).toBe(0);
  });
});
