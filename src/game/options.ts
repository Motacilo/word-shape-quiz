import { QUIZ_FONT_FILES } from "../fonts/loadFonts.ts";

export const QUIZ_FONTS = QUIZ_FONT_FILES;

export function quizFontCaption(id: string): string {
  if (id === "andika-bold") return "ふつうにもこもこ";
  if (id === "jua") return "もっともこもこ";
  return "";
}

export const DIFFICULTIES = [
  { radius: 8, label: "ほぼ文字" },
  { radius: 16, label: "かんたん" },
  { radius: 24, label: "ふつう" },
  { radius: 32, label: "むずい" },
  { radius: 40, label: "ほぼ雲" },
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
  correct: { fill: "#F2FBF4", outline: "#22AA4E", letter: "#22AA4E" },
  wrong: { fill: "#FFF0F2", outline: "#E2183C", letter: "#E2183C" },
} as const;

export const QUIZ_FILL = QUIZ_THEME.play.fill;
export const QUIZ_OUTLINE = QUIZ_THEME.play.outline;

export function difficultyLabel(radius: number): string {
  return DIFFICULTIES.find((item) => item.radius === radius)?.label ?? `${radius}`;
}
