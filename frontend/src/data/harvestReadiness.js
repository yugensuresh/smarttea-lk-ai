export const READINESS_FIELDS = [
  {
    id: "a1",
    name: "Field A-1",
    location: "Upper Estate",
    status: "READY NOW",
    statusTone: "ready",
    action: "Assign Team",
    actionTone: "primary",
    description:
      "Optimal plucking window established. High yield expected based on recent rainfall data.",
    maturity: 98,
    stats: {
      lastPlucked: "14 Days Ago",
      secondary: { label: "Soil Moisture", value: "Optimal (42%)" },
      yield: "450 kg/ha",
      spark: [12, 14, 13, 15, 16, 18, 19],
    },
  },
  {
    id: "b4",
    name: "Field B-4",
    location: "Valley Slope",
    status: "NEARLY READY",
    statusTone: "near",
    action: "Monitor",
    actionTone: "outline",
    description: "Monitoring required. Expected to reach optimal maturity within 48 hours.",
    maturity: 85,
    stats: {
      lastPlucked: "11 Days Ago",
      secondary: { label: "Sunlight Exp.", value: "Slightly Low" },
      yield: "380 kg/ha",
      spark: [10, 11, 12, 13, 14, 15, 16],
    },
  },
  {
    id: "c2",
    name: "Field C-2",
    location: "New Planting",
    status: "NOT READY",
    statusTone: "not",
    action: "Details",
    actionTone: "ghost",
    description: "Recovering from recent pruning. Do not schedule plucking for at least 7 days.",
    maturity: 35,
    stats: {
      lastPlucked: "4 Days Ago",
      secondary: { label: "Pest Risk", value: "Elev. (Thrips)", warn: true },
      yield: "-- kg/ha",
      spark: [8, 7, 6, 5, 5, 4, 4],
    },
  },
];

export const ESTATE_OVERVIEW = {
  readyPercent: 42,
  legend: [
    { label: "Ready Now", count: 12, tone: "ready" },
    { label: "Nearly Ready", count: 8, tone: "near" },
    { label: "Not Ready", count: 16, tone: "not" },
  ],
};

export const ENV_CONTEXT = {
  body: "Current weather patterns are accelerating growth in lower elevation fields.",
  avgTemp: "24°C",
  humidity: "78%",
  alert: "Heavy rain forecasted in 3 days. Prioritize harvesting mature fields immediately.",
};

export function fieldBorderClass(tone) {
  if (tone === "ready") return "border-l-[#178a45]";
  if (tone === "near") return "border-l-[#7bc89a]";
  return "border-l-[#e8a4a4]";
}

export function statusBadgeClass(tone) {
  if (tone === "ready") return "bg-[#178a45] text-white";
  if (tone === "near") return "bg-[#dbeafe] text-[#1e5a8a]";
  return "bg-[#fde8e8] text-[#b42318]";
}

export function maturityBarClass(tone) {
  if (tone === "not") return "bg-[#e57373]";
  if (tone === "near") return "bg-[#7bc89a]";
  return "bg-[#178a45]";
}
