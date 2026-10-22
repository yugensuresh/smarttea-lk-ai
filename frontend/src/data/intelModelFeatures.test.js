import { describe, expect, it } from "vitest";
import {
  buildQualityStiiPayload,
  buildTeaQualityPayload,
  buildStrictFeaturePayload,
  emptyQualityStiiForm,
  emptySustainabilityForm,
  SUSTAINABILITY_FIELDS,
  validateIntelForm,
} from "./intelModelFeatures.js";

describe("intelModelFeatures", () => {
  it("buildTeaQualityPayload validates and returns six features", () => {
    const payload = buildTeaQualityPayload(emptyQualityStiiForm());
    expect(payload.features.elevation_m).toBe(1200);
    expect(payload.error).toBeUndefined();
  });

  it("buildQualityStiiPayload includes both feature blocks", () => {
    const form = emptyQualityStiiForm();
    const payload = buildQualityStiiPayload(form, form);
    expect(payload.teaQualityFeatures.temperature_c).toBe(24);
    expect(payload.sustainabilityFeatures.soil_ph).toBe(5.5);
  });

  it("buildQualityStiiPayload rejects empty required fields", () => {
    const form = { ...emptyQualityStiiForm(), temperature_c: "" };
    const payload = buildQualityStiiPayload(form, form);
    expect(payload.error).toMatch(/Missing/i);
  });

  it("validateIntelForm flags non-numeric values", () => {
    const form = { ...emptySustainabilityForm(), soil_ph: "bad" };
    const result = validateIntelForm(SUSTAINABILITY_FIELDS, form);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/Invalid/i);
  });

  it("buildStrictFeaturePayload uses only form values", () => {
    const form = { ...emptySustainabilityForm(), production_kg_per_day_monthly_average: "620" };
    const features = buildStrictFeaturePayload(SUSTAINABILITY_FIELDS, form);
    expect(features.production_kg_per_day_monthly_average).toBe(620);
  });
});
