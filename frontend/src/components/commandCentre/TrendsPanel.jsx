import { useDashboard } from "../../context/DashboardContext";
import { yieldForecastMetrics } from "../../utils/commandCentreMetrics";
import RiskTrendChart from "../RiskTrendChart";
import HarvestReadinessChart from "./HarvestReadinessChart";
import YieldForecastSnapshot from "./YieldForecastSnapshot";
import { ChartCard, SectionHeader } from "./CommandCentreUi";

export default function TrendsPanel() {
  const { member02Readiness, member02Forecasting, memberErrors, memberLoading } = useDashboard();
  const yieldMetrics = yieldForecastMetrics(member02Forecasting);

  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="ANALYTICS"
        title="Trends & forecasting context"
        description="Disease trend uses the dashboard catalog time series (not live sensors). Harvest readiness is a field distribution — not a yield history chart."
      />

      <div className="panel overflow-hidden p-1 sm:p-2">
        <RiskTrendChart />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Harvest readiness distribution"
          description="Field counts aligned with the executive readiness percentage."
        >
          <HarvestReadinessChart
            readinessPayload={member02Readiness}
            loading={memberLoading}
            error={memberErrors.harvestReadiness}
          />
        </ChartCard>

        <ChartCard
          title="Yield forecast snapshot"
          description="Single KPI from the forecasting service — no fabricated historical yield chart on this page."
        >
          <YieldForecastSnapshot
            metrics={yieldMetrics}
            loading={memberLoading}
            error={memberErrors.harvestForecast}
          />
        </ChartCard>
      </div>
    </section>
  );
}
