export const PDVI_META = {
  model: "MODEL 03",
  advisory: "ACTIVE ADVISORY",
  cycle: "CYCLE 2024-Q3",
  score: 72,
  delta: 4,
  band: "Substantial Risk",
  telemetryStations: 42,
  telemetryUpdated: "12 mins ago",
};

export const PDVI_SUMMARY =
  "Estate vulnerability is elevated due to coupled microclimate humidity and historical blister-blight zones in Nuwara Eliya Sector 2. Supervisors should prioritize protective sprays on the top three blocks before the next cool night.";

export const CONTRIBUTING_FACTORS = [
  {
    id: "climate",
    label: "Climate & Humidity",
    weight: "30% wt",
    value: 88,
    status: "Critical",
    tone: "critical",
    bar: "#e23b45",
  },
  {
    id: "history",
    label: "Historical Disease Occurrence",
    weight: "30% wt",
    value: 76,
    status: "Elevated",
    tone: "elevated",
    bar: "#e08a1e",
  },
  {
    id: "vigor",
    label: "Crop Age & Bush Vigor",
    weight: "25% wt",
    value: 58,
    status: "Moderate",
    tone: "moderate",
    bar: "#5cb87a",
  },
  {
    id: "drainage",
    label: "Soil Drainage & Slope",
    weight: "15% wt",
    value: 42,
    status: "Normal",
    tone: "normal",
    bar: "#1f7a4d",
  },
];

export const PRIORITY_BLOCKS = [
  {
    id: "b4s9",
    block: "Block 04, Sector 09",
    concern: "High Humidity",
    score: 88,
    tone: "critical",
  },
  {
    id: "b2s1",
    block: "Block 02, Sector 01",
    concern: "Historical Blight",
    score: 76,
    tone: "elevated",
  },
  {
    id: "b5s12",
    block: "Block 05, Sector 12",
    concern: "Drainage Lag",
    score: 42,
    tone: "moderate",
  },
];

export const METHODOLOGY = [
  "PDVI aggregates weighted estate factors into a 0-100 vulnerability index refreshed each advisory cycle.",
  "Climate & humidity and historical disease occurrence each contribute 30% of the composite score.",
  "Crop age, bush vigor, and soil drainage complete the index using TRI estate management guidelines.",
  "Scores above 70 trigger substantial-risk advisories and supervisor dispatch recommendations.",
];

export function statusTone(tone) {
  const map = {
    critical: "bg-[#fdecee] text-[#d64550]",
    elevated: "bg-[#f8efd8] text-[#b87418]",
    moderate: "bg-[#e7f6ec] text-[#1f7a45]",
    normal: "bg-[#eef1ef] text-[#5f7368]",
  };
  return map[tone] ?? map.normal;
}

export function concernTone(tone) {
  const map = {
    critical: "text-[#e23b45]",
    elevated: "text-[#c98416]",
    moderate: "text-[#3c9a62]",
  };
  return map[tone] ?? "text-[#5f7368]";
}

export function scoreBoxTone(score) {
  if (score >= 80) return "bg-[#fdecee] text-[#e23b45]";
  if (score >= 65) return "bg-[#f8efd8] text-[#c98416]";
  return "bg-[#eef6f0] text-[#3c9a62]";
}
