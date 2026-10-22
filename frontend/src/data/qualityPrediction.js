export const PREDICTION_FORM = {
  harvestDate: "2024-05-15",
  temp: "24.5",
  humidity: "82",
  soilMoisture: "65",
  batchId: "LK-NWE-8902",
};

export const PREDICTION_RESULT = {
  grade: "Premium Grade A",
  badge: "High Export Potential",
};

export const INFLUENCING_FACTORS = [
  {
    id: "rain",
    label: "Rainfall Distribution",
    sub: "Optimal levels last 14 days",
    impact: "+32% Impact",
    icon: "droplet",
  },
  {
    id: "ph",
    label: "Soil pH Levels",
    sub: "Consistent at 5.2",
    impact: "+28% Impact",
    icon: "flask",
  },
  {
    id: "diurnal",
    label: "Diurnal Temp Variation",
    sub: "Excellent day/night delta",
    impact: "+15% Impact",
    icon: "thermometer",
  },
];

export const FEATURE_IMPORTANCE = [
  { label: "Soil Moisture", value: 0.45 },
  { label: "Harvest Temp", value: 0.32 },
  { label: "Humidity", value: 0.28 },
  { label: "Elevation Base", value: 0.15 },
];

export const CONFIDENCE_SCORE = 98;
