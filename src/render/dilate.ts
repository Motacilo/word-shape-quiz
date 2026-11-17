const EMPTY = 1e12;

// Felzenszwalb & Huttenlocher の 1 次元二乗距離変換。
function edt1d(f: Float64Array, n: number, out: Float64Array): void {
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  let k = 0;
  v[0] = 0;
  z[0] = Number.NEGATIVE_INFINITY;
  z[1] = Number.POSITIVE_INFINITY;

  for (let q = 1; q < n; q++) {
    let s = separate(f, v[k] ?? 0, q);
    while (s <= (z[k] ?? Number.NEGATIVE_INFINITY)) {
      k -= 1;
      s = separate(f, v[k] ?? 0, q);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Number.POSITIVE_INFINITY;
  }

  k = 0;
  for (let q = 0; q < n; q++) {
    while ((z[k + 1] ?? Number.POSITIVE_INFINITY) < q) k += 1;
    const dx = q - (v[k] ?? 0);
    out[q] = dx * dx + (f[v[k] ?? 0] ?? EMPTY);
  }
}

function separate(f: Float64Array, p: number, q: number): number {
  return (f[q]! + q * q - (f[p]! + p * p)) / (2 * q - 2 * p);
}

// 前景を半径 r だけ外側へ広げる。穴は同じ半径だけ狭まる。
export function dilateMask(
  source: Uint8Array,
  width: number,
  height: number,
  radius: number,
): Uint8Array {
  const out = new Uint8Array(width * height);
  if (radius <= 0) {
    for (let i = 0; i < source.length; i++) out[i] = source[i] ? 1 : 0;
    return out;
  }

  const grid = new Float64Array(width * height);
  for (let i = 0; i < source.length; i++) grid[i] = source[i] ? 0 : EMPTY;

  const columnIn = new Float64Array(height);
  const columnOut = new Float64Array(height);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) columnIn[y] = grid[y * width + x] ?? EMPTY;
    edt1d(columnIn, height, columnOut);
    for (let y = 0; y < height; y++) grid[y * width + x] = columnOut[y] ?? EMPTY;
  }

  const rowIn = new Float64Array(width);
  const rowOut = new Float64Array(width);
  const limit = radius * radius;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) rowIn[x] = grid[y * width + x] ?? EMPTY;
    edt1d(rowIn, width, rowOut);
    for (let x = 0; x < width; x++) {
      out[y * width + x] = (rowOut[x] ?? EMPTY) <= limit ? 1 : 0;
    }
  }
  return out;
}
