import { useEffect, useRef, useState } from "react";
import type { QuizFont } from "../fonts/loadFonts.ts";
import { QUIZ_THEME } from "../game/options.ts";
import { clampPan, zoomAtPoint, zoomByWheel, type ZoomView } from "../game/zoom.ts";
import { renderWordShape } from "../render/renderShape.ts";

type Phase = "play" | "correct" | "wrong";

const initialView: ZoomView = { zoom: 1, panX: 0, panY: 0 };

function hitsShape(canvas: HTMLCanvasElement, clientX: number, clientY: number): boolean {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;
  const x = Math.min(canvas.width - 1, Math.floor(((clientX - rect.left) / rect.width) * canvas.width));
  const y = Math.min(canvas.height - 1, Math.floor(((clientY - rect.top) / rect.height) * canvas.height));
  const context = canvas.getContext("2d");
  if (!context) return true;
  const pixel = context.getImageData(x, y, 1, 1).data;
  return (pixel[3] ?? 0) > 16;
}

export function ShapeZoom({
  open,
  word,
  font,
  radius,
  phase,
  onClose,
}: {
  open: boolean;
  word: string | null;
  font: QuizFont;
  radius: number;
  phase: Phase;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef({ ...initialView, width: 1, height: 1, viewW: 1, viewH: 1 });
  const dragged = useRef(false);
  const [view, setView] = useState<ZoomView>(initialView);

  const apply = (next: ZoomView) => {
    const box = viewRef.current;
    const pan = clampPan(next.panX, next.panY, next.zoom, box.width, box.height, box.viewW, box.viewH);
    const settled = { zoom: next.zoom, panX: pan.panX, panY: pan.panY };
    viewRef.current = { ...box, ...settled };
    setView(settled);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      viewRef.current = { ...viewRef.current, ...initialView };
      setView(initialView);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const dialog = dialogRef.current;
    if (!open || !canvas || !dialog || !word) return;
    const theme = phase === "correct" ? QUIZ_THEME.correct : phase === "wrong" ? QUIZ_THEME.wrong : QUIZ_THEME.play;
    const ratios = [3, 2, 1];
    let metrics: { cssWidth: number; cssHeight: number } | null = null;
    for (const pixelRatio of ratios) {
      try {
        metrics = renderWordShape(canvas, {
          text: word,
          fontFamily: font.family,
          fontWeight: font.weight,
          fontSize: 120,
          dilationRadius: radius,
          tracking: 0,
          fillColor: theme.fill,
          backgroundColor: "transparent",
          outlineColor: theme.outline,
          outlineWidth: 2,
          letterColor: phase === "play" ? undefined : theme.letter,
          pixelRatio,
          method: "stroke",
        });
        break;
      } catch {
        metrics = null;
      }
    }
    if (!metrics) return;

    const fit = () => {
      const maxWidth = dialog.clientWidth * 0.9;
      const maxHeight = dialog.clientHeight * 0.8;
      const scale = Math.min(maxWidth / metrics.cssWidth, maxHeight / metrics.cssHeight);
      const width = metrics.cssWidth * scale;
      const height = metrics.cssHeight * scale;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      viewRef.current.width = width;
      viewRef.current.height = height;
      viewRef.current.viewW = dialog.clientWidth;
      viewRef.current.viewH = dialog.clientHeight;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open, word, font, radius, phase]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const points = new Map<number, { x: number; y: number }>();
    type Gesture =
      | { kind: "none" }
      | { kind: "pan"; x: number; y: number; panX: number; panY: number }
      | { kind: "pinch"; dist: number; zoom: number; midX: number; midY: number; panX: number; panY: number };
    let gesture: Gesture = { kind: "none" };

    const originOf = (clientX: number, clientY: number) => {
      const rect = dialog.getBoundingClientRect();
      return { x: clientX - (rect.left + rect.width / 2), y: clientY - (rect.top + rect.height / 2) };
    };

    const begin = () => {
      const list = [...points.values()];
      const current = viewRef.current;
      if (list.length >= 2) {
        const [a, b] = list;
        if (!a || !b) return;
        gesture = {
          kind: "pinch",
          dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
          zoom: current.zoom,
          midX: (a.x + b.x) / 2,
          midY: (a.y + b.y) / 2,
          panX: current.panX,
          panY: current.panY,
        };
        return;
      }
      const only = list[0];
      if (!only) {
        gesture = { kind: "none" };
        return;
      }
      gesture = { kind: "pan", x: only.x, y: only.y, panX: current.panX, panY: current.panY };
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = viewRef.current;
      const origin = originOf(event.clientX, event.clientY);
      apply(zoomAtPoint(current, zoomByWheel(current.zoom, event.deltaY), origin.x, origin.y));
    };
    const onDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest("button")) return;
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
      dialog.setPointerCapture(event.pointerId);
      begin();
    };
    const onMove = (event: PointerEvent) => {
      if (!points.has(event.pointerId)) return;
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const list = [...points.values()];
      if (gesture.kind === "pinch" && list.length >= 2) {
        const [a, b] = list;
        if (!a || !b) return;
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        dragged.current = true;
        const origin = originOf(gesture.midX, gesture.midY);
        const zoomed = zoomAtPoint(
          { zoom: gesture.zoom, panX: gesture.panX, panY: gesture.panY },
          gesture.zoom * (dist / gesture.dist),
          origin.x,
          origin.y,
        );
        apply({ zoom: zoomed.zoom, panX: zoomed.panX + (midX - gesture.midX), panY: zoomed.panY + (midY - gesture.midY) });
        return;
      }
      if (gesture.kind === "pan" && list.length === 1) {
        const point = list[0];
        if (!point) return;
        const dx = point.x - gesture.x;
        const dy = point.y - gesture.y;
        if (Math.hypot(dx, dy) > 6) dragged.current = true;
        apply({ zoom: viewRef.current.zoom, panX: gesture.panX + dx, panY: gesture.panY + dy });
      }
    };
    const onUp = (event: PointerEvent) => {
      points.delete(event.pointerId);
      begin();
    };

    dialog.addEventListener("wheel", onWheel, { passive: false });
    dialog.addEventListener("pointerdown", onDown);
    dialog.addEventListener("pointermove", onMove);
    dialog.addEventListener("pointerup", onUp);
    dialog.addEventListener("pointercancel", onUp);
    return () => {
      dialog.removeEventListener("wheel", onWheel);
      dialog.removeEventListener("pointerdown", onDown);
      dialog.removeEventListener("pointermove", onMove);
      dialog.removeEventListener("pointerup", onUp);
      dialog.removeEventListener("pointercancel", onUp);
    };
  }, [open]);

  return (
    <dialog
      className="zoom-dialog"
      ref={dialogRef}
      aria-label="問題の拡大"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        const target = event.target;
        if (target instanceof Element && target.closest("button")) return;
        const canvas = canvasRef.current;
        if (canvas && hitsShape(canvas, event.clientX, event.clientY)) return;
        onClose();
      }}
    >
      <button className="text-button zoom-close" type="button" onClick={onClose}>
        閉じる
      </button>
      <canvas
        ref={canvasRef}
        style={{ transform: `translate(${view.panX}px, ${view.panY}px) scale(${view.zoom})` }}
        role="img"
        aria-label={phase !== "play" && word ? `${word} の形状` : "単語の形状"}
      />
    </dialog>
  );
}
