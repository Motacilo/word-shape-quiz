const MIN_ZOOM = 0.4;
const MAX_ZOOM = 8;

export type ZoomView = {
  zoom: number;
  panX: number;
  panY: number;
};

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function zoomByWheel(current: number, deltaY: number): number {
  return clampZoom(current * Math.exp(-deltaY / 280));
}

/** 画面上の origin の位置を保ったまま拡大率を変える。origin は画像の中心からの距離。 */
export function zoomAtPoint(view: ZoomView, nextZoom: number, originX: number, originY: number): ZoomView {
  const zoom = clampZoom(nextZoom);
  const ratio = view.zoom === 0 ? 1 : zoom / view.zoom;
  return {
    zoom,
    panX: originX * (1 - ratio) + view.panX * ratio,
    panY: originY * (1 - ratio) + view.panY * ratio,
  };
}

export function clampPan(
  panX: number,
  panY: number,
  zoom: number,
  width: number,
  height: number,
  viewWidth: number,
  viewHeight: number,
): { panX: number; panY: number } {
  const limitX = Math.max(0, viewWidth / 2 + (width * zoom) / 2 - 48);
  const limitY = Math.max(0, viewHeight / 2 + (height * zoom) / 2 - 48);
  return {
    panX: Math.min(limitX, Math.max(-limitX, panX)),
    panY: Math.min(limitY, Math.max(-limitY, panY)),
  };
}
