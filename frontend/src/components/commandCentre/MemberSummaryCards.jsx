import { Loader2 } from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";
import {
  harvestReadinessOverview,
  intelOverviewMetrics,
  yieldForecastIsDisplayable,
  yieldForecastMetrics,
} from "../../utils/commandCentreMetrics";
import {
  CardFooterLink,
  InlineError,
  MetricBlock,
  MetricUnavailable,
  OverviewCardShell,
  OverviewLabel,
  OverviewMeta,
  SectionHeader,
} from "./CommandCentreUi";

export default function MemberSummaryCards() {
  const {
    estateStats,
    dashboardLoading,
    memberLoading,
    dataSource,
    telemetryLive,
    member02Readiness,
    member02Forecasting,
    member03Intel,
    memberErrors,
  } = useDashboard();

  const loading = dashboardLoading || memberLoading;

  if (loading || !estateStats) {
    return (
      <section className="space-y-4" aria-busy="true">
        <SectionHeader eyebrow="OVERVIEW" title="Executive signals" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((key) => (
            <OverviewCardShell key={key}>
              <Loader2 className="h-5 w-5 animate-spin text-[#178a45]" aria-label="Loading" />
              <p className="mt-2 text-sm text-[#8b9790]">Loading…</p>
            </OverviewCardShell>
          ))}
        </div>
      </section>
    );
  }

  const readinessOverview = harvestReadinessOverview(member02Readiness);
  const readyCount = readinessOverview?.legend?.find((item) => item.tone === "ready")?.count;
  const yieldMetrics = yieldForecastMetrics(member02Forecasting);
  const intelMetrics = intelOverviewMetrics(member03Intel);
  const dashboardMeta = dataSource === "api" ? "Dashboard API" : "Sample (offline)";

  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="OVERVIEW"
        title="Executive signals"
        description="Headline metrics from the same integrated payloads used across this page."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCardShell accent="m01">
          <OverviewLabel>Plantation health</OverviewLabel>
          <OverviewMeta>Estate catalog summary (not live PDVI run)</OverviewMeta>
          <MetricBlock
            value={estateStats.pdvi}
            unit="/100 PDVI"
            badge={estateStats.band}
            description={
              <>
                <span className="font-semibold text-[#e23d45]">{estateStats.diseaseRisk}</span> disease risk ·{" "}
                {estateStats.diseaseNote}
              </>
            }
          />
          <CardFooterLink to="/pdvi" meta={dashboardMeta}>
            {telemetryLive ? "Telemetry on" : "Telemetry paused"} · PDVI module
          </CardFooterLink>
        </OverviewCardShell>

        <OverviewCardShell accent="m02">
          <OverviewLabel>Harvest readiness</OverviewLabel>
          <OverviewMeta>Harvest readiness service</OverviewMeta>
          {memberErrors.harvestReadiness ? (
            <>
              <MetricUnavailable />
              <InlineError>{memberErrors.harvestReadiness}</InlineError>
            </>
          ) : readinessOverview ? (
            <MetricBlock
              tone="good"
              value={readinessOverview.readyPercent}
              unit="%"
              description={`${readyCount ?? 0} of ${member02Readiness?.fields?.length ?? 0} fields ready now`}
            />
          ) : (
            <MetricUnavailable message="No readiness fields returned." />
          )}
          <CardFooterLink
            to="/harvest/readiness"
            meta={member02Readiness?.serviceConnected ? "ML enabled" : "Service check"}
          >
            Harvest readiness
          </CardFooterLink>
        </OverviewCardShell>

        <OverviewCardShell accent="m02b">
          <OverviewLabel>Yield forecast</OverviewLabel>
          <OverviewMeta>Yield model prediction (not sensors)</OverviewMeta>
          {memberErrors.harvestForecast ? (
            <>
              <MetricUnavailable />
              <InlineError>{memberErrors.harvestForecast}</InlineError>
            </>
          ) : yieldForecastIsDisplayable(yieldMetrics) ? (
            <MetricBlock
              value={yieldMetrics.value}
              unit={yieldMetrics.unit}
              description={
                [
                  yieldMetrics.delta,
                  yieldMetrics.peakLabel && yieldMetrics.peakLabel !== "—"
                    ? `Period: ${yieldMetrics.peakLabel}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Live yield model kg output"
              }
            />
          ) : yieldMetrics ? (
            <MetricUnavailable
              message={
                yieldMetrics.delta ??
                "Yield model did not return a live kg prediction on this refresh. Historical series are only on the forecasting module."
              }
            />
          ) : (
            <MetricUnavailable message="Forecast payload missing KPIs." />
          )}
          <CardFooterLink
            to="/harvest/forecasting"
            meta={yieldForecastIsDisplayable(yieldMetrics) ? "Live prediction" : "Unavailable"}
          >
            Yield forecasting
          </CardFooterLink>
        </OverviewCardShell>

        <OverviewCardShell accent="m03">
          <OverviewLabel>Quality & sustainability</OverviewLabel>
          <OverviewMeta>Quality & intel overview (estate-level)</OverviewMeta>
          {memberErrors.intel ? (
            <>
              <MetricUnavailable />
              <InlineError>{memberErrors.intel}</InlineError>
            </>
          ) : intelMetrics?.sustainabilityScore != null ? (
            <MetricBlock
              value={intelMetrics.sustainabilityScore}
              unit="/100"
              description={`Estate overview · ${
                intelMetrics.teaGrade ? `Grade ${intelMetrics.teaGrade}` : "Grade not in overview"
              }${intelMetrics.stiiScore != null ? ` · STII ${Math.round(intelMetrics.stiiScore)}/100 (estate)` : ""}`}
            />
          ) : intelMetrics ? (
            <MetricUnavailable message="Sustainability score not in intel overview. STII and grade may still be on the quality module." />
          ) : (
            <MetricUnavailable message="Intel overview returned no KPIs." />
          )}
          <CardFooterLink
            to="/intel/predictions"
            meta={member03Intel?.serviceConnected ? "ML enabled" : "Service check"}
          >
            Quality & sustainability
          </CardFooterLink>
        </OverviewCardShell>
      </div>
    </section>
  );
}
