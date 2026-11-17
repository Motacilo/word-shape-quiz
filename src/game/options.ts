import { QUIZ_FONT_FILES } from "../fonts/loadFonts.ts";

export const QUIZ_FONTS = QUIZ_FONT_FILES;

export function quizFontCaption(id: string): string {
  if (id === "andika-bold") return "ふつうにもこもこ";
  if (id === "jua") return "もっともこもこ";
  return "";
}

export const DIFFICULTIES = [
  { radius: 16, label: "易しい" },
  { radius: 24, label: "ふつう" },
  { radius: 32, label: "むずい" },
  { radius: 40, label: "雲" },
] as const;

export type DifficultyRadius = (typeof DIFFICULTIES)[number]["radius"];

export const QUESTION_CHOICES = [
  { count: 10, label: "10問" },
  { count: 30, label: "30問" },
  { count: 50, label: "50問" },
  { count: 100, label: "100問" },
  { count: "all", label: "全問" },
] as const;

export type QuestionCount = (typeof QUESTION_CHOICES)[number]["count"];

export function questionLimit(count: QuestionCount, available: number): number {
  const wanted = count === "all" ? available : count;
  return Math.min(wanted, Math.max(0, available));
}

export const QUIZ_BACKGROUND = "#FFFFFF";

export const QUIZ_THEME = {
  play: { fill: "#E9F8FF", outline: "#1AA3E0", letter: "#1AA3E0" },
  correct: { fill: "#FFF4F5", outline: "#FF4D5A", letter: "#FF4D5A" },
  wrong: { fill: "#F3F6FB", outline: "#1B3A6B", letter: "#1B3A6B" },
} as const;

export const QUIZ_FILL = QUIZ_THEME.play.fill;
export const QUIZ_OUTLINE = QUIZ_THEME.play.outline;

export function difficultyLabel(radius: number): string {
  return DIFFICULTIES.find((item) => item.radius === radius)?.label ?? `${radius}`;
}
