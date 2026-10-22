export const QS_KPIS = {
  quality: { value: 94, delta: "+2.4%", code: "Q-PRED-LIVE" },
  sustainability: { grade: "A+", note: "Top 5% Regionally", code: "SUST-IDX-Q3" },
  resourceEfficiency: 88,
  stiiScore: "91/100",
};

export const PERFORMANCE_SERIES = [62, 58, 65, 68, 72, 70, 74, 78, 76, 80, 82, 85, 83, 86, 88, 90, 89, 91, 93, 92, 94, 93, 95, 94, 96, 95, 97, 96, 98, 94];

export const RECOMMENDATIONS = [
  {
    id: "irrigation",
    title: "Adjust Irrigation in Sector 4",
    badge: "HIGH PRIORITY",
    badgeTone: "priority",
    body: "Soil moisture sensors indicate a 15% drop below optimal levels. Increase flow rate by 0.5L/hr for next 48 hours.",
    action: "Apply Settings",
    icon: "droplet",
  },
  {
    id: "mulch",
    title: "Initiate Organic Mulching",
    badge: "SCHEDULED",
    badgeTone: "scheduled",
    body: "Predictive models suggest upcoming dry spell. Mulching Sector 2 will preserve current high sustainability index.",
    action: "View Schedule",
    icon: "layers",
  },
  {
    id: "route",
    title: "Harvest Route Optimization",
    badge: "OPTIMIZATION",
    badgeTone: "optimization",
    body: "AI route planner has found a 12% more efficient path for tomorrow's harvest, reducing fuel consumption.",
    action: "Review Route",
    icon: "truck",
  },
];
