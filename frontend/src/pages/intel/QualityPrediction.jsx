import { useCallback, useState } from "react";
import IntelPageHeader from "../../components/intel/IntelPageHeader";
import IntelTeaQualityForm from "../../components/intel/IntelTeaQualityForm";
import IntelTeaQualityResults from "../../components/intel/IntelTeaQualityResults";
import { predictTeaQuality } from "../../api/intelApi";
import { buildTeaQualityPayload, emptyTeaQualityForm } from "../../data/intelModelFeatures";
import { mapTeaQualityResponse } from "../../utils/intelPresentation";

export default function QualityPrediction() {
  const [form, setForm] = useState(emptyTeaQualityForm);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [running, setRunning] = useState(false);

  const onChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setResult(null);
    setError("");
    setValidationError("");
  }, []);

  async function runPrediction() {
    if (running) return;
    setValidationError("");
    setError("");
    const payload = buildTeaQualityPayload(form);
    if (payload.error) {
      setValidationError(payload.error);
      setResult(null);
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const data = await predictTeaQuality(payload.features);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message ?? "Prediction failed");
    } finally {
      setRunning(false);
    }
  }

  const mapped = mapTeaQualityResponse(result);

  return (
    <div className="mx-auto max-w-[1120px] pb-8">
      <IntelPageHeader
        title="Tea Quality Prediction"
        description="Model 01 (Gradient Boosting) predicts tea grade from six environmental and field features."
        statusLabel={mapped?.live ? "Live Model 01 prediction" : "Awaiting prediction"}
        statusLive={Boolean(mapped?.live)}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <IntelTeaQualityForm
          form={form}
          onChange={onChange}
          onSubmit={runPrediction}
          running={running}
          validationError={validationError}
        />
        <IntelTeaQualityResults result={result} error={error} running={running} />
      </div>
    </div>
  );
}
