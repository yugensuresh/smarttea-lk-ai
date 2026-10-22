import { apiFetch, pick } from "./apiClient";
import { alerts as demoAlerts } from "../data/dashboard";

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

/**
 * GET /api/v1/alerts
 */
export async function fetchAlerts({ estate, q } = {}) {
  const params = new URLSearchParams();
  if (estate) params.set("estate", estate);
  if (q) params.set("q", q);
  const query = params.toString();
  const path = query ? `/api/v1/alerts?${query}` : "/api/v1/alerts";

  try {
    const data = await apiFetch(path);
    const list = Array.isArray(data) ? data : (data.alerts ?? []);
    return { alerts: list.map(mapAlert), source: "api" };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[alertsApi] Using local demo alerts:", error.message);
      return { alerts: demoAlerts.map(mapAlert), source: "demo", error: error.message };
    }
    throw error;
  }
}
