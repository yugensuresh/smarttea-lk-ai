/** Severity service meta — trained image model vs experimental heuristic. */
export function isValidatedSeverityModel(meta) {
  if (!meta || typeof meta !== "object") return false;
  const engine = String(meta.inferenceEngine ?? "");
  const note = String(meta.inferenceNote ?? meta.inference_note ?? "");
  if (engine.includes("heuristic")) return false;
  if (/model 01|classification confidence/i.test(note)) return false;
  return Boolean(meta.serviceConnected ?? meta.service_connected);
}

export function mapToDisplaySeverity(level) {
  const normalized = String(level ?? "").toLowerCase();
  if (normalized.includes("minimal") || normalized === "low" || normalized === "mild") return "Mild";
  if (normalized === "moderate") return "Moderate";
  if (
    normalized.includes("high") ||
    normalized.includes("critical") ||
    normalized.includes("severe")
  ) {
    return "Severe";
  }
  return null;
}

export function buildSeverityAssessContext(model01) {
  if (!model01?.classId) return null;
  return {
    classId: model01.classId,
    label: model01.label,
    confidence: model01.confidence,
  };
}

export function severityAssessEnabled({
  hasSpecimen,
  model01,
  allowExperimental,
  severityModelReady,
  assessing,
}) {
  const hasVerified = Boolean(model01?.classId);
  const canRunExperimental = hasSpecimen && hasVerified && allowExperimental && !severityModelReady;
  const canRunValidated = hasSpecimen && hasVerified && severityModelReady;
  return {
    canAssess: (canRunExperimental || canRunValidated) && !assessing,
    canRunExperimental,
    canRunValidated,
    hasVerified,
  };
}
