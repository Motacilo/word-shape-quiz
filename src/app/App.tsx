import { useEffect, useRef, useState, type ReactNode } from "react";
import { preloadSounds, setSoundVolume } from "../audio/sounds.ts";
import { HomeScreen } from "../components/HomeScreen.tsx";
import { QuizScreen } from "../components/QuizScreen.tsx";
import { ResultsScreen } from "../components/ResultsScreen.tsx";
import { SettingsScreen } from "../components/SettingsScreen.tsx";
import { WordsScreen } from "../components/WordsScreen.tsx";
import { QUIZ_WORDS } from "../data/quizWords.ts";
import { loadQuizFonts } from "../fonts/loadFonts.ts";
import {
  QUIZ_FONTS,
  questionLimit,
  type DifficultyRadius,
  type QuestionCount,
} from "../game/options.ts";
import { loadWordBook, markWord, saveWordBook, wordKey, type WordBook } from "../game/progress.ts";
import { buildRound, type RoundAnswer } from "../game/quiz.ts";

type Screen = "home" | "words" | "settings" | "quiz" | "results";

const FADE_MS = 220;
const cloudSrc = (file: string) => `${import.meta.env.BASE_URL}clouds/${file}`;

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [fade, setFade] = useState<"in" | "out">("in");
  const [radius, setRadius] = useState<DifficultyRadius>(16);
  const [fontId, setFontId] = useState(QUIZ_FONTS[0]?.id ?? "andika-bold");
  const [count, setCount] = useState<QuestionCount>(10);
  const [volume, setVolume] = useState(70);
  const [book, setBook] = useState<WordBook>(() => loadWordBook());
  const [questions, setQuestions] = useState<string[]>([]);
  const [results, setResults] = useState<RoundAnswer[]>([]);
  const [fontsReady, setFontsReady] = useState(false);
  const [fontError, setFontError] = useState<string | null>(null);
  const bookRef = useRef(book);
  const nextRef = useRef<Screen | null>(null);
  bookRef.current = book;
  const font = QUIZ_FONTS.find((item) => item.id === fontId) ?? QUIZ_FONTS[0];

  useEffect(() => {
    document.title = "もこもこ英単語クイズ";
    preloadSounds();
    let cancelled = false;
    loadQuizFonts()
      .then(() => {
        if (!cancelled) setFontsReady(true);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setFontError(caught instanceof Error ? caught.message : "フォントの読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSoundVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (fade !== "out") return;
    const id = window.setTimeout(() => {
      const next = nextRef.current;
      if (next) setScreen(next);
      setFade("in");
    }, FADE_MS);
    return () => window.clearTimeout(id);
  }, [fade]);

  const go = (next: Screen) => {
    if (fade === "out") {
      nextRef.current = next;
      return;
    }
    if (next === screen) return;
    nextRef.current = next;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setScreen(next);
      return;
    }
    setFade("out");
  };

  const mark = (word: string, correct: boolean) => {
    const next = markWord(bookRef.current, wordKey(fontId, radius, word), correct);
    bookRef.current = next;
    setBook(next);
    saveWordBook(next);
  };

  const start = () => {
    setQuestions(buildRound(questionLimit(count, QUIZ_WORDS.length), QUIZ_WORDS));
    setResults([]);
    go("quiz");
  };

  let content: ReactNode;
  if (screen === "words") {
    content = <WordsScreen book={book} onHome={() => go("home")} />;
  } else if (screen === "settings") {
    content = (
      <SettingsScreen volume={volume} onVolume={setVolume} onBack={() => go("home")} />
    );
  } else if (screen === "quiz" && font) {
    content = (
      <QuizScreen
        font={font}
        radius={radius}
        questions={questions}
        onMark={mark}
        onFinish={(answers) => {
          setResults(answers);
          go("results");
        }}
        onHome={() => go("home")}
      />
    );
  } else if (screen === "results" && font) {
    content = (
      <ResultsScreen font={font} answers={results} onHome={() => go("home")} onRetry={start} />
    );
  } else {
    content = (
      <HomeScreen
        radius={radius}
        fontId={fontId}
        count={count}
        fontsReady={fontsReady}
        fontError={fontError}
        onRadius={setRadius}
        onFont={setFontId}
        onCount={setCount}
        onStart={start}
        onOpenWords={() => go("words")}
        onOpenSettings={() => go("settings")}
      />
    );
  }

  return (
    <>
      <div className="sky-art" aria-hidden="true">
        <img className="cloud-tl" src={cloudSrc("white-01.png")} alt="" />
        <img className="cloud-tr" src={cloudSrc("white-03.png")} alt="" />
        <img className="cloud-tc" src={cloudSrc("fluffy-04.png")} alt="" />
        <img className="cloud-ml" src={cloudSrc("white-02.png")} alt="" />
        <img className="cloud-mr" src={cloudSrc("fluffy-07.png")} alt="" />
        <img className="cloud-fl" src={cloudSrc("fluffy-02.png")} alt="" />
        <img className="cloud-fr" src={cloudSrc("fluffy-03.png")} alt="" />
        <img className="cloud-bl" src={cloudSrc("white-04.png")} alt="" />
        <img className="cloud-br" src={cloudSrc("white-06.png")} alt="" />
        <img className="cloud-bc" src={cloudSrc("white-05.png")} alt="" />
      </div>
      <div className={fade === "out" ? "screen-stage is-out" : "screen-stage is-in"}>{content}</div>
    </>
  );
}
