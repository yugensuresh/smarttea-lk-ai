import { apiFetch, pick } from "./apiClient";
import {
  ESTATES as DEMO_ESTATES,
  alerts as demoAlerts,
  estateStats as demoEstateStats,
  fields as demoFields,
  trend as demoTrend,
} from "../data/dashboard";

function mapEstateStats(raw) {
  if (!raw) return demoEstateStats;
  return {
    pdvi: pick(raw, "pdvi", "pdvi_score") ?? demoEstateStats.pdvi,
    band: pick(raw, "band", "risk_band") ?? demoEstateStats.band,
    totalFields: pick(raw, "totalFields", "total_fields") ?? demoEstateStats.totalFields,
    diseaseRisk: pick(raw, "diseaseRisk", "disease_risk") ?? demoEstateStats.diseaseRisk,
    diseaseNote: pick(raw, "diseaseNote", "disease_note") ?? demoEstateStats.diseaseNote,
    modelRisk: pick(raw, "modelRisk", "model_risk") ?? demoEstateStats.modelRisk,
    modelPdvi: pick(raw, "modelPdvi", "model_pdvi") ?? demoEstateStats.modelPdvi,
    riskEngine: pick(raw, "riskEngine", "risk_engine") ?? demoEstateStats.riskEngine,
    primaryDisease: pick(raw, "primaryDisease", "primary_disease") ?? demoEstateStats.primaryDisease,
    alertPlaces: pick(raw, "alertPlaces", "alert_places") ?? demoEstateStats.alertPlaces,
  };
}

function mapField(raw) {
  return {
    id: String(pick(raw, "id", "field_id") ?? ""),
    name: pick(raw, "name", "field_name") ?? "",
    sector: pick(raw, "sector", "estate_sector") ?? "",
    estate: raw.estate ?? "",
    clone: raw.clone ?? "",
    score: Number(pick(raw, "score", "risk_score") ?? 0),
    concern: pick(raw, "concern", "primary_concern") ?? "",
    status: pick(raw, "status", "field_status") ?? "",
    severity: pick(raw, "severity") ?? "warning",
    humidity: pick(raw, "humidity"),
    leafWetness: pick(raw, "leafWetness", "leaf_wetness"),
    temperature: raw.temperature,
    sporePressure: pick(raw, "sporePressure", "spore_pressure"),
    recommendation: raw.recommendation ?? "",
  };
}

function mapAlert(raw) {
  return {
    id: pick(raw, "id", "alert_id") ?? raw.title,
    fieldId: pick(raw, "fieldId", "field_id"),
    estate: raw.estate ?? "",
    title: raw.title ?? "",
    place: raw.place ?? "",
    level: raw.level ?? "",
    time: pick(raw, "time", "time_ago") ?? "",
  };
}

function mapTrendPoint(raw) {
  return {
    day: Number(raw.day),
    risk: Number(pick(raw, "risk", "risk_index") ?? 0),
    humidity: Number(pick(raw, "humidity", "canopy_humidity") ?? 0),
    label: raw.label,
    place: raw.place,
    critical: Boolean(raw.critical),
  };
}

function mapDetection(raw) {
  return {
    id: pick(raw, "id", "detection_id") ?? raw.name,
    name: raw.name ?? "",
    fieldId: pick(raw, "fieldId", "field_id"),
    field: pick(raw, "field", "field_name") ?? "",
    confidence: Number(pick(raw, "confidence", "confidence_pct") ?? 0),
    model: raw.model ?? "",
    detail: raw.detail ?? raw.summary ?? "",
  };
}

function normalizeDashboardPayload(data) {
  const estates = data.estates ?? DEMO_ESTATES;
  const detectionsRaw = data.detections ?? data.recentDetections ?? data.recent_detections;
  return {
    estates,
    estateStats: mapEstateStats(data.estateStats ?? data.estate_stats),
    fields: (data.fields ?? []).map(mapField),
    alerts: (data.alerts ?? []).map(mapAlert),
    trend: (data.trend ?? data.risk_trend ?? []).map(mapTrendPoint),
    detections: Array.isArray(detectionsRaw) ? detectionsRaw.map(mapDetection) : [],
    telemetryLive: pick(data, "telemetryLive", "telemetry_live") ?? true,
  };
}

const demoDashboard = () =>
  normalizeDashboardPayload({
    estates: DEMO_ESTATES,
    estateStats: demoEstateStats,
    fields: demoFields,
    alerts: demoAlerts,
    trend: demoTrend,
    telemetryLive: true,
  });

/**
 * GET /api/v1/dashboard?days=30
 */
export async function fetchDashboard({ days = 30 } = {}) {
  try {
    const data = await apiFetch(`/api/v1/dashboard?days=${encodeURIComponent(days)}`);
    const normalized = normalizeDashboardPayload(data);
    return { ...normalized, source: "api" };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[dashboardApi] Using local demo data:", error.message);
      return { ...demoDashboard(), source: "demo", error: error.message };
    }
    throw error;
  }
}
