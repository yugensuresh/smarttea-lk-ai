import { diseaseClassForModel02 } from "../data/model02Features";
import { confidenceAsFraction } from "./leafWorkflow";
import { isVerifiedModel01Record } from "./model01Session";
import { normalizeSeverityProbabilitiesForPdvi } from "./pdviSeverityProbs";

/** Prerequisites for POST /api/v1/predict/pdvi (Model 01 + Model 02 severity probs). */
export function getPdviPrerequisites(workflow) {
  const hasSpecimen = Boolean(workflow?.specimen);
  const hasModel01 = isVerifiedModel01Record(workflow?.model01);
  const isHealthy = workflow?.model01?.classId === "healthy";
  const hasPdviDisease =
    hasModel01 && diseaseClassForModel02(workflow.model01.classId) != null;
  const normalizedSeverity = normalizeSeverityProbabilitiesForPdvi(
    workflow?.model02?.severityProbabilitiesForPdvi,
  );
  const hasModel02 = normalizedSeverity != null;
  return {
    hasSpecimen,
    hasModel01,
    hasModel02,
    hasPdviDisease,
    isHealthy,
    normalizedSeverity,
    ready: hasPdviDisease && hasModel02,
  };
}

export function getPdviStatusCopy(prereq) {
  if (!prereq.hasModel01) {
    return {
      model01Status: "Required",
      model02Status: prereq.hasModel02 ? "Complete" : "Required",
      emptyState:
        "Complete Disease Detection first — analyze a leaf image with the verified Keras model.",
      calculateBlockedReason: "Disease Detection must be completed before PDVI can run.",
    };
  }
  if (prereq.isHealthy || !prereq.hasPdviDisease) {
    return {
      model01Status: prereq.isHealthy ? "Healthy" : "Complete",
      model02Status: prereq.hasModel02 ? "Complete" : "Required",
      emptyState:
        "Model 01 predicted Healthy — PDVI uses disease confidence and is not applicable for this specimen.",
      calculateBlockedReason: "PDVI requires a diseased leaf prediction from Model 01.",
    };
  }
  if (!prereq.hasModel02) {
    return {
      model01Status: "Complete",
      model02Status: "Required",
      emptyState:
        "Environmental Risk must be run successfully so severity probabilities are saved for this session.",
      calculateBlockedReason: "Run Environmental Risk prediction to supply Model 02 severity probabilities.",
    };
  }
  return {
    model01Status: "Complete",
    model02Status: "Complete",
    emptyState: "Prerequisites are complete — use Calculate PDVI to run the session formula.",
    calculateBlockedReason: null,
  };
}

export function buildPdviPredictBody(workflow) {
  const prereq = getPdviPrerequisites(workflow);
  if (!prereq.ready) {
    return { error: getPdviStatusCopy(prereq).calculateBlockedReason ?? "Prerequisites incomplete." };
  }
  return {
    body: {
      model01Disease: diseaseClassForModel02(workflow.model01.classId),
      model01Confidence: confidenceAsFraction(workflow.model01.confidence),
      severityProbabilities: prereq.normalizedSeverity,
    },
  };
}

/** Rebuild UI payload from session-stored PDVI (after successful Calculate). */
export function sessionPdviViewFromWorkflow(workflow) {
  const stored = workflow?.pdvi;
  if (stored?.score == null || Number.isNaN(Number(stored.score))) return null;
  const score = Number(stored.score);
  return {
    hasFormulaCalculation: true,
    sessionLinked: true,
    model02Linked: true,
    source: "api",
    calculation: stored.calculation ?? { pdviScore: score, band: stored.band },
    meta: {
      band: stored.band ?? stored.calculation?.band ?? null,
      score,
      scoreExact: score,
      scoreDisplayRounded: Math.round(score),
      scoreIsFromFormula: true,
      inferenceEngine: stored.calculation?.inferenceEngine ?? "pdvi-formula-v1",
    },
  };
}
