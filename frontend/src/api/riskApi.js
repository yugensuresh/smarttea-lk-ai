import { apiFetch, pick } from "./apiClient";
import { normalizeSeverityProbabilitiesForPdvi } from "../utils/pdviSeverityProbs";
import {
  ACTION_PLAN as demoActionPlan,
  ENV_METRICS as demoEnvMetrics,
  HOURLY_TREND as demoHourlyTrend,
  MODEL_02_ENV_INPUTS as demoModelInputs,
  RISK_ALERT as demoRiskAlert,
  RISK_META as demoRiskMeta,
  TECHNICAL_INPUTS as demoTelemetry,
} from "../data/riskModel";

const SKLEARN_ENGINE = "sklearn-hgb-v1";

function mapMetric(raw) {
  return {
    id: raw.id ?? "",
    label: raw.label ?? "",
    value: String(raw.value ?? ""),
    unit: raw.unit ?? "",
    status: raw.status ?? "",
    statusIcon: pick(raw, "statusIcon", "status_icon") ?? "check",
    tone: raw.tone ?? "neutral",
    accent: raw.accent ?? "#1f8a4c",
    icon: raw.icon ?? "droplets",
    demo: Boolean(raw.demo),
  };
}

function mapHourlyPoint(raw) {
  return {
    label: raw.label ?? "",
    humidity: Number(raw.humidity ?? 0),
    temperature: Number(raw.temperature ?? 0),
    riskScore: Number(pick(raw, "riskScore", "risk_score") ?? 0),
    riskCategory: pick(raw, "riskCategory", "risk_category") ?? "Moderate",
    now: Boolean(raw.now),
  };
}

function mapPdviSeverityProbs(raw) {
  return normalizeSeverityProbabilitiesForPdvi(raw);
}

function normalizeRiskPayload(data, options = {}) {
  const { explicitDemo = false } = options;
  const prediction = data?.prediction ?? null;
  const inferenceEngine = pick(data?.meta, "inferenceEngine", "inference_engine") ?? prediction?.inferenceEngine ?? null;
  const inferenceRan = data?.meta?.inferenceRan === true;
  const isCatalogSnapshot =
    explicitDemo || inferenceEngine === "catalog-seed" || data?.meta?.contentSource === "catalog";
  const hasTrainedPrediction =
    !explicitDemo &&
    inferenceRan &&
    prediction != null &&
    inferenceEngine === SKLEARN_ENGINE;

  const meta = {
    ...(isCatalogSnapshot && !hasTrainedPrediction ? demoRiskMeta : {}),
    ...(data?.meta ?? data?.model ?? {}),
    serviceConnected: data?.meta?.serviceConnected ?? !explicitDemo,
    modelStatus:
      pick(data?.meta, "modelStatus", "model_status") ??
      (hasTrainedPrediction ? "HistGradientBoosting inference complete" : demoRiskMeta.modelStatus),
    fleetLabel: pick(data?.meta, "fleetLabel", "fleet_label") ?? demoRiskMeta.fleetLabel,
    inferenceEngine,
    inferenceRan: data?.meta?.inferenceRan ?? false,
    contentSource: data?.meta?.contentSource ?? (hasTrainedPrediction ? "prediction" : "catalog"),
    riskScoreNote: data?.meta?.riskScoreNote ?? prediction?.riskScoreNote ?? null,
  };

  const severityProbabilitiesForPdvi = hasTrainedPrediction
    ? mapPdviSeverityProbs(data.severityProbabilitiesForPdvi) ??
      mapPdviSeverityProbs(data.severity_probabilities_for_pdvi) ??
      mapPdviSeverityProbs(prediction?.severityProbabilitiesForPdvi) ??
      mapPdviSeverityProbs(prediction?.severity_probabilities_for_pdvi)
    : null;

  const catalogIllustrative = data?.catalogIllustrative ?? (isCatalogSnapshot ? { metrics: true, hourlyTrend: true, actionPlan: true } : null);

  return {
    meta,
    alert: {
      ...(isCatalogSnapshot && !hasTrainedPrediction ? demoRiskAlert : {}),
      ...(data?.alert ?? data?.risk_alert ?? {}),
    },
    metrics: isCatalogSnapshot
      ? (data?.metrics ?? data?.env_metrics ?? demoEnvMetrics).map(mapMetric)
      : Array.isArray(data?.metrics)
        ? data.metrics.map(mapMetric)
        : [],
    hourlyTrend: isCatalogSnapshot
      ? (data?.hourlyTrend ?? data?.hourly_trend ?? demoHourlyTrend).map(mapHourlyPoint)
      : Array.isArray(data?.hourlyTrend)
        ? data.hourlyTrend.map(mapHourlyPoint)
        : [],
    modelInputs: data?.modelInputs ?? data?.model_inputs ?? (hasTrainedPrediction ? [] : demoModelInputs),
    actionPlan: isCatalogSnapshot
      ? data?.actionPlan ?? data?.action_plan ?? demoActionPlan
      : data?.actionPlan ?? data?.action_plan ?? [],
    telemetry: data?.telemetry ?? data?.technical_inputs ?? (hasTrainedPrediction ? [] : demoTelemetry),
    prediction,
    severityProbabilitiesForPdvi,
    riskCategory: prediction?.riskCategory ?? prediction?.risk_category ?? null,
    catalogIllustrative,
    hasTrainedPrediction,
    sampleDataLabeled: explicitDemo,
  };
}

const demoRisk = () =>
  normalizeRiskPayload(
    {
      meta: { ...demoRiskMeta, serviceConnected: false, inferenceEngine: "catalog-seed", inferenceRan: false },
      alert: demoRiskAlert,
      metrics: demoEnvMetrics,
      hourlyTrend: demoHourlyTrend,
      modelInputs: demoModelInputs,
      actionPlan: demoActionPlan,
      telemetry: demoTelemetry,
    },
    { explicitDemo: true },
  );

/**
 * GET /api/v1/risk/environmental — strict (no demo fallback).
 */
export async function fetchEnvironmentalRiskLive() {
  const data = await apiFetch("/api/v1/risk/environmental");
  return { ...normalizeRiskPayload(data), source: "api" };
}

/**
 * GET /api/v1/risk/environmental — dashboard may use demo fallback in dev.
 */
export async function fetchEnvironmentalRisk() {
  try {
    return await fetchEnvironmentalRiskLive();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[riskApi] Using labelled local demo risk data:", error.message);
      return { ...demoRisk(), source: "demo", error: error.message };
    }
    throw error;
  }
}

/**
 * POST /api/v1/predict/environmental-risk — manual or diagnostic payload.
 */
export async function runEnvironmentalRiskPrediction(payload = {}) {
  const data = await apiFetch("/api/v1/predict/environmental-risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return {
    ...normalizeRiskPayload(data),
    source: "api",
    inputMode: payload.inputMode ?? "manual",
    ranAt: new Date().toISOString(),
  };
}

/** @deprecated Use runEnvironmentalRiskPrediction */
export async function runEnvironmentalRiskDiagnostic(payload = {}) {
  try {
    return await runEnvironmentalRiskPrediction(payload);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[riskApi] Diagnostic demo fallback:", error.message);
      return {
        ...demoRisk(),
        source: "demo",
        error: error.message,
        ranAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

export function buildRiskExportSnapshot(bundle) {
  return {
    demo: bundle.source !== "api" || !bundle.hasTrainedPrediction,
    model: bundle.meta,
    alert: bundle.alert,
    metrics: bundle.metrics,
    modelInputs: bundle.modelInputs,
    trend: bundle.hourlyTrend,
    actionPlan: bundle.actionPlan,
    telemetry: bundle.telemetry,
    prediction: bundle.prediction,
    exportedAt: new Date().toISOString(),
  };
}

export { SKLEARN_ENGINE as MODEL02_INFERENCE_ENGINE };
