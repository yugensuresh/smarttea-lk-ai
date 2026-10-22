import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileImage,
  Leaf,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ClassProbabilityBreakdown from "../components/disease/ClassProbabilityBreakdown";
import LeafSpecimenPreview from "../components/LeafSpecimenPreview";
import { fetchDiseaseModelMeta, predictDisease } from "../api/diseaseApi";
import { MODEL_META, PATHOLOGY_CLASSES } from "../data/diseaseModel";
import { diseaseClassForModel02 } from "../data/model02Features";
import DiseaseSeverityAssessment from "../components/disease/DiseaseSeverityAssessment";
import {
  LEAF_WORKFLOW_STORAGE_KEY,
  mergeLeafWorkflow,
  persistLeafWorkflow,
  readLeafWorkflow,
} from "../utils/leafWorkflow";
import {
  isVerifiedKerasEngine,
  KERAS_INFERENCE_ENGINE,
  resolveInferenceEngine,
} from "../utils/model01Session";
import { canExportDiseaseReport } from "../utils/diseaseExport";
import { fileToPreviewDataUrl } from "../utils/specimenPreview";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_BYTES = 5 * 1024 * 1024;
function Badge({ children, tone = "mint" }) {
  const tones = {
    mint: "bg-[#dff5e8] text-[#1a7a45]",
    gray: "bg-[#eef1ef] text-[#5f7368]",
    amber: "bg-[#f8efd8] text-[#8d6b34]",
    dark: "bg-[#10241c] text-white",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isAcceptedImage(file) {
  if (ACCEPTED_TYPES.has(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
}

function loadImageDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight, previewUrl: url });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null, previewUrl: null });
    };
    img.src = url;
  });
}

function hasProbabilityPayload(raw) {
  const list = raw?.probabilities ?? raw?.class_probabilities;
  return Array.isArray(list) && list.length > 0;
}

function predictedClassFromRaw(raw) {
  return raw?.classId ?? raw?.class_id ?? raw?.predictedClass ?? raw?.predicted_class ?? null;
}

async function saveLeafWorkflow(file, specimenMeta, diagnosis, { verified }) {
  try {
    const previewDataUrl = await fileToPreviewDataUrl(file);
    const specimen = {
      name: specimenMeta.fullName,
      fullName: specimenMeta.fullName,
      sizeLabel: specimenMeta.sizeLabel,
      dimensions: specimenMeta.dimensions,
      format: specimenMeta.format,
      previewDataUrl,
    };
    const payload = {
      sourcePage: "disease",
      updatedAt: new Date().toISOString(),
      specimen,
    };
    if (verified) {
      persistLeafWorkflow({
        ...payload,
        model01: {
          classId: diagnosis.classId,
          label: diagnosis.pathology?.label,
          confidence: diagnosis.probability,
          diseaseClass: diseaseClassForModel02(diagnosis.classId),
          inferenceEngine: diagnosis.inferenceEngine ?? KERAS_INFERENCE_ENGINE,
          probabilitiesSummary: (diagnosis.probabilities ?? []).slice(0, 4).map((p) => ({
            id: p.id,
            label: p.label,
            pct: p.pct,
          })),
          source: "api",
        },
        model02: null,
        pdvi: null,
      });
    } else {
      mergeLeafWorkflow({ ...payload, model01: null });
    }
  } catch {
    /* session handoff is best-effort */
  }
}

export default function DiseaseDetection() {
  const inputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [specimen, setSpecimen] = useState(null);
  const [specimenFile, setSpecimenFile] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [predictionRaw, setPredictionRaw] = useState(null);
  const [phase, setPhase] = useState("empty");
  const [dragOver, setDragOver] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [modelMeta, setModelMeta] = useState(MODEL_META);
  const [serviceStatus, setServiceStatus] = useState("checking");
  const [sessionSaved, setSessionSaved] = useState(false);
  const [severitySnapshot, setSeveritySnapshot] = useState(null);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState("");

  const onSeverityChange = useCallback((result) => {
    setSeveritySnapshot(result ?? null);
  }, []);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokePreview(), [revokePreview]);

  useEffect(() => {
    let active = true;
    setServiceStatus("checking");
    fetchDiseaseModelMeta()
      .then((meta) => {
        if (!active) return;
        setModelMeta(meta);
        setServiceStatus(meta.serviceConnected ? "connected" : "unavailable");
      })
      .catch(() => {
        if (active) {
          setModelMeta(MODEL_META);
          setServiceStatus("unavailable");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const clearDependentWorkflow = useCallback(() => {
    if (readLeafWorkflow()) {
      mergeLeafWorkflow({ model01: null, model02: null, pdvi: null }, { silent: true });
    }
  }, []);

  const applyFile = useCallback(
    async (file) => {
      setFormError("");
      clearDependentWorkflow();
      if (!isAcceptedImage(file)) {
        setFormError("Accepted formats: JPG, JPEG, and PNG.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setFormError("Image must be 5 MB or smaller.");
        return;
      }
      revokePreview();
      const { width, height, previewUrl } = await loadImageDimensions(file);
      if (previewUrl) previewUrlRef.current = previewUrl;
      const dimensions =
        width && height ? `${width.toLocaleString()} × ${height.toLocaleString()} px` : "Dimensions unavailable";
      const formatLabel = file.type === "image/png" ? "PNG" : "JPEG";
      setSpecimen({
        name: file.name,
        fullName: file.name,
        sizeLabel: formatBytes(file.size),
        dimensions,
        format: formatLabel,
        previewUrl: previewUrl ?? undefined,
      });
      setSpecimenFile(file);
      setDiagnosis(null);
      setPredictionRaw(null);
      setSessionSaved(false);
      setSeveritySnapshot(null);
      setExportError("");
      setPhase("selected");
    },
    [revokePreview, clearDependentWorkflow],
  );

  function onBrowse() {
    inputRef.current?.click();
  }

  function onInputChange(event) {
    const file = event.target.files?.[0];
    if (file) applyFile(file);
    event.target.value = "";
  }

  function onDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) applyFile(file);
  }

  async function analyzeLeaf() {
    if (!specimenFile || phase === "analyzing") return;
    setFormError("");
    setDiagnosis(null);
    setPredictionRaw(null);
    setSessionSaved(false);
    setSeveritySnapshot(null);
    setExportError("");
    setPhase("analyzing");
    try {
      const result = await predictDisease(specimenFile);
      const raw = result.raw ?? {};
      if (!predictedClassFromRaw(raw)) {
        throw new Error("Model response did not include a predicted class.");
      }
      setDiagnosis(result.diagnosis);
      setPredictionRaw(raw);
      setPhase("result");
      if (result.source === "api") {
        setServiceStatus("connected");
        setModelMeta((current) => ({ ...current, serviceConnected: true }));
        const verified = isVerifiedKerasEngine(raw, result.diagnosis);
        await saveLeafWorkflow(specimenFile, specimen, result.diagnosis, { verified });
        if (verified) {
          setSessionSaved(true);
        }
      }
    } catch (error) {
      setFormError(error.message ?? "Disease prediction failed. The model service may be unavailable.");
      setPhase("selected");
    }
  }

  function resetUpload() {
    revokePreview();
    setSpecimen(null);
    setSpecimenFile(null);
    setDiagnosis(null);
    setPredictionRaw(null);
    setFormError("");
    setPhase("empty");
    setSessionSaved(false);
    setSeveritySnapshot(null);
    setExportError("");
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(LEAF_WORKFLOW_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent("smarttea-lk:leaf-workflow-updated"));
    }
  }

  const previewSrc = specimen?.previewUrl;
  const showResult = phase === "result" && diagnosis && specimen;
  const showAnalyzing = phase === "analyzing";
  const showSelected = phase === "selected" && specimen && !showAnalyzing;
  const showEmpty = phase === "empty" && !specimen;
  const isHealthy = diagnosis?.classId === "healthy";
  const showProbabilities =
    showResult &&
    (hasProbabilityPayload(predictionRaw) || (diagnosis?.probabilities?.length ?? 0) > 0);
  const inferenceEngine = resolveInferenceEngine(predictionRaw, diagnosis);
  const verifiedTrainedModel01 = inferenceEngine === KERAS_INFERENCE_ENGINE;
  const showConfidence =
    showResult && ((diagnosis?.probability ?? 0) > 0 || hasProbabilityPayload(predictionRaw));
  const exportEnabled = canExportDiseaseReport({
    phase,
    diagnosis,
    predictionRaw,
    sessionSaved,
  });

  async function handleExportPdf() {
    if (!exportEnabled || !diagnosis || !specimen || exportBusy) return;
    setExportBusy(true);
    setExportError("");
    try {
      let imageDataUrl = null;
      if (specimenFile) {
        try {
          imageDataUrl = await fileToPreviewDataUrl(specimenFile);
        } catch {
          imageDataUrl = specimen.previewUrl?.startsWith("data:") ? specimen.previewUrl : null;
        }
      }
      const { downloadDiseaseReportPdf } = await import("../utils/diseaseReportPdf");
      await downloadDiseaseReportPdf({
        specimen,
        diagnosis,
        modelMeta,
        inferenceEngine,
        verified: verifiedTrainedModel01,
        severitySnapshot,
        imageDataUrl,
      });
    } catch (err) {
      setExportError(err.message ?? "PDF export failed");
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <div className="pb-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[26px] font-bold tracking-[-0.03em] text-[#1b2a22]">Disease Detection</h1>
            {verifiedTrainedModel01 && (
              <>
                <Badge>EfficientNet-B0</Badge>
                <Badge tone="gray">Keras · {modelMeta.version ?? MODEL_META.version}</Badge>
              </>
            )}
            {showResult && !verifiedTrainedModel01 && inferenceEngine && (
              <Badge tone="amber">Fallback · {inferenceEngine}</Badge>
            )}
            {showResult && !verifiedTrainedModel01 && !inferenceEngine && (
              <Badge tone="amber">Trained model not confirmed</Badge>
            )}
            {serviceStatus === "connected" && <Badge tone="mint">Service connected</Badge>}
            {serviceStatus === "unavailable" && <Badge tone="amber">Service not verified</Badge>}
            {serviceStatus === "checking" && <Badge tone="gray">Checking service…</Badge>}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#7e8c84]">
            Upload a clear tea leaf photo to identify common pathology classes. Images are analyzed at{" "}
            {MODEL_META.inputSize} across {MODEL_META.classes} disease categories.
          </p>
        </div>

      </header>

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-2 xl:gap-5">
        <section className="panel min-w-0 p-5 sm:p-6">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-[#1c2b24]">
              <UploadCloud className="h-[18px] w-[18px] text-[#178a45]" />
              Upload tea leaf image
            </h2>
            <p className="mt-1 text-[13px] text-[#8b9790]">JPG or PNG · max 5 MB</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            className="hidden"
            onChange={onInputChange}
          />

          {showEmpty && (
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors ${
                dragOver ? "border-[#178a45] bg-[#f3faf6]" : "border-[#d8e3dc] bg-[#fafbfa]"
              }`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#dff5e8] text-[#178a45]">
                <Leaf className="h-6 w-6" />
              </span>
              <p className="mt-3 text-sm font-medium text-[#24352c]">Drag and drop a leaf photo here</p>
              <p className="mt-1 text-xs text-[#8b9790]">Or browse from your device</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={onBrowse}
                  className="rounded-xl border border-[#e3ebe6] bg-white px-4 py-2 text-sm font-semibold text-[#24352c] shadow-sm hover:bg-[#fbfcfb]"
                >
                  Browse Leaf Photo
                </button>
              </div>
              {formError && (
                <p
                  className="mt-4 flex max-w-sm items-start gap-2 rounded-xl bg-[#fde8e8] px-3 py-2.5 text-sm text-[#991b1b]"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {formError}
                </p>
              )}
            </div>
          )}

          {(showSelected || showAnalyzing || showResult) && specimen && (
            <div className="mt-4 min-w-0">
              <div className="overflow-hidden rounded-2xl border border-[#e6eeea] bg-[#fafbfa]">
                <div className="aspect-[4/3] max-h-[260px] w-full min-h-0 sm:max-h-[300px]">
                  <LeafSpecimenPreview
                    src={previewSrc}
                    className="h-full max-h-[260px] w-full rounded-none sm:max-h-[300px]"
                    alt={specimen.fullName}
                  />
                </div>
                <div className="border-t border-[#eef2ef] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef6f0] text-[#178a45]">
                        <FileImage className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-semibold text-[#1c2b24] sm:whitespace-normal sm:break-words"
                          title={specimen.fullName}
                        >
                          {specimen.fullName}
                        </p>
                        <dl className="mt-2 grid gap-1.5 text-xs sm:grid-cols-3">
                          <div>
                            <dt className="text-[#a3ada7]">File size</dt>
                            <dd className="font-medium text-[#3e4f46]">{specimen.sizeLabel}</dd>
                          </div>
                          <div>
                            <dt className="text-[#a3ada7]">Dimensions</dt>
                            <dd className="font-medium text-[#3e4f46]">{specimen.dimensions}</dd>
                          </div>
                          <div>
                            <dt className="text-[#a3ada7]">Format</dt>
                            <dd className="font-medium text-[#3e4f46]">{specimen.format}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2 self-start sm:ml-auto">
                      <button
                        type="button"
                        onClick={onBrowse}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#5f7368] hover:bg-white hover:text-[#178a45]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={resetUpload}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#e23b45] hover:bg-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {formError && (
                <p
                  className="mt-3 flex items-start gap-2 rounded-xl bg-[#fde8e8] px-3 py-2.5 text-sm text-[#991b1b]"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {formError}
                </p>
              )}

              <button
                type="button"
                disabled={!specimenFile || showAnalyzing}
                onClick={analyzeLeaf}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10241c] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#173628] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing leaf…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analyze Image
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        <section className="panel min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold text-[#1c2b24]">
              <ClipboardCheck className="h-[18px] w-[18px] shrink-0 text-[#178a45]" />
              Diagnostic Result
            </h2>
            {showResult && (
              <div className="flex max-w-full flex-wrap gap-2">
                {verifiedTrainedModel01 ? (
                  <Badge tone="mint">Verified disease model</Badge>
                ) : (
                  <Badge tone="amber">Unverified — not saved to session</Badge>
                )}
                {inferenceEngine && <Badge tone="gray">{inferenceEngine}</Badge>}
              </div>
            )}
          </div>

          <div className="mt-3 min-w-0">

          {showEmpty && !specimen && (
            <div className="rounded-xl border border-[#e8ece9] bg-[#fafbfa] px-4 py-5 text-sm text-[#5f7368]">
              Upload a leaf image, then choose Analyze Image.
            </div>
          )}

          {showSelected && !showAnalyzing && !showResult && (
            <div className="rounded-xl border border-dashed border-[#dce5df] bg-[#fafbfa] px-4 py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-[#178a45]" />
              <p className="mt-3 text-sm font-medium text-[#24352c]">Specimen ready</p>
              <p className="mt-1 text-xs text-[#8b9790]">
                Choose Analyze Image when you are ready. Nothing runs until you confirm.
              </p>
            </div>
          )}

          {showAnalyzing && (
            <div className="flex flex-col items-center justify-center rounded-xl bg-[#f6f8f6] px-4 py-10 text-center">
              <Loader2 className="h-9 w-9 animate-spin text-[#178a45]" />
              <p className="mt-4 text-sm font-medium text-[#24352c]">Analyzing image…</p>
              <p className="mt-1 text-xs text-[#8b9790]">This usually takes a few seconds.</p>
            </div>
          )}

          {showResult && (
            <div className="min-w-0 space-y-3">
              {!verifiedTrainedModel01 && (
                <p
                  className="flex items-start gap-2 rounded-xl border border-[#f0e0b8] bg-[#fdf8ed] px-3 py-2.5 text-sm leading-6 text-[#7a5a20]"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#c98416]" />
                  <span>
                    The trained disease model was <strong className="font-semibold">not confirmed</strong>
                    {inferenceEngine
                      ? ` (engine: ${inferenceEngine}).`
                      : " (the service did not confirm the trained model)."}{" "}
                    Results are for review only and were not saved to your session pipeline.
                  </span>
                </p>
              )}

              <div
                className={`rounded-xl border px-4 py-3 ${
                  isHealthy ? "border-[#c8e8d4] bg-[#edf8f0]" : "border-[#e8dcc8] bg-[#fdfaf4]"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9992]">Predicted class</p>
                <h3 className="mt-0.5 break-words text-xl font-bold tracking-tight text-[#1c2b24] sm:text-2xl">
                  {diagnosis.pathology.label}
                </h3>
                <p className="text-sm italic text-[#6d7c74]">{diagnosis.pathology.scientific}</p>
                <p className="font-mono text-[11px] text-[#8b9790]">Code {diagnosis.pathology.code}</p>
                {isHealthy ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#dff5e8] px-2.5 py-1 text-sm font-medium text-[#1a7a45]">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Healthy — no disease alert
                  </p>
                ) : (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#f8efd8] px-2.5 py-1 text-sm font-medium text-[#9a6410]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Pathology detected — confirm in the field
                  </p>
                )}
              </div>

              {showConfidence && (
                <div className="rounded-xl border border-[#e6eeea] bg-white px-4 py-3">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9992]">
                      Model-reported confidence
                    </p>
                    <span className="text-2xl font-bold tabular-nums text-[#178a45]">{diagnosis.probability}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e3ebe6]">
                    <div
                      className="h-full rounded-full bg-[#178a45]"
                      style={{ width: `${Math.min(100, Math.max(0, diagnosis.probability))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#7e8c84]">
                    Held-out test accuracy:{" "}
                    <span className="font-semibold text-[#3e4f46]">{MODEL_META.benchmarkAcc}%</span> — not this
                    specimen’s prediction confidence.
                  </p>
                </div>
              )}

              {diagnosis.summary && (
                <div className="rounded-xl bg-[#edf8f0] px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-[#1f7a45]">Result summary</p>
                  <p className="mt-1.5 text-sm leading-6 text-[#2c4338]">{diagnosis.summary}</p>
                </div>
              )}

              {diagnosis.nextSteps?.length > 0 && (
                <div className="rounded-xl border border-[#eef2ef] bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9992]">Suggested next steps</p>
                  <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm leading-6 text-[#3e4f46]">
                    {diagnosis.nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {showProbabilities && diagnosis.probabilities?.length > 0 && (
                <div className="rounded-xl border border-[#eef2ef] bg-[#fafbfa] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9992]">
                    Four-class probability (server output
                    {verifiedTrainedModel01 ? "" : " — unverified"})
                  </p>
                  <div className="mt-2">
                    <ClassProbabilityBreakdown
                      items={[...diagnosis.probabilities].sort((a, b) => b.pct - a.pct)}
                      activeId={diagnosis.classId}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[#eef2ef] bg-[#fafbfa] px-3 py-3">
                {sessionSaved ? (
                  <p className="text-xs font-medium text-[#1a7a45]">
                    Session saved — Environmental Risk and PDVI can use this result.
                  </p>
                ) : (
                  <p className="text-xs text-[#8b9790]">Session not saved until the verified model confirms inference.</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    to="/risk"
                    className={`inline-flex min-w-[9.5rem] flex-1 items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold sm:flex-none ${
                      sessionSaved
                        ? "border-[#e3ebe6] bg-white text-[#24352c] hover:bg-[#fbfcfb]"
                        : "pointer-events-none border-[#eef2ef] bg-white text-[#b0bab4]"
                    }`}
                  >
                    Environmental Risk
                  </Link>
                  <Link
                    to="/pdvi"
                    className={`inline-flex min-w-[9.5rem] flex-1 items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-semibold sm:flex-none ${
                      sessionSaved
                        ? "border-[#e3ebe6] bg-white text-[#24352c] hover:bg-[#fbfcfb]"
                        : "pointer-events-none border-[#eef2ef] bg-white text-[#b0bab4]"
                    }`}
                  >
                    PDVI Scoring
                  </Link>
                  <button
                    type="button"
                    onClick={resetUpload}
                    className="inline-flex min-w-[9.5rem] flex-1 items-center justify-center rounded-xl bg-[#10241c] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#173628] sm:flex-none"
                  >
                    Analyze Another
                  </button>
                  <button
                    type="button"
                    disabled={!exportEnabled || exportBusy}
                    onClick={handleExportPdf}
                    className="inline-flex min-w-[9.5rem] flex-1 items-center justify-center gap-2 rounded-xl border border-[#e3ebe6] bg-white px-3 py-2.5 text-sm font-semibold text-[#24352c] hover:bg-[#f6f8f6] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    {exportBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 shrink-0" />}
                    {exportBusy ? "Exporting…" : "Export Result"}
                  </button>
                </div>
                {exportError && (
                  <p className="mt-2 text-xs text-[#991b1b]" role="alert">
                    {exportError}
                  </p>
                )}
              </div>
            </div>
          )}
          </div>

          <div id="severity-assessment" className="mt-4 scroll-mt-4 border-t border-[#eef2ef] pt-4">
            <DiseaseSeverityAssessment
              hasSpecimen={Boolean(specimen)}
              onSeverityChange={onSeverityChange}
              resetKey={`${specimen?.fullName ?? "none"}-${phase}-${sessionSaved && verifiedTrainedModel01 ? diagnosis?.classId : "none"}`}
              model01={
                sessionSaved && verifiedTrainedModel01 && diagnosis
                  ? {
                      classId: diagnosis.classId,
                      label: diagnosis.pathology?.label,
                      confidence: diagnosis.probability,
                    }
                  : null
              }
            />
          </div>
        </section>
      </div>

      <div className="panel mt-4 overflow-hidden">
        <button
          type="button"
          aria-expanded={specsOpen}
          onClick={() => setSpecsOpen((open) => !open)}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#24352c] hover:bg-[#fafbfa]"
        >
          View model specifications &amp; pathology classes
          <ChevronDown className={`h-4 w-4 text-[#8b9790] transition-transform ${specsOpen ? "rotate-180" : ""}`} />
        </button>
        {specsOpen && (
          <div className="border-t border-[#eef2ef] px-5 py-4">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Architecture", "EfficientNet-B0"],
                ["Framework", "TensorFlow / Keras"],
                ["Input size", MODEL_META.inputSize],
                ["Reported test accuracy", `${MODEL_META.benchmarkAcc}%`],
                ["Pathology classes", String(MODEL_META.classes)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-semibold uppercase text-[#8d9992]">{label}</dt>
                  <dd className="mt-1 text-sm font-medium text-[#1c2b24]">{value}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-4 divide-y divide-[#f0f4f1] rounded-xl border border-[#eef2ef]">
              {PATHOLOGY_CLASSES.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <span>
                    <span className="font-semibold text-[#1c2b24]">{item.label}</span>
                    <span className="ml-2 text-[#6d7c74]">{item.scientific}</span>
                  </span>
                  <span className="font-mono text-xs text-[#8b9790]">{item.code}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}
