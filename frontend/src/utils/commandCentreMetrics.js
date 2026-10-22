import { computeEstateOverview } from "./harvestReadinessUi";

/** Dashboard priority fields — same rule as Priority Actions panel. */
export function isPriorityField(field) {
  return field?.status === "Action Required" || Number(field?.score ?? 0) >= 70;
}

export function countPriorityFields(fields) {
  if (!Array.isArray(fields)) return 0;
  return fields.filter(isPriorityField).length;
}

export function countUnresolvedAlerts(alerts) {
  if (!Array.isArray(alerts)) return 0;
  return alerts.filter((alert) => alert.level === "Unresolved").length;
}

/**
 * Single readiness overview for cards and charts.
 * Uses API estateOverview when legend counts match field list; otherwise derives from fields.
 */
export function harvestReadinessOverview(readinessPayload) {
  const fields = readinessPayload?.fields;
  if (!Array.isArray(fields) || fields.length === 0) return null;

  const derived = computeEstateOverview(fields);
  const fromApi = readinessPayload?.estateOverview;
  if (fromApi?.readyPercent != null && Array.isArray(fromApi.legend)) {
    const sum = fromApi.legend.reduce((total, item) => total + Number(item.count ?? 0), 0);
    if (sum === fields.length) {
      return {
        readyPercent: fromApi.readyPercent,
        legend: fromApi.legend,
        source: "api-estateOverview",
      };
    }
  }
  return { ...derived, source: "derived-from-fields" };
}

export function intelOverviewMetrics(intelPayload) {
  const kpis = intelPayload?.kpis;
  if (!kpis || typeof kpis !== "object") return null;
  const sustainabilityScore =
    kpis.sustainabilityScore != null ? Number(kpis.sustainabilityScore) : null;
  const stiiScore = kpis.stiiScore != null ? Number(kpis.stiiScore) : null;
  const teaGrade = kpis.teaGrade != null ? String(kpis.teaGrade) : null;
  if (sustainabilityScore == null && !teaGrade && stiiScore == null) return null;
  return { sustainabilityScore, stiiScore, teaGrade };
}

export function yieldForecastMetrics(forecastPayload) {
  const kpi = forecastPayload?.kpis?.predictedYield;
  if (!kpi) return null;
  const peak = forecastPayload?.kpis?.peakDate;
  return {
    value: kpi.value ?? null,
    unit: kpi.unit ?? "kg",
    delta: kpi.delta ?? null,
    live: kpi.live === true,
    peakLabel: peak?.value ?? null,
    peakNote: peak?.note ?? null,
  };
}

/** True only when the forecasting API marks a live model kg output (not a placeholder dash). */
export function yieldForecastIsDisplayable(metrics) {
  if (!metrics || metrics.live !== true) return false;
  const v = metrics.value;
  return v != null && String(v).trim() !== "" && v !== "—";
}
