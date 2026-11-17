import { describe, expect, it } from "vitest";
import { alphabetFromCode, buildRound, editGuess, judgeAnswer, keepHalfWidth, takeNext } from "./quiz.ts";

describe("judgeAnswer", () => {
  it("空白と大小を無視して一致する", () => {
    expect(judgeAnswer("  Apple ", "apple")).toBe("correct");
  });

  it("空の入力は不正解にしない", () => {
    expect(judgeAnswer("   ", "apple")).toBe("empty");
  });

  it("綴りが違うと不正解", () => {
    expect(judgeAnswer("apply", "apple")).toBe("wrong");
  });
});

describe("alphabetFromCode", () => {
  it("物理キーを半角アルファベットにする", () => {
    expect(alphabetFromCode("KeyA", false, false)).toBe("a");
    expect(alphabetFromCode("KeyA", true, false)).toBe("A");
    expect(alphabetFromCode("KeyA", false, true)).toBe("A");
    expect(alphabetFromCode("KeyA", true, true)).toBe("a");
  });

  it("文字キー以外は対象外", () => {
    expect(alphabetFromCode("Digit1", false, false)).toBeNull();
    expect(alphabetFromCode("Enter", false, false)).toBeNull();
  });
});

describe("editGuess", () => {
  it("選択範囲を半角文字で置き換える", () => {
    expect(editGuess("aple", 1, 1, { type: "insert", text: "p" })).toEqual({ value: "apple", caret: 2 });
    expect(editGuess("axple", 1, 2, { type: "insert", text: "" })).toEqual({ value: "aple", caret: 1 });
  });

  it("バックスペースは直前の文字を消す", () => {
    expect(editGuess("apple", 5, 5, { type: "backspace" })).toEqual({ value: "appl", caret: 4 });
  });
});

describe("keepHalfWidth", () => {
  it("半角英字はそのまま残す", () => {
    expect(keepHalfWidth("Apple 1")).toBe("Apple 1");
  });

  it("全角英数は半角にする", () => {
    expect(keepHalfWidth("Ａｐｐｌｅ　１")).toBe("Apple 1");
  });

  it("全角の仮名や漢字は入れない", () => {
    expect(keepHalfWidth("りんごapple")).toBe("apple");
  });
});

describe("takeNext", () => {
  it("山が残っていれば先頭を出す", () => {
    expect(takeNext(["book", "moon"], "apple", ["apple", "book", "moon"], () => 0)).toEqual({
      word: "book",
      deck: ["moon"],
    });
  });

  it("山が空のときは直前の単語を先頭にしない", () => {
    const drawn = takeNext([], "apple", ["apple", "book", "moon"], () => 0);
    expect(drawn.word).not.toBe("apple");
    expect(["book", "moon"]).toContain(drawn.word);
  });
});

describe("buildRound", () => {
  const words = ["apple", "book", "moon"];

  it("指定した問数だけ並べる", () => {
    expect(buildRound(2, words, () => 0)).toEqual(["book", "moon"]);
  });

  it("単語数と同じ問数なら、それぞれの語を一度ずつ出す", () => {
    const round = buildRound(words.length, words, () => 0.5);
    expect(new Set(round)).toEqual(new Set(words));
  });

  it("周回しても直前の単語をすぐ繰り返さない", () => {
    const round = buildRound(4, words, () => 0);
    expect(round).toHaveLength(4);
    expect(round[2]).not.toBe(round[3]);
    for (const word of round) expect(words).toContain(word);
  });
});
