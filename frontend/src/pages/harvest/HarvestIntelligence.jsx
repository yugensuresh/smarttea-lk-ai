import {
  Clock,
  CloudRain,
  FileText,
  Lightbulb,
  MoreVertical,
  Package,
  Shield,
  Sprout,
  TrendingUp,
} from "lucide-react";
import YieldForecastChart from "../../components/harvest/YieldForecastChart";
import {
  AI_RECOMMENDATIONS,
  CLIMATE_ALERT,
  HARVEST_FIELDS,
  HARVEST_KPIS,
  actionClass,
  readinessBarColor,
  statusClass,
} from "../../data/harvestDashboard";

function HarvestCard({ children, className = "" }) {
  return (
    <article className={`rounded-2xl border border-[#e8ece9] bg-white shadow-[0_1px_3px_rgba(16,40,28,0.06)] ${className}`}>
      {children}
    </article>
  );
}

export default function HarvestIntelligence() {
  return (
    <div className="mx-auto max-w-[1180px] pb-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#1b2a22]">Harvest Intelligence</h1>
          <p className="mt-1 text-sm text-[#7e8c84]">Real-time overview of AI Harvest module metrics.</p>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-[#8b9790]">
          <Clock className="h-3.5 w-3.5" />
          Last updated: Just now
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HarvestCard className="p-4">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">PREDICTED YIELD</p>
            <span className="rounded-lg bg-[#edf8f0] p-2 text-[#178a45]">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-[26px] font-bold tabular-nums text-[#1c2b24]">
            {HARVEST_KPIS.predictedYield.value}
            <span className="ml-1 text-sm font-semibold text-[#8b9790]">{HARVEST_KPIS.predictedYield.unit}</span>
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#178a45]">
            <TrendingUp className="h-3.5 w-3.5" />
            {HARVEST_KPIS.predictedYield.delta}
          </p>
        </HarvestCard>

        <HarvestCard className="p-4">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">AVG. READINESS</p>
            <span className="rounded-lg bg-[#edf8f0] p-2 text-[#178a45]">
              <Sprout className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-[26px] font-bold tabular-nums text-[#1c2b24]">{HARVEST_KPIS.avgReadiness.value}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef3f0]">
            <div
              className="h-full rounded-full bg-[#178a45]"
              style={{ width: `${HARVEST_KPIS.avgReadiness.value}%` }}
            />
          </div>
        </HarvestCard>

        <HarvestCard className="p-4">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">CLIMATE RISK</p>
            <span className="rounded-lg bg-[#edf8f0] p-2 text-[#178a45]">
              <Shield className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-[22px] font-bold text-[#178a45]">
            {HARVEST_KPIS.climateRisk.level}
            <span className="ml-1 text-[#22a35a]">•</span>
          </p>
          <p className="mt-1 text-xs text-[#8b9790]">{HARVEST_KPIS.climateRisk.note}</p>
        </HarvestCard>

        <HarvestCard className="p-4">
          <div className="flex items-start justify-between">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">THRRI INDEX</p>
            <span className="rounded-lg bg-[#edf8f0] p-2 text-[#178a45]">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-[26px] font-bold tabular-nums text-[#1c2b24]">
            {HARVEST_KPIS.thrri.value}
            <span className="text-base font-semibold text-[#8b9790]"> / {HARVEST_KPIS.thrri.max}</span>
          </p>
          <p className="mt-1 text-xs text-[#8b9790]">{HARVEST_KPIS.thrri.note}</p>
        </HarvestCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <HarvestCard className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1b2a22]">Yield Forecast (30 Days)</h2>
            <button type="button" className="rounded-lg p-1 text-[#8b9790] hover:bg-[#f4f6f4]" aria-label="Chart options">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
          <YieldForecastChart />
        </HarvestCard>

        <div className="flex flex-col gap-4">
          <HarvestCard className="flex-1 p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-[#1b2a22]">
              <Lightbulb className="h-4 w-4 text-[#178a45]" />
              AI Recommendations
            </h2>
            <ul className="mt-3 space-y-2">
              {AI_RECOMMENDATIONS.map((text) => (
                <li key={text} className="rounded-xl bg-[#f6f8f6] px-3 py-2.5 text-sm leading-6 text-[#4d6258]">
                  {text}
                </li>
              ))}
            </ul>
          </HarvestCard>

          <HarvestCard className="p-4 sm:p-5">
            <h2 className="text-base font-semibold text-[#1b2a22]">Climate Alerts</h2>
            <div className="mt-3 flex gap-3 rounded-xl bg-[#fdecee] px-3 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#e23b45]">
                <CloudRain className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#1c2b24]">{CLIMATE_ALERT.title}</p>
                <p className="mt-0.5 text-sm text-[#6d7c74]">{CLIMATE_ALERT.detail}</p>
              </div>
            </div>
          </HarvestCard>
        </div>
      </section>

      <HarvestCard className="mt-4 overflow-hidden">
        <div className="border-b border-[#eef2ef] px-5 py-4">
          <h2 className="text-base font-semibold text-[#1b2a22]">Fields Ready for Harvesting</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[#eef2ef] text-[11px] font-semibold tracking-[0.14em] text-[#9aa69e]">
                <th className="px-5 py-3">FIELD ID</th>
                <th className="px-3 py-3">READINESS</th>
                <th className="px-3 py-3">EXPECTED YIELD (KG)</th>
                <th className="px-3 py-3">STATUS</th>
                <th className="px-5 py-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {HARVEST_FIELDS.map((field) => (
                <tr key={field.id} className="border-b border-[#f2f5f3] last:border-0">
                  <td className="px-5 py-3.5 text-sm font-semibold text-[#1c2b24]">{field.id}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#eef3f0]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${field.readiness}%`,
                            backgroundColor: readinessBarColor(field.readiness),
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium tabular-nums text-[#5f7368]">{field.readiness}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-sm tabular-nums text-[#5f7368]">{field.yieldKg.toLocaleString()}</td>
                  <td className="px-3 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(field.tone)}`}>
                      {field.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button type="button" className={`text-sm ${actionClass(field.tone)}`}>
                      {field.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </HarvestCard>
    </div>
  );
}
