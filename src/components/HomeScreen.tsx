import { useLayoutEffect, useRef, useState } from "react";
import { playSound } from "../audio/sounds.ts";
import { renderWordShape } from "../render/renderShape.ts";
import type { QuizFont } from "../fonts/loadFonts.ts";
import {
  DIFFICULTIES,
  QUESTION_CHOICES,
  QUIZ_FONTS,
  QUIZ_THEME,
  quizFontCaption,
  type DifficultyRadius,
  type QuestionCount,
} from "../game/options.ts";

export function HomeScreen({
  radius,
  fontId,
  count,
  fontsReady,
  fontError,
  onRadius,
  onFont,
  onCount,
  onStart,
  onOpenWords,
  onOpenSettings,
  onOpenLicenses,
}: {
  radius: DifficultyRadius;
  fontId: string;
  count: QuestionCount;
  fontsReady: boolean;
  fontError: string | null;
  onRadius: (radius: DifficultyRadius) => void;
  onFont: (fontId: string) => void;
  onCount: (count: QuestionCount) => void;
  onStart: () => void;
  onOpenWords: () => void;
  onOpenSettings: () => void;
  onOpenLicenses: () => void;
}) {
  const font = QUIZ_FONTS.find((item) => item.id === fontId) ?? QUIZ_FONTS[0];
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleCanvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [titleDrawn, setTitleDrawn] = useState(false);

  useLayoutEffect(() => {
    const heading = titleRef.current;
    const canvas = titleCanvasRef.current;
    if (!heading || !canvas) return;
    let cancelled = false;
    const draw = () => {
      void (async () => {
      if (cancelled || !heading || !canvas) return;
      const fontSize = Number.parseFloat(getComputedStyle(heading).fontSize);
      await document.fonts.load(`400 ${fontSize}px "Mochiy Pop One"`);
      if (cancelled || !heading || !canvas) return;
      const style = getComputedStyle(heading);
      const weight = Number.parseInt(style.fontWeight, 10);
      try {
        const metrics = renderWordShape(canvas, {
          text: "もこもこ英単語クイズ",
          fontFamily: style.fontFamily,
          fontWeight: Number.isFinite(weight) ? weight : 400,
          fontSize,
          dilationRadius: Math.round(fontSize * 0.5),
          tracking: 0,
          fillColor: QUIZ_THEME.play.fill,
          backgroundColor: "transparent",
          outlineColor: QUIZ_THEME.play.outline,
          outlineWidth: 2,
          letterColor: "#0878b8",
          pixelRatio: Math.min(2, window.devicePixelRatio || 1),
          method: "stroke",
        });
        canvas.style.width = `min(100%, ${metrics.cssWidth}px)`;
        canvas.style.height = "auto";
        setTitleDrawn(true);
      } catch {
        setTitleDrawn(false);
      }
      })();
    };
    void document.fonts.ready.then(draw);
    window.addEventListener("resize", draw);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", draw);
    };
  }, []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const sync = () => {
      const groups = [...panel.querySelectorAll<HTMLElement>(".choices")];
      for (const group of groups) {
        const buttons = [...group.querySelectorAll<HTMLButtonElement>("button")];
        for (const button of buttons) {
          button.style.minWidth = "";
          button.style.minHeight = "";
        }
        const widest = Math.max(...buttons.map((button) => button.offsetWidth));
        const tallest = Math.max(...buttons.map((button) => button.offsetHeight));
        const width = `${Math.ceil(widest)}px`;
        const height = `${Math.ceil(tallest)}px`;
        for (const button of buttons) {
          button.style.minWidth = width;
          button.style.minHeight = height;
        }
      }
    };
    let cancelled = false;
    const run = () => {
      if (!cancelled) sync();
    };
    run();
    void document.fonts.ready.then(run);
    window.addEventListener("resize", run);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", run);
    };
  }, [fontsReady]);

  return (
    <main className="quiz home">
      <header className="home-hero">
        <h1 ref={titleRef} className={titleDrawn ? "title-shape is-drawn" : "title-shape"}>
          <canvas ref={titleCanvasRef} aria-hidden="true" />
          <span className="title-shape-label">もこもこ英単語クイズ</span>
        </h1>
        <p>形を見て当てます。</p>
      </header>

      <section ref={panelRef} className="panel setup-panel">
        <button
          className="gear-button"
          type="button"
          aria-label="設定"
          onClick={() => {
            playSound("decide");
            onOpenSettings();
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.4 1.05.73 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.58-.21 1.13-.54 1.63-.94l2.39.96c.24.1.51 0 .64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"
            />
          </svg>
        </button>
        <fieldset className="choice-group">
          <legend>難易度</legend>
          <div className="choices difficulty-choices">
            {DIFFICULTIES.map((item) => (
              <button
                key={item.radius}
                type="button"
                aria-pressed={radius === item.radius}
                onClick={() => {
                  playSound("decide");
                  onRadius(item.radius);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="choice-group">
          <legend>フォント</legend>
          <div className="choices font-choices">
            {QUIZ_FONTS.map((item) => (
              <div className="font-choice" key={item.id}>
                <button
                  type="button"
                  aria-pressed={fontId === item.id}
                  aria-label={item.label}
                style={fontButtonStyle(item)}
                  onClick={() => {
                    playSound("decide");
                    onFont(item.id);
                  }}
                >
                  <span>
                    {item.label.split(" ").map((part, index) => (
                      <span key={part}>
                        {index > 0 ? <br /> : null}
                        {part}
                      </span>
                    ))}
                  </span>
                </button>
                <span className="font-caption">{quizFontCaption(item.id)}</span>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="choice-group">
          <legend>問題数</legend>
          <div className="choices">
            {QUESTION_CHOICES.map((item) => (
              <button
                key={item.count}
                type="button"
                aria-pressed={count === item.count}
                onClick={() => {
                  playSound("decide");
                  onCount(item.count);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="home-actions">
          <button
            className="start-button"
            type="button"
            disabled={!fontsReady || !font}
            onClick={() => {
              playSound("start");
              onStart();
            }}
          >
            スタート
          </button>
          <button
            className="words-button"
            type="button"
            onClick={() => {
              playSound("decide");
              onOpenWords();
            }}
          >
            単語一覧
          </button>
        </div>
        {fontError ? <p className="error">{fontError}</p> : null}
        {!fontsReady && !fontError ? <p className="status">フォントを読み込んでいます</p> : null}
      </section>
      <p className="home-foot">
        <button
          className="text-button"
          type="button"
          onClick={() => {
            playSound("decide");
            onOpenLicenses();
          }}
        >
          ライセンス
        </button>
        <a
          className="text-button"
          href="https://motacilo.com/privacy/word-shape-quiz.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          プライバシーポリシー
        </a>
      </p>
    </main>
  );
}

function fontButtonStyle(font: QuizFont): { fontFamily: string; fontWeight: number } {
  return {
    fontFamily: `"${font.family}", sans-serif`,
    fontWeight: font.weight,
  };
}
