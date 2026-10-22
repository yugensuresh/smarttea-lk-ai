import IntelScoreRing from "./IntelScoreRing";
import { IntelCompactPlaceholder } from "./IntelPageHeader";
import { mapTeaQualityResponse } from "../../utils/intelPresentation";

export default function IntelTeaQualityResults({ result, error, running }) {
  if (running) {
    return <IntelCompactPlaceholder>Running Model 01 tea quality classifier…</IntelCompactPlaceholder>;
  }
  if (error) {
    return <IntelCompactPlaceholder tone="error">{error}</IntelCompactPlaceholder>;
  }

  const mapped = mapTeaQualityResponse(result);
  if (!mapped?.live) {
    return <IntelCompactPlaceholder>Enter inputs and run the model to see grade and scores.</IntelCompactPlaceholder>;
  }

  return (
    <section className="rounded-2xl border border-[#c8f0d4] bg-[#edf8f0] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8d9992]">Model 01 result</p>
      <p className="mt-2 text-3xl font-bold text-[#153d2e]">Grade {mapped.teaGrade}</p>
      {mapped.qualityScoreEquivalent != null && (
        <p className="mt-2 text-sm text-[#5f7368]">
          Numeric quality equivalent (STII grade map):{" "}
          <span className="font-semibold tabular-nums">{mapped.qualityScoreEquivalent}</span>
        </p>
      )}
      {mapped.topClassProbabilityPct != null && (
        <div className="mt-4 flex items-center gap-4">
          <IntelScoreRing
            score={mapped.topClassProbabilityPct}
            size={100}
            stroke={10}
            label={
              <span className="text-lg font-bold tabular-nums text-[#153d2e]">{mapped.topClassProbabilityPct}%</span>
            }
          />
          <p className="text-xs leading-relaxed text-[#7e8c84]">
            Top class probability — not the numeric quality score.
          </p>
        </div>
      )}
      <p className="mt-3 text-[10px] text-[#a3ada7]">{mapped.inferenceEngine}</p>
    </section>
  );
}
