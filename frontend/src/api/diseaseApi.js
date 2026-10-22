import { apiFetch, apiUrl, pick } from "./apiClient";
import { MODEL_META, PATHOLOGY_CLASSES, diagnosisForClass } from "../data/diseaseModel";

function mapProbabilities(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list.map((item) => ({
    id: pick(item, "id", "class_id", "classId") ?? "",
    label: item.label ?? "",
    pct: Number(
      (() => {
        const direct = pick(item, "pct", "probability", "confidence_pct");
        if (direct != null) return direct <= 1 ? direct * 100 : direct;
        return 0;
      })(),
    ),
  }));
}

function mapDiagnosis(data) {
  const classId =
    pick(data, "classId", "class_id", "predicted_class", "predictedClass") ?? "blister";
  const pathologyFromApi = data.pathology ?? data.pathology_class;
  const pathology =
    pathologyFromApi ??
    PATHOLOGY_CLASSES.find((item) => item.id === classId) ??
    PATHOLOGY_CLASSES[0];

  const probabilities = mapProbabilities(data.probabilities ?? data.class_probabilities);
  const confidenceRaw = pick(data, "probability", "confidence", "confidence_score");
  const probabilityForClass = probabilities?.find((item) => item.id === classId)?.pct;
  const probability =
    probabilityForClass ??
    (confidenceRaw != null
      ? Number(confidenceRaw <= 1 ? confidenceRaw * 100 : confidenceRaw)
      : probabilities?.[0]?.pct ?? 0);

  const nextSteps = data.nextSteps ?? data.next_steps ?? [];

  return {
    classId,
    probability: Math.round(probability * 10) / 10,
    score: probability / 100,
    isDemo: Boolean(data.demo),
    summary: data.summary ?? data.description ?? "",
    nextSteps: Array.isArray(nextSteps) ? nextSteps : [],
    pathology: {
      id: pathology.id ?? classId,
      label: pathology.label ?? "",
      scientific: pathology.scientific ?? "",
      code: pathology.code ?? "",
    },
    probabilities: probabilities ?? [],
    inferenceEngine: data.inferenceEngine ?? data.inference_engine ?? null,
  };
}

/**
 * POST /api/v1/predict/disease (multipart: file)
 */
export async function predictDisease(file) {
  const form = new FormData();
  form.append("file", file);

  const response = await fetch(apiUrl(MODEL_META.endpoint), {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    const message =
      typeof body?.detail === "string"
        ? body.detail
        : `Disease prediction failed (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  return { diagnosis: mapDiagnosis(data), raw: data, source: "api" };
}

/**
 * GET /api/v1/models/disease — optional service metadata
 */
export async function fetchDiseaseModelMeta() {
  try {
    const data = await apiFetch("/api/v1/models/disease");
    return {
      ...MODEL_META,
      ...data,
      serviceConnected: true,
    };
  } catch {
    return { ...MODEL_META, serviceConnected: false };
  }
}

export async function predictDiseaseWithFallback(file, { demoClassId = "blister" } = {}) {
  try {
    return await predictDisease(file);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[diseaseApi] Using demo diagnosis:", error.message);
      return {
        diagnosis: { ...diagnosisForClass(demoClassId), isDemo: true },
        source: "demo",
        error: error.message,
      };
    }
    throw error;
  }
}
