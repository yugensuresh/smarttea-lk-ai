import { describe, expect, it } from "vitest";

function normalizeScore(data) {
  const calculation = data?.calculation ?? null;
  const rawMeta = data?.meta ?? {};
  const formulaScore =
    calculation?.pdviScore != null ? Number(calculation.pdviScore) : calculation?.score != null ? Number(calculation.score) : null;
  const metaScore =
    rawMeta.pdviScoreExact != null ? Number(rawMeta.pdviScoreExact) : rawMeta.score != null ? Number(rawMeta.score) : null;
  return formulaScore ?? metaScore;
}

describe("pdviApi score mapping", () => {
  it("prefers calculation pdviScore over static catalog meta", () => {
    const low = normalizeScore({
      meta: { score: 72 },
      calculation: { pdviScore: 41.2 },
    });
    const high = normalizeScore({
      meta: { score: 72 },
      calculation: { pdviScore: 88.6 },
    });
    expect(low).toBe(41.2);
    expect(high).toBe(88.6);
    expect(low).not.toBe(high);
  });
});
