import { Download, Droplets, Loader2, Sun, Thermometer, TrendingUp, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ProductionTrajectoryChart from "../../components/harvest/ProductionTrajectoryChart";
import HarvestModelForm from "../../components/harvest/HarvestModelForm";
import PageHeader from "../../components/PageHeader";
import { fetchHarvestForecasting, predictHarvestYield } from "../../api/harvestApi";
import {
  YIELD_FEATURE_FIELDS,
  buildFeatures,
  emptyForm,
} from "../../data/harvestModelFeatures";
import { featuresToFormValues } from "../../utils/harvestReadinessUi";
import {
  ENV_DRIVERS as demoEnvDrivers,
  FORECAST_KPIS,
  VARIANCE_ROWS,
} from "../../data/harvestForecasting";

const PERIODS = ["Weekly", "Monthly", "Seasonal"];

const DRIVER_ICONS = {
  droplet: Droplets,
  thermometer: Thermometer,
  sun: Sun,
};

function HarvestCard({ children, className = "" }) {
  return (
    <article className={`rounded-2xl border border-[#e8ece9] bg-white shadow-[0_1px_3px_rgba(16,40,28,0.06)] ${className}`}>
      {children}
    </article>
  );
}

function impactClass(tone) {
  if (tone === "negative") return "bg-[#fde8e8] text-[#b42318]";
  return "bg-[#e7f7ec] text-[#178a45]";
}

function accuracyClass(tone) {
  if (tone === "pending") return "bg-[#eef1ef] text-[#5f7368]";
  return "bg-[#e7f7ec] text-[#178a45]";
}

export default function HarvestForecasting() {
  const [period, setPeriod] = useState("Monthly");
  const [kpis, setKpis] = useState(FORECAST_KPIS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => emptyForm(YIELD_FEATURE_FIELDS));
  const [running, setRunning] = useState(false);
  const [inferenceEngine, setInferenceEngine] = useState("");
  const [envDrivers, setEnvDrivers] = useState(demoEnvDrivers);
  const [varianceNote, setVarianceNote] = useState("");

  const setFormField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchHarvestForecasting();
        if (!active) return;
        if (data.kpis?.predictedYield) {
          setKpis((prev) => ({ ...prev, ...data.kpis }));
        }
        if (data.prediction?.error) {
          setError(String(data.prediction.error));
        }
        const seeded = featuresToFormValues(YIELD_FEATURE_FIELDS, data.yieldFeatures);
        if (seeded) setForm(seeded);
        if (data.inferenceEngine) setInferenceEngine(String(data.inferenceEngine));
        if (data.environmentalDrivers?.length) setEnvDrivers(data.environmentalDrivers);
        if (data.varianceAnalysis?.note) setVarianceNote(String(data.varianceAnalysis.note));
      } catch (err) {
        if (active) setError(err.message ?? "Forecast API unavailable");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function runYieldModel() {
    setRunning(true);
    setError("");
    try {
      const features = buildFeatures(YIELD_FEATURE_FIELDS, form);
      const prediction = await predictHarvestYield(features);
      if (prediction.error) {
        setError(String(prediction.error));
        return;
      }
      const kg = Number(prediction.predictedYieldKg ?? 0);
      if (kg > 0 && prediction.inferenceEngine === "xgb-yield-v1") {
        setKpis((prev) => ({
          ...prev,
          predictedYield: {
            value: kg.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            unit: "kg",
            delta: "Live yield forecast",
            live: true,
          },
        }));
      }
      if (prediction.inferenceEngine) setInferenceEngine(String(prediction.inferenceEngine));
    } catch (err) {
      setError(err.message ?? "Yield prediction failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] pb-8">
      <PageHeader
        title="Yield Forecasting"
        subtitle="Forecast harvest yield from weather, soil, and field conditions."
        action={
          <div className="inline-flex rounded-xl border border-[#e8ece9] bg-white p-1">
            {PERIODS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setPeriod(label)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  period === label ? "bg-[#178a45] text-white" : "text-[#5f6f66] hover:bg-[#f4f6f4]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {loading && (
        <p className="mb-4 flex items-center gap-2 text-sm text-[#8b9790]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading yield prediction…
        </p>
      )}
      {error && (
        <p className="mb-4 flex items-center gap-2 text-sm text-[#5f7368]">
          <WifiOff className="h-4 w-4" /> {error}
        </p>
      )}
      {inferenceEngine && (
        <p
          className={`mb-4 text-xs font-medium ${inferenceEngine === "error" ? "text-[#b42318]" : "text-[#1a7a45]"}`}
        >
          {inferenceEngine === "error" ? "Yield forecast unavailable" : "Live yield forecast connected"}
        </p>
      )}

      <HarvestModelForm
        title="Yield forecast inputs"
        fields={YIELD_FEATURE_FIELDS}
        values={form}
        onChange={setFormField}
        onSubmit={runYieldModel}
        running={running}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <HarvestCard className="p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">
            PREDICTED YIELD (NEXT CYCLE)
            {!kpis.predictedYield?.live && (
              <span className="ml-2 rounded-md bg-[#f4f6f4] px-1.5 py-0.5 text-[10px] text-[#8b9790]">ILLUSTRATIVE</span>
            )}
          </p>
          <p className="mt-2 text-[28px] font-bold tabular-nums text-[#1c2b24]">
            {kpis.predictedYield.value}
            <span className="ml-1 text-base font-semibold text-[#8b9790]">{kpis.predictedYield.unit}</span>
          </p>
          <p
            className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
              kpis.predictedYield?.live ? "bg-[#e7f7ec] text-[#178a45]" : "bg-[#eef1ef] text-[#5f7368]"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            {kpis.predictedYield.delta}
          </p>
        </HarvestCard>

        <HarvestCard className="p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">MODEL CONFIDENCE</p>
          <p className="mt-2 text-[28px] font-bold tabular-nums text-[#1c2b24]">{kpis.modelConfidence}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eef3f0]">
            <div
              className="h-full rounded-full bg-[#178a45]"
              style={{ width: `${kpis.modelConfidence}%` }}
            />
          </div>
        </HarvestCard>

        <HarvestCard className="p-5">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">EST. PEAK HARVEST DATE</p>
          <p className="mt-2 text-[28px] font-bold text-[#1c2b24]">{kpis.peakDate.value}</p>
          <p className="mt-1 text-sm text-[#7e8c84]">{kpis.peakDate.note}</p>
          <span className="mt-2 inline-block rounded-md bg-[#178a45] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
            {kpis.peakDate.badge}
          </span>
        </HarvestCard>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_280px]">
        <HarvestCard className="p-5">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-[#1b2a22]">Production Trajectory</h2>
            <p className="text-xs text-[#8b9790]">
              Historical demo series — yield KPI is live only after a successful forecast run.
            </p>
          </div>
          <ProductionTrajectoryChart />
        </HarvestCard>

        <HarvestCard className="p-5">
          <h2 className="text-base font-bold text-[#1b2a22]">Environmental Drivers</h2>
          <p className="text-xs text-[#8b9790]">Values reflect the inputs used for the yield forecast.</p>
          <ul className="mt-4 space-y-4">
            {envDrivers.map((driver) => {
              const iconKey = driver.icon === "rain" ? "droplet" : driver.icon;
              const Icon = DRIVER_ICONS[iconKey] ?? Droplets;
              return (
                <li key={driver.id} className="rounded-xl border border-[#eef2ef] bg-[#fafbfa] px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#178a45] ring-1 ring-[#e8ece9]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#1c2b24]">{driver.label}</p>
                        <p className="text-lg font-bold tabular-nums text-[#1c2b24]">{driver.value}</p>
                        <p className="text-xs text-[#7e8c84]">{driver.sub}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${impactClass(driver.impactTone)}`}>
                      {driver.impact}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </HarvestCard>
      </section>

      <HarvestCard className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef2ef] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[#1b2a22]">Historical Variance Analysis</h2>
            <p className="text-xs text-[#8b9790]">
              {varianceNote || "Sample historical rows — only the top KPI reflects the live yield forecast."}
            </p>
          </div>
          <span className="rounded-md bg-[#f4f6f4] px-2 py-0.5 text-[10px] font-bold text-[#8b9790]">DEMO DATA</span>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg text-[#5f6f66] hover:bg-[#f4f6f4]"
            aria-label="Download report"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#eef2ef] text-[11px] font-semibold tracking-wide text-[#8d9992]">
                <th className="px-5 py-3 font-semibold">Harvest Cycle</th>
                <th className="px-5 py-3 font-semibold">Actual Yield (kg)</th>
                <th className="px-5 py-3 font-semibold">Predicted Yield (kg)</th>
                <th className="px-5 py-3 font-semibold">Variance</th>
                <th className="px-5 py-3 font-semibold">Model Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {VARIANCE_ROWS.map((row) => (
                <tr key={row.cycle} className="border-b border-[#f4f6f4] last:border-0">
                  <td className="px-5 py-3.5 font-medium text-[#1c2b24]">{row.cycle}</td>
                  <td className="px-5 py-3.5 tabular-nums text-[#5f6f66]">{row.actual}</td>
                  <td className="px-5 py-3.5 tabular-nums text-[#5f6f66]">{row.predicted}</td>
                  <td
                    className={`px-5 py-3.5 font-semibold tabular-nums ${
                      row.varianceTone === "negative"
                        ? "text-[#b42318]"
                        : row.varianceTone === "muted"
                          ? "text-[#a3ada7]"
                          : "text-[#1c2b24]"
                    }`}
                  >
                    {row.variance}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${accuracyClass(row.accuracyTone)}`}>
                      {row.accuracy}
                    </span>
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
