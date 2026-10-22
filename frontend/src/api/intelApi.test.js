import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { predictQualityStii, predictSustainability } from "./intelApi.js";

describe("intelApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("window", {
      localStorage: { getItem: () => null },
      sessionStorage: { getItem: () => null },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("predictQualityStii sends teaQualityFeatures and sustainabilityFeatures", async () => {
    const payload = {
      teaQualityFeatures: { temperature_c: 24, elevation_m: 1200 },
      sustainabilityFeatures: { soil_ph: 5.5, elevation_m: 1200 },
    };
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        teaQuality: { teaGrade: "A", inferenceEngine: "sklearn-gbc-tea-quality-v1" },
        sustainability: { sustainabilityScore: 88, inferenceEngine: "sklearn-rf-sustainability-v1" },
        stii: { stii_score: 90, performance_tier: "Excellent", inferenceEngine: "stii-formula-v1" },
      }),
    });

    const result = await predictQualityStii(payload);
    expect(result.teaQuality.teaGrade).toBe("A");
    expect(fetch).toHaveBeenCalledOnce();
    const [, options] = fetch.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it("predictSustainability wraps features in a features object", async () => {
    const features = {
      elevation_m: 1200,
      soil_moisture_pct: 42,
      soil_ph: 5.5,
      rainfall_mm: 14,
      temperature_mean_c: 24,
      humidity_mean_pct: 85,
      et0_mm: 4.2,
      production_kg_per_day_monthly_average: 850,
    };
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        sustainabilityScore: 81.2,
        inferenceEngine: "sklearn-rf-sustainability-v1",
      }),
    });

    await predictSustainability(features);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toContain("/api/v1/intel/predict/sustainability");
    expect(JSON.parse(options.body)).toEqual({ features });
  });

  it("predictQualityStii throws when ok is false", async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: false, error: "Unavailable" }),
    });
    await expect(predictQualityStii({ teaQualityFeatures: {}, sustainabilityFeatures: {} })).rejects.toThrow(
      "Unavailable",
    );
  });
});
