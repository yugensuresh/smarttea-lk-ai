import IntelScoreRing from "./IntelScoreRing";
import { IntelCompactPlaceholder } from "./IntelPageHeader";
import { mapQualityStiiResponse } from "../../utils/intelPresentation";

export default function IntelStiiResultsPanel({ result, error, running }) {
  const mapped = mapQualityStiiResponse(result);

  if (running) {
    return <IntelCompactPlaceholder>Running both models and STII engine…</IntelCompactPlaceholder>;
  }
  if (error) {
    return <IntelCompactPlaceholder tone="error">{error}</IntelCompactPlaceholder>;
  }
  if (!mapped?.live) {
    return <IntelCompactPlaceholder>Submit valid inputs to calculate STII.</IntelCompactPlaceholder>;
  }

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-[#c8f0d4] bg-[#edf8f0] p-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8d9992]">STII score</p>
        <div className="mt-2 flex flex-col items-center">
          <IntelScoreRing
            score={Math.round(mapped.stiiScore)}
            size={160}
            stroke={12}
            label={
              <>
                <span className="text-[32px] font-bold tabular-nums text-[#153d2e]">{mapped.stiiScore}</span>
                <span className="text-[10px] font-bold tracking-wide text-[#178a45]">{mapped.performanceTier}</span>
              </>
            }
          />
        </div>
        <p className="mt-2 text-xs text-[#5f7368]">
          STII = 0.5 × Quality Score + 0.5 × Sustainability Score
        </p>
        <p className="mt-1 text-[11px] tabular-nums text-[#7e8c84]">
          ({mapped.qualityScoreEquivalent} + {mapped.sustainabilityScore}) → server computed
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <article className="rounded-xl border border-[#e8ece9] bg-white p-3">
          <p className="text-[10px] font-semibold uppercase text-[#8d9992]">Tea grade</p>
          <p className="text-lg font-bold text-[#153d2e]">Grade {mapped.teaGrade}</p>
          <p className="text-xs text-[#7e8c84]">Quality score: {mapped.qualityScoreEquivalent}</p>
        </article>
        <article className="rounded-xl border border-[#e8ece9] bg-white p-3">
          <p className="text-[10px] font-semibold uppercase text-[#8d9992]">Sustainability</p>
          <p className="text-lg font-bold tabular-nums text-[#153d2e]">{mapped.sustainabilityScore}</p>
          <p className="text-xs text-[#7e8c84]">{mapped.sustainabilityLabel ?? "—"}</p>
        </article>
      </div>
      <p className="text-[10px] text-[#a3ada7]">
        Engines: {mapped.qualityEngine} · {mapped.sustainabilityEngine} · {mapped.stiiEngine}
      </p>
    </section>
  );
}
