import { playSound } from "../audio/sounds.ts";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const FONTS = [
  {
    name: "Andika Bold",
    notice: "Copyright (c) 2004-2022 SIL International. Reserved Font Names “Andika” and “SIL”.",
    license: "fonts/OFL-Andika.txt",
  },
  {
    name: "Jua",
    notice: "Copyright 2018 The Jua Project Authors.",
    license: "fonts/OFL-Jua.txt",
  },
  {
    name: "Mochiy Pop One",
    notice: "Copyright 2020 The Mochiypop Project Authors (https://github.com/fontdasu/Mochiypop).",
    license: "fonts/rounded/mochiypopone-OFL.txt",
  },
] as const;

export function LicensesScreen({ onHome }: { onHome: () => void }) {
  return (
    <main className="quiz">
      <div className="quiz-top">
        <h1>ライセンス</h1>
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
      <p className="lede">このアプリに同梱しているフォントとライブラリです。</p>

      <section className="panel license-panel">
        <h2>フォント</h2>
        <p>SIL Open Font License 1.1</p>
        <ul>
          {FONTS.map((font) => (
            <li key={font.name}>
              <strong>{font.name}</strong>
              <span>{font.notice}</span>
              <a href={asset(font.license)}>ライセンス原文</a>
            </li>
          ))}
        </ul>

        <h2>ライブラリ</h2>
        <p>MIT License</p>
        <ul>
          <li>
            <strong>React、React DOM</strong>
            <span>Copyright (c) Meta Platforms, Inc. and affiliates.</span>
            <a href={asset("licenses/MIT.txt")}>ライセンス原文</a>
          </li>
        </ul>
      </section>
    </main>
  );
}
