/**
 * Model 01 Keras softmax: index order matches ml/member01_config.json diseaseClassIds.
 */

function pctFromSoftmaxValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n >= 0 && n <= 1) return n * 100;
  return n;
}

/**
 * @param {{ classIndexOrder?: string[], softmaxVector?: number[] }} payload
 * @returns {{ valid: boolean, items: { id: string, pct: number }[] }}
 */
export function parseModel01Softmax({ classIndexOrder, softmaxVector } = {}) {
  if (!Array.isArray(classIndexOrder) || !Array.isArray(softmaxVector)) {
    return { valid: false, items: [] };
  }
  if (!classIndexOrder.length || classIndexOrder.length !== softmaxVector.length) {
    return { valid: false, items: [] };
  }

  const items = classIndexOrder.map((id, index) => ({
    id: String(id),
    pct: pctFromSoftmaxValue(softmaxVector[index]),
  }));

  const totalPct = items.reduce((sum, row) => sum + row.pct, 0);
  const valid = totalPct > 99 && totalPct < 101;

  return { valid, items };
}

/**
 * Map a legacy API probability row to display pct.
 * Prefer explicit probability (0–1 softmax) over pct when both are present so values
 * like pct 0.6 are not mistaken for fractions (60%).
 */
export function pctFromApiProbabilityRow(item) {
  if (!item || typeof item !== "object") return 0;
  const probability = item.probability ?? item.confidence;
  if (probability != null && Number.isFinite(Number(probability))) {
    return pctFromSoftmaxValue(probability);
  }
  const pct = item.pct ?? item.confidence_pct;
  if (pct != null && Number.isFinite(Number(pct))) {
    const n = Number(pct);
    return n >= 0 && n <= 1 ? n * 100 : n;
  }
  return 0;
}
