import { describe, expect, it } from "vitest";
import { canExportDiseaseReport, diseaseReportFilename } from "./diseaseExport.js";
import { KERAS_INFERENCE_ENGINE } from "./model01Session.js";

describe("diseaseExport", () => {
  it("canExportDiseaseReport requires verified keras session result", () => {
    expect(
      canExportDiseaseReport({
        phase: "result",
        diagnosis: { classId: "blister" },
        predictionRaw: { inferenceEngine: KERAS_INFERENCE_ENGINE },
        sessionSaved: true,
      }),
    ).toBe(true);
    expect(
      canExportDiseaseReport({
        phase: "result",
        diagnosis: { classId: "blister" },
        predictionRaw: { inferenceEngine: "catalog-seed" },
        sessionSaved: true,
      }),
    ).toBe(false);
    expect(
      canExportDiseaseReport({
        phase: "selected",
        diagnosis: null,
        predictionRaw: null,
        sessionSaved: false,
      }),
    ).toBe(false);
  });

  it("diseaseReportFilename uses SmartTea-LK prefix and pdf extension", () => {
    const name = diseaseReportFilename(new Date("2026-03-15T09:07:00"));
    expect(name).toMatch(/^SmartTea-LK_Disease_Report_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.pdf$/);
  });
});
