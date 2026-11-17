// 隣り合うインクの隙間が 2r 未満なら、両側からの膨張がつながる。
export function countBridges(gaps: readonly number[], dilationRadius: number): number {
  const limit = dilationRadius * 2;
  let bridges = 0;
  for (const gap of gaps) {
    if (gap < limit) bridges += 1;
  }
  return bridges;
}
