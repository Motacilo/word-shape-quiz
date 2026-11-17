// 外とつながっていない空白をインクにする。輪郭で閉じた穴が残らない。
export function fillEnclosedHoles(source: Uint8Array, width: number, height: number): Uint8Array {
  const exterior = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const push = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (source[index] || exterior[index]) return;
    exterior[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    if (height > 1) push(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    push(0, y);
    if (width > 1) push(width - 1, y);
  }

  while (head < tail) {
    const index = queue[head] ?? 0;
    head += 1;
    const x = index % width;
    const y = (index - x) / width;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const out = new Uint8Array(width * height);
  for (let i = 0; i < out.length; i++) out[i] = exterior[i] ? 0 : 1;
  return out;
}
