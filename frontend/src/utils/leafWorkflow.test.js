import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mergeLeafWorkflow, persistLeafWorkflow, readLeafWorkflow } from "./leafWorkflow.js";

describe("leafWorkflow handoff", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", {
      store: {},
      setItem(key, value) {
        this.store[key] = value;
      },
      getItem(key) {
        return this.store[key] ?? null;
      },
    });
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists specimen preview for severity page", () => {
    persistLeafWorkflow({
      specimen: { fullName: "leaf.jpg", previewDataUrl: "data:image/jpeg;base64,abc" },
    });
    const wf = readLeafWorkflow();
    expect(wf?.specimen?.fullName).toBe("leaf.jpg");
  });

  it("clears pdvi when model02 inputs are updated", () => {
    persistLeafWorkflow({
      specimen: { fullName: "leaf.jpg", previewDataUrl: "data:image/jpeg;base64,abc" },
      model01: { classId: "blister" },
      model02: { severityProbabilitiesForPdvi: { Low: 0.25, Moderate: 0.25, High: 0.25, Severe: 0.25 } },
      pdvi: { score: 55, band: "Moderate Risk" },
    });
    mergeLeafWorkflow({
      model02: {
        severityProbabilitiesForPdvi: { Low: 0.05, Moderate: 0.05, High: 0.1, Severe: 0.8 },
      },
    });
    const wf = readLeafWorkflow();
    expect(wf?.pdvi).toBeNull();
    expect(wf?.model02?.severityProbabilitiesForPdvi?.Severe).toBe(0.8);
  });

  it("mergeLeafWorkflow can clear model01 when replacing specimen only", () => {
    persistLeafWorkflow({
      specimen: { fullName: "a.jpg", previewDataUrl: "data:image/jpeg;base64,a" },
      model01: { classId: "blister", inferenceEngine: "keras-efficientnetb0-v1" },
    });
    mergeLeafWorkflow({
      specimen: { fullName: "b.jpg", previewDataUrl: "data:image/jpeg;base64,b" },
      model01: null,
    });
    const wf = readLeafWorkflow();
    expect(wf?.specimen?.fullName).toBe("b.jpg");
    expect(wf?.model01).toBeNull();
  });

  /** Matches Severity Estimation attachLocalSpecimen session patch. */
  it("severity specimen replace clears model01, model02, and dependent pdvi", () => {
    persistLeafWorkflow({
      specimen: { fullName: "a.jpg", previewDataUrl: "data:image/jpeg;base64,a" },
      model01: { classId: "blister", inferenceEngine: "keras-efficientnetb0-v1", confidence: 88 },
      model02: {
        severityProbabilitiesForPdvi: { Low: 0.1, Moderate: 0.2, High: 0.3, Severe: 0.4 },
      },
      pdvi: { score: 62, band: "Moderate Risk" },
      sourcePage: "disease",
    });
    mergeLeafWorkflow({
      sourcePage: "severity",
      specimen: { fullName: "b.jpg", previewDataUrl: "data:image/jpeg;base64,b" },
      model01: null,
      model02: null,
    });
    const wf = readLeafWorkflow();
    expect(wf?.specimen?.fullName).toBe("b.jpg");
    expect(wf?.specimen?.previewDataUrl).toBe("data:image/jpeg;base64,b");
    expect(wf?.sourcePage).toBe("severity");
    expect(wf?.model01).toBeNull();
    expect(wf?.model02).toBeNull();
    expect(wf?.pdvi).toBeNull();
  });

  it("clearing model01 via merge clears dependent pdvi (disease replace flow)", () => {
    persistLeafWorkflow({
      specimen: { fullName: "a.jpg", previewDataUrl: "data:image/jpeg;base64,a" },
      model01: { classId: "blister", inferenceEngine: "keras-efficientnetb0-v1" },
      model02: { severityProbabilitiesForPdvi: { Low: 0.25, Moderate: 0.25, High: 0.25, Severe: 0.25 } },
      pdvi: { score: 40 },
    });
    mergeLeafWorkflow({ model01: null, model02: null, pdvi: null }, { silent: true });
    const wf = readLeafWorkflow();
    expect(wf?.model01).toBeNull();
    expect(wf?.pdvi).toBeNull();
  });

  it("severity specimen replace preserves unrelated session fields when present", () => {
    persistLeafWorkflow({
      specimen: { fullName: "a.jpg", previewDataUrl: "data:image/jpeg;base64,a" },
      model01: { classId: "grey" },
      model02: { severityProbabilitiesForPdvi: { Low: 0.25, Moderate: 0.25, High: 0.25, Severe: 0.25 } },
      pdvi: { score: 40 },
      updatedAt: "2020-01-01T00:00:00.000Z",
    });
    mergeLeafWorkflow({
      sourcePage: "severity",
      specimen: { fullName: "c.jpg", previewDataUrl: "data:image/jpeg;base64,c" },
      model01: null,
      model02: null,
    });
    const wf = readLeafWorkflow();
    expect(wf?.updatedAt).not.toBe("2020-01-01T00:00:00.000Z");
    expect(wf?.specimen?.fullName).toBe("c.jpg");
  });
});
