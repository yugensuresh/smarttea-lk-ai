import { KERAS_INFERENCE_ENGINE, resolveInferenceEngine } from "./model01Session";

/** Export enabled only for verified Keras Model 01 on the current successful analysis. */
export function canExportDiseaseReport({ phase, diagnosis, predictionRaw, sessionSaved }) {
  if (phase !== "result" || !diagnosis || !sessionSaved) return false;
  const engine = resolveInferenceEngine(predictionRaw, diagnosis);
  return engine === KERAS_INFERENCE_ENGINE;
}

export function diseaseReportFilename(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
  return `SmartTea-LK_Disease_Report_${stamp}.pdf`;
}
