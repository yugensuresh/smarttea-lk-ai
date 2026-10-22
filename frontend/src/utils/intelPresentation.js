/** Grade → numeric quality score (STII engine mapping). */
export const GRADE_QUALITY_SCORE = {
  A: 92.5,
  B: 77.5,
  C: 60.0,
  D: 42.5,
};

const LIVE_INTEL_ENGINES = new Set([
  "sklearn-gbc-tea-quality-v1",
  "sklearn-rf-sustainability-v1",
  "stii-formula-v1",
]);

export function isLiveIntelEngine(engine) {
  if (!engine || typeof engine !== "string") return false;
  return LIVE_INTEL_ENGINES.has(engine);
}

export function isLiveIntelBundle(data) {
  if (!data || data.ok === false) return false;
  const qualityEngine = data.teaQuality?.inferenceEngine ?? data.inferenceEngine;
  const sustainEngine = data.sustainability?.inferenceEngine;
  const stiiEngine = data.stii?.inferenceEngine;
  if (qualityEngine && sustainEngine && stiiEngine) {
    return isLiveIntelEngine(qualityEngine) && isLiveIntelEngine(sustainEngine) && isLiveIntelEngine(stiiEngine);
  }
  return isLiveIntelEngine(qualityEngine);
}

export function extractTopClassProbability(probabilities) {
  if (!Array.isArray(probabilities) || probabilities.length === 0) return null;
  let best = probabilities[0]?.probability ?? 0;
  for (const row of probabilities) {
    const p = Number(row?.probability ?? 0);
    if (p > best) best = p;
  }
  return Math.round(best * 100);
}

export function mapTeaQualityResponse(data) {
  if (!data || data.ok === false) return null;
  const engine = data.inferenceEngine;
  if (!isLiveIntelEngine(engine)) return null;
  const grade = data.teaGrade ?? null;
  const qualityScoreEquivalent =
    grade != null ? GRADE_QUALITY_SCORE[String(grade).charAt(0).toUpperCase()] ?? null : null;
  return {
    live: true,
    teaGrade: grade,
    qualityScoreEquivalent,
    topClassProbabilityPct: extractTopClassProbability(data.probabilities),
    inferenceEngine: engine,
  };
}

export function mapQualityStiiResponse(data) {
  if (!data || !isLiveIntelBundle(data)) return null;
  return {
    live: true,
    teaGrade: data.teaQuality?.teaGrade ?? null,
    qualityScoreEquivalent: data.qualityScoreEquivalent ?? data.stii?.quality_score_equiv ?? null,
    sustainabilityScore: data.sustainability?.sustainabilityScore ?? null,
    sustainabilityLabel: data.sustainability?.performanceLabel ?? null,
    stiiScore: data.stiiScore ?? data.stii?.stii_score ?? null,
    performanceTier: data.performanceTier ?? data.stii?.performance_tier ?? null,
    topClassProbabilityPct: extractTopClassProbability(data.teaQuality?.probabilities),
    qualityEngine: data.teaQuality?.inferenceEngine ?? null,
    sustainabilityEngine: data.sustainability?.inferenceEngine ?? null,
    stiiEngine: data.stii?.inferenceEngine ?? null,
  };
}

export function normalizeIntelOverview(data) {
  const kpis = data?.kpis ?? {};
  const live = data?.ok !== false && isLiveIntelEngine(data?.inferenceEngine);
  return {
    live,
    teaGrade: kpis.teaGrade ?? null,
    qualityScoreEquivalent: kpis.qualityScoreEquivalent ?? data?.stii?.quality_score_equiv ?? null,
    teaQualityConfidence: kpis.teaQualityConfidence ?? null,
    sustainabilityScore: kpis.sustainabilityScore ?? data?.sustainability?.sustainabilityScore ?? null,
    sustainabilityLabel: kpis.sustainabilityLabel ?? data?.sustainability?.performanceLabel ?? null,
    stiiScore: kpis.stiiScore ?? data?.stii?.stii_score ?? null,
    stiiTier: kpis.stiiTier ?? data?.stii?.performance_tier ?? null,
    inferenceEngine: data?.inferenceEngine ?? null,
  };
}
