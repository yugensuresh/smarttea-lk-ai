/** Harvest / climate model input schemas (match joblib feature_names_in_). */

export const READINESS_FEATURE_FIELDS = [
  { key: "rainfall_mm", label: "Rainfall", unit: "mm", default: "80", min: 0, max: 500, step: 0.1 },
  { key: "humidity_percent", label: "Humidity", unit: "%", default: "75", min: 0, max: 100, step: 0.1 },
  { key: "elevation_m", label: "Elevation", unit: "m", default: "1200", min: 0, max: 2500, step: 1 },
  { key: "temperature_c", label: "Temperature", unit: "°C", default: "23", min: 0, max: 45, step: 0.1 },
];

export const YIELD_FEATURE_FIELDS = [
  { key: "temperature_max_c", label: "Max temperature", unit: "°C", default: "26" },
  { key: "temperature_min_c", label: "Min temperature", unit: "°C", default: "18" },
  { key: "temperature_avg_c", label: "Avg temperature", unit: "°C", default: "24" },
  { key: "rainfall_mm", label: "Rainfall", unit: "mm", default: "14" },
  { key: "humidity_pct", label: "Humidity", unit: "%", default: "85" },
  { key: "wind_speed", label: "Wind speed", unit: "m/s", default: "2.4" },
  { key: "soil_moisture_pct", label: "Soil moisture", unit: "%", default: "42" },
  { key: "estate_id", label: "Estate ID", type: "select", options: ["EST001", "EST002", "EST003"], default: "EST001" },
  { key: "elevation_m", label: "Elevation", unit: "m", default: "1200" },
  { key: "block_id", label: "Block ID", type: "text", default: "B01" },
  { key: "cultivated_area_ha", label: "Cultivated area", unit: "ha", default: "12" },
  { key: "plucking_interval_days", label: "Plucking interval", unit: "days", default: "7" },
];

export const CLIMATE_FEATURE_FIELDS = [
  { key: "rainfall_mm", label: "Rainfall", unit: "mm", default: "45" },
  { key: "temperature_avg_c", label: "Avg temperature", unit: "°C", default: "24" },
  { key: "soil_moisture_pct", label: "Soil moisture", unit: "%", default: "42" },
  { key: "wind_speed", label: "Wind speed", unit: "m/s", default: "2.4" },
];

export function emptyForm(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""]));
}

export function buildFeatures(fields, values) {
  const features = {};
  for (const field of fields) {
    const raw = values[field.key];
    if (raw === "" || raw == null) continue;
    if (field.type === "select" || field.type === "text") {
      features[field.key] = String(raw);
    } else {
      const num = Number(raw);
      if (!Number.isNaN(num)) features[field.key] = num;
    }
  }
  return features;
}

export function maturityStatus(maturity, ready) {
  if (ready || maturity >= 25) return { status: "READY NOW", tone: "ready" };
  if (maturity >= 12) return { status: "NEARLY READY", tone: "near" };
  return { status: "NOT READY", tone: "not" };
}
