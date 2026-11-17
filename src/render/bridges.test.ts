import { describe, expect, it } from "vitest";
import { countBridges } from "./bridges.ts";

describe("countBridges", () => {
  it("隙間が 2r 未満の対だけを数える", () => {
    expect(countBridges([11.9, 12, 20], 6)).toBe(1);
  });

  it("すでに重なっている対は橋になる", () => {
    expect(countBridges([-2, 0], 6)).toBe(2);
  });
});
