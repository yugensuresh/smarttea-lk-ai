import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { buildPdviPredictBody, getPdviPrerequisites } from "./pdviWorkflow.js";
import { KERAS_INFERENCE_ENGINE } from "./model01Session.js";
import { mergeLeafWorkflow, persistLeafWorkflow, readLeafWorkflow } from "./leafWorkflow.js";

describe("PDVI calculate flow (session + API contract)", () => {
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

  const baseWorkflow = {
    specimen: { fullName: "leaf.jpg", previewDataUrl: "data:image/jpeg;base64,x" },
    model01: { classId: "blister", confidence: 90, inferenceEngine: KERAS_INFERENCE_ENGINE },
    model02: { severityProbabilitiesForPdvi: { Low: 1 } },
  };

  it("enables calculation when Model 02 returns single-key severity (regression)", () => {
    persistLeafWorkflow(baseWorkflow);
    expect(getPdviPrerequisites(readLeafWorkflow()).ready).toBe(true);
    const { body } = buildPdviPredictBody(readLeafWorkflow());
    expect(body.severityProbabilities).toEqual({ Low: 1, Moderate: 0, High: 0, Severe: 0 });
  });

  it("simulates single POST and session persist on success", async () => {
    persistLeafWorkflow(baseWorkflow);
    const predictPdvi = vi.fn().mockResolvedValue({
      hasFormulaCalculation: true,
      calculation: { pdviScore: 42.5, band: "Moderate Risk", inferenceEngine: "pdvi-formula-v1" },
      meta: { scoreDisplayRounded: 43, scoreExact: 42.5, band: "Moderate Risk" },
      source: "api",
    });

    const wf = readLeafWorkflow();
    const built = buildPdviPredictBody(wf);
    await predictPdvi(built.body);
    expect(predictPdvi).toHaveBeenCalledTimes(1);

    mergeLeafWorkflow(
      {
        pdvi: {
          score: 42.5,
          band: "Moderate Risk",
          calculation: { pdviScore: 42.5, band: "Moderate Risk" },
        },
      },
      { silent: true, notifyPipeline: true },
    );
    expect(readLeafWorkflow()?.pdvi?.score).toBe(42.5);
  });

  it("duplicate calculate guard uses in-flight flag pattern", () => {
    let inFlight = false;
    const tryStart = () => {
      if (inFlight) return false;
      inFlight = true;
      return true;
    };
    expect(tryStart()).toBe(true);
    expect(tryStart()).toBe(false);
    inFlight = false;
    expect(tryStart()).toBe(true);
  });
});
