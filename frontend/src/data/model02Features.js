/** Model 02 (HistGradientBoostingClassifier) — matches Model02_Final_Model.joblib feature schema. */
export const MODEL_02_META = {
  id: "02",
  name: "HistGradientBoostingClassifier",
  version: "v1.2",
  endpointGet: "/api/v1/risk/environmental",
  endpointPredict: "/api/v1/predict/environmental-risk",
  artifact: "Member01/Riskprediction/Model02_Final_Model.joblib",
};

export const MODEL_02_RISK_CLASSES = ["Low", "Moderate", "High", "Very High"];

export const MODEL_02_DISEASE_CLASSES = ["Blister_Blight", "Grey_Blight", "Red_Rust"];

export const MODEL_02_ESTATE_IDS = ["EST001", "EST002", "EST003", "EST004", "EST005"];

export const MODEL_02_FEATURE_FIELDS = [
  { key: "temperature_c", feature: "Air temperature", unit: "°C", lag: "Current", min: 0, max: 45, step: 0.1, required: true },
  { key: "relative_humidity_pct", feature: "Relative humidity", unit: "%", lag: "Current", min: 0, max: 100, step: 0.1, required: true },
  { key: "soil_moisture_pct", feature: "Soil moisture", unit: "%", lag: "Current", min: 0, max: 100, step: 0.1, required: true },
  { key: "leaf_wetness", feature: "Leaf wetness duration", unit: "h", lag: "Current", min: 0, max: 24, step: 0.1, required: true },
  { key: "rainfall_mm", feature: "Rainfall", unit: "mm", lag: "Past 24 h", min: 0, max: 500, step: 0.1, required: true },
  { key: "light_intensity_lux", feature: "Light intensity", unit: "lux", lag: "Current", min: 0, max: 120000, step: 1, required: true },
  { key: "wind_speed", feature: "Wind speed", unit: "m/s", lag: "Current", min: 0, max: 40, step: 0.1, required: true },
  { key: "temperature_c_lag1", feature: "Air temperature", unit: "°C", lag: "Lag 1 h", min: 0, max: 45, step: 0.1, required: true },
  { key: "temperature_c_lag3", feature: "Air temperature", unit: "°C", lag: "Lag 3 h", min: 0, max: 45, step: 0.1, required: true },
  { key: "temperature_c_lag7", feature: "Air temperature", unit: "°C", lag: "Lag 7 h", min: 0, max: 45, step: 0.1, required: true },
  { key: "relative_humidity_pct_lag7", feature: "Relative humidity", unit: "%", lag: "Lag 7 h", min: 0, max: 100, step: 0.1, required: true },
  { key: "rainfall_mm_lag7", feature: "Rainfall", unit: "mm", lag: "Lag 7 h", min: 0, max: 500, step: 0.1, required: true },
  { key: "soil_moisture_pct_lag3", feature: "Soil moisture", unit: "%", lag: "Lag 3 h", min: 0, max: 100, step: 0.1, required: true },
  { key: "soil_moisture_pct_prev3d_mean", feature: "Soil moisture (3 d mean)", unit: "%", lag: "Rolling", min: 0, max: 100, step: 0.1, required: true },
  { key: "relative_humidity_pct_prev7d_mean", feature: "Relative humidity (7 d mean)", unit: "%", lag: "Rolling", min: 0, max: 100, step: 0.1, required: true },
  { key: "rainfall_mm_prev7d_mean", feature: "Rainfall (7 d mean)", unit: "mm", lag: "Rolling", min: 0, max: 500, step: 0.1, required: true },
  { key: "month", feature: "Calendar month", unit: "1–12", lag: "Current", min: 1, max: 12, step: 1, required: true },
  {
    key: "disease_class",
    feature: "Linked disease class (Model 01)",
    unit: "—",
    lag: "Categorical",
    type: "select",
    options: MODEL_02_DISEASE_CLASSES,
    required: true,
  },
  {
    key: "estate_id",
    feature: "Estate ID",
    unit: "—",
    lag: "Categorical",
    type: "select",
    options: MODEL_02_ESTATE_IDS,
    required: true,
  },
];

/** Suggested starting values aligned with estate telemetry seed data. */
export const MODEL_02_SAMPLE_VALUES = {
  temperature_c: "24.2",
  relative_humidity_pct: "85.4",
  soil_moisture_pct: "42.0",
  leaf_wetness: "6.8",
  rainfall_mm: "14.2",
  light_intensity_lux: "45000",
  wind_speed: "2.4",
  temperature_c_lag1: "23.8",
  temperature_c_lag3: "23.2",
  temperature_c_lag7: "22.5",
  relative_humidity_pct_lag7: "78.0",
  rainfall_mm_lag7: "12.0",
  soil_moisture_pct_lag3: "41.0",
  soil_moisture_pct_prev3d_mean: "40.5",
  relative_humidity_pct_prev7d_mean: "76.0",
  rainfall_mm_prev7d_mean: "38.0",
  month: String(new Date().getMonth() + 1),
  disease_class: "Blister_Blight",
  estate_id: "EST001",
};

export function emptyModel02Form() {
  return { ...MODEL_02_SAMPLE_VALUES };
}

export function validateModel02Form(values) {
  const errors = {};
  for (const field of MODEL_02_FEATURE_FIELDS) {
    const raw = values[field.key];
    if (raw === "" || raw == null) {
      if (field.required) errors[field.key] = "Required";
      continue;
    }
    if (field.type === "select") {
      if (field.key === "disease_class" && (raw === "__HEALTHY_INCOMPATIBLE__" || raw === "")) {
        errors[field.key] =
          raw === "__HEALTHY_INCOMPATIBLE__"
            ? "Model 02 requires a diseased leaf (Model 01 healthy is not compatible)."
            : "Required";
      }
      continue;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) {
      errors[field.key] = "Enter a number";
      continue;
    }
    if (num < field.min || num > field.max) {
      errors[field.key] = `Must be between ${field.min} and ${field.max}`;
    }
  }
  return errors;
}

export function buildModel02Payload(values) {
  const features = {};
  for (const field of MODEL_02_FEATURE_FIELDS) {
    const raw = values[field.key];
    if (raw === "" || raw == null) continue;
    if (field.type === "select") {
      if (field.key === "disease_class" && (raw === "__HEALTHY_INCOMPATIBLE__" || raw == null)) continue;
      features[field.key] = String(raw);
    } else {
      const num = Number(raw);
      if (!Number.isNaN(num)) features[field.key] = num;
    }
  }
  return {
    inputMode: "manual",
    features,
    featureOrder: MODEL_02_FEATURE_FIELDS.map((f) => f.key),
  };
}

/**
 * Map Model 01 classId to Model 02 categorical disease_class.
 * Returns null for healthy — Model 02 is for diseased-leaf environmental pressure, not healthy specimens.
 */
export function diseaseClassForModel02(classId) {
  if (classId === "healthy") return null;
  switch (classId) {
    case "grey":
      return "Grey_Blight";
    case "redRust":
      return "Red_Rust";
    default:
      return "Blister_Blight";
  }
}
