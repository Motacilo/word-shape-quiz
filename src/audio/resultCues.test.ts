import { describe, expect, it } from "vitest";
import { resultCues } from "./resultCues.ts";

describe("resultCues", () => {
  it("30%未満はスタジアムの拍手", () => {
    expect(resultCues(1, 10)).toEqual(["applauseLow"]);
    expect(resultCues(0, 5)).toEqual(["applauseLow"]);
  });

  it("30%以上70%未満は歓声と拍手2", () => {
    expect(resultCues(3, 10)).toEqual(["applauseMid"]);
    expect(resultCues(6, 10)).toEqual(["applauseMid"]);
  });

  it("70%以上は歓声と拍手1", () => {
    expect(resultCues(7, 10)).toEqual(["applauseHigh"]);
    expect(resultCues(9, 10)).toEqual(["applauseHigh"]);
  });

  it("全問正解は歓声にファンファーレを足す", () => {
    expect(resultCues(5, 5)).toEqual(["applauseHigh", "fanfare"]);
  });
});
