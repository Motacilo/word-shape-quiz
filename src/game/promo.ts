export const AUTHOR_X_URL = "https://x.com/motaciloBlanka";

const STORAGE_KEY = "shape-word-quiz.x-promo.v1";

export type PromoRecord = {
  never: boolean;
  shownOn: string | null;
  shownLastTime: boolean;
};

export function emptyPromo(): PromoRecord {
  return { never: false, shownOn: null, shownLastTime: false };
}

export function todayKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shouldShowPromo(record: PromoRecord, today: string): boolean {
  if (record.never) return false;
  if (record.shownLastTime) return false;
  if (record.shownOn === today) return false;
  return true;
}

export function promoAfterShow(today: string, never: boolean): PromoRecord {
  return { never, shownOn: today, shownLastTime: true };
}

export function promoAfterSkip(record: PromoRecord): PromoRecord {
  return { ...record, shownLastTime: false };
}

export function loadPromo(): PromoRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPromo();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyPromo();
    const shownOnRaw = (parsed as { shownOn?: unknown }).shownOn;
    const shownOn = typeof shownOnRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(shownOnRaw) ? shownOnRaw : null;
    return {
      never: (parsed as { never?: unknown }).never === true,
      shownOn,
      shownLastTime: (parsed as { shownLastTime?: unknown }).shownLastTime === true,
    };
  } catch {
    return emptyPromo();
  }
}

export function savePromo(record: PromoRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}
