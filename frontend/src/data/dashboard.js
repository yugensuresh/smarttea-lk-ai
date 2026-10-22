export const ESTATES = ["Nuwara Eliya", "Dimbula", "Kandy Ridge"];

export const estateStats = {
  pdvi: 72,
  band: "Moderate-High",
  totalFields: 120,
  diseaseRisk: "High",
  diseaseNote: "Spore pressure",
  modelRisk: "Model 02",
  modelPdvi: "Model 03",
  riskEngine: "HistGradientBoosting",
  primaryDisease: "Blister Blight",
  alertPlaces: "Nuwara Eliya & Dimbula",
};

export const fields = [
  {
    id: "a12",
    name: "Field A-12",
    sector: "Nuwara Eliya Sector 2",
    estate: "Nuwara Eliya",
    clone: "TRI 2025",
    score: 92,
    concern: "Blister Blight Micro-climate",
    status: "Action Required",
    severity: "critical",
    humidity: 91,
    leafWetness: "18.4 h",
    temperature: "17.2°C",
    sporePressure: "High",
    recommendation:
      "Apply a protective copper spray within 24 hours. Pause overhead irrigation through the next cool night and re-scout the lower canopy on the windward edge.",
  },
  {
    id: "s4n",
    name: "Sector 4 North",
    sector: "Dimbula Lowland",
    estate: "Dimbula",
    clone: "TRI 4042",
    score: 85,
    concern: "Drought & Leaf Wetness",
    status: "Action Required",
    severity: "critical",
    humidity: 74,
    leafWetness: "11.2 h",
    temperature: "24.8°C",
    sporePressure: "Moderate",
    recommendation:
      "Shift to a short evening irrigation pulse and inspect for drought scorch on exposed rows. Recheck soil moisture probes before the next supervisor round.",
  },
  {
    id: "c03",
    name: "Field C-03",
    sector: "Kandy Ridge Division",
    estate: "Kandy Ridge",
    clone: "TRI 2023",
    score: 78,
    concern: "Nutrient Deficiency",
    status: "Warning",
    severity: "warning",
    humidity: 69,
    leafWetness: "6.1 h",
    temperature: "22.4°C",
    sporePressure: "Low",
    recommendation:
      "Schedule a foliar potassium and magnesium pass this week. Yellowing is concentrated on the ridge crest and is not yet paired with blister lesions.",
  },
];

export const alerts = [
  {
    id: 1,
    fieldId: "a12",
    estate: "Nuwara Eliya",
    title: "Blister blight micro-climate",
    place: "Field A-12 · Nuwara Eliya",
    level: "Unresolved",
    time: "18 min ago",
  },
  {
    id: 2,
    fieldId: "s4n",
    estate: "Dimbula",
    title: "Drought and leaf wetness",
    place: "Sector 4 North · Dimbula",
    level: "Unresolved",
    time: "42 min ago",
  },
  {
    id: 3,
    fieldId: "c03",
    estate: "Kandy Ridge",
    title: "Nutrient deficiency warning",
    place: "Field C-03 · Kandy Ridge",
    level: "Warning",
    time: "2 h ago",
  },
  {
    id: 4,
    estate: "Nuwara Eliya",
    title: "Canopy humidity above band",
    place: "Nuwara Eliya Sector 2",
    level: "Watch",
    time: "3 h ago",
  },
  {
    id: 5,
    estate: "Dimbula",
    title: "Sensor drift on block probe",
    place: "Dimbula Lowland",
    level: "Watch",
    time: "5 h ago",
  },
];

export const detections = [
  {
    id: "blister",
    name: "Blister blight",
    fieldId: "a12",
    field: "Field A-12",
    confidence: 94,
    model: "Model 02",
    detail:
      "Spore load is high where canopy humidity stayed above the infection band overnight.",
  },
  {
    id: "drought",
    name: "Drought stress",
    fieldId: "s4n",
    field: "Sector 4 North",
    confidence: 88,
    model: "Model 02",
    detail:
      "Leaf wetness is uneven and soil moisture sits below the irrigation band.",
  },
  {
    id: "nutrient",
    name: "Nutrient deficiency",
    fieldId: "c03",
    field: "Field C-03",
    confidence: 81,
    model: "Model 03",
    detail:
      "Chlorosis on the ridge crest without an active lesion pattern.",
  },
];

export const estateRisk = [
  {
    estate: "Nuwara Eliya",
    level: "High",
    score: 89,
    note: "Blister blight micro-climate on Sector 2 after the day-24 humidity breach.",
  },
  {
    estate: "Dimbula",
    level: "High",
    score: 85,
    note: "Drought stress with uneven leaf wetness across the lowland rows.",
  },
  {
    estate: "Kandy Ridge",
    level: "Elevated",
    score: 78,
    note: "Nutrient deficiency on the ridge crest. Lesion pressure remains low.",
  },
];

export const pdviFactors = [
  { name: "Spore pressure", value: 81, note: "Elevated in Nuwara Eliya" },
  { name: "Canopy humidity", value: 76, note: "Coupled with infection risk" },
  { name: "Leaf wetness hours", value: 74, note: "Overnight persistence" },
  { name: "Thermal inversion", value: 58, note: "Cool nights on the ridge" },
];

export const reportHistory = [
  { id: "r1", name: "Weekly estate brief", date: "14 Oct 2026", range: "7 days" },
  { id: "r2", name: "Blister blight watch", date: "12 Oct 2026", range: "Nuwara Eliya" },
  { id: "r3", name: "Irrigation adjustment log", date: "08 Oct 2026", range: "Dimbula" },
];

export const trend = [
  { day: 1, risk: 12, humidity: 31, label: "Day 1" },
  { day: 4, risk: 16, humidity: 40 },
  { day: 7, risk: 23, humidity: 54, label: "Day 7" },
  { day: 10, risk: 36, humidity: 62 },
  { day: 14, risk: 49, humidity: 67, label: "Day 14" },
  { day: 17, risk: 51, humidity: 65 },
  { day: 21, risk: 47, humidity: 70, label: "Day 21" },
  { day: 23, risk: 53, humidity: 75 },
  { day: 24, risk: 62, humidity: 79 },
  { day: 26, risk: 78, humidity: 86 },
  {
    day: 28,
    risk: 89,
    humidity: 91,
    label: "Day 28",
    place: "Nuwara Eliya",
    critical: true,
  },
  { day: 29, risk: 86, humidity: 84 },
  { day: 30, risk: 84, humidity: 78, label: "Today", place: "Estate average" },
];

export function scoreClass(score) {
  if (score >= 85) return "text-[#e23b45]";
  if (score >= 70) return "text-[#c98416]";
  return "text-[#1f7a45]";
}

export function statusClass(status) {
  if (status === "Action Required" || status === "Unresolved") {
    return "bg-[#fdecee] text-[#d64550]";
  }
  if (status === "Warning") return "bg-[#f8efc8] text-[#9a6410]";
  if (status === "Watch") return "bg-[#e8f1f6] text-[#3d6f8f]";
  return "bg-[#e7f6ec] text-[#1f7a45]";
}

export function flagClass(severity) {
  return severity === "critical"
    ? "bg-[#fdecee] text-[#e23b45]"
    : "bg-[#fbf3d5] text-[#c98416]";
}

export function riskTone(level) {
  if (level === "High") return "text-[#e23b45]";
  return "text-[#c98416]";
}
