import { dilateMask } from "./dilate.ts";

// インクのうち、背景から半径 r 以内の部分を輪郭にする。
export function outlineMask(
  source: Uint8Array,
  width: number,
  height: number,
  radiusPx: number,
): Uint8Array {
  const edge = new Uint8Array(source.length);
  if (radiusPx <= 0) return edge;
  const background = new Uint8Array(source.length);
  for (let i = 0; i < source.length; i++) background[i] = source[i] ? 0 : 1;
  const nearBackground = dilateMask(background, width, height, radiusPx);
  for (let i = 0; i < source.length; i++) edge[i] = source[i] && nearBackground[i] ? 1 : 0;
  return edge;
}
