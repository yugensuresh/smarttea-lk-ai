export const HARVEST_KPIS = {
  predictedYield: { value: "12,450", unit: "kg", delta: "+4.2% vs last month" },
  avgReadiness: { value: 82 },
  climateRisk: { level: "Low", note: "Optimal conditions expected" },
  thrri: { value: "0.88", max: "1.0", note: "High reliability score" },
};

export const YIELD_FORECAST = [
  { day: 1, label: "Nov 1", predicted: 8200, actual: 7800 },
  { day: 10, label: "Nov 10", predicted: 9800, actual: 9600 },
  { day: 15, predicted: 10500, actual: 10200 },
  { day: 20, label: "Nov 20", predicted: 11200, actual: 10800 },
  { day: 25, predicted: 11800, actual: null },
  { day: 30, label: "Nov 30", predicted: 12450, actual: null },
];

export const AI_RECOMMENDATIONS = [
  "Prioritize harvesting Sector 4B within 48 hrs to maximize leaf quality before the rain window.",
  "Delay Sector 2A plucking by 24 hrs — readiness index still climbing on upper canopy.",
  "Schedule maintenance on transport lane C before the weekend crew rotation.",
];

export const CLIMATE_ALERT = {
  title: "Heavy Rain Expected",
  detail: "Tomorrow 14:00 – 18:00. May disrupt afternoon harvesting schedules.",
};

export const HARVEST_FIELDS = [
  {
    id: "Sector-4B",
    readiness: 86,
    yieldKg: 1200,
    status: "READY NOW",
    action: "Assign Crew",
    tone: "ready",
  },
  {
    id: "Sector-1A",
    readiness: 68,
    yieldKg: 950,
    status: "NEARLY READY",
    action: "Review",
    tone: "near",
  },
  {
    id: "Sector-3C",
    readiness: 45,
    yieldKg: 1100,
    status: "NOT READY",
    action: "Monitor",
    tone: "wait",
  },
];

export function readinessBarColor(readiness) {
  if (readiness >= 80) return "#178a45";
  if (readiness >= 60) return "#3b9e8c";
  return "#e08a9a";
}

export function statusClass(tone) {
  if (tone === "ready") return "bg-[#178a45] text-white";
  if (tone === "near") return "bg-[#dbeafe] text-[#2563eb]";
  return "bg-[#fdecee] text-[#e23b45]";
}

export function actionClass(tone) {
  return tone === "wait" ? "text-[#8b9790]" : "text-[#178a45] font-semibold";
}
