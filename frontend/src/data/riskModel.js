export const RISK_META = {
  model: "Model 02",
  modelStatus: "Demo UI",
  engine: "HistGradientBoostingClassifier v1.2",
  endpoint: "/api/v1/predict/environmental-risk",
  serviceConnected: false,
  fleetLabel: "Sample telemetry (demo)",
};

export const RISK_ALERT = {
  category: "High",
  diseaseFocus: "Elevated fungal pressure (demo)",
  contributors: [
    "Relative humidity in upper canopy band (sample: 85.4%)",
    "Prolonged leaf wetness duration (sample: 6.8 h)",
    "Recent rainfall accumulation (sample: 14.2 mm / 24 h)",
  ],
  explanation:
    "Demo output: Model 02 combines current and lagged environmental features to estimate disease pressure. This alert illustrates a high-risk category for supervisor review — not a live inference result.",
};

export const ENV_METRICS = [
  {
    id: "temp",
    label: "Temperature",
    value: "24.2",
    unit: "°C",
    status: "Sample · normal band",
    statusIcon: "check",
    tone: "good",
    accent: "#1f8a4c",
    icon: "thermometer",
    demo: true,
  },
  {
    id: "humidity",
    label: "Humidity",
    value: "85.4",
    unit: "%",
    status: "Sample · elevated",
    statusIcon: "alert",
    tone: "risk",
    accent: "#c4845a",
    icon: "droplets",
    demo: true,
  },
  {
    id: "wetness",
    label: "Leaf Wetness",
    value: "6.8",
    unit: "hrs",
    status: "Sample · prolonged",
    statusIcon: "clock",
    tone: "warn",
    accent: "#c4845a",
    icon: "leaf",
    demo: true,
  },
  {
    id: "rain",
    label: "Rainfall (24h)",
    value: "14.2",
    unit: "mm",
    status: "Sample · moderate",
    statusIcon: "drop",
    tone: "neutral",
    accent: "#1f8a4c",
    icon: "cloud",
    demo: true,
  },
];

/** Demo time series — illustrative only */
export const HOURLY_TREND = [
  { label: "Mon 12:00", humidity: 68, temperature: 22.0, riskScore: 38, riskCategory: "Moderate" },
  { label: "Mon 18:00", humidity: 71, temperature: 21.6, riskScore: 42, riskCategory: "Moderate" },
  { label: "Tue 00:00", humidity: 74, temperature: 21.2, riskScore: 48, riskCategory: "Moderate" },
  { label: "Tue 06:00", humidity: 76, temperature: 20.8, riskScore: 52, riskCategory: "Moderate" },
  { label: "Tue 12:00", humidity: 78, temperature: 21.5, riskScore: 58, riskCategory: "Moderate" },
  { label: "Tue 18:00", humidity: 81, temperature: 22.1, riskScore: 66, riskCategory: "High" },
  { label: "Wed 00:00", humidity: 83, temperature: 22.8, riskScore: 74, riskCategory: "High" },
  { label: "Now", humidity: 85.4, temperature: 24.2, riskScore: 82, riskCategory: "High", now: true },
];

export const RISK_CATEGORY_COLORS = {
  Low: "#1f8a4c",
  Moderate: "#c98416",
  High: "#d64545",
  "Very High": "#991b1b",
};

export const MODEL_02_ENV_INPUTS = [
  { feature: "Air temperature", value: "24.2 °C", lag: "Current hour" },
  { feature: "Relative humidity", value: "85.4 %", lag: "Current hour" },
  { feature: "Soil moisture (volumetric)", value: "31.2 %", lag: "Current hour" },
  { feature: "Leaf wetness duration", value: "6.8 h", lag: "Rolling 24 h" },
  { feature: "Rainfall", value: "14.2 mm", lag: "Past 24 h" },
  { feature: "Light intensity (PAR)", value: "412 µmol/m²/s", lag: "Current hour" },
  { feature: "Wind speed", value: "1.8 m/s", lag: "Current hour" },
  { feature: "Relative humidity", value: "81.2 %", lag: "Lag 6 h" },
  { feature: "Relative humidity", value: "76.5 %", lag: "Lag 12 h" },
  { feature: "Air temperature", value: "22.4 °C", lag: "Lag 6 h" },
  { feature: "Leaf wetness duration", value: "4.1 h", lag: "Lag 12 h" },
];

export const ACTION_PLAN = {
  title: "Review canopy humidity and leaf wetness during the next scouting cycle.",
  detail:
    "General demo recommendation: confirm drainage and airflow in affected blocks, document findings, and align spray or cultural interventions with agronomy guidelines.",
};

export const TECHNICAL_INPUTS = [
  { sensor: "Canopy RH probe (sample)", value: "85.4 %", status: "Demo data" },
  { sensor: "Leaf wetness plate (sample)", value: "6.8 h", status: "Demo data" },
  { sensor: "Air temperature node (sample)", value: "24.2 °C", status: "Demo data" },
  { sensor: "Rain gauge (sample)", value: "14.2 mm / 24 h", status: "Demo data" },
  { sensor: "Spore trap index (sample)", value: "Elevated (illustrative)", status: "Demo data" },
];

export function exportRiskSnapshot() {
  const payload = {
    demo: true,
    model: RISK_META,
    alert: RISK_ALERT,
    metrics: ENV_METRICS,
    modelInputs: MODEL_02_ENV_INPUTS,
    trend: HOURLY_TREND,
    actionPlan: ACTION_PLAN,
    telemetry: TECHNICAL_INPUTS,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "environmental-risk-demo-export.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
