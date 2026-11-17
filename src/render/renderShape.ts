import { countBridges } from "./bridges.ts";
import { dilateMask } from "./dilate.ts";
import { fillEnclosedHoles } from "./fillHoles.ts";
import { outlineMask } from "./outline.ts";

export type RenderMethod = "dilate" | "stroke";

export type ShapeRenderParams = {
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  dilationRadius: number;
  tracking: number;
  fillColor: string;
  backgroundColor: string;
  outlineColor?: string;
  outlineWidth?: number;
  letterColor?: string;
  pixelRatio: number;
  method: RenderMethod;
};

export type ShapeMetrics = {
  cssWidth: number;
  cssHeight: number;
  gaps: number[];
  bridges: number;
};

type Glyph = {
  ch: string;
  advance: number;
  ascent: number;
  descent: number;
  left: number;
  right: number;
  origin: number;
};

export function renderWordShape(
  canvas: HTMLCanvasElement,
  params: ShapeRenderParams,
): ShapeMetrics {
  if (!params.text) throw new Error("描画する文字がありません");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("2d context を取得できません");

  const ratio = Math.max(1, params.pixelRatio);
  const fontPx = params.fontSize * ratio;
  const radiusPx = params.dilationRadius * ratio;
  const trackingPx = params.tracking * ratio;
  const pad = Math.ceil(radiusPx + ratio * 4);
  const placed = layoutGlyphs(context, params, fontPx, trackingPx);

  const inkLeft = Math.min(...placed.map((glyph) => glyph.origin - glyph.left));
  const inkRight = Math.max(...placed.map((glyph) => glyph.origin + glyph.right));
  const shift = pad - inkLeft;
  for (const glyph of placed) glyph.origin += shift;

  const maxAscent = Math.max(...placed.map((glyph) => glyph.ascent));
  const maxDescent = Math.max(...placed.map((glyph) => glyph.descent));
  const width = Math.ceil(inkRight + shift + pad);
  const height = Math.ceil(pad + maxAscent + maxDescent + pad);
  if (width > 4096 || height > 2048 || width < 1 || height < 1) {
    throw new Error(`描画サイズが範囲外です: ${width}×${height}`);
  }

  const gaps = placed.slice(0, -1).map((glyph, index) => {
    const next = placed[index + 1];
    if (!next) return 0;
    const gap = next.origin - next.left - (glyph.origin + glyph.right);
    return gap / ratio;
  });

  canvas.width = width;
  canvas.height = height;
  const baseline = pad + maxAscent;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  context.font = fontSpec(params, fontPx);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";

  if (params.method === "stroke") {
    paintStroke(context, placed, baseline, radiusPx, params);
  } else {
    paintDilated(context, placed, baseline, width, height, radiusPx, params);
  }

  if (params.letterColor) {
    context.font = fontSpec(params, fontPx);
    context.fillStyle = params.letterColor;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    for (const glyph of placed) context.fillText(glyph.ch, glyph.origin, baseline);
  }

  return {
    cssWidth: width / ratio,
    cssHeight: height / ratio,
    gaps,
    bridges: countBridges(gaps, params.dilationRadius),
  };
}

function layoutGlyphs(
  context: CanvasRenderingContext2D,
  params: ShapeRenderParams,
  fontPx: number,
  trackingPx: number,
): Glyph[] {
  context.font = fontSpec(params, fontPx);
  let cursor = 0;
  const glyphs = Array.from(params.text).map((ch, index, all) => {
    const measured = context.measureText(ch);
    const glyph: Glyph = {
      ch,
      advance: measured.width,
      ascent: measured.actualBoundingBoxAscent,
      descent: measured.actualBoundingBoxDescent,
      left: measured.actualBoundingBoxLeft,
      right: measured.actualBoundingBoxRight,
      origin: cursor,
    };
    if (glyph.advance <= 0 || glyph.ascent + glyph.descent <= 0) {
      throw new Error(`フォントがまだ適用されていません: ${params.fontFamily}`);
    }
    cursor += glyph.advance;
    if (index < all.length - 1) cursor += trackingPx;
    return glyph;
  });
  return glyphs;
}

function fontSpec(params: ShapeRenderParams, fontPx: number): string {
  const family = params.fontFamily.includes(",") ? params.fontFamily : `"${params.fontFamily}"`;
  return `${params.fontWeight} ${fontPx}px ${family}`;
}

function paintStroke(
  context: CanvasRenderingContext2D,
  placed: Glyph[],
  baseline: number,
  radiusPx: number,
  params: ShapeRenderParams,
): void {
  const { width, height } = context.canvas;
  context.strokeStyle = "#000000";
  context.fillStyle = "#000000";
  context.lineJoin = "round";
  context.lineCap = "round";
  // stroke は輪郭の両側へ広がる。外側の広がりを半径に揃える。
  context.lineWidth = radiusPx * 2;
  if (radiusPx > 0) {
    for (const glyph of placed) context.strokeText(glyph.ch, glyph.origin, baseline);
  }
  for (const glyph of placed) context.fillText(glyph.ch, glyph.origin, baseline);

  const image = context.getImageData(0, 0, width, height);
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = (image.data[i * 4 + 3] ?? 0) >= 128 ? 1 : 0;
  const solid = fillEnclosedHoles(mask, width, height);
  paintSolid(context, solid, params);
}

function paintDilated(
  context: CanvasRenderingContext2D,
  placed: Glyph[],
  baseline: number,
  width: number,
  height: number,
  radiusPx: number,
  params: ShapeRenderParams,
): void {
  context.fillStyle = "#000000";
  for (const glyph of placed) context.fillText(glyph.ch, glyph.origin, baseline);

  const image = context.getImageData(0, 0, width, height);
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = (image.data[i * 4 + 3] ?? 0) >= 128 ? 1 : 0;
  const dilated = dilateMask(mask, width, height, radiusPx);
  paintSolid(context, dilated, params);
}

function paintSolid(
  context: CanvasRenderingContext2D,
  mask: Uint8Array,
  params: ShapeRenderParams,
): void {
  const { width, height } = context.canvas;
  const image = context.createImageData(width, height);
  const fill = hexToRgb(params.fillColor);
  const background = params.backgroundColor === "transparent" ? null : hexToRgb(params.backgroundColor);
  const outline = params.outlineColor ? hexToRgb(params.outlineColor) : null;
  const outlinePx = outline ? Math.max(1, Math.round((params.outlineWidth ?? 2) * params.pixelRatio)) : 0;
  const edge = outline ? outlineMask(mask, width, height, outlinePx) : null;
  for (let i = 0; i < mask.length; i++) {
    const offset = i * 4;
    const color = edge?.[i] ? outline : mask[i] === 1 ? fill : background;
    if (!color) continue;
    image.data[offset] = color.r;
    image.data[offset + 1] = color.g;
    image.data[offset + 2] = color.b;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = Number.parseInt(hex.slice(1), 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}
