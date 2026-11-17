import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { playSound } from "../audio/sounds.ts";
import type { QuizFont } from "../fonts/loadFonts.ts";
import { QUIZ_BACKGROUND, QUIZ_THEME, difficultyLabel } from "../game/options.ts";
import { alphabetFromCode, editGuess, judgeAnswer, keepHalfWidth, type RoundAnswer } from "../game/quiz.ts";
import { renderWordShape } from "../render/renderShape.ts";

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
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      setDrawError(null);
    } catch (caught) {
      setDrawError(caught instanceof Error ? caught.message : "描画に失敗しました");
    }
  }, [word, radius, font, phase]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.setAttribute("inputmode", "latin");
    input.setAttribute("lang", "en");
    input.setAttribute("autocorrect", "off");
  }, []);

  useEffect(() => {
    if (phase === "play") inputRef.current?.focus();
  }, [word, phase]);

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

      <div className={phase === "play" ? "quiz-stage" : `quiz-stage is-${phase}`}>
        <div className="quiz-shape" ref={shapeRef}>
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={phase !== "play" && word ? `${word} の形状` : "単語の形状"}
          />
        </div>
      </div>

      <p className="quiz-notice" role="status">
        {phase === "play" ? (
          notice || <span className="quiz-hint">Enter でも答えられます。</span>
        ) : (
          <>
            <span className="quiz-result-label">{phase === "correct" ? "正解" : "不正解"}</span>
            <span className="quiz-hint">Enter で{last ? "結果へ" : "次へ"}</span>
          </>
        )}
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
    </main>
  );
}
