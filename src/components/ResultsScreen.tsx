import { useEffect } from "react";
import { playResultSounds, playSound } from "../audio/sounds.ts";
import type { QuizFont } from "../fonts/loadFonts.ts";
import type { RoundAnswer } from "../game/quiz.ts";
import { QUIZ_THEME } from "../game/options.ts";

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
          onClick={() => {
            playSound("decide");
            onRetry();
          }}
        >
          もう一度
        </button>
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
    </main>
  );
}
