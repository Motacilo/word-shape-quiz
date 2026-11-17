import { describe, expect, it } from "vitest";
import { fillEnclosedHoles } from "./fillHoles.ts";

function mask(width: number, height: number, ink: ReadonlyArray<[number, number]>): Uint8Array {
  const source = new Uint8Array(width * height);
  for (const [x, y] of ink) source[y * width + x] = 1;
  return source;
}

describe("fillEnclosedHoles", () => {
  it("閉じた穴を塗り、外側の空白は残す", () => {
    const ink: Array<[number, number]> = [];
    for (let y = 2; y <= 4; y++) {
      for (let x = 2; x <= 4; x++) {
        if (x === 3 && y === 3) continue;
        ink.push([x, y]);
      }
    }
    const filled = fillEnclosedHoles(mask(7, 7, ink), 7, 7);
    expect(filled[3 * 7 + 3]).toBe(1);
    expect(filled[0]).toBe(0);
    expect(filled[2 * 7 + 2]).toBe(1);
  });

  it("外へ開いた隙間は塗らない", () => {
    const ink: Array<[number, number]> = [];
    for (let y = 2; y <= 4; y++) {
      for (let x = 2; x <= 4; x++) {
        if (x === 3 && y === 3) continue;
        if (x === 4 && y === 3) continue;
        ink.push([x, y]);
      }
    }
    const filled = fillEnclosedHoles(mask(7, 7, ink), 7, 7);
    expect(filled[3 * 7 + 3]).toBe(0);
  });
});
