import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync(new URL("../src/data/quizWords.ts", import.meta.url), "utf8");
const existing = [...src.matchAll(/"([a-z]+)"/g)].map((match) => match[1]);
const add = `
ant bee deer dolphin duck fox frog kangaroo mouse penguin sheep snake whale wolf zebra
bean butter cheese coffee cookie corn fruit grape honey jam juice lemon melon noodle onion peach pie salad salt soup sugar tea toast
back cap coat dress finger glove hat jacket knee neck pocket shoulder skirt sock sweater tooth uniform
airport bank beach castle farm forest hill hotel island lake market museum office pool road store street temple town village
chalk classmate club desk eraser exam globe grade map notebook page practice ruler subject team textbook
actor artist aunt baker cousin driver farmer grandfather grandmother parent pilot singer uncle
bring build carry catch climb cook draw dream drive enjoy fall finish fly grow hold hope join jump keep laugh learn leave meet move need paint push ride sing sit stand stay teach tell turn visit wait wash wear win
afraid brave bright cheap cool cute dark dirty excited funny heavy lucky popular pretty ready safe sick smart soft special sunny sweet tall thirsty warm windy wrong
ball boat box camera card clock cup gift glass guitar ice key letter mirror money movie photo piano picture robot
camp picnic skate volleyball
calendar hour minute
hear right
`
  .trim()
  .split(/\s+/);

const all = [...existing, ...add].sort();
const bad = all.filter((word) => !/^[a-z]{3,12}$/.test(word));
const dups = all.filter((word, index) => all.indexOf(word) !== index);
if (bad.length || dups.length || all.length !== 500 || add.length !== 200 || existing.length !== 300) {
  console.error(JSON.stringify({ existing: existing.length, add: add.length, all: all.length, bad, dups }, null, 2));
  process.exit(1);
}

const body = all.map((word) => `  "${word}",`).join("\n");
const out = `/** クイズと単語一覧が使う英単語。中学校の授業で出てきやすい語を中心にしている。 */\nexport const QUIZ_WORDS = [\n${body}\n] as const;\n`;
writeFileSync(new URL("../src/data/quizWords.ts", import.meta.url), out);
console.log("wrote", all.length);
