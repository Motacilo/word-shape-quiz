import correctUrl from "../../assets/se/クイズ正解1.mp3";
import wrongUrl from "../../assets/se/クイズ不正解1.mp3";
import decideUrl from "../../assets/se/決定ボタンを押す3.mp3";
import startUrl from "../../assets/se/決定ボタンを押す24.mp3";
import applauseLowUrl from "../../assets/se/スタジアムの拍手.mp3";
import applauseMidUrl from "../../assets/se/歓声と拍手2.mp3";
import applauseHighUrl from "../../assets/se/歓声と拍手1.mp3";
import fanfareUrl from "../../assets/se/ラッパのファンファーレ.mp3";
import { resultCues, type ResultCue } from "./resultCues.ts";

export type SoundCue = "correct" | "wrong" | "decide" | "start" | ResultCue;

const sources: Record<SoundCue, string> = {
  correct: correctUrl,
  wrong: wrongUrl,
  decide: decideUrl,
  start: startUrl,
  applauseLow: applauseLowUrl,
  applauseMid: applauseMidUrl,
  applauseHigh: applauseHighUrl,
  fanfare: fanfareUrl,
};

const templates = new Map<SoundCue, HTMLAudioElement>();
let volume = 0.7;

function template(cue: SoundCue): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  const existing = templates.get(cue);
  if (existing) return existing;
  const audio = new Audio(sources[cue]);
  audio.preload = "auto";
  templates.set(cue, audio);
  return audio;
}

export function preloadSounds(): void {
  (Object.keys(sources) as SoundCue[]).forEach((cue) => {
    template(cue);
  });
}

export function setSoundVolume(value: number): void {
  volume = Math.min(1, Math.max(0, value / 100));
}

export function playSound(cue: SoundCue): void {
  const source = template(cue);
  if (!source || volume <= 0) return;
  const audio = source.cloneNode(true) as HTMLAudioElement;
  audio.volume = volume;
  void audio.play().catch(() => {});
}

export function playResultSounds(correct: number, total: number): void {
  for (const cue of resultCues(correct, total)) playSound(cue);
}
