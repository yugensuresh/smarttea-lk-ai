import { useCallback, useState } from "react";
import IntelPageHeader from "../../components/intel/IntelPageHeader";
import IntelQualityStiiForm from "../../components/intel/IntelQualityStiiForm";
import IntelStiiResultsPanel from "../../components/intel/IntelStiiResultsPanel";
import { predictQualityStii } from "../../api/intelApi";
import { buildQualityStiiPayload, emptyQualityStiiForm } from "../../data/intelModelFeatures";
import { mapQualityStiiResponse } from "../../utils/intelPresentation";

export default function IntelligenceIndex() {
  const [form, setForm] = useState(emptyQualityStiiForm);
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

  async function runStii() {
    if (running) return;
    setValidationError("");
    setError("");
    const payload = buildQualityStiiPayload(form, form);
    if (payload.error) {
      setValidationError(payload.error);
      setResult(null);
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const data = await predictQualityStii(payload);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message ?? "STII calculation failed");
    } finally {
      setRunning(false);
    }
  }

  const mapped = mapQualityStiiResponse(result);

  return (
    <div className="mx-auto max-w-[1120px] pb-8">
      <IntelPageHeader
        title="STII"
        description="SmartTea Intelligence Index combines Model 01 grade and Model 02 sustainability (50/50) on the server."
        statusLabel={mapped?.live ? "Live STII result" : "Awaiting calculation"}
        statusLive={Boolean(mapped?.live)}
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <IntelQualityStiiForm
          form={form}
          onChange={onChange}
          onSubmit={runStii}
          running={running}
          validationError={validationError}
        />
        <IntelStiiResultsPanel result={result} error={error} running={running} />
      </div>
    </div>
  );
}
