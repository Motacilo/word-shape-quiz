import { describe, expect, it } from "vitest";
import { dilateMask } from "./dilate.ts";

function mask(width: number, height: number, ink: ReadonlyArray<[number, number]>): Uint8Array {
  const source = new Uint8Array(width * height);
  for (const [x, y] of ink) source[y * width + x] = 1;
  return source;
}

function on(source: Uint8Array, width: number, x: number, y: number): boolean {
  return source[y * width + x] === 1;
}

describe("dilateMask", () => {
  it("半径 0 はインクをそのまま残す", () => {
    const source = mask(3, 2, [[0, 1]]);
    const dilated = dilateMask(source, 3, 2, 0);
    expect(Array.from(dilated)).toEqual(Array.from(source));
  });

  it("半径 1 は上下左右へ広がり、斜めは残る", () => {
    const dilated = dilateMask(mask(5, 5, [[2, 2]]), 5, 5, 1);
    expect(on(dilated, 5, 2, 2)).toBe(true);
    expect(on(dilated, 5, 3, 2)).toBe(true);
    expect(on(dilated, 5, 2, 1)).toBe(true);
    expect(on(dilated, 5, 3, 3)).toBe(false);
  });

  it("半径 2 は軸上の距離 2 まで含み、角の距離は超える", () => {
    const dilated = dilateMask(mask(7, 7, [[3, 3]]), 7, 7, 2);
    expect(on(dilated, 7, 5, 3)).toBe(true);
    expect(on(dilated, 7, 6, 3)).toBe(false);
    expect(on(dilated, 7, 5, 5)).toBe(false);
  });

  it("離れた点は半径の 2 倍まで橋がかかる", () => {
    const dilated = dilateMask(mask(5, 1, [[0, 0], [4, 0]]), 5, 1, 2);
    expect(Array.from(dilated)).toEqual([1, 1, 1, 1, 1]);
    const short = dilateMask(mask(5, 1, [[0, 0], [4, 0]]), 5, 1, 1);
    expect(on(short, 5, 2, 0)).toBe(false);
  });

  it("矩形の辺は半径ぶん広がり、角は丸いままである", () => {
    const ink: Array<[number, number]> = [];
    for (let y = 15; y < 25; y++) {
      for (let x = 15; x < 25; x++) ink.push([x, y]);
    }
    const dilated = dilateMask(mask(40, 40, ink), 40, 40, 5);
    expect(on(dilated, 40, 10, 20)).toBe(true);
    expect(on(dilated, 40, 9, 20)).toBe(false);
    expect(on(dilated, 40, 10, 10)).toBe(false);
  });

  it("縦長の画像でも列方向に広がる", () => {
    const dilated = dilateMask(mask(2, 5, [[0, 3]]), 2, 5, 1);
    expect(on(dilated, 2, 0, 2)).toBe(true);
    expect(on(dilated, 2, 0, 4)).toBe(true);
    expect(on(dilated, 2, 1, 3)).toBe(true);
    expect(on(dilated, 2, 0, 1)).toBe(false);
  });
});
