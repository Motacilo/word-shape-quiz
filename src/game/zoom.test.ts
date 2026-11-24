import { describe, expect, it } from "vitest";
import { clampZoom, zoomByDelta } from "./zoom.ts";

describe("zoomByDelta", () => {
  it("上へ動かすと拡大する", () => {
    expect(zoomByDelta(1, 80)).toBeGreaterThan(1);
  });

  it("下へ動かすと、最初の大きさより小さくならない", () => {
    expect(zoomByDelta(1, -80)).toBe(1);
  });

  it("拡大には上限がある", () => {
    expect(clampZoom(20)).toBe(6);
    expect(zoomByDelta(6, 400)).toBe(6);
  });
});
