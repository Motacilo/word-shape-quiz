import { describe, expect, it } from "vitest";
import { outlineMask } from "./outline.ts";

describe("outlineMask", () => {
  it("塊の縁だけを輪郭にし、内側は残す", () => {
    const width = 9;
    const height = 9;
    const source = new Uint8Array(width * height);
    for (let y = 3; y <= 5; y++) {
      for (let x = 3; x <= 5; x++) source[y * width + x] = 1;
    }
    const edge = outlineMask(source, width, height, 1);
    expect(edge[4 * width + 4]).toBe(0);
    expect(edge[4 * width + 3]).toBe(1);
    expect(edge[0]).toBe(0);
  });
});
