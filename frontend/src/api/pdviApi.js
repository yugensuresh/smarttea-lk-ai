import { apiFetch, pick } from "./apiClient";
import {
  CONTRIBUTING_FACTORS as demoFactors,
  METHODOLOGY as demoMethodology,
  PDVI_META as demoMeta,
  PDVI_SUMMARY as demoSummary,
  PRIORITY_BLOCKS as demoBlocks,
} from "../data/pdviModel";

function numOrNull(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function mapFactor(raw) {
  return {
    id: raw.id ?? "",
    label: raw.label ?? "",
    weight: raw.weight ?? "",
    value: Number(raw.value ?? 0),
    status: raw.status ?? "",
    tone: raw.tone ?? "normal",
    bar: raw.bar ?? "#1f7a4d",
  };
}

function mapBlock(raw) {
  return {
    id: String(pick(raw, "id", "block_id") ?? ""),
    block: pick(raw, "block", "block_name") ?? "",
    concern: raw.concern ?? "",
    score: Number(raw.score ?? 0),
    tone: raw.tone ?? "moderate",
  };
}

function mapMeta(rawMeta, calculation) {
  const formulaScore = calculation
    ? numOrNull(pick(calculation, "score", "pdviScore", "pdvi_score"))
    : null;
  const metaScore =
    numOrNull(pick(rawMeta, "pdviScoreExact", "pdvi_score_exact")) ??
    numOrNull(pick(rawMeta, "score", "pdvi_score"));

  return {
    model: rawMeta?.model ?? "MODEL 03",
    advisory: rawMeta?.advisory ?? null,
    cycle: rawMeta?.cycle ?? null,
    band: rawMeta?.band ?? calculation?.band ?? null,
    inferenceEngine: pick(rawMeta, "inferenceEngine", "inference_engine") ?? calculation?.inferenceEngine ?? null,
    formulaStatus: pick(rawMeta, "formulaStatus", "formula_status") ?? calculation?.status ?? null,
    score: formulaScore ?? metaScore,
    scoreIsFromFormula: formulaScore != null,
    scoreExact: formulaScore,
    scoreDisplayRounded:
      formulaScore != null
        ? Math.round(formulaScore)
        : metaScore != null
          ? Math.round(metaScore)
          : null,
    delta: numOrNull(pick(rawMeta, "delta", "score_delta")),
    deltaVerified: pick(rawMeta, "deltaVerified", "delta_verified") === true,
    telemetryStations: numOrNull(pick(rawMeta, "telemetryStations", "telemetry_stations")),
    telemetryUpdated: pick(rawMeta, "telemetryUpdated", "telemetry_updated") ?? null,
  };
}

function normalizePdviPayload(data, options = {}) {
  const { explicitDemo = false } = options;
  const calculation = data?.calculation ?? data?.formula ?? null;
  const rawMeta = data?.meta ?? data?.pdvi ?? {};

  const factorsRaw = data?.contributingFactors ?? data?.contributing_factors;
  const blocksRaw = data?.priorityBlocks ?? data?.priority_blocks;
  const methodologyRaw = data?.methodology;

  const hasFactors = Array.isArray(factorsRaw) && factorsRaw.length > 0;
  const hasBlocks = Array.isArray(blocksRaw) && blocksRaw.length > 0;
  const hasMethodology = Array.isArray(methodologyRaw) && methodologyRaw.length > 0;

  const telemetryRaw = pick(data, "telemetryActive", "telemetry_active");
  const telemetryActive = telemetryRaw === true;

  return {
    meta: mapMeta(rawMeta, calculation),
    summary: data?.summary ?? data?.advisory_summary ?? null,
    contributingFactors: hasFactors ? factorsRaw.map(mapFactor) : [],
    priorityBlocks: hasBlocks ? blocksRaw.map(mapBlock) : [],
    methodology: hasMethodology ? methodologyRaw : [],
    telemetryActive,
    calculation,
    hasFormulaCalculation: calculation != null && numOrNull(pick(calculation, "score", "pdviScore")) != null,
    narrativeIsCatalog: !explicitDemo && Boolean(data?.summary || hasFactors || hasBlocks),
    sampleDataLabeled: explicitDemo,
    source: explicitDemo ? "demo" : "api",
  };
}

/** Dev-only fallback when GET /api/v1/pdvi is unreachable — explicitly labelled sample data. */
function buildExplicitDemoPayload(errorMessage) {
  return {
    ...normalizePdviPayload(
      {
        meta: {
          model: demoMeta.model,
          advisory: demoMeta.advisory,
          cycle: demoMeta.cycle,
          band: null,
          score: null,
          delta: null,
        },
        summary: demoSummary,
        contributingFactors: demoFactors,
        priorityBlocks: demoBlocks,
        methodology: demoMethodology,
        telemetryActive: false,
      },
      { explicitDemo: true },
    ),
    error: errorMessage,
  };
}

/**
 * GET /api/v1/pdvi
 */
export async function fetchPdviResults() {
  try {
    const data = await apiFetch("/api/v1/pdvi");
    return normalizePdviPayload(data);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[pdviApi] Using labelled local sample PDVI data:", error.message);
      return buildExplicitDemoPayload(error.message);
    }
    throw error;
  }
}

/**
 * POST /api/v1/predict/pdvi — Model 03 formula (Model 01 confidence + severity probabilities).
 */
export async function predictPdvi(body) {
  const data = await apiFetch("/api/v1/predict/pdvi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return normalizePdviPayload(data);
}
