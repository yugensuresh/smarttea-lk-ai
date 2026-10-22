import { describe, expect, it } from "vitest";
import {
  GRADE_QUALITY_SCORE,
  isLiveIntelBundle,
  isLiveIntelEngine,
  mapQualityStiiResponse,
  mapTeaQualityResponse,
  normalizeIntelOverview,
} from "./intelPresentation.js";

describe("intelPresentation", () => {
  it("maps grade quality scores for STII", () => {
    expect(GRADE_QUALITY_SCORE.A).toBe(92.5);
    expect(GRADE_QUALITY_SCORE.B).toBe(77.5);
    expect(GRADE_QUALITY_SCORE.C).toBe(60);
    expect(GRADE_QUALITY_SCORE.D).toBe(42.5);
  });

  it("detects live intel engines", () => {
    expect(isLiveIntelEngine("sklearn-gbc-tea-quality-v1")).toBe(true);
    expect(isLiveIntelEngine("catalog-fallback")).toBe(false);
    expect(isLiveIntelEngine("unavailable")).toBe(false);
  });

  it("normalizeIntelOverview prefers numeric quality score", () => {
    const view = normalizeIntelOverview({
      ok: true,
      inferenceEngine: "sklearn-gbc-tea-quality-v1",
      kpis: {
        teaGrade: "A",
        qualityScoreEquivalent: 92.5,
        teaQualityConfidence: 88,
        sustainabilityScore: 80,
        stiiScore: 86.25,
        stiiTier: "Excellent",
      },
    });
    expect(view.live).toBe(true);
    expect(view.qualityScoreEquivalent).toBe(92.5);
    expect(view.teaQualityConfidence).toBe(88);
  });

  it("mapTeaQualityResponse maps live Model 01 response", () => {
    const mapped = mapTeaQualityResponse({
      ok: true,
      teaGrade: "A",
      inferenceEngine: "sklearn-gbc-tea-quality-v1",
      probabilities: [{ grade: "A", probability: 0.88 }],
    });
    expect(mapped?.live).toBe(true);
    expect(mapped?.teaGrade).toBe("A");
    expect(mapped?.qualityScoreEquivalent).toBe(92.5);
    expect(mapped?.topClassProbabilityPct).toBe(88);
  });

  it("mapQualityStiiResponse reads API top-level and nested fields", () => {
    const mapped = mapQualityStiiResponse({
      ok: true,
      qualityScoreEquivalent: 77.5,
      stiiScore: 82.1,
      performanceTier: "Good",
      teaQuality: {
        teaGrade: "B",
        inferenceEngine: "sklearn-gbc-tea-quality-v1",
        probabilities: [{ grade: "B", probability: 0.91 }],
      },
      sustainability: {
        sustainabilityScore: 86.7,
        performanceLabel: "Excellent",
        inferenceEngine: "sklearn-rf-sustainability-v1",
      },
      stii: { inferenceEngine: "stii-formula-v1" },
    });
    expect(mapped.teaGrade).toBe("B");
    expect(mapped.qualityScoreEquivalent).toBe(77.5);
    expect(mapped.sustainabilityScore).toBe(86.7);
    expect(mapped.stiiScore).toBe(82.1);
    expect(mapped.live).toBe(true);
  });

  it("isLiveIntelBundle requires all three engines", () => {
    expect(
      isLiveIntelBundle({
        ok: true,
        teaQuality: { inferenceEngine: "sklearn-gbc-tea-quality-v1" },
        sustainability: { inferenceEngine: "sklearn-rf-sustainability-v1" },
        stii: { inferenceEngine: "stii-formula-v1" },
      }),
    ).toBe(true);
    expect(isLiveIntelBundle({ ok: false })).toBe(false);
  });
});
