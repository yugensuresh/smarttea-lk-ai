import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../context/DashboardContext";
import {
  countPriorityFields,
  countUnresolvedAlerts,
  harvestReadinessOverview,
  intelOverviewMetrics,
  yieldForecastIsDisplayable,
  yieldForecastMetrics,
} from "../../utils/commandCentreMetrics";
import { readLeafWorkflow, workflowPipelineStatus } from "../../utils/leafWorkflow";
import {
  KpiRow,
  MemberPanel,
  ModuleLinkGrid,
  SectionHeader,
  InlineError,
  StatusChip,
} from "./CommandCentreUi";

export default function MemberWorkspaceRow() {
  const {
    estateStats,
    filteredFields,
    matchedAlerts,
    dataSource,
    telemetryLive,
    memberLoading,
    dashboardLoading,
    member02Readiness,
    member02Forecasting,
    member03Intel,
    memberErrors,
    workflow,
  } = useDashboard();

  const loading = dashboardLoading || memberLoading;

  if (loading || !estateStats) {
    return (
      <section className="grid gap-4 lg:grid-cols-3" aria-busy="true">
        {[1, 2, 3].map((key) => (
          <div key={key} className="panel flex min-h-[280px] items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#178a45]" aria-label="Loading module summaries" />
          </div>
        ))}
      </section>
    );
  }

  const readinessOverview = harvestReadinessOverview(member02Readiness);
  const yieldMetrics = yieldForecastMetrics(member02Forecasting);
  const intelMetrics = intelOverviewMetrics(member03Intel);
  const pipeline = workflowPipelineStatus(workflow ?? readLeafWorkflow());
  const env = member02Readiness?.envContext;

  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="PLATFORM MODULES"
        title="Intelligence at a glance"
        description="Summaries from disease health, harvest, and quality overview services. Open a module for leaf analysis, harvest models, and sustainability analytics."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <MemberPanel
          badge="PLANTATION HEALTH"
          title="Disease & plantation health"
          subtitle="Dashboard estate catalog · live inference in modules"
          footer={
            <ModuleLinkGrid
              links={[
                { to: "/disease", label: "Disease" },
                { to: "/disease#severity-assessment", label: "Severity" },
                { to: "/risk", label: "Env. risk" },
                { to: "/pdvi", label: "PDVI" },
              ]}
            />
          }
        >
          <div className="flex flex-wrap gap-2">
            <StatusChip ok={dataSource === "api"} label={dataSource === "api" ? "Dashboard API" : "Sample data"} />
            <StatusChip ok={telemetryLive} label={telemetryLive ? "Telemetry live" : "Telemetry paused"} />
          </div>
          <KpiRow label="Estate PDVI" value={`${estateStats.pdvi}/100`} hint={estateStats.band} />
          <KpiRow
            label="Disease risk"
            value={estateStats.diseaseRisk}
            hint={estateStats.diseaseNote}
            tone="risk"
          />
          <KpiRow
            label="Priority fields"
            value={String(countPriorityFields(filteredFields))}
            hint={`${countUnresolvedAlerts(matchedAlerts)} unresolved alerts`}
          />
          <p className="text-[12px] text-[#7d8b83]">
            Session pipeline:{" "}
            <span className={pipeline.model01 ? "font-semibold text-[#178a45]" : "text-[#b0bab4]"}>Disease</span>
            {" → "}
            <span className={pipeline.model02 ? "font-semibold text-[#178a45]" : "text-[#b0bab4]"}>Risk</span>
            {" → "}
            <span className={pipeline.pdvi ? "font-semibold text-[#178a45]" : "text-[#b0bab4]"}>PDVI</span>
          </p>
        </MemberPanel>

        <MemberPanel
          badge="CLIMATE & HARVEST"
          title="Harvest & yield intelligence"
          subtitle="Readiness and forecasting services"
          footer={
            <ModuleLinkGrid
              links={[
                { to: "/harvest/readiness", label: "Readiness" },
                { to: "/harvest/forecasting", label: "Forecast" },
                { to: "/harvest/risk", label: "Climate risk" },
              ]}
            />
          }
        >
          <div className="flex flex-wrap gap-2">
            <StatusChip
              ok={Boolean(member02Readiness?.serviceConnected)}
              label={member02Readiness?.serviceConnected ? "Harvest ML on" : "Harvest ML check"}
            />
          </div>
          {memberErrors.harvestReadiness ? (
            <InlineError>{memberErrors.harvestReadiness}</InlineError>
          ) : (
            <KpiRow
              label="Ready now"
              value={readinessOverview ? `${readinessOverview.readyPercent}%` : "Unavailable"}
              hint={
                readinessOverview
                  ? `${readinessOverview.legend?.find((l) => l.tone === "ready")?.count ?? "—"} harvest fields in readiness API`
                  : "No readiness payload on this refresh"
              }
              tone={readinessOverview ? "good" : "default"}
            />
          )}
          {memberErrors.harvestForecast ? (
            <InlineError>{memberErrors.harvestForecast}</InlineError>
          ) : (
            <KpiRow
              label="Yield forecast"
              value={
                yieldForecastIsDisplayable(yieldMetrics)
                  ? `${yieldMetrics.value} ${yieldMetrics.unit}`
                  : "Unavailable"
              }
              hint={
                yieldForecastIsDisplayable(yieldMetrics)
                  ? [yieldMetrics.delta, yieldMetrics.peakNote].filter(Boolean).join(" · ")
                  : yieldMetrics?.delta ??
                    "Point KPI only — no yield history on dashboard. Open Forecasting when inference succeeds."
              }
            />
          )}
          {env?.alert ? (
            <p className="rounded-xl border border-[#eef2ef] bg-white px-3 py-2 text-[12px] text-[#5f7368]">{env.alert}</p>
          ) : null}
        </MemberPanel>

        <MemberPanel
          badge="QUALITY & SUSTAINABILITY"
          title="Quality & sustainability"
          subtitle="Intel overview KPIs (estate-level)"
          footer={
            <ModuleLinkGrid
              links={[
                { to: "/intel/predictions", label: "Tea quality" },
                { to: "/intel/predictions", label: "Quality prediction" },
                { to: "/intel/index", label: "STII index" },
              ]}
            />
          }
        >
          <div className="flex flex-wrap gap-2">
            <StatusChip
              ok={Boolean(member03Intel?.serviceConnected)}
              label={member03Intel?.serviceConnected ? "Intel ML on" : "Intel ML check"}
            />
          </div>
          {memberErrors.intel ? (
            <InlineError>{memberErrors.intel}</InlineError>
          ) : intelMetrics ? (
            <>
              <KpiRow
                label="Sustainability (estate)"
                value={
                  intelMetrics.sustainabilityScore != null
                    ? `${intelMetrics.sustainabilityScore}/100`
                    : "Unavailable"
                }
                hint={intelMetrics.teaGrade ? `Tea grade ${intelMetrics.teaGrade}` : "Grade not in overview"}
              />
              <KpiRow
                label="STII (estate)"
                value={
                  intelMetrics.stiiScore != null ? `${Math.round(intelMetrics.stiiScore)}/100` : "Unavailable"
                }
                hint="Estate overview — per-field intel not on dashboard API"
              />
            </>
          ) : (
            <p className="text-[12px] text-[#7d8b83]">Intel overview returned no KPIs.</p>
          )}
          <Link to="/intel/sustainability-assessment" className="text-[12px] font-semibold text-[#178a45] hover:underline">
            Open sustainability assessment →
          </Link>
        </MemberPanel>
      </div>
    </section>
  );
}
