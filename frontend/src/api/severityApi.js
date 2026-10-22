import { apiFetch } from "./apiClient";

/**
 * POST /api/v1/predict/severity — reserved for a validated severity model (not Model 01).
 * Returns null when the endpoint is not implemented.
 */
export async function fetchSeverityServiceStatus() {
  try {
    await apiFetch("/api/v1/models/severity");
    return { available: true, source: "api" };
  } catch {
    return { available: false, source: "unavailable" };
  }
}

export async function predictSeverity(_payload) {
  try {
    const data = await apiFetch("/api/v1/predict/severity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(_payload),
    });
    return { result: data, source: "api" };
  } catch (error) {
    return {
      result: null,
      source: "unavailable",
      error: error.message ?? "Severity service unavailable",
    };
  }
}
