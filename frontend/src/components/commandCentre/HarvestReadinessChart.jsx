import { harvestReadinessOverview } from "../../utils/commandCentreMetrics";
import { ChartLegendItem, EmptyState, InlineError } from "./CommandCentreUi";

const BAR_CLASS = {
  ready: "bg-[#178a45]",
  near: "bg-[#7bc89a]",
  not: "bg-[#f0a8a8]",
};

const LEGEND_CLASS = {
  ready: "bg-[#178a45]",
  near: "bg-[#7bc89a]",
  not: "bg-[#f0a8a8]",
};

export default function HarvestReadinessChart({ readinessPayload, loading, error }) {
  const overview = harvestReadinessOverview(readinessPayload);
  const legend = overview?.legend ?? [];
  const total = legend.reduce((sum, item) => sum + Number(item.count ?? 0), 0);

  if (loading) {
    return <p className="text-sm text-[#8b9790]">Loading readiness distribution…</p>;
  }
  if (error) {
    return <InlineError>{error}</InlineError>;
  }
  if (!overview || !total) {
    return (
      <EmptyState>No harvest readiness field list in the API response.</EmptyState>
    );
  }

  return (
    <div>
      <p className="text-[13px] text-[#7d8b83]">
        {overview.readyPercent}% ready · {total} fields ·{" "}
        {overview.source === "api-estateOverview" ? "API overview" : "derived from fields"}.
      </p>
      <div
        className="mt-4 flex h-9 overflow-hidden rounded-lg border border-[#e6eeea]"
        role="img"
        aria-label={`Readiness distribution: ${legend.map((b) => `${b.label} ${b.count}`).join(", ")}`}
      >
        {legend.map((bucket) => {
          const n = Number(bucket.count ?? 0);
          if (!n) return null;
          const pct = (n / total) * 100;
          return (
            <div
              key={bucket.tone ?? bucket.label}
              className={`${BAR_CLASS[bucket.tone] ?? "bg-[#eef1ef]"} flex items-center justify-center text-[11px] font-semibold text-[#10241c]`}
              style={{ width: `${pct}%` }}
              title={`${bucket.label}: ${n}`}
            >
              {pct >= 16 ? `${n}` : ""}
            </div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {legend.map((bucket) => (
          <li key={bucket.tone ?? bucket.label}>
            <ChartLegendItem
              colorClass={LEGEND_CLASS[bucket.tone] ?? "bg-[#eef1ef]"}
              label={`${bucket.label}: ${bucket.count ?? 0}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
