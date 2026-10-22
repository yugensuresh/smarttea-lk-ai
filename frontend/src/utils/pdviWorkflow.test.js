import { describe, expect, it } from "vitest";
import {
  buildPdviPredictBody,
  getPdviPrerequisites,
  getPdviStatusCopy,
  sessionPdviViewFromWorkflow,
} from "./pdviWorkflow.js";
import { KERAS_INFERENCE_ENGINE } from "./model01Session.js";

const verifiedModel01 = {
  classId: "blister",
  confidence: 88,
  inferenceEngine: KERAS_INFERENCE_ENGINE,
};

describe("pdviWorkflow", () => {
  it("getPdviPrerequisites requires verified model01 and valid severity probs", () => {
    expect(getPdviPrerequisites(null).ready).toBe(false);
    expect(getPdviPrerequisites({ model01: { classId: "blister" } }).ready).toBe(false);
    expect(
      getPdviPrerequisites({
        model01: verifiedModel01,
        model02: { severityProbabilitiesForPdvi: { Low: 0.1, Moderate: 0.2, High: 0.3, Severe: 0.4 } },
      }).ready,
    ).toBe(true);
  });

  it("accepts partial severity keys from Model 02 inference", () => {
    const prereq = getPdviPrerequisites({
      model01: verifiedModel01,
      model02: { severityProbabilitiesForPdvi: { Low: 1 } },
    });
    expect(prereq.ready).toBe(true);
    expect(prereq.normalizedSeverity?.Severe).toBe(0);
  });

  it("blocks PDVI when Model 01 is healthy", () => {
    const prereq = getPdviPrerequisites({
      model01: { ...verifiedModel01, classId: "healthy" },
      model02: { severityProbabilitiesForPdvi: { Low: 0.25, Moderate: 0.25, High: 0.25, Severe: 0.25 } },
    });
    expect(prereq.ready).toBe(false);
    expect(getPdviStatusCopy(prereq).model01Status).toBe("Healthy");
    expect(getPdviStatusCopy(prereq).emptyState).toMatch(/Healthy/i);
    expect(getPdviStatusCopy(prereq).calculateBlockedReason).toMatch(/diseased/i);
  });

  it("getPdviStatusCopy explains missing Model 02", () => {
    const copy = getPdviStatusCopy(getPdviPrerequisites({ model01: verifiedModel01 }));
    expect(copy.model02Status).toBe("Required");
    expect(copy.emptyState).toMatch(/Environmental Risk/i);
  });

  it("buildPdviPredictBody returns error when prerequisites missing", () => {
    expect(buildPdviPredictBody({ model01: verifiedModel01 }).error).toMatch(/Environmental Risk/i);
  });

  it("buildPdviPredictBody maps disease class and confidence", () => {
    const { body } = buildPdviPredictBody({
      model01: verifiedModel01,
      model02: { severityProbabilitiesForPdvi: { Low: 0.25, Moderate: 0.25, High: 0.25, Severe: 0.25 } },
    });
    expect(body.model01Disease).toBe("Blister_Blight");
    expect(body.model01Confidence).toBeCloseTo(0.88);
    expect(body.severityProbabilities.Severe).toBe(0.25);
  });

  it("sessionPdviViewFromWorkflow rebuilds display from stored session", () => {
    const view = sessionPdviViewFromWorkflow({
      pdvi: { score: 41.2, band: "Moderate Risk", calculation: { pdviScore: 41.2, inferenceEngine: "pdvi-formula-v1" } },
    });
    expect(view?.hasFormulaCalculation).toBe(true);
    expect(view.meta.scoreDisplayRounded).toBe(41);
  });
});
