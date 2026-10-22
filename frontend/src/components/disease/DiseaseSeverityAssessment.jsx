import { Loader2, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "../../api/apiClient";
import { predictSeverity } from "../../api/severityApi";
import { confidenceAsFraction } from "../../utils/leafWorkflow";
import {
  buildSeverityAssessContext,
  isValidatedSeverityModel,
  mapToDisplaySeverity,
  severityAssessEnabled,
} from "../../utils/severityAssessmentUi";

/**
 * Persistent severity block on Disease Detection — always mounted; inner state gates actions.
 * @param {{ hasSpecimen: boolean, model01: object|null, resetKey?: string, onSeverityChange?: (result: object|null) => void }} props
 */
export default function DiseaseSeverityAssessment({ hasSpecimen, model01, resetKey = "", onSeverityChange }) {
  const [severityMeta, setSeverityMeta] = useState({ checking: true, meta: null, validated: false });
  const [allowExperimental, setAllowExperimental] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [severityResult, setSeverityResult] = useState(null);
  const [assessError, setAssessError] = useState("");

  useEffect(() => {
    setAllowExperimental(false);
    setSeverityResult(null);
    setAssessError("");
    onSeverityChange?.(null);
  }, [resetKey, onSeverityChange]);

  useEffect(() => {
    onSeverityChange?.(severityResult);
  }, [severityResult, onSeverityChange]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const meta = await apiFetch("/api/v1/models/severity");
        if (!active) return;
        setSeverityMeta({
          checking: false,
          meta,
          validated: isValidatedSeverityModel(meta),
        });
      } catch {
        if (active) setSeverityMeta({ checking: false, meta: null, validated: false });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const severityModelReady = severityMeta.validated;
  const { canAssess, canRunExperimental, hasVerified } = severityAssessEnabled({
    hasSpecimen,
    model01,
    allowExperimental,
    severityModelReady,
    assessing,
  });

  async function runSeverityAssess() {
    const ctx = buildSeverityAssessContext(model01);
    if (!canAssess || !ctx) return;
    setAssessing(true);
    setAssessError("");
    setSeverityResult(null);
    try {
      const { result, source, error } = await predictSeverity({
        model01Context: {
          classId: ctx.classId,
          label: ctx.label,
          confidence: confidenceAsFraction(ctx.confidence) * 100,
        },
      });
      if (source !== "api" || !result) {
        throw new Error(error ?? "Severity service unavailable");
      }
      const displayLevel = mapToDisplaySeverity(result.severity ?? result.level ?? result.severityClass);
      setSeverityResult({
        displayLevel,
        rawLevel: result.severity ?? result.level,
        affectedPct: result.affectedAreaPct ?? result.affected_area_pct,
        explanation: result.explanation ?? "",
        inferenceEngine: result.inferenceEngine ?? "unknown",
        experimental: !severityModelReady,
      });
    } catch (err) {
      setAssessError(err.message ?? "Severity assessment failed");
    } finally {
      setAssessing(false);
    }
  }

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">SEVERITY ASSESSMENT</p>

      {severityMeta.checking ? (
        <p className="mt-2 flex items-center gap-2 text-sm text-[#8b9790]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking severity service…
        </p>
      ) : (
        <>
          <div className="mt-2 rounded-xl border border-[#eef2ef] bg-[#fafbfa] px-3 py-2.5">
            {severityModelReady ? (
              <p className="text-sm font-semibold text-[#14532d]">Trained severity model connected</p>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#8d6b34]">Dedicated severity model not deployed.</p>
                <p className="mt-1 text-xs leading-relaxed text-[#8b9790]">
                  Severity cannot currently be classified into Mild, Moderate, or Severe by a trained image model.
                </p>
                {severityMeta.meta?.inferenceNote && (
                  <p className="mt-1 text-xs text-[#8b9790]">{severityMeta.meta.inferenceNote}</p>
                )}
              </>
            )}
          </div>

          {!hasVerified && (
            <p className="mt-3 rounded-lg bg-[#f6f8f6] px-3 py-2 text-sm text-[#5f7368]">
              Analyze a leaf image to enable severity assessment.
            </p>
          )}

          {!severityModelReady && hasVerified && (
            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl border border-[#e6eeea] bg-white px-3 py-2.5 text-sm text-[#3e4f46]">
              <input
                type="checkbox"
                checked={allowExperimental}
                onChange={(e) => {
                  setAllowExperimental(e.target.checked);
                  setSeverityResult(null);
                  setAssessError("");
                }}
                className="mt-0.5"
              />
              <span>Experimental heuristic estimate — not model-based severity detection.</span>
            </label>
          )}

          {!severityModelReady && hasVerified && !allowExperimental && (
            <p className="mt-2 text-xs text-[#8b9790]">Opt in above to run an experimental context-based estimate.</p>
          )}

          {!severityResult && !assessError && !assessing && hasVerified && allowExperimental && !severityModelReady && (
            <p className="mt-2 text-xs text-[#8b9790]">Ready to run the experimental estimate for this specimen.</p>
          )}

          {severityResult && (
            <div className="mt-3 rounded-xl border border-[#e6eeea] bg-white px-3 py-2.5 text-sm" role="status">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8d9992]">
                {severityResult.experimental
                  ? "Experimental heuristic estimate — not model-based severity detection"
                  : "Model result"}
              </p>
              {severityResult.displayLevel ? (
                <p className="mt-1 font-semibold text-[#1c2b24]">{severityResult.displayLevel}</p>
              ) : (
                <p className="mt-1 text-[#8b9790]">Raw level: {severityResult.rawLevel ?? "—"}</p>
              )}
              {severityResult.affectedPct != null && (
                <p className="mt-2 text-xs text-[#5f7368]">
                  Heuristic affected area: {severityResult.affectedPct}% (not from image segmentation).
                </p>
              )}
              {severityResult.explanation && (
                <p className="mt-2 text-xs leading-relaxed text-[#5f7368]">{severityResult.explanation}</p>
              )}
              <p className="mt-2 text-[10px] text-[#b0bab4]">Engine: {severityResult.inferenceEngine}</p>
            </div>
          )}

          {assessError && (
            <p className="mt-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]" role="alert">
              {assessError}
            </p>
          )}

          <button
            type="button"
            disabled={!canAssess}
            onClick={runSeverityAssess}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10241c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173628] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scale className="h-4 w-4" aria-hidden="true" />}
            {assessing
              ? "Assessing…"
              : severityModelReady
                ? "Run severity assessment"
                : "Run experimental estimate"}
          </button>
        </>
      )}
    </div>
  );
}
