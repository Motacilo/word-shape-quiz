import { describe, expect, it } from "vitest";
import { clampPan, clampZoom, zoomAtPoint, zoomByWheel } from "./zoom.ts";

describe("zoom", () => {
  it("ホイールで拡大も縮小もできる", () => {
    expect(zoomByWheel(1, -120)).toBeGreaterThan(1);
    expect(zoomByWheel(1, 120)).toBeLessThan(1);
  });

  it("拡大率には下限と上限がある", () => {
    expect(clampZoom(0)).toBe(0.4);
    expect(clampZoom(20)).toBe(8);
  });

  it("ホイール位置の画像がずれない", () => {
    const next = zoomAtPoint({ zoom: 1, panX: 0, panY: 0 }, 2, 100, 40);
    expect(next.zoom).toBe(2);
    expect(next.panX).toBeCloseTo(-100);
    expect(next.panY).toBeCloseTo(-40);
  });

  it("ドラッグしても画面の外へ消えない", () => {
    const pan = clampPan(5000, -5000, 1, 200, 80, 400, 300);
    expect(pan.panX).toBeLessThan(5000);
    expect(pan.panY).toBeGreaterThan(-5000);
  });
});
