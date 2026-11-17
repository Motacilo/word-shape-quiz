export type WordRecord = {
  answered: boolean;
  correct: boolean;
};

export type WordBook = Record<string, WordRecord>;

const STORAGE_KEY = "shape-word-quiz.words.v1";

export function wordKey(fontId: string, radius: number, word: string): string {
  return `${fontId}|${radius}|${word}`;
}

export function markWord(book: WordBook, key: string, correct: boolean): WordBook {
  const current = book[key];
  return {
    ...book,
    [key]: {
      answered: true,
      correct: Boolean(current?.correct) || correct,
    },
  };
}

export function wasCorrect(book: WordBook, fontId: string, radius: number, word: string): boolean {
  return book[wordKey(fontId, radius, word)]?.correct === true;
}

export function listAnswered(
  book: WordBook,
  fontId: string,
  radius: number,
  words: readonly string[],
): { word: string; correct: boolean }[] {
  return words.flatMap((word) => {
    const record = book[wordKey(fontId, radius, word)];
    if (!record?.answered) return [];
    return [{ word, correct: record.correct }];
  });
}

export function loadWordBook(): WordBook {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const book: WordBook = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const answered = (value as { answered?: unknown }).answered;
      const correct = (value as { correct?: unknown }).correct;
      if (answered !== true) continue;
      book[key] = { answered: true, correct: correct === true };
    }
    return book;
  } catch {
    return {};
  }
}

export function saveWordBook(book: WordBook): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
}
