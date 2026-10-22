import { describe, expect, it } from "vitest";
import { parseModel01Softmax } from "../utils/diseaseSoftmax.js";

/** Regression: pct under 1.0 must not be treated as fractions when probability exists. */
describe("disease probability mapping regression", () => {
  it("legacy API rows with pct 0.6 and probability 0.006 sum to ~100%", () => {
    const parsed = parseModel01Softmax({
      classIndexOrder: ["blister", "grey", "redRust", "healthy"],
      softmaxVector: [0.006, 0.001, 0.009, 0.984],
    });
    expect(parsed.valid).toBe(true);
    const totalPct = parsed.items.reduce((s, row) => s + row.pct, 0);
    expect(totalPct).toBeGreaterThan(99);
    expect(totalPct).toBeLessThan(101);
    expect(parsed.items.find((r) => r.id === "redRust")?.pct).toBeLessThan(2);
  });
});
