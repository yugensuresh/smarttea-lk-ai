import { apiFetch, pick } from "./apiClient";

function mapReadinessField(raw) {
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    location: raw.location ?? "",
    status: raw.status ?? "",
    statusTone: pick(raw, "statusTone", "status_tone") ?? "not",
    action: raw.action ?? "Details",
    actionTone: pick(raw, "actionTone", "action_tone") ?? "ghost",
    description: raw.description ?? "",
    maturity: Number(raw.maturity ?? 0),
    stats: raw.stats ?? {},
    prediction: raw.prediction ?? null,
    mlFeatures: raw.mlFeatures ?? raw.ml_features ?? null,
  };
}

export async function fetchHarvestReadiness() {
  const data = await apiFetch("/api/v1/harvest/readiness");
  return {
    fields: (data.fields ?? []).map(mapReadinessField),
    estateOverview: data.estateOverview ?? data.estate_overview ?? {},
    envContext: data.envContext ?? data.env_context ?? {},
    inferenceEngine: data.inferenceEngine ?? null,
    inferenceSummary: data.inferenceSummary ?? data.inference_summary ?? null,
    serviceConnected: Boolean(data.serviceConnected ?? data.service_connected),
    source: "api",
  };
}

export async function fetchHarvestForecasting() {
  const data = await apiFetch("/api/v1/harvest/forecasting");
  return {
    kpis: data.kpis ?? {},
    prediction: data.prediction ?? null,
    yieldFeatures: data.yieldFeatures ?? data.yield_features ?? null,
    environmentalDrivers: data.environmentalDrivers ?? data.environmental_drivers ?? null,
    varianceAnalysis: data.varianceAnalysis ?? data.variance_analysis ?? null,
    inferenceEngine: data.inferenceEngine ?? null,
    serviceConnected: Boolean(data.serviceConnected),
    source: "api",
  };
}

export async function fetchHarvestClimateRisk() {
  const data = await apiFetch("/api/v1/harvest/climate-risk");
  return {
    riskAlert: data.riskAlert ?? data.risk_alert ?? {},
    optimalWindow: data.optimalWindow ?? data.optimal_window ?? {},
    prediction: data.prediction ?? null,
    climateFeatures: data.climateFeatures ?? data.climate_features ?? null,
    microClimateForecast: data.microClimateForecast ?? data.micro_climate_forecast ?? null,
    microClimateForecastDemo: Boolean(data.microClimateForecastDemo ?? data.micro_climate_forecast_demo),
    inferenceEngine: data.inferenceEngine ?? null,
    serviceConnected: Boolean(data.serviceConnected),
    source: "api",
  };
}

export async function fetchHarvestThrri() {
  const data = await apiFetch("/api/v1/harvest/thrri");
  return { ...data, source: "api" };
}

export async function predictHarvestReadiness(features) {
  const data = await apiFetch("/api/v1/harvest/predict/readiness", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features }),
  });
  return { ...data, source: "api" };
}

export async function predictHarvestYield(features) {
  const data = await apiFetch("/api/v1/harvest/predict/yield", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features }),
  });
  return { ...data, source: "api" };
}

export async function predictHarvestClimate(features) {
  const data = await apiFetch("/api/v1/harvest/predict/climate-risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ features }),
  });
  return { ...data, source: "api" };
}
