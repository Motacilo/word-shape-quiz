import { useEffect, useRef, useState } from "react";
import type { QuizFont } from "../fonts/loadFonts.ts";
import { QUIZ_BACKGROUND, QUIZ_THEME } from "../game/options.ts";
import { zoomByDelta } from "../game/zoom.ts";
import { renderWordShape } from "../render/renderShape.ts";

type Phase = "play" | "correct" | "wrong";

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
  const zoomRef = useRef(1);
  const dragged = useRef(false);
  const [zoom, setZoom] = useState(1);
  zoomRef.current = zoom;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setZoom(1);
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
          backgroundColor: QUIZ_BACKGROUND,
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
      const maxWidth = dialog.clientWidth * 0.88;
      const maxHeight = dialog.clientHeight * 0.76;
      const scale = Math.min(maxWidth / metrics.cssWidth, maxHeight / metrics.cssHeight);
      canvas.style.width = `${metrics.cssWidth * scale}px`;
      canvas.style.height = `${metrics.cssHeight * scale}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [open, word, font, radius, phase]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    let startY = 0;
    let startZoom = 1;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => zoomByDelta(current, -event.deltaY));
    };
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startY = event.touches[0]!.clientY;
      startZoom = zoomRef.current;
      dragged.current = false;
    };
    const onMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const delta = startY - event.touches[0]!.clientY;
      if (Math.abs(delta) > 8) dragged.current = true;
      event.preventDefault();
      setZoom(zoomByDelta(startZoom, delta));
    };
    dialog.addEventListener("wheel", onWheel, { passive: false });
    dialog.addEventListener("touchstart", onStart, { passive: true });
    dialog.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      dialog.removeEventListener("wheel", onWheel);
      dialog.removeEventListener("touchstart", onStart);
      dialog.removeEventListener("touchmove", onMove);
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
        if (target instanceof Element && target.closest("button, canvas")) return;
        onClose();
      }}
    >
      <button className="text-button zoom-close" type="button" onClick={onClose}>
        閉じる
      </button>
      <canvas
        ref={canvasRef}
        style={{ transform: `scale(${zoom})` }}
        role="img"
        aria-label={phase !== "play" && word ? `${word} の形状` : "単語の形状"}
      />
    </dialog>
  );
}
