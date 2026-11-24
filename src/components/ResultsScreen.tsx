import { useEffect, useRef, useState } from "react";
import { playResultSounds, playSound } from "../audio/sounds.ts";
import type { QuizFont } from "../fonts/loadFonts.ts";
import { QUIZ_THEME } from "../game/options.ts";
import {
  AUTHOR_X_URL,
  loadPromo,
  promoAfterShow,
  promoAfterSkip,
  savePromo,
  shouldShowPromo,
  todayKey,
} from "../game/promo.ts";
import type { RoundAnswer } from "../game/quiz.ts";

export function ResultsScreen({
  font,
  answers,
  onHome,
  onRetry,
}: {
  font: QuizFont;
  answers: readonly RoundAnswer[];
  onHome: () => void;
  onRetry: () => void;
}) {
  const correct = answers.filter((item) => item.correct).length;
  const perfect = answers.length > 0 && correct === answers.length;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pendingRef = useRef<(() => void) | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);
  const [neverAgain, setNeverAgain] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (promoOpen && !dialog.open) dialog.showModal();
    if (!promoOpen && dialog.open) dialog.close();
  }, [promoOpen]);

  const leave = (action: () => void) => {
    playSound("decide");
    const record = loadPromo();
    const today = todayKey();
    if (!shouldShowPromo(record, today)) {
      savePromo(promoAfterSkip(record));
      action();
      return;
    }
    pendingRef.current = action;
    setNeverAgain(false);
    setPromoOpen(true);
  };

  const closePromo = () => {
    savePromo(promoAfterShow(todayKey(), neverAgain));
    dialogRef.current?.close();
    setPromoOpen(false);
    const action = pendingRef.current;
    pendingRef.current = null;
    action?.();
  };

  useEffect(() => {
    const id = window.setTimeout(() => playResultSounds(correct, answers.length), 0);
    return () => window.clearTimeout(id);
  }, [correct, answers.length]);
  const style = {
    fontFamily: `"${font.family}", sans-serif`,
    fontWeight: font.weight,
  };

  return (
    <main className="quiz results-screen">
      <header className="home-hero">
        <h1>{perfect ? "全問正解" : "結果"}</h1>
        <p className="score">
          <span>
            {correct} / {answers.length}
          </span>
          <span className="score-unit">問 正解！</span>
        </p>
      </header>
      <div className="result-scroll">
        <ol className="result-list">
          {answers.map((item, index) => (
            <li key={`${item.word}-${index}`} className={item.correct ? "is-correct" : "is-wrong"}>
              <span style={{ ...style, color: item.correct ? QUIZ_THEME.correct.letter : QUIZ_THEME.wrong.letter }}>
                {item.word}
              </span>
              <span className={item.correct ? "result-ok" : "result-miss"}>
                {item.correct ? "正解" : "不正解"}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="home-actions result-actions">
        <button
          className="primary"
          type="button"
          onClick={() => leave(onRetry)}
        >
          もう一度
        </button>
        <button type="button" onClick={() => leave(onHome)}>
          ホームへ
        </button>
      </div>
      <dialog
        className="promo-dialog"
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          closePromo();
        }}
      >
        <h2>Xもぜひ！</h2>
        <p>
          他のアプリなども紹介しています。
          <br />
          ぜひフォローしてください！
        </p>
        <a className="promo-link" href={AUTHOR_X_URL} target="_blank" rel="noopener noreferrer">
          <img className="promo-icon" src={`${import.meta.env.BASE_URL}promo-icon.png`} alt="" />
          @motaciloBlanka
        </a>
        <label className="promo-check">
          <input
            type="checkbox"
            checked={neverAgain}
            onChange={(event) => setNeverAgain(event.target.checked)}
          />
          二度と表示しない
        </label>
        <button className="primary promo-close" type="button" onClick={closePromo}>
          閉じる
        </button>
      </dialog>
    </main>
  );
}
