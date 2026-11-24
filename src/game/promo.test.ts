import { describe, expect, it } from "vitest";
import { emptyPromo, promoAfterShow, promoAfterSkip, shouldShowPromo } from "./promo.ts";

describe("shouldShowPromo", () => {
  it("最初の終了後は出す", () => {
    expect(shouldShowPromo(emptyPromo(), "2026-11-24")).toBe(true);
  });

  it("出した直後の次は出さず、その次の日なら出す", () => {
    const shown = promoAfterShow("2026-11-24", false);
    expect(shouldShowPromo(shown, "2026-11-25")).toBe(false);
    const skipped = promoAfterSkip(shown);
    expect(shouldShowPromo(skipped, "2026-11-25")).toBe(true);
  });

  it("同じ日には一度まで", () => {
    const shown = promoAfterShow("2026-11-24", false);
    const skipped = promoAfterSkip(shown);
    expect(shouldShowPromo(skipped, "2026-11-24")).toBe(false);
  });

  it("二度と表示しないを選んだら、日が変わっても出さない", () => {
    const hidden = promoAfterShow("2026-11-24", true);
    const skipped = promoAfterSkip(hidden);
    expect(shouldShowPromo(skipped, "2026-12-01")).toBe(false);
  });
});
