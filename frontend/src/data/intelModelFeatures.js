/** Model feature schemas matching harvest and quality joblib pipelines. */
export const TEA_QUALITY_FIELDS = [
  { key: "temperature_c", label: "Temperature", unit: "°C", default: "24" },
  { key: "humidity_pct", label: "Humidity", unit: "%", default: "85" },
  { key: "rainfall_mm", label: "Rainfall", unit: "mm", default: "14" },
  { key: "soil_moisture_pct", label: "Soil moisture", unit: "%", default: "42" },
  { key: "sunshine_hours", label: "Sunshine hours", unit: "h", default: "6.5" },
  { key: "elevation_m", label: "Elevation", unit: "m", default: "1200" },
];

export const SUSTAINABILITY_FIELDS = [
  { key: "elevation_m", label: "Elevation", unit: "m", default: "1200" },
  { key: "soil_moisture_pct", label: "Soil moisture", unit: "%", default: "42" },
  { key: "soil_ph", label: "Soil pH", unit: "—", default: "5.5" },
  { key: "rainfall_mm", label: "Rainfall", unit: "mm", default: "14" },
  { key: "temperature_mean_c", label: "Mean temperature", unit: "°C", default: "24" },
  { key: "humidity_mean_pct", label: "Mean humidity", unit: "%", default: "85" },
  { key: "et0_mm", label: "ET₀", unit: "mm", default: "4.2" },
  {
    key: "production_kg_per_day_monthly_average",
    label: "Production (kg/day avg)",
    unit: "kg",
    default: "850",
  },
];

export function buildFeaturePayload(fields, values) {
  const features = {};
  for (const field of fields) {
    const num = Number(values[field.key] ?? field.default);
    if (!Number.isNaN(num)) features[field.key] = num;
  }
  return features;
}

/** Validate form values before submit (no silent default fill). */
export function validateIntelForm(fields, values) {
  const missing = [];
  const invalid = [];
  for (const field of fields) {
    const raw = values[field.key];
    if (raw === "" || raw === undefined || raw === null) {
      missing.push(field.label);
      continue;
    }
    const num = Number(raw);
    if (!Number.isFinite(num)) invalid.push(field.label);
  }
  if (missing.length || invalid.length) {
    const parts = [];
    if (missing.length) parts.push(`Missing: ${missing.join(", ")}`);
    if (invalid.length) parts.push(`Invalid: ${invalid.join(", ")}`);
    return { ok: false, message: parts.join(". ") };
  }
  return { ok: true };
}

export function buildStrictFeaturePayload(fields, values) {
  const features = {};
  for (const field of fields) {
    features[field.key] = Number(values[field.key]);
  }
  return features;
}

export function buildTeaQualityPayload(values, { strict = true } = {}) {
  if (strict) {
    const check = validateIntelForm(TEA_QUALITY_FIELDS, values);
    if (!check.ok) return { error: check.message };
    return { features: buildStrictFeaturePayload(TEA_QUALITY_FIELDS, values) };
  }
  return { features: buildFeaturePayload(TEA_QUALITY_FIELDS, values) };
}

/** POST /api/v1/intel/predict/quality-stii request body. */
export function buildQualityStiiPayload(teaQualityValues, sustainabilityValues, { strict = true } = {}) {
  if (strict) {
    const qCheck = validateIntelForm(TEA_QUALITY_FIELDS, teaQualityValues);
    if (!qCheck.ok) return { error: qCheck.message };
    const sCheck = validateIntelForm(SUSTAINABILITY_FIELDS, sustainabilityValues);
    if (!sCheck.ok) return { error: sCheck.message };
    return {
      teaQualityFeatures: buildStrictFeaturePayload(TEA_QUALITY_FIELDS, teaQualityValues),
      sustainabilityFeatures: buildStrictFeaturePayload(SUSTAINABILITY_FIELDS, sustainabilityValues),
    };
  }
  return {
    teaQualityFeatures: buildFeaturePayload(TEA_QUALITY_FIELDS, teaQualityValues),
    sustainabilityFeatures: buildFeaturePayload(SUSTAINABILITY_FIELDS, sustainabilityValues),
  };
}

export function emptyQualityStiiForm() {
  return {
    ...emptyTeaQualityForm(),
    ...emptySustainabilityForm(),
  };
}

export function emptyTeaQualityForm() {
  return Object.fromEntries(TEA_QUALITY_FIELDS.map((f) => [f.key, f.default]));
}

export function emptySustainabilityForm() {
  return Object.fromEntries(SUSTAINABILITY_FIELDS.map((f) => [f.key, f.default]));
}
