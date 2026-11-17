export function alphabetFromCode(code: string, shiftKey: boolean, capsLock: boolean): string | null {
  const match = /^Key([A-Z])$/.exec(code);
  const letter = match?.[1];
  if (!letter) return null;
  return shiftKey !== capsLock ? letter : letter.toLowerCase();
}

export function editGuess(
  value: string,
  start: number,
  end: number,
  edit: { type: "insert"; text: string } | { type: "backspace" } | { type: "delete" },
): { value: string; caret: number } {
  const from = Math.max(0, Math.min(start, end, value.length));
  const to = Math.max(0, Math.min(Math.max(start, end), value.length));
  if (edit.type === "insert") {
    return { value: value.slice(0, from) + edit.text + value.slice(to), caret: from + edit.text.length };
  }
  if (from !== to) return { value: value.slice(0, from) + value.slice(to), caret: from };
  if (edit.type === "backspace") {
    if (from === 0) return { value, caret: 0 };
    return { value: value.slice(0, from - 1) + value.slice(to), caret: from - 1 };
  }
  if (from >= value.length) return { value, caret: from };
  return { value: value.slice(0, from) + value.slice(from + 1), caret: from };
}

export function keepHalfWidth(value: string): string {
  let result = "";
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    const half =
      code === 0x3000 ? 0x20 : code >= 0xff01 && code <= 0xff5e ? code - 0xfee0 : code;
    if (half >= 0x20 && half <= 0x7e) result += String.fromCharCode(half);
  }
  return result;
}

export function normalizeAnswer(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export function judgeAnswer(guess: string, answer: string): "empty" | "correct" | "wrong" {
  const normalized = normalizeAnswer(guess);
  if (!normalized) return "empty";
  return normalized === answer.toLowerCase() ? "correct" : "wrong";
}

export function takeNext(
  deck: readonly string[],
  last: string | null,
  words: readonly string[],
  random: () => number = Math.random,
): { word: string; deck: string[] } {
  let pool = [...deck];
  if (pool.length === 0) {
    const source = words.filter((word) => word !== last);
    pool = shuffle(source.length > 0 ? source : words, random);
  }
  const word = pool[0];
  if (!word) throw new Error("単語がありません");
  return { word, deck: pool.slice(1) };
}

export type RoundAnswer = {
  word: string;
  correct: boolean;
};

export function buildRound(
  count: number,
  words: readonly string[],
  random: () => number = Math.random,
): string[] {
  if (count < 1) throw new Error("問題数がありません");
  const round: string[] = [];
  let deck: string[] = [];
  let last: string | null = null;
  for (let index = 0; index < count; index += 1) {
    const drawn = takeNext(deck, last, words, random);
    round.push(drawn.word);
    deck = drawn.deck;
    last = drawn.word;
  }
  return round;
}

function shuffle(words: readonly string[], random: () => number): string[] {
  const next = [...words];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const current = next[index];
    const other = next[swap];
    if (current === undefined || other === undefined) continue;
    next[index] = other;
    next[swap] = current;
  }
  return next;
}
