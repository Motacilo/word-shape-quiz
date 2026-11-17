import { playSound } from "../audio/sounds.ts";
import { QUIZ_WORDS } from "../data/quizWords.ts";
import { DIFFICULTIES, QUIZ_FONTS } from "../game/options.ts";
import { wasCorrect, type WordBook } from "../game/progress.ts";

export function WordsScreen({ book, onHome }: { book: WordBook; onHome: () => void }) {
  return (
    <main className="quiz words-screen">
      <div className="quiz-top">
        <h1>単語一覧</h1>
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
      <p className="lede">星は、その難易度とフォントで正解した印です。</p>
      <div className="word-table-wrap">
        <table className="word-table">
          <thead>
            <tr>
              <th className="word-col" rowSpan={2} scope="col">
                単語
              </th>
              {DIFFICULTIES.map((difficulty) => (
                <th key={difficulty.radius} scope="colgroup" colSpan={QUIZ_FONTS.length}>
                  {difficulty.label}
                </th>
              ))}
            </tr>
            <tr>
              {DIFFICULTIES.flatMap((difficulty) =>
                QUIZ_FONTS.map((font) => (
                  <th key={`${difficulty.radius}-${font.id}`} scope="col">
                    {font.label}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {QUIZ_WORDS.map((word) => (
              <tr key={word}>
                <th className="word-col" scope="row">
                  {word}
                </th>
                {DIFFICULTIES.flatMap((difficulty) =>
                  QUIZ_FONTS.map((font) => {
                    const correct = wasCorrect(book, font.id, difficulty.radius, word);
                    return (
                      <td key={`${difficulty.radius}-${font.id}`} aria-label={correct ? "正解" : "未正解"}>
                        {correct ? (
                          <span className="star" aria-hidden="true">
                            ★
                          </span>
                        ) : null}
                      </td>
                    );
                  }),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
