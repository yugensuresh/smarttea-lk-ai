import { describe, expect, it, vi, beforeEach } from "vitest";

const outputBlob = new Blob(["%PDF-mock"], { type: "application/pdf" });

vi.mock("jspdf", () => ({
  jsPDF: class MockJsPDF {
    setFont() {}
    setFontSize() {}
    setTextColor() {}
    setDrawColor() {}
    text() {}
    line() {}
    addImage() {}
    addPage() {}
    splitTextToSize(text) {
      return [String(text)];
    }
    output() {
      return outputBlob;
    }
  },
}));

import { buildDiseaseReportPdf } from "./diseaseReportPdf.js";

describe("diseaseReportPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildDiseaseReportPdf returns pdf blob and formatted filename", async () => {
    const { blob, filename } = await buildDiseaseReportPdf({
      specimen: { fullName: "leaf.jpg", sizeLabel: "120 KB", dimensions: "800 × 600 px", format: "JPEG" },
      diagnosis: {
        classId: "blister",
        probability: 79.3,
        pathology: { label: "Blister Blight", scientific: "Exobasidium vexans", code: "INF-9821" },
        summary: "Summary text",
        nextSteps: ["Step one"],
        probabilities: [
          { id: "blister", label: "Blister Blight", pct: 79.3 },
          { id: "healthy", label: "Healthy", pct: 10.8 },
        ],
      },
      modelMeta: { name: "EfficientNet-B0 Keras", benchmarkAcc: 92.55 },
      inferenceEngine: "keras-efficientnetb0-v1",
      verified: true,
      severitySnapshot: {
        experimental: true,
        displayLevel: "Moderate",
        affectedPct: 12,
        explanation: "Heuristic note",
      },
      generatedAt: new Date("2026-01-02T14:30:00"),
    });
    expect(blob.type).toBe("application/pdf");
    expect(filename).toBe("SmartTea-LK_Disease_Report_2026-01-02_14-30.pdf");
  });
});
