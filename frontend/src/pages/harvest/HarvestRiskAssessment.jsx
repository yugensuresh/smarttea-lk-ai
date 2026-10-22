import { AlertTriangle, Calendar, CloudRain, Loader2, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import HarvestModelForm from "../../components/harvest/HarvestModelForm";
import PageHeader from "../../components/PageHeader";
import { fetchHarvestClimateRisk, predictHarvestClimate } from "../../api/harvestApi";
import {
  CLIMATE_FEATURE_FIELDS,
  buildFeatures,
  emptyForm,
} from "../../data/harvestModelFeatures";
import { featuresToFormValues } from "../../utils/harvestReadinessUi";
import {
  HARVEST_RISK_ALERT as demoAlert,
  MICRO_CLIMATE_FORECAST as demoForecast,
  OPTIMAL_WINDOW as demoWindow,
} from "../../data/harvestClimateRisk";

function HarvestCard({ children, className = "" }) {
  return (
    <article className={`rounded-2xl border border-[#e8ece9] bg-white shadow-[0_1px_3px_rgba(16,40,28,0.06)] ${className}`}>
      {children}
    </article>
  );
}

function ForecastDayCard({ day, temp, rainMm, humidity, tone, badge, showRainIcon }) {
  const optimal = tone === "optimal";
  return (
    <div
      className={`relative flex min-w-[140px] flex-1 flex-col rounded-2xl border px-4 py-4 ${
        optimal
          ? "border-[#178a45] bg-[#178a45] text-white"
          : "border-[#e8ece9] bg-white text-[#1c2b24]"
      }`}
    >
      {badge && (
        <span className="absolute right-3 top-3 rounded-md bg-[#c8f0d4] px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#14532d]">
          {badge}
        </span>
      )}
      <p className={`text-sm font-semibold ${optimal ? "text-white/90" : "text-[#5f6f66]"}`}>{day}</p>
      <p className="mt-3 text-[28px] font-bold tabular-nums leading-none">
        {temp}
        <span className="text-lg font-semibold">°C</span>
      </p>
      <div className={`mt-auto flex items-end justify-between gap-2 pt-6 text-xs ${optimal ? "text-white/85" : "text-[#7e8c84]"}`}>
        <span className="inline-flex items-center gap-1 font-medium">
          {showRainIcon && !optimal && <CloudRain className="h-3.5 w-3.5 text-[#7e8c84]" />}
          {rainMm}mm
        </span>
        <span className="font-medium">{humidity}%</span>
      </div>
    </div>
  );
}

export default function HarvestRiskAssessment() {
  const [alert, setAlert] = useState(demoAlert);
  const [optimalWindow, setOptimalWindow] = useState(demoWindow);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => emptyForm(CLIMATE_FEATURE_FIELDS));
  const [running, setRunning] = useState(false);
  const [inferenceEngine, setInferenceEngine] = useState("");
  const [forecastDays, setForecastDays] = useState(demoForecast);
  const [forecastDemo, setForecastDemo] = useState(true);

  const setFormField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchHarvestClimateRisk();
        if (!active) return;
        if (data.riskAlert?.level) setAlert(data.riskAlert);
        if (data.optimalWindow) setOptimalWindow(data.optimalWindow);
        const seeded = featuresToFormValues(CLIMATE_FEATURE_FIELDS, data.climateFeatures);
        if (seeded) setForm(seeded);
        if (data.inferenceEngine) setInferenceEngine(String(data.inferenceEngine));
        if (data.microClimateForecast?.length) setForecastDays(data.microClimateForecast);
        setForecastDemo(Boolean(data.microClimateForecastDemo));
      } catch (err) {
        if (active) setError(err.message ?? "Climate risk API unavailable");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function runClimateModel() {
    setRunning(true);
    setError("");
    try {
      const features = buildFeatures(CLIMATE_FEATURE_FIELDS, form);
      const prediction = await predictHarvestClimate(features);
      if (prediction.error) {
        setError(String(prediction.error));
        return;
      }
      const level = prediction.riskLevel ?? prediction.risk_level ?? "UNKNOWN";
      const confidence = Math.round(Number(prediction.confidence ?? 0));
      setAlert({
        level,
        confidence,
        body: `Climate harvest risk for rainfall ${features.rainfall_mm ?? "—"} mm and avg temp ${features.temperature_avg_c ?? "—"}°C.`,
      });
      if (prediction.inferenceEngine) setInferenceEngine(String(prediction.inferenceEngine));
    } catch (err) {
      setError(err.message ?? "Climate prediction failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] pb-8">
      <PageHeader
        title="Climate Risk Assessment"
        subtitle="Assess climate-related harvest risk from rainfall, temperature, and field conditions."
      />

      {loading && (
        <p className="mb-4 flex items-center gap-2 text-sm text-[#8b9790]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading risk assessment…
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
          {inferenceEngine === "error" ? "Climate risk assessment unavailable" : "Live climate risk connected"}
        </p>
      )}
      {!loading && forecastDemo && (
        <p className="mb-4 text-xs text-[#8b9790]">
          Risk alert and optimal window are live when scoring succeeds; the 5-day micro-climate strip is
          illustrative catalog data unless a live forecast API is added.
        </p>
      )}

      <HarvestModelForm
        title="Climate risk inputs"
        fields={CLIMATE_FEATURE_FIELDS}
        values={form}
        onChange={setFormField}
        onSubmit={runClimateModel}
        running={running}
      />

      <section className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <HarvestCard className="p-5 sm:p-6">
          <div className="flex gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#fde8e8] text-[#b42318]">
              <AlertTriangle className="h-6 w-6" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">AI-GENERATED HARVEST RISK</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-[32px] font-bold leading-none text-[#b42318]">{alert.level}</span>
                <span className="text-sm font-medium text-[#7e8c84]">Confidence: {alert.confidence}%</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#5f6f66]">{alert.body}</p>
            </div>
          </div>
        </HarvestCard>

        <div className="flex flex-col justify-between rounded-2xl bg-[#14532d] p-5 text-white shadow-[0_8px_24px_rgba(20,83,45,0.25)] sm:p-6">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-white/80">
              <Calendar className="h-4 w-4" />
              OPTIMAL WINDOW
            </p>
            <p className="mt-2 text-[26px] font-bold tracking-tight">{optimalWindow.range}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/85">{optimalWindow.body}</p>
          </div>
          <button
            type="button"
            className="mt-5 w-fit rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#14532d] hover:bg-[#f0fdf4]"
          >
            Schedule Teams
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-[#14532d]">
          5-Day Micro-Climate Forecast
          {forecastDemo && (
            <span className="ml-2 rounded-md bg-[#f4f6f4] px-2 py-0.5 text-xs font-semibold text-[#8b9790]">
              DEMO DATA
            </span>
          )}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {forecastDays.map((item) => (
            <ForecastDayCard key={item.day} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
