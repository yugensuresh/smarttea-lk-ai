export const FORECAST_KPIS = {
  predictedYield: { value: "14,250", unit: "kg", delta: "+8.4% vs last cycle" },
  modelConfidence: 92.8,
  peakDate: { value: "October 14th", note: "Favorable weather window", badge: "OPTIMAL" },
};

export const PRODUCTION_TRAJECTORY = [
  { label: "Jun", historical: 11800, predicted: null },
  { label: "Jul", historical: 12100, predicted: null },
  { label: "Aug", historical: 12850, predicted: null },
  { label: "Sep", historical: 13200, predicted: null },
  { label: "Oct", historical: null, predicted: 13800, isNow: true },
  { label: "Nov", historical: null, predicted: 14250 },
];

export const ENV_DRIVERS = [
  {
    id: "moisture",
    label: "Soil Moisture",
    value: "42%",
    sub: "Optimal range",
    impact: "+2% Yield",
    impactTone: "positive",
    icon: "droplet",
  },
  {
    id: "temp",
    label: "Avg Temperature",
    value: "24°C",
    sub: "Slight elevation",
    impact: "-1% Yield",
    impactTone: "negative",
    icon: "thermometer",
  },
  {
    id: "sun",
    label: "Sun Exposure",
    value: "8.5h",
    sub: "High accumulation",
    impact: "+3% Yield",
    impactTone: "positive",
    icon: "sun",
  },
];

export const VARIANCE_ROWS = [
  {
    cycle: "Cycle 2023-A",
    actual: "13,100",
    predicted: "12,950",
    variance: "+1.1%",
    varianceTone: "neutral",
    accuracy: "High",
    accuracyTone: "high",
  },
  {
    cycle: "Cycle 2023-B",
    actual: "14,050",
    predicted: "14,300",
    variance: "-1.7%",
    varianceTone: "negative",
    accuracy: "High",
    accuracyTone: "high",
  },
  {
    cycle: "Cycle 2023-C (Current)",
    actual: "In Progress",
    predicted: "14,250",
    variance: "—",
    varianceTone: "muted",
    accuracy: "Pending",
    accuracyTone: "pending",
  },
];
