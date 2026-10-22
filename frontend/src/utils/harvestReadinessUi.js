import { maturityStatus } from "../data/harvestModelFeatures";

export function applyReadinessPrediction(field, prediction) {
  const inferenceFailed = Boolean(prediction?.error) || prediction?.inferenceEngine === "error";
  const maturity = Math.round(Number(prediction.maturityIndex ?? 0));
  const isReady = Boolean(prediction.ready);
  const { status, tone } = inferenceFailed
    ? { status: "UNAVAILABLE", tone: "not" }
    : maturityStatus(maturity, isReady);
  return {
    ...field,
    maturity,
    status,
    statusTone: tone,
    description: inferenceFailed
      ? `Readiness scoring failed: ${prediction.error}`
      : prediction.summary ??
        (maturity >= 25
          ? "Favorable microclimate for plucking at this elevation."
          : "Readiness is low — adjust rainfall/humidity or wait for the next window."),
    action: tone === "ready" ? "Assign Team" : tone === "near" ? "Monitor" : "Details",
    actionTone: tone === "ready" ? "primary" : tone === "near" ? "outline" : "ghost",
    prediction,
    mlFeatures: prediction.featuresUsed ?? field.mlFeatures,
    stats: {
      ...field.stats,
      secondary: {
        label: "Model readiness",
        value: inferenceFailed
          ? "Unavailable"
          : (prediction.readinessLabel ?? prediction.readiness_label ?? "—"),
        warn: inferenceFailed || tone === "not",
      },
      spark: [8, 9, 10, 11, 12, 13, Math.max(1, Math.round(maturity / 5))],
    },
  };
}

export function computeEstateOverview(fields) {
  let ready = 0;
  let near = 0;
  let not = 0;
  for (const field of fields) {
    if (field.statusTone === "ready") ready += 1;
    else if (field.statusTone === "near") near += 1;
    else not += 1;
  }
  const total = Math.max(1, ready + near + not);
  return {
    readyPercent: Math.round((ready * 100) / total),
    legend: [
      { label: "Ready Now", count: ready, tone: "ready" },
      { label: "Nearly Ready", count: near, tone: "near" },
      { label: "Not Ready", count: not, tone: "not" },
    ],
  };
}

export function featuresToFormValues(schema, features) {
  if (!features) return null;
  const values = {};
  for (const field of schema) {
    const v = features[field.key];
    values[field.key] = v != null ? String(v) : field.default ?? "";
  }
  return values;
}
