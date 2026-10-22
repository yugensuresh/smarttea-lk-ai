import {
  AlertTriangle,
  ChevronDown,
  ClipboardCheck,
  Download,
  Loader2,
  SlidersHorizontal,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import EnvironmentalRisk72Chart from "../components/EnvironmentalRisk72Chart";
import {
  buildRiskExportSnapshot,
  fetchEnvironmentalRiskLive,
  MODEL02_INFERENCE_ENGINE,
  runEnvironmentalRiskPrediction,
} from "../api/riskApi";
import {
  MODEL_02_FEATURE_FIELDS,
  MODEL_02_META,
  buildModel02Payload,
  emptyModel02Form,
  validateModel02Form,
} from "../data/model02Features";
import { mergeLeafWorkflow, readLeafWorkflow } from "../utils/leafWorkflow";
import { normalizeSeverityProbabilitiesForPdvi } from "../utils/pdviSeverityProbs";

function exportRiskSnapshot(bundle) {
  const payload = buildRiskExportSnapshot(bundle);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "environmental-risk-prediction.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function RiskPrediction() {
  const [form, setForm] = useState(emptyModel02Form);
  const [formErrors, setFormErrors] = useState({});
  const [telemetrySnapshot, setTelemetrySnapshot] = useState(null);
  const [telemetryError, setTelemetryError] = useState("");
  const [telemetryLoading, setTelemetryLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [predictError, setPredictError] = useState("");
  const [predicting, setPredicting] = useState(false);
  const [technicalOpen, setTechnicalOpen] = useState(false);

  const loadTelemetry = useCallback(async () => {
    setTelemetryLoading(true);
    setTelemetryError("");
    try {
      const data = await fetchEnvironmentalRiskLive();
      setTelemetrySnapshot(data);
    } catch (error) {
      setTelemetrySnapshot(null);
      setTelemetryError(error.message ?? "Environmental risk service unavailable");
    } finally {
      setTelemetryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  useEffect(() => {
    const workflow = readLeafWorkflow();
    if (workflow?.model01?.diseaseClass) {
      setForm((prev) => ({
        ...prev,
        disease_class: workflow.model01.diseaseClass ?? "__HEALTHY_INCOMPATIBLE__",
      }));
    } else if (workflow?.model01?.classId === "healthy") {
      setForm((prev) => ({ ...prev, disease_class: "__HEALTHY_INCOMPATIBLE__" }));
    }
  }, []);

  async function onRunPrediction() {
    const errors = validateModel02Form(form);
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    setPredicting(true);
    setPredictError("");
    try {
      const payload = buildModel02Payload(form);
      const result = await runEnvironmentalRiskPrediction(payload);
      setPrediction(result);
      const pdviSeverity = normalizeSeverityProbabilitiesForPdvi(result.severityProbabilitiesForPdvi);
      if (
        result.hasTrainedPrediction &&
        result.prediction?.inferenceEngine === MODEL02_INFERENCE_ENGINE &&
        pdviSeverity
      ) {
        mergeLeafWorkflow({
          model02: {
            riskCategory: result.riskCategory ?? result.alert?.category,
            inferenceEngine: result.prediction.inferenceEngine,
            severityProbabilitiesForPdvi: pdviSeverity,
            ranAt: result.ranAt,
          },
        });
      }
    } catch (error) {
      setPrediction(null);
      setPredictError(error.message ?? "Risk prediction failed");
    } finally {
      setPredicting(false);
    }
  }

  const result = prediction;
  const showChart =
    result?.source === "api" && Array.isArray(result.hourlyTrend) && result.hourlyTrend.length > 0;

  return (
    <div className="pb-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <span className="rounded-full bg-[#dff5e8] px-2.5 py-0.5 text-[11px] font-semibold text-[#1a7a45]">
            Model {MODEL_02_META.id}
          </span>
          <h1 className="mt-2 text-[26px] font-bold tracking-[-0.03em] text-[#1b2a22]">
            Environmental Disease Risk Prediction
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#7e8c84]">
            Enter field measurements manually to assess environmental disease pressure. Live sensor telemetry is shown
            separately when available — it is not copied into the form.
          </p>
        </div>
        {result?.source === "api" && (
          <button
            type="button"
            onClick={() => exportRiskSnapshot(result)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e3ebe6] bg-white px-4 py-2 text-sm font-semibold text-[#24352c] shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export result
          </button>
        )}
      </header>

      {!telemetryLoading && (telemetryError || telemetrySnapshot?.source === "api") && (
        <p className="mb-3 rounded-lg bg-[#f6f8f6] px-3 py-2 text-xs text-[#5f7368]">
          {telemetryError ? (
            <>
              <WifiOff className="mr-1 inline h-3.5 w-3.5" />
              Sensor reference unavailable — enter all values manually. ({telemetryError})
            </>
          ) : (
            <>
              Reference telemetry ({telemetrySnapshot.meta?.fleetLabel ?? "fleet"}) — not copied into the form.
              {telemetrySnapshot.meta?.inferenceEngine === "catalog-seed" && (
                <span className="text-[#8d6b34]"> Catalog seed only; run Assess Environmental Risk for a live score.</span>
              )}
            </>
          )}
        </p>
      )}

      {result?.hasTrainedPrediction && (
        <p className="mb-4 rounded-xl border border-[#d9f5e3] bg-[#edf8f0] px-4 py-2 text-sm text-[#1f7a45]">
          Environmental risk assessment complete
          {result.severityProbabilitiesForPdvi ? " · saved for PDVI scoring" : ""}
          {result.meta?.riskScoreNote ? (
            <span className="mt-1 block text-xs text-[#5f7368]">{result.meta.riskScoreNote}</span>
          ) : null}
        </p>
      )}

      <section className="panel mb-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#1c2b24]">
          <SlidersHorizontal className="h-[18px] w-[18px] text-[#178a45]" />
          Environmental inputs
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODEL_02_FEATURE_FIELDS.map((field) => (
            <label key={field.key} className="block text-sm">
              <span className="font-medium text-[#24352c]">{field.feature}</span>
              <span className="ml-1 text-xs text-[#8b9790]">
                ({field.lag}) · {field.unit}
              </span>
              {field.type === "select" ? (
                <select
                  value={form[field.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[#e3ebe6] px-3 py-2 text-[#1c2b24] focus:border-[#178a45] focus:outline-none"
                >
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={form[field.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-[#e3ebe6] px-3 py-2 text-[#1c2b24] focus:border-[#178a45] focus:outline-none"
                />
              )}
              {formErrors[field.key] && (
                <span className="mt-0.5 block text-xs text-[#991b1b]">{formErrors[field.key]}</span>
              )}
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={predicting}
          onClick={onRunPrediction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#10241c] px-5 py-3 text-sm font-semibold text-white hover:bg-[#173628] disabled:opacity-60"
        >
          {predicting ? <Loader2 className="h-4 w-4 animate-spin" /> : <TriangleAlert className="h-4 w-4" />}
          {predicting ? "Calculating risk…" : "Assess Environmental Risk"}
        </button>
        {predictError && (
          <p className="mt-3 text-sm text-[#991b1b]" role="alert">
            {predictError}
          </p>
        )}
      </section>

      {!result && !predictError && !predicting && (
        <p className="rounded-xl border border-[#e8ece9] bg-[#fafbfa] px-4 py-4 text-sm text-[#7d8b83]">
          Enter required environmental inputs and run Assess Environmental Risk to see results.
        </p>
      )}

      {result && (
        <>
          <section className="panel mb-4 overflow-hidden p-0 ring-1 ring-[#e8dcc8]">
            <div className="flex flex-wrap gap-4 p-4 sm:p-5">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#f8efd8] text-[#c98416]">
                <AlertTriangle className="h-7 w-7" />
              </span>
              <div className="min-w-0 flex-1">
                <span className="rounded-full bg-[#f8efd8] px-2 py-0.5 text-[11px] font-bold text-[#9a6410]">
                  PREDICTED RISK: {result.alert?.category?.toUpperCase() ?? "—"}
                  {result.source !== "api" ? " (UNVERIFIED)" : ""}
                </span>
                <h2 className="mt-2 text-lg font-bold text-[#1c2b24]">{result.alert?.diseaseFocus}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5f7368]">{result.alert?.explanation}</p>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-[#3e4f46]">
                  {(result.alert?.contributors ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-[#8b9790]">
                  Input mode: manual entry · Source: {result.source === "api" ? "API response" : result.source}
                  {result.meta?.inferenceEngine ? ` · Engine: ${result.meta.inferenceEngine}` : ""}
                </p>
              </div>
            </div>
          </section>

          {showChart && <EnvironmentalRisk72Chart hourlyTrend={result.hourlyTrend} />}

          {!showChart && (
            <p className="mb-4 text-xs text-[#8b9790]">
              Historical risk trend chart is shown only when the API returns a suitable time series.
            </p>
          )}

          <section className="panel mt-4 flex gap-3 bg-[#edf8f0] p-4 sm:p-5">
            <ClipboardCheck className="h-5 w-5 shrink-0 text-[#178a45]" />
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#1f7a45]">INTERPRETATION</p>
              <p className="mt-1 text-sm font-semibold text-[#1c2b24]">{result.actionPlan?.title}</p>
              <p className="mt-1 text-sm text-[#5f7368]">{result.actionPlan?.detail}</p>
            </div>
          </section>

          <div className="panel mt-4 overflow-hidden">
            <button
              type="button"
              aria-expanded={technicalOpen}
              onClick={() => setTechnicalOpen((o) => !o)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#24352c]"
            >
              Technical inputs returned with prediction
              <ChevronDown className={`h-4 w-4 transition-transform ${technicalOpen ? "rotate-180" : ""}`} />
            </button>
            {technicalOpen && (
              <ul className="divide-y divide-[#f0f4f1] border-t border-[#eef2ef]">
                {(result.telemetry ?? []).map((row) => (
                  <li key={row.sensor} className="flex flex-wrap justify-between gap-2 px-5 py-3 text-sm">
                    <span className="font-medium">{row.sensor}</span>
                    <span className="text-[#6d7c74]">{row.value}</span>
                    <span className="text-xs text-[#8b9790]">{row.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
