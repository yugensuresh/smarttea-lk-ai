export const HARVEST_RISK_ALERT = {
  level: "HIGH",
  confidence: 94,
  body:
    "Incoming heavy monsoon rains (expected >45mm over the next 48 hours) present a severe risk of mechanical crop damage and significant plucking delays. Soil saturation levels in Sectors 4 and 7 are approaching critical thresholds, increasing landslide vulnerability.",
};

export const OPTIMAL_WINDOW = {
  range: "Nov 12 – Nov 14",
  body: "A brief clearing in the monsoon system is projected. Accelerate labor mobilization for this 72-hour window.",
};

export const MICRO_CLIMATE_FORECAST = [
  { day: "Today", temp: 22, rainMm: 45, humidity: 98, tone: "default" },
  { day: "Tomorrow", temp: 23, rainMm: 30, humidity: 95, tone: "default" },
  { day: "Nov 12", temp: 25, rainMm: 5, humidity: 78, tone: "optimal", badge: "OPTIMAL" },
  { day: "Nov 13", temp: 26, rainMm: 0, humidity: 72, tone: "optimal" },
  { day: "Nov 14", temp: 24, rainMm: 12, humidity: 85, tone: "default", showRainIcon: true },
];
