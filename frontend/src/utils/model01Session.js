/** Must match backend Keras disease model identifier. */
export const KERAS_INFERENCE_ENGINE = "keras-efficientnetb0-v1";

export function resolveInferenceEngine(raw, diagnosis) {
  return raw?.inferenceEngine ?? raw?.inference_engine ?? diagnosis?.inferenceEngine ?? null;
}

export function isVerifiedKerasEngine(raw, diagnosis) {
  return resolveInferenceEngine(raw, diagnosis) === KERAS_INFERENCE_ENGINE;
}

export function isVerifiedModel01Record(model01) {
  if (!model01?.classId) return false;
  return String(model01.inferenceEngine ?? "") === KERAS_INFERENCE_ENGINE;
}
