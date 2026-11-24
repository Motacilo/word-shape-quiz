const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return MIN_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/** 上方向の移動量で拡大し、下方向で元の拡大率まで戻す。 */
export function zoomByDelta(current: number, delta: number): number {
  return clampZoom(current * Math.exp(delta / 220));
}
