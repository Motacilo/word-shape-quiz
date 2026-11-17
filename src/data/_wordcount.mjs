import { writeFileSync } from "node:fs";

const raw = `
apple book moon little dragon fish mountain eye school happy bridge puzzle
cat dog bird horse tiger rabbit monkey elephant lion bear pig cow sheep chicken duck frog snake mouse whale panda fox wolf bee butterfly dolphin penguin zebra giraffe
bread rice milk water egg cake cheese butter meat banana orange grape lemon tomato potato carrot onion salad soup pizza hamburger sandwich cookie chocolate coffee tea juice sugar salt breakfast lunch dinner restaurant honey jam corn peach melon cherry strawberry noodle vegetable fruit food
teacher student class classroom pen pencil notebook desk chair library homework test question answer english math science history music art sport friend study lesson dictionary eraser ruler paper bag uniform club team practice exam college subject
ear nose mouth hand foot head hair face arm leg finger tooth heart body
family father mother parent brother sister baby child boy girl man woman people doctor nurse farmer king queen
house home room door window kitchen bed table clock picture phone computer camera television radio mirror box key cup glass plate bowl spoon fork knife bottle map letter card money photo ball toy gift hat shoe shirt coat dress pocket umbrella watch ring
bicycle car bus train plane ship boat station park hospital store shop bank hotel airport museum zoo farm city town village street road country japan america china england france australia office factory church castle robot
red blue green yellow black white brown pink purple
one two three four five six seven eight nine ten hundred thousand
time today tomorrow yesterday morning afternoon evening night week month year spring summer autumn winter
monday tuesday wednesday thursday friday saturday sunday
january february march april may june july august september october november december
hour minute birthday holiday christmas season
see look eat drink play run walk swim sing dance sleep open close buy make take give have like love want know think help work live visit enjoy start stop study read write speak listen talk ask meet call use try find come draw cook wash drive ride jump sit stand smile laugh cry teach travel finish remember understand watch
big small long short new old young good bad hot cold fast slow easy hard kind nice great high strong clean busy free early late famous hungry tired sick fine large tall dark soft heavy rich poor glad sorry angry quiet ready sweet best beautiful interesting important difficult delicious wonderful popular special useful favorite different exciting dangerous expensive cute funny
color number story song game movie dream idea world please thank hello welcome goodbye name problem future language culture group weather news hope
`.trim().split(/\s+/);
const remove = new Set(`
dolphin penguin zebra giraffe wolf fox whale bee
honey jam corn peach melon cherry noodle cookie salt sugar vegetable fruit
fork knife spoon bowl plate bottle mirror pocket ring umbrella television camera radio glass cup key box map letter card photo toy
factory church office hotel bank airport museum village
farmer
glad poor rich soft heavy dark cute funny tall large
draw drive ride jump wash cook cry laugh teach travel finish sit stand
culture language group news
thousand
snake frog mouse duck sheep butterfly
grape lemon salad soup
gift hat coat dress
store farm town street road
enjoy visit dance sing close meet
hundred
college subject exam uniform club team eraser ruler notebook practice
australia france england china
robot castle
finger tooth
parent
boat
`.trim().split(/\s+/));
const extraRemove = new Set(`
king queen
movie problem hope idea dream
fine sick ready sweet
useful popular special exciting
holiday season minute hour
money paper desk clock ball picture
juice coffee tea cheese butter onion
`.trim().split(/\s+/));
const extraAdd = `
sun star sky cloud rain snow wind river sea tree flower grass garden
day sad
always usually often sometimes never
soccer baseball tennis basketball
`.trim().split(/\s+/);
const kept = [...raw.filter((w) => !remove.has(w) && !extraRemove.has(w)), ...extraAdd].map((w) =>
  w === "sport" ? "sports" : w,
);
const missingRemove = [...remove].filter((w) => !raw.includes(w));
console.log("removed", remove.size, "missing from raw", missingRemove.join(" "));
const bad = kept.filter((w) => !/^[a-z]+$/.test(w) || w.length < 3 || w.length > 12);
const seen = new Map();
for (const w of kept) seen.set(w, (seen.get(w) || 0) + 1);
const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([w]) => w);
const uniq = [...new Set(kept)].sort();
const originals = "apple book moon little dragon fish mountain eye school happy bridge puzzle".split(" ");
const missingOriginals = originals.filter((w) => !uniq.includes(w));
console.log("raw", raw.length, "unique", uniq.length);
console.log("dupes", dupes.join(" "));
console.log("bad", bad.join(" "));
console.log("missing originals", missingOriginals.join(" "));
console.log("longest", uniq.slice().sort((a, b) => b.length - a.length).slice(0, 12).join(" "));
const body = uniq.map((w) => `  "${w}",`).join("\n");
writeFileSync(
  new URL("./quizWords.ts", import.meta.url),
  `/** 授業で出てきやすい英単語。実験用の12語とは別に、クイズと単語一覧が使う。 */\nexport const QUIZ_WORDS = [\n${body}\n] as const;\n`,
);

