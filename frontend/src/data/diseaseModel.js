export const MODEL_META = {
  id: "01",
  name: "EfficientNet-B0 Keras",
  version: "v1.0",
  endpoint: "/api/v1/predict/disease",
  benchmarkAcc: 92.55,
  benchmarkAccNote:
    "Held-out test accuracy from Model 01 training evaluation; not guaranteed for each uploaded specimen.",
  inputSize: "224 × 224 RGB",
  classes: 4,
  serviceConnected: false,
};

export const PATHOLOGY_CLASSES = [
  {
    id: "blister",
    label: "Blister Blight",
    scientific: "Exobasidium vexans Massee",
    code: "INF-9821",
  },
  {
    id: "grey",
    label: "Grey Blight",
    scientific: "Pestalotiopsis theae",
    code: "INF-7732",
  },
  {
    id: "redRust",
    label: "Red Rust",
    scientific: "Cephaleuros parasiticus",
    code: "INF-5520",
  },
  {
    id: "healthy",
    label: "Healthy",
    scientific: "Camellia sinensis (normal)",
    code: "OK-0000",
  },
];

/** Frontend demo softmax vectors — not live inference output */
export const DEMO_SOFTMAX_BY_CLASS = {
  blister: [
    { id: "blister", label: "Blister Blight", pct: 89.4 },
    { id: "grey", label: "Grey Blight", pct: 6.2 },
    { id: "redRust", label: "Red Rust", pct: 3.1 },
    { id: "healthy", label: "Healthy", pct: 1.3 },
  ],
  grey: [
    { id: "grey", label: "Grey Blight", pct: 84.1 },
    { id: "blister", label: "Blister Blight", pct: 8.4 },
    { id: "redRust", label: "Red Rust", pct: 4.0 },
    { id: "healthy", label: "Healthy", pct: 3.5 },
  ],
  redRust: [
    { id: "redRust", label: "Red Rust", pct: 81.6 },
    { id: "grey", label: "Grey Blight", pct: 9.2 },
    { id: "blister", label: "Blister Blight", pct: 5.7 },
    { id: "healthy", label: "Healthy", pct: 3.5 },
  ],
  healthy: [
    { id: "healthy", label: "Healthy", pct: 96.2 },
    { id: "grey", label: "Grey Blight", pct: 1.6 },
    { id: "blister", label: "Blister Blight", pct: 1.4 },
    { id: "redRust", label: "Red Rust", pct: 0.8 },
  ],
};

export const DEMO_SPECIMEN = {
  name: "sample_blister_specimen.jpg",
  fullName: "sample_blister_specimen.jpg",
  sizeLabel: "2.4 MB",
  dimensions: "3024 × 4032",
  format: "JPEG",
  isDemoSample: true,
};

const DESCRIPTIONS = {
  blister:
    "Demo result: lesion patterns consistent with early blister blight on the adaxial leaf surface. This copy is for UI preview only.",
  grey: "Demo result: grey blight–like necrotic spotting suggested on the specimen. Confirm with field scouting before treatment.",
  redRust: "Demo result: algal rust–like discolouration signatures flagged. Validate humidity and shade conditions on the block.",
  healthy:
    "Demo result: no pathology class exceeded the demo infection threshold. Continue routine monitoring on this block.",
};

const NEXT_STEPS = {
  blister: [
    "Isolate affected rows and log block ID in the supervisor queue.",
    "Schedule copper-based protective spray within 24 hours if field conditions match.",
    "Re-scout after the next cool, damp night cycle.",
  ],
  grey: [
    "Increase airflow assessment on dense canopy sectors.",
    "Review recent rainfall and plan targeted fungicide window with agronomy lead.",
    "Collect a follow-up specimen in 48 hours for comparison.",
  ],
  redRust: [
    "Inspect shaded zones for rust spread on lower leaf surfaces.",
    "Trim overhead shade where moisture retention is high.",
    "Monitor neighbouring blocks for similar algal rust signatures.",
  ],
  healthy: [
    "Continue standard weekly scouting on this block.",
    "Maintain balanced plucking rounds and canopy ventilation.",
    "Archive this specimen as a healthy reference if desired.",
  ],
};

export function diagnosisForClass(classId) {
  const pathology = PATHOLOGY_CLASSES.find((item) => item.id === classId) ?? PATHOLOGY_CLASSES[0];
  const probabilities = DEMO_SOFTMAX_BY_CLASS[classId] ?? DEMO_SOFTMAX_BY_CLASS.blister;
  const top = probabilities[0];
  return {
    classId,
    probability: top.pct,
    score: top.pct / 100,
    isDemo: true,
    summary: DESCRIPTIONS[classId] ?? DESCRIPTIONS.blister,
    nextSteps: NEXT_STEPS[classId] ?? NEXT_STEPS.blister,
    pathology,
    probabilities,
  };
}
