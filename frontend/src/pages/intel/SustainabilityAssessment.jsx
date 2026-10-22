import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import HarvestModelForm from "../../components/harvest/HarvestModelForm";
import IntelPageHeader from "../../components/intel/IntelPageHeader";
import { IntelCompactPlaceholder } from "../../components/intel/IntelPageHeader";
import IntelScoreRing from "../../components/intel/IntelScoreRing";
import { fetchSustainabilityAssessment, predictSustainability } from "../../api/intelApi";
import {
  SUSTAINABILITY_FIELDS,
  buildStrictFeaturePayload,
  emptySustainabilityForm,
  validateIntelForm,
} from "../../data/intelModelFeatures";
import { featuresToFormValues } from "../../utils/harvestReadinessUi";
import { isLiveIntelEngine } from "../../utils/intelPresentation";

export default function SustainabilityAssessment() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [form, setForm] = useState(() => emptySustainabilityForm());
  const [running, setRunning] = useState(false);
  const [livePrediction, setLivePrediction] = useState(false);
  const [referenceNote, setReferenceNote] = useState("");
  const [result, setResult] = useState(null);

  const setFormField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setLivePrediction(false);
    setValidationError("");
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchSustainabilityAssessment();
        if (!active) return;
        const seeded = featuresToFormValues(SUSTAINABILITY_FIELDS, data.sustainabilityFeatures);
        if (seeded) setForm(seeded);
        if (data.ok === true && data.prediction?.sustainabilityScore != null) {
          setReferenceNote(
            `Reference only (catalog defaults on server): score ${data.prediction.sustainabilityScore}. Your submission below replaces this.`,
          );
        } else if (data.ok === false) {
          setReferenceNote(data.error ?? "Model 02 unavailable until ML service is connected.");
        }
      } catch (err) {
        if (active) setError(err.message ?? "Could not load form defaults");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function runSustainabilityModel() {
    setValidationError("");
    setError("");
    const check = validateIntelForm(SUSTAINABILITY_FIELDS, form);
    if (!check.ok) {
      setValidationError(check.message);
      setLivePrediction(false);
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const features = buildStrictFeaturePayload(SUSTAINABILITY_FIELDS, form);
      const prediction = await predictSustainability(features);
      setResult(prediction);
      setLivePrediction(isLiveIntelEngine(prediction.inferenceEngine));
    } catch (err) {
      setLivePrediction(false);
      setResult(null);
      setError(err.message ?? "Sustainability prediction failed");
    } finally {
      setRunning(false);
    }
  }

  const score = livePrediction ? Math.round(Number(result?.sustainabilityScore ?? 0)) : null;

  return (
    <div className="mx-auto max-w-[1120px] pb-8">
      <IntelPageHeader
        title="Sustainability Assessment"
        description="Model 02 (Random Forest) scores plantation sustainability from eight soil and operational features."
        statusLabel={livePrediction ? "Live Model 02 prediction" : "Awaiting prediction"}
        statusLive={livePrediction}
      />

      {loading && (
        <p className="mb-3 flex items-center gap-2 text-sm text-[#8b9790]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading form…
        </p>
      )}
      {referenceNote && (
        <p className="mb-3 rounded-lg bg-[#f6f8f6] px-3 py-2 text-xs text-[#5f7368]">{referenceNote}</p>
      )}
      {validationError && (
        <p className="mb-3 text-sm text-[#991b1b]" role="alert">
          {validationError}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <HarvestModelForm
          title="Model 02 inputs"
          fields={SUSTAINABILITY_FIELDS}
          values={form}
          onChange={setFormField}
          onSubmit={runSustainabilityModel}
          running={running}
          submitLabel="Run Sustainability Model"
        />
        <div>
          {error && !running && (
            <IntelCompactPlaceholder tone="error">{error}</IntelCompactPlaceholder>
          )}
          {!error && running && (
            <IntelCompactPlaceholder>Running Model 02 sustainability regressor…</IntelCompactPlaceholder>
          )}
          {!error && !running && !livePrediction && (
            <IntelCompactPlaceholder>Awaiting prediction — submit the form to run Model 02.</IntelCompactPlaceholder>
          )}
          {!error && !running && livePrediction && result && (
            <section className="rounded-2xl border border-[#c8f0d4] bg-[#edf8f0] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8d9992]">Your latest run</p>
              <div className="mt-3 flex items-center gap-4">
                <IntelScoreRing
                  score={score}
                  max={100}
                  size={120}
                  stroke={10}
                  label={
                    <span className="text-xl font-bold tabular-nums text-[#153d2e]">
                      {score}
                      <span className="text-sm font-medium text-[#8b9790]"> / 100</span>
                    </span>
                  }
                />
                <div>
                  <p className="text-lg font-bold text-[#153d2e]">{result.performanceLabel ?? "—"}</p>
                  <p className="text-xs text-[#7e8c84]">{result.inferenceEngine}</p>
                  <p className="mt-1 text-xs tabular-nums text-[#5f7368]">
                    Raw score: {result.sustainabilityScore}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
