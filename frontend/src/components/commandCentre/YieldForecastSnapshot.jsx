import { Link } from "react-router-dom";
import { yieldForecastIsDisplayable } from "../../utils/commandCentreMetrics";
import { cc, EmptyStatePanel, InlineError } from "./CommandCentreUi";

export default function YieldForecastSnapshot({ metrics, loading, error }) {
  if (loading) {
    return <p className={`text-sm ${cc.muted}`}>Loading yield forecast KPI…</p>;
  }
  if (error) {
    return <InlineError>{error}</InlineError>;
  }
  if (yieldForecastIsDisplayable(metrics)) {
    return (
      <div className={`rounded-xl border ${cc.border} bg-[#fafbfa] px-5 py-6`}>
        <p className="text-3xl font-semibold tabular-nums tracking-tight text-[#1c2b24]">
          {metrics.value}
          <span className="ml-1 text-sm font-medium text-[#8b9790]">{metrics.unit}</span>
        </p>
        {metrics.delta ? <p className="mt-2 text-sm text-[#5f7368]">{metrics.delta}</p> : null}
        {(metrics.peakLabel || metrics.peakNote) && (
          <p className="mt-2 text-sm text-[#5f7368]">
            {metrics.peakLabel && metrics.peakLabel !== "—" ? (
              <span className="font-medium text-[#24352c]">Forecast period: {metrics.peakLabel}</span>
            ) : null}
            {metrics.peakNote ? (
              <span className={metrics.peakLabel && metrics.peakLabel !== "—" ? ` ${cc.muted}` : cc.muted}>
                {metrics.peakLabel && metrics.peakLabel !== "—" ? " · " : ""}
                {metrics.peakNote}
              </span>
            ) : null}
          </p>
        )}
        <div className="mt-4">
          <EmptyStatePanel
            title="No historical yield series on this dashboard"
            actionTo="/harvest/forecasting"
            actionLabel="Open Yield Forecasting for drivers and variance"
          >
            The integrated API exposes a single point KPI (kg), not a multi-month trajectory. Charts on this page are
            not back-filled from catalog data.
          </EmptyStatePanel>
        </div>
      </div>
    );
  }

  const reason =
    metrics?.delta ??
    (metrics
      ? "The yield model did not return a live kg prediction for this refresh."
      : "Forecast payload did not include predictedYield KPIs.");

  return (
    <EmptyStatePanel title="Yield forecast KPI unavailable" actionTo="/harvest/forecasting" actionLabel="Run yield forecasting module">
      {reason} Historical forecast time series are not available on the dashboard API — only the current point estimate
      when inference succeeds.
    </EmptyStatePanel>
  );
}
