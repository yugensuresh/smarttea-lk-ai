import { BookOpen, ChevronDown, Download, Loader2, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchPdviResults, predictPdvi } from "../api/pdviApi";
import { statusTone } from "../data/pdviModel";
import {
  buildPdviPredictBody,
  getPdviPrerequisites,
  getPdviStatusCopy,
  sessionPdviViewFromWorkflow,
} from "../utils/pdviWorkflow";
import { mergeLeafWorkflow, readLeafWorkflow } from "../utils/leafWorkflow";

function PdviGauge({ score }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 78;
  const stroke = 14;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = (safeScore / 100) * circumference;
  const strokeColor = safeScore >= 70 ? "#e23b45" : safeScore >= 45 ? "#c98416" : "#1f7a4d";

  return (
    <div className="relative mx-auto h-[140px] w-[140px] sm:h-[160px] sm:w-[160px]">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="90" cy="90" r={normalizedRadius} fill="none" stroke="#e8eeea" strokeWidth={stroke} />
        <circle
          cx="90"
          cy="90"
          r={normalizedRadius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-bold leading-none tabular-nums text-[#1c2b24] sm:text-[38px]">
          {Math.round(safeScore)}
        </span>
        <span className="mt-1 text-xs text-[#8b9790]">/ 100</span>
      </div>
    </div>
  );
}

function PrerequisiteCard({ title, status, detail, actionTo, actionLabel }) {
  const statusStyles =
    status === "Complete"
      ? "bg-[#dff5e8] text-[#14532d]"
      : status === "Healthy"
        ? "bg-[#e8f4ec] text-[#1f7a4d]"
        : status === "Failed"
          ? "bg-[#fdecec] text-[#991b1b]"
          : "bg-[#eef1ef] text-[#5f7368]";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-[#e8ece9] bg-[#fafbfa] p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#24352c]">{title}</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles}`}>
          {status}
        </span>
      </div>
      {detail && <p className="text-xs leading-relaxed text-[#7e8c84]">{detail}</p>}
      {status !== "Complete" && actionTo && actionLabel && (
        <Link
          to={actionTo}
          className="mt-auto inline-flex w-full items-center justify-center rounded-lg border border-[#d8e5dd] bg-white px-3 py-2 text-xs font-semibold text-[#178a45] hover:bg-[#f4fbf7] sm:w-auto sm:justify-start"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function bandInterpretation(band) {
  if (!band) return "";
  if (/substantial/i.test(band)) return "Substantial vulnerability — prioritize field review.";
  if (/moderate/i.test(band)) return "Moderate vulnerability — continue monitoring.";
  if (/low/i.test(band)) return "Relatively low vulnerability.";
  if (/minimal/i.test(band)) return "Minimal band — low disease confidence or expected severity.";
  return `Band: ${band}.`;
}

export default function PdviScoring() {
  const navigate = useNavigate();
  const location = useLocation();
  const [workflow, setWorkflow] = useState(() => readLeafWorkflow());
  const [sessionResult, setSessionResult] = useState(() => sessionPdviViewFromWorkflow(readLeafWorkflow()));
  const [reference, setReference] = useState(null);
  const [refError, setRefError] = useState("");
  const [refLoading, setRefLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const calcInFlight = useRef(false);

  const prereq = getPdviPrerequisites(workflow);
  const statusCopy = getPdviStatusCopy(prereq);

  const syncWorkflow = useCallback(() => {
    const wf = readLeafWorkflow();
    setWorkflow(wf);
    if (wf?.pdvi?.score == null) {
      setSessionResult(null);
    } else {
      setSessionResult(sessionPdviViewFromWorkflow(wf));
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchPdviResults();
        if (active) setReference(data);
      } catch (err) {
        if (active) setRefError(err.message ?? "Reference data unavailable");
      } finally {
        if (active) setRefLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    syncWorkflow();
    function onUpdate(event) {
      if (event?.detail?.pipelineOnly) return;
      syncWorkflow();
      setCalcError("");
    }
    window.addEventListener("smarttea-lk:leaf-workflow-updated", onUpdate);
    return () => window.removeEventListener("smarttea-lk:leaf-workflow-updated", onUpdate);
  }, [syncWorkflow, location.pathname]);

  async function calculatePdvi() {
    const wf = readLeafWorkflow();
    const livePrereq = getPdviPrerequisites(wf);
    if (calcInFlight.current || calculating) return;
    if (!livePrereq.ready) {
      setCalcError(getPdviStatusCopy(livePrereq).calculateBlockedReason ?? "Prerequisites incomplete.");
      syncWorkflow();
      return;
    }
    const built = buildPdviPredictBody(wf);
    if (built.error) {
      setCalcError(built.error);
      return;
    }
    calcInFlight.current = true;
    setCalculating(true);
    setCalcError("");
    setSessionResult(null);
    try {
      const data = await predictPdvi(built.body);
      data.sessionLinked = true;
      data.model02Linked = true;
      const formulaScore =
        data.calculation?.pdviScore ?? data.calculation?.score ?? data.meta?.scoreExact ?? data.meta?.score;
      mergeLeafWorkflow(
        {
          pdvi: {
            score: formulaScore,
            band: data.meta?.band ?? data.calculation?.band,
            calculation: data.calculation ?? null,
            updatedAt: new Date().toISOString(),
          },
        },
        { silent: true, notifyPipeline: true },
      );
      setSessionResult(data);
      syncWorkflow();
    } catch (err) {
      setSessionResult(null);
      setCalcError(err.message ?? "PDVI calculation failed");
    } finally {
      setCalculating(false);
      calcInFlight.current = false;
    }
  }

  const hasSessionScore =
    sessionResult?.hasFormulaCalculation && sessionResult.meta?.scoreDisplayRounded != null;
  const displayScore = hasSessionScore ? sessionResult.meta.scoreDisplayRounded : null;
  const exactScore = sessionResult?.meta?.scoreExact ?? sessionResult?.calculation?.pdviScore;
  const factors = reference?.contributingFactors ?? [];
  const methodology = reference?.methodology ?? [];

  const exportEnabled = hasSessionScore && sessionResult?.source === "api";

  const model01Detail = prereq.hasModel01
    ? workflow?.model01?.label ?? workflow?.model01?.classId
    : "Analyze a leaf image on Disease Detection (verified Keras inference).";
  const model02Detail = prereq.hasModel02
    ? "Severity probabilities saved from Environmental Risk for this session."
    : "Run Environmental Risk after disease detection so Model 02 probabilities are stored.";

  const emptyStateMessage = calculating
    ? "Running PDVI formula on your session inputs…"
    : hasSessionScore
      ? null
      : statusCopy.emptyState;

  return (
    <div className="mx-auto max-w-[1120px] space-y-4 overflow-x-hidden pb-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#178a45]">PLANTATION HEALTH</p>
          <h1 className="text-2xl font-bold tracking-tight text-[#1b2a22] sm:text-[26px]">PDVI Scoring</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#7e8c84]">
            Complete Disease Detection and Environmental Risk for this leaf session, then calculate PDVI.
          </p>
        </div>
        {exportEnabled ? (
          <button
            type="button"
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify({ ...sessionResult, exportedAt: new Date().toISOString() }, null, 2)],
                { type: "application/json" },
              );
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "pdvi-session-result.json";
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#e3ebe6] bg-white px-3 py-2 text-xs font-semibold text-[#24352c] shadow-sm hover:bg-[#f8fbf9]"
          >
            <Download className="h-3.5 w-3.5" />
            Export session result
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#e3ebe6] bg-white px-3 py-2 text-xs font-semibold text-[#24352c] opacity-50 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            Export session result
          </button>
        )}
      </header>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="panel p-4 sm:p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">SESSION WORKFLOW</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <PrerequisiteCard
              title="Disease Detection"
              status={statusCopy.model01Status}
              detail={model01Detail}
              actionTo={statusCopy.model01Status === "Complete" ? undefined : "/disease"}
              actionLabel="Go to Disease Detection"
            />
            <PrerequisiteCard
              title="Environmental Risk"
              status={statusCopy.model02Status}
              detail={model02Detail}
              actionTo={statusCopy.model02Status === "Complete" ? undefined : "/risk"}
              actionLabel="Go to Environmental Risk"
            />
          </div>

          <div className="mt-4 border-t border-[#eef2ef] pt-4">
            <button
              type="button"
              disabled={!prereq.ready || calculating}
              aria-busy={calculating}
              onClick={calculatePdvi}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#10241c] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#173628] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {calculating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {calculating ? "Calculating…" : "Calculate PDVI"}
            </button>
            {!prereq.ready && !calculating && statusCopy.calculateBlockedReason && (
              <p className="mt-2 text-xs text-[#7e8c84]">{statusCopy.calculateBlockedReason}</p>
            )}
          </div>

          {calcError && (
            <p
              className="mt-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]"
              role="alert"
            >
              {calcError}
            </p>
          )}
        </section>

        <section className="panel p-4 sm:p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">SESSION RESULT</p>
          {hasSessionScore ? (
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
              <PdviGauge score={displayScore} />
              <div className="min-w-0 flex-1 text-center sm:text-left">
                {exactScore != null && (
                  <p className="text-sm text-[#5f7368]">
                    Calculated value{" "}
                    <span className="font-mono text-base font-semibold tabular-nums text-[#1c2b24]">
                      {Number(exactScore)}
                    </span>
                  </p>
                )}
                {sessionResult.meta?.band && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#fdecee] px-3 py-1 text-sm font-semibold text-[#d64550]">
                    <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {sessionResult.meta.band}
                  </p>
                )}
                <p className="mt-3 text-sm text-[#5f7368]">{bandInterpretation(sessionResult.meta?.band)}</p>
                {sessionResult.calculation?.expectedSeverity != null && (
                  <p className="mt-2 text-xs text-[#8b9790]">
                    Expected severity (formula):{" "}
                    <span className="font-mono tabular-nums text-[#24352c]">
                      {sessionResult.calculation.expectedSeverity}
                    </span>
                  </p>
                )}
                {sessionResult.calculation?.warning && (
                  <p className="mt-2 rounded-lg border border-[#e8d4a8] bg-[#fff8eb] px-3 py-2 text-xs text-[#7a5c1e]">
                    {sessionResult.calculation.warning}
                  </p>
                )}
                <p className="mt-2 text-[10px] text-[#a3ada7]">
                  Engine: {sessionResult.meta?.inferenceEngine ?? sessionResult.calculation?.inferenceEngine ?? "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-[#dfe6e1] bg-[#fafbfa] px-4 py-5 text-sm leading-relaxed text-[#5f7368]">
              {emptyStateMessage}
            </div>
          )}
        </section>
      </div>

      <div className="panel overflow-hidden opacity-[0.98]">
        <button
          type="button"
          aria-expanded={referenceOpen}
          onClick={() => setReferenceOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold text-[#24352c] hover:bg-[#fafbfa]"
        >
          Reference information (catalog — not your session score)
          <ChevronDown className={`h-4 w-4 text-[#8b9790] transition-transform ${referenceOpen ? "rotate-180" : ""}`} />
        </button>
        {referenceOpen && (
          <div className="border-t border-[#eef2ef] px-5 py-4">
            {refLoading && (
              <p className="flex items-center gap-2 text-sm text-[#8b9790]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading reference…
              </p>
            )}
            {refError && <p className="text-sm text-[#991b1b]">{refError}</p>}
            {!refLoading && reference?.summary && (
              <p className="text-sm leading-relaxed text-[#5f7368]">{reference.summary}</p>
            )}
            {factors.length > 0 && (
              <ul className="mt-4 space-y-2">
                {factors.map((factor) => (
                  <li key={factor.id} className="rounded-lg border border-[#eef2ef] bg-[#fafbfa] px-3 py-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-[#1c2b24]">{factor.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(factor.tone)}`}>
                        {factor.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b9790]">{factor.weight}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div id="pdvi-methodology" className="panel overflow-hidden scroll-mt-4 opacity-[0.98]">
        <button
          type="button"
          aria-expanded={methodologyOpen}
          onClick={() => setMethodologyOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold text-[#24352c] hover:bg-[#fafbfa]"
        >
          <span className="inline-flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#178a45]" aria-hidden="true" />
            Calculation methodology
          </span>
          <ChevronDown className={`h-4 w-4 text-[#8b9790] transition-transform ${methodologyOpen ? "rotate-180" : ""}`} />
        </button>
        {methodologyOpen && (
          <div className="border-t border-[#eef2ef] px-5 py-4">
            {methodology.length === 0 ? (
              <p className="text-sm text-[#8b9790]">
                PDVI combines Model 01 disease confidence with Model 02 severity probabilities via the server formula (
                <code className="text-xs">pdvi-formula-v1</code>).
              </p>
            ) : (
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#5f7368]">
                {methodology.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => navigate("/disease")}
          className="flex-1 rounded-xl border border-[#e3ebe6] bg-white px-3 py-2 text-xs font-semibold text-[#24352c] hover:bg-[#f8fbf9]"
        >
          Disease Detection
        </button>
        <button
          type="button"
          onClick={() => navigate("/risk")}
          className="flex-1 rounded-xl border border-[#e3ebe6] bg-white px-3 py-2 text-xs font-semibold text-[#24352c] hover:bg-[#f8fbf9]"
        >
          Environmental Risk
        </button>
      </div>
    </div>
  );
}
