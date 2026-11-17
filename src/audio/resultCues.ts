export type ResultCue = "applauseLow" | "applauseMid" | "applauseHigh" | "fanfare";

export function resultCues(correct: number, total: number): ResultCue[] {
  if (total <= 0) return [];
  const ratio = correct / total;
  const cheer: ResultCue = ratio < 0.3 ? "applauseLow" : ratio < 0.7 ? "applauseMid" : "applauseHigh";
  return correct === total ? [cheer, "fanfare"] : [cheer];
}
