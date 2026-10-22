/** Disease & Plantation Health sidebar routes (single source for nav + tests). */
export const DISEASE_DETECTION_PATH = "/disease";
export const SEVERITY_LEGACY_PATH = "/severity";

export const plantationHealthNav = [
  { to: DISEASE_DETECTION_PATH, label: "Disease Detection" },
  { to: "/risk", label: "Risk Prediction" },
  { to: "/pdvi", label: "PDVI Scoring" },
];
