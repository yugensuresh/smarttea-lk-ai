import { describe, expect, it } from "vitest";
import { normalizeSeverityProbabilitiesForPdvi } from "./pdviSeverityProbs.js";

describe("normalizeSeverityProbabilitiesForPdvi", () => {
  it("fills missing keys with zero when one class dominates (Model 02 inference shape)", () => {
    const out = normalizeSeverityProbabilitiesForPdvi({ Low: 1 });
    expect(out).toEqual({ Low: 1, Moderate: 0, High: 0, Severe: 0 });
  });

  it("renormalizes when sum is not 1", () => {
    const out = normalizeSeverityProbabilitiesForPdvi({ Low: 0.5, Moderate: 0.3 });
    expect(out.Low).toBeCloseTo(0.625);
    expect(out.Moderate).toBeCloseTo(0.375);
    expect(out.High).toBe(0);
    expect(out.Severe).toBe(0);
  });

  it("returns null for empty or all-zero input", () => {
    expect(normalizeSeverityProbabilitiesForPdvi(null)).toBeNull();
    expect(normalizeSeverityProbabilitiesForPdvi({})).toBeNull();
    expect(normalizeSeverityProbabilitiesForPdvi({ Low: 0, Moderate: 0, High: 0, Severe: 0 })).toBeNull();
  });

  it("rejects negative or non-finite values", () => {
    expect(normalizeSeverityProbabilitiesForPdvi({ Low: -0.2, Moderate: 1.2 })).toBeNull();
    expect(normalizeSeverityProbabilitiesForPdvi({ Low: NaN, Moderate: 1 })).toBeNull();
  });
});
