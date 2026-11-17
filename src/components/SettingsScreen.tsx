import { playSound } from "../audio/sounds.ts";
import { QUIZ_FONTS, quizFontCaption } from "../game/options.ts";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export function SettingsScreen({
  volume,
  onVolume,
  onBack,
}: {
  volume: number;
  onVolume: (volume: number) => void;
  onBack: () => void;
}) {
  return (
    <main className="quiz">
      <div className="quiz-top">
        <h1>設定</h1>
        <button
          type="button"
          onClick={() => {
            playSound("decide");
            onBack();
          }}
        >
          戻る
        </button>
      </div>
      <p className="lede">音量は効果音に反映されます。</p>

      <section className="panel">
        <label className="field" htmlFor="volume">
          音量
          <input
            id="volume"
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => onVolume(Number(event.target.value))}
          />
          <span className="volume-readout">{volume}</span>
        </label>
      </section>

      <section className="panel" aria-labelledby="alphabet-heading">
        <h2 id="alphabet-heading">文字</h2>
        {QUIZ_FONTS.map((font) => (
          <div className="alphabet" key={font.id}>
            <p className="alphabet-label">
              <span style={{ fontFamily: `"${font.family}", sans-serif`, fontWeight: font.weight }}>
                {font.label}
              </span>
              <span className="font-caption">{quizFontCaption(font.id)}</span>
            </p>
            <p
              className="alphabet-letters"
              style={{ fontFamily: `"${font.family}", sans-serif`, fontWeight: font.weight }}
              aria-label={`${font.label} の a から z`}
            >
              {ALPHABET.split("").map((letter) => (
                <span key={letter}>{letter}</span>
              ))}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
