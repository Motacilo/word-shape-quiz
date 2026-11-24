import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { playSound } from "../audio/sounds.ts";
import type { QuizFont } from "../fonts/loadFonts.ts";
import { QUIZ_BACKGROUND, QUIZ_THEME, difficultyLabel } from "../game/options.ts";
import { alphabetFromCode, editGuess, judgeAnswer, keepHalfWidth, type RoundAnswer } from "../game/quiz.ts";
import { renderWordShape } from "../render/renderShape.ts";
import { ShapeZoom } from "./ShapeZoom.tsx";

type Phase = "play" | "correct" | "wrong";

export function QuizScreen({
  font,
  radius,
  questions,
  onMark,
  onFinish,
  onHome,
}: {
  font: QuizFont;
  radius: number;
  questions: readonly string[];
  onMark: (word: string, correct: boolean) => void;
  onFinish: (answers: RoundAnswer[]) => void;
  onHome: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [phase, setPhase] = useState<Phase>("play");
  const [notice, setNotice] = useState("");
  const [drawError, setDrawError] = useState<string | null>(null);
  const answersRef = useRef<RoundAnswer[]>([]);
  const phaseRef = useRef<Phase>("play");
  const advancing = useRef(false);
  const composingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shapeRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const guessRef = useRef("");
  const endingIme = useRef(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomOpenRef = useRef(false);
  const [directAlphabet] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(any-hover: hover)").matches &&
      window.matchMedia("(any-pointer: fine)").matches,
  );
  const word = questions[index] ?? null;
  const last = index + 1 >= questions.length;
  phaseRef.current = phase;
  guessRef.current = guess;
  zoomOpenRef.current = zoomOpen;

  useEffect(() => {
    const canvas = canvasRef.current;
    const shape = shapeRef.current;
    if (!canvas || !shape || !word) return;
    const theme = phase === "correct" ? QUIZ_THEME.correct : phase === "wrong" ? QUIZ_THEME.wrong : QUIZ_THEME.play;
    try {
      const metrics = renderWordShape(canvas, {
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
        pixelRatio: Math.min(2, window.devicePixelRatio || 1),
        method: "stroke",
      });
      shape.style.width = `min(100%, ${metrics.cssWidth}px)`;
      canvas.style.removeProperty("width");
      canvas.style.removeProperty("height");
      setDrawError(null);
    } catch (caught) {
      setDrawError(caught instanceof Error ? caught.message : "描画に失敗しました");
    }
  }, [word, radius, font, phase]);

  useEffect(() => {
    const root = document.documentElement;
    const { body } = document;
    const viewport = window.visualViewport;
    root.classList.add("quiz-lock");
    const pin = () => {
      const height = viewport?.height ?? window.innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      root.style.setProperty("--quiz-viewport", `${height}px`);
      body.style.transform = offset > 0 ? `translateY(${offset}px)` : "";
      if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
    };
    pin();
    viewport?.addEventListener("resize", pin);
    viewport?.addEventListener("scroll", pin);
    window.addEventListener("scroll", pin, { passive: true });
    return () => {
      root.classList.remove("quiz-lock");
      root.style.removeProperty("--quiz-viewport");
      body.style.transform = "";
      viewport?.removeEventListener("resize", pin);
      viewport?.removeEventListener("scroll", pin);
      window.removeEventListener("scroll", pin);
    };
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.setAttribute("inputmode", "latin");
    input.setAttribute("lang", "en");
    input.setAttribute("autocorrect", "off");
  }, []);

  useEffect(() => {
    if (phase === "play" && !zoomOpen) inputRef.current?.focus();
  }, [word, phase, zoomOpen]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = caretRef.current;
    if (!input || caret === null) return;
    input.setSelectionRange(caret, caret);
    caretRef.current = null;
  }, [guess]);

  const commitGuess = (next: string, caret: number) => {
    guessRef.current = next;
    caretRef.current = caret;
    setGuess(next);
  };

  const settleAlphabet = (input: HTMLInputElement, value: string, caret: number) => {
    if (endingIme.current) return;
    endingIme.current = true;
    const pos = Math.max(0, Math.min(caret, value.length));
    try {
      input.readOnly = true;
      input.value = value;
      input.blur();
      input.focus({ preventScroll: true });
      input.value = value;
      input.setSelectionRange(pos, pos);
    } finally {
      endingIme.current = false;
      composingRef.current = false;
    }
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el || document.activeElement !== el) return;
      const settled = guessRef.current;
      if (el.value === settled) return;
      el.value = settled;
      const caret = Math.min(pos, settled.length);
      el.setSelectionRange(caret, caret);
    });
  };

  const advanceRef = useRef<() => void>(() => {});
  advanceRef.current = () => {
    if (phaseRef.current === "play" || advancing.current || !word) return;
    advancing.current = true;
    playSound("decide");
    const answers = [...answersRef.current, { word, correct: phaseRef.current === "correct" }];
    answersRef.current = answers;
    if (index + 1 >= questions.length) {
      onFinish(answers);
      return;
    }
    setIndex((current) => current + 1);
    guessRef.current = "";
    setGuess("");
    setPhase("play");
    setNotice("");
    window.setTimeout(() => {
      advancing.current = false;
    }, 0);
  };

  const submitRef = useRef<() => void>(() => {});
  submitRef.current = () => {
    if (!word || phaseRef.current !== "play") return;
    const result = judgeAnswer(guess, word);
    if (result === "empty") {
      setNotice("単語を入力してください");
      return;
    }
    if (result === "correct") {
      phaseRef.current = "correct";
      setPhase("correct");
      setNotice("");
      onMark(word, true);
      playSound("correct");
      return;
    }
    phaseRef.current = "wrong";
    setPhase("wrong");
    setNotice("");
    onMark(word, false);
    playSound("wrong");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (zoomOpenRef.current) return;
      if (event.key !== "Enter" || event.repeat || event.isComposing || composingRef.current) return;
      event.preventDefault();
      if (phaseRef.current === "play") submitRef.current();
      else advanceRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="quiz" data-phase={phase}>
      <div className="quiz-top">
        <p className="quiz-progress">
          {index + 1} / {questions.length}
          <span>
            {difficultyLabel(radius)} · {font.label}
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            playSound("decide");
            onHome();
          }}
        >
          ホームへ
        </button>
      </div>

      {drawError ? <p className="error">{drawError}</p> : null}

      <div
        className={phase === "play" ? "quiz-stage" : `quiz-stage is-${phase}`}
        role="button"
        tabIndex={0}
        aria-label="問題を拡大表示"
        onClick={() => setZoomOpen(true)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.stopPropagation();
          setZoomOpen(true);
        }}
      >
        <p className={phase === "play" ? "quiz-mark" : `quiz-mark is-${phase}`} aria-hidden="true">
          {phase === "correct" ? "〇" : phase === "wrong" ? "✕" : ""}
        </p>
        <div className="quiz-shape" ref={shapeRef}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={phase !== "play" && word ? `${word} の形状` : "単語の形状"}
          />
        </div>
      </div>

      <p className={phase === "play" && notice ? "quiz-notice" : "visually-hidden"} role="status">
        {phase === "correct" ? "正解" : phase === "wrong" ? "不正解" : notice}
      </p>

      <form
        className="quiz-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitRef.current();
        }}
      >
        <label className="field">
          英単語
          <input
            ref={inputRef}
            className="quiz-input"
            value={guess}
            disabled={phase !== "play"}
            readOnly={directAlphabet}
            aria-readonly={directAlphabet ? false : undefined}
            lang="en"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint={phase === "play" ? "go" : "next"}
            onFocus={() => {
              window.requestAnimationFrame(() => window.scrollTo(0, 0));
            }}
            onKeyDown={(event) => {
              if (!directAlphabet || event.ctrlKey || event.metaKey || event.altKey) return;
              const input = event.currentTarget;
              const start = input.selectionStart ?? guessRef.current.length;
              const end = input.selectionEnd ?? guessRef.current.length;
              const letter = alphabetFromCode(event.code, event.shiftKey, event.getModifierState("CapsLock"));
              const native = event.nativeEvent;
              const ime = native.isComposing || native.key === "Process" || native.keyCode === 229;
              if (letter) {
                event.preventDefault();
                const next = editGuess(guessRef.current, start, end, { type: "insert", text: letter });
                commitGuess(next.value, next.caret);
                if (ime) settleAlphabet(input, next.value, next.caret);
                return;
              }
              if (event.key === "Backspace" || event.key === "Delete" || event.code === "Backspace" || event.code === "Delete") {
                event.preventDefault();
                const next = editGuess(guessRef.current, start, end, {
                  type: event.key === "Delete" || event.code === "Delete" ? "delete" : "backspace",
                });
                commitGuess(next.value, next.caret);
                if (ime) settleAlphabet(input, next.value, next.caret);
              }
            }}
            onPaste={(event) => {
              event.preventDefault();
              const text = keepHalfWidth(event.clipboardData.getData("text"));
              const input = event.currentTarget;
              const start = input.selectionStart ?? guess.length;
              const end = input.selectionEnd ?? guess.length;
              const next = editGuess(guess, start, end, { type: "insert", text });
              commitGuess(next.value, next.caret);
            }}
            onChange={(event) => {
              if (directAlphabet) return;
              setGuess(keepHalfWidth(event.target.value));
            }}
            onCompositionStart={(event) => {
              if (!directAlphabet) {
                composingRef.current = true;
                return;
              }
              const input = event.currentTarget;
              const caret = caretRef.current ?? input.selectionStart ?? guessRef.current.length;
              settleAlphabet(input, guessRef.current, caret);
            }}
            onCompositionUpdate={(event) => {
              if (!directAlphabet || endingIme.current) return;
              event.currentTarget.value = guessRef.current;
            }}
            onCompositionEnd={(event) => {
              composingRef.current = false;
              if (!directAlphabet) {
                setGuess(keepHalfWidth(event.currentTarget.value));
                return;
              }
              const input = event.currentTarget;
              input.value = guessRef.current;
              const pos = caretRef.current ?? guessRef.current.length;
              input.setSelectionRange(pos, pos);
            }}
          />
        </label>
        <button className="primary answer-submit" type="submit" disabled={phase !== "play"}>
          答える
        </button>
        {phase !== "play" ? (
          <button className="primary answer-next" type="button" onClick={() => advanceRef.current()}>
            {last ? "結果を見る" : "次の問題"}
          </button>
        ) : null}
      </form>
      {phase !== "play" ? (
        <button className="primary answer-next answer-next-corner" type="button" onClick={() => advanceRef.current()}>
          {last ? "結果を見る" : "次の問題"}
        </button>
      ) : null}
      <ShapeZoom
        open={zoomOpen}
        word={word}
        font={font}
        radius={radius}
        phase={phase}
        onClose={() => setZoomOpen(false)}
      />
    </main>
  );
}
