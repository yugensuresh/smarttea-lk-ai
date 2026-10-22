import { apiFetch, ApiError } from "./apiClient";

function assertIntelSuccess(data, context) {
  if (data?.ok === false) {
    throw new ApiError(data.error ?? `${context} unavailable`);
  }
  return data;
}

export async function fetchIntelOverview() {
  const data = await apiFetch("/api/v1/intel/overview");
  return {
    ok: data.ok !== false,
    kpis: data.kpis ?? {},
    teaQuality: data.teaQuality ?? null,
    sustainability: data.sustainability ?? null,
    stii: data.stii ?? null,
    serviceConnected: Boolean(data.serviceConnected),
    inferenceEngine: data.inferenceEngine ?? null,
    error: data.error ?? null,
    source: "api",
  };
}

export async function fetchSustainabilityAssessment() {
  const data = await apiFetch("/api/v1/intel/sustainability-assessment");
  return {
    ok: data.ok !== false,
    performanceScore: data.performanceScore ?? data.performance_score ?? {},
    prediction: data.prediction ?? null,
    sustainabilityFeatures: data.sustainabilityFeatures ?? data.sustainability_features ?? null,
    inferenceEngine: data.inferenceEngine ?? data.meta?.inferenceEngine ?? null,
    meta: data.meta ?? {},
    serviceConnected: Boolean(data.serviceConnected),
    error: data.error ?? null,
    source: "api",
  };
}

export async function predictSustainability(features) {
  const data = assertIntelSuccess(
    await apiFetch("/api/v1/intel/predict/sustainability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    }),
    "Sustainability prediction",
  );
  return { ...data, source: "api" };
}

export async function predictTeaQuality(features) {
  const data = assertIntelSuccess(
    await apiFetch("/api/v1/intel/predict/tea-quality", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features }),
    }),
    "Tea quality prediction",
  );
  return { ...data, source: "api" };
}

export async function predictQualityStii(payload) {
  const data = assertIntelSuccess(
    await apiFetch("/api/v1/intel/predict/quality-stii", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
    "Quality & STII prediction",
  );
  return { ...data, source: "api" };
}
