const PDVI_SEVERITY_KEYS = ["Low", "Moderate", "High", "Severe"];

/**
 * Normalize Model 02 severity output for PDVI POST.
 * Inference may return only non-zero classes; backend requires all four keys summing ~1.
 */
export function normalizeSeverityProbabilitiesForPdvi(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  for (const key of PDVI_SEVERITY_KEYS) {
    const value = raw[key];
    if (value == null) {
      out[key] = 0;
      continue;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return null;
    out[key] = n;
  }
  let sum = Object.values(out).reduce((a, b) => a + b, 0);
  if (!Number.isFinite(sum) || sum <= 0) return null;
  if (Math.abs(sum - 1) > 0.02) {
    for (const key of PDVI_SEVERITY_KEYS) {
      out[key] = out[key] / sum;
    }
    sum = 1;
  }
  return out;
}
