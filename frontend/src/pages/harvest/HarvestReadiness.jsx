import {
  AlertTriangle,
  Eye,
  Filter,
  Info,
  Loader2,
  Thermometer,
  UserPlus,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import MiniSparkline from "../../components/harvest/MiniSparkline";
import HarvestModelForm from "../../components/harvest/HarvestModelForm";
import PageHeader from "../../components/PageHeader";
import { fetchHarvestReadiness, predictHarvestReadiness } from "../../api/harvestApi";
import {
  READINESS_FEATURE_FIELDS,
  buildFeatures,
  emptyForm,
} from "../../data/harvestModelFeatures";
import {
  applyReadinessPrediction,
  computeEstateOverview,
  featuresToFormValues,
} from "../../utils/harvestReadinessUi";
import {
  ENV_CONTEXT as demoEnv,
  ESTATE_OVERVIEW as demoOverview,
  READINESS_FIELDS as demoFields,
  fieldBorderClass,
  maturityBarClass,
  statusBadgeClass,
} from "../../data/harvestReadiness";

function HarvestCard({ children, className = "" }) {
  return (
    <article className={`rounded-2xl border border-[#e8ece9] bg-white shadow-[0_1px_3px_rgba(16,40,28,0.06)] ${className}`}>
      {children}
    </article>
  );
}

function actionButtonClass(tone) {
  if (tone === "primary") {
    return "inline-flex items-center gap-2 rounded-xl bg-[#178a45] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14703a]";
  }
  if (tone === "outline") {
    return "inline-flex items-center gap-2 rounded-xl border border-[#c5cec8] bg-white px-4 py-2 text-sm font-semibold text-[#3e4f46] hover:bg-[#f4f6f4]";
  }
  return "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[#5f6f66] hover:bg-[#f4f6f4]";
}

function ActionIcon({ tone }) {
  if (tone === "primary") return <UserPlus className="h-4 w-4" />;
  if (tone === "outline") return <Eye className="h-4 w-4" />;
  return <Info className="h-4 w-4" />;
}

function legendDotClass(tone) {
  if (tone === "ready") return "bg-[#178a45]";
  if (tone === "near") return "bg-[#7bc89a]";
  return "bg-[#f0a8a8]";
}

export default function HarvestReadiness() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fields, setFields] = useState(demoFields);
  const [estateOverview, setEstateOverview] = useState(demoOverview);
  const [envContext, setEnvContext] = useState(demoEnv);
  const [serviceConnected, setServiceConnected] = useState(false);
  const [inferenceEngine, setInferenceEngine] = useState("");
  const [inferenceSummary, setInferenceSummary] = useState(null);
  const [form, setForm] = useState(() => emptyForm(READINESS_FEATURE_FIELDS));
  const [running, setRunning] = useState(false);

  const setFormField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchHarvestReadiness();
        if (!active) return;
        if (data.fields?.length) {
          setFields(data.fields);
          const seeded = featuresToFormValues(READINESS_FEATURE_FIELDS, data.fields[0]?.mlFeatures);
          if (seeded) setForm(seeded);
        }
        if (data.estateOverview) setEstateOverview(data.estateOverview);
        if (data.envContext) setEnvContext(data.envContext);
        setServiceConnected(data.serviceConnected);
        if (data.inferenceEngine) setInferenceEngine(data.inferenceEngine);
      } catch (err) {
        if (active) setError(err.message ?? "Harvest readiness API unavailable");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function runReadinessModel() {
    setRunning(true);
    setError("");
    try {
      const shared = buildFeatures(READINESS_FEATURE_FIELDS, form);
      const updated = await Promise.all(
        fields.map(async (field) => {
          const features = { ...(field.mlFeatures ?? {}), ...shared };
          const prediction = await predictHarvestReadiness(features);
          return applyReadinessPrediction(field, prediction);
        }),
      );
      setFields(updated);
      setEstateOverview(computeEstateOverview(updated));
      const engine = updated.find((f) => f.prediction?.inferenceEngine)?.prediction?.inferenceEngine;
      if (engine) setInferenceEngine(String(engine));
    } catch (err) {
      setError(err.message ?? "Readiness prediction failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] pb-8">
      <PageHeader
        title="Harvest Readiness"
        subtitle="Field maturity scores from rainfall, humidity, elevation, and temperature."
        action={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e8ece9] bg-white px-4 py-2 text-sm font-semibold text-[#3e4f46] shadow-sm hover:bg-[#f4f6f4]"
          >
            <Filter className="h-4 w-4" />
            Filter: Priority First
          </button>
        }
      />

      {loading && (
        <p className="mb-4 flex items-center gap-2 text-sm text-[#8b9790]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading live readiness scores…
        </p>
      )}
      {!loading && error && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-[#f6f8f6] px-3 py-2 text-sm text-[#5f7368]">
          <WifiOff className="h-4 w-4" /> {error} — showing demo layout.
        </p>
      )}
      {!loading && serviceConnected && (
        <p
          className={`mb-4 text-xs font-medium ${inferenceEngine === "error" ? "text-[#b42318]" : "text-[#1a7a45]"}`}
        >
          {inferenceEngine === "error"
            ? "Some or all field predictions failed — see field cards."
            : "Live readiness scores connected"}
          {inferenceSummary?.liveFieldPredictions != null
            ? ` · ${inferenceSummary.liveFieldPredictions}/${inferenceSummary.fieldCount} fields live`
            : ""}
        </p>
      )}

      <HarvestModelForm
        title="Microclimate inputs (all fields)"
        fields={READINESS_FEATURE_FIELDS}
        values={form}
        onChange={setFormField}
        onSubmit={runReadinessModel}
        running={running}
        submitLabel="Re-score all fields"
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {fields.map((field) => (
            <HarvestCard
              key={field.id}
              className={`border-l-4 p-5 sm:p-6 ${fieldBorderClass(field.statusTone)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[#1b2a22]">
                      {field.name}
                      <span className="ml-2 text-base font-medium text-[#7e8c84]">({field.location})</span>
                    </h2>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${statusBadgeClass(field.statusTone)}`}>
                      {field.status}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5f6f66]">{field.description}</p>
                </div>
                <button type="button" className={actionButtonClass(field.actionTone)}>
                  <ActionIcon tone={field.actionTone} />
                  {field.action}
                </button>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#7e8c84]">
                  <span>Maturity Index</span>
                  <span className="tabular-nums text-[#1c2b24]">{field.maturity}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef3f0]">
                  <div
                    className={`h-full rounded-full ${maturityBarClass(field.statusTone)}`}
                    style={{ width: `${field.maturity}%` }}
                  />
                </div>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#a3ada7]">Last Plucked</dt>
                  <dd className="mt-1 text-sm font-semibold text-[#1c2b24]">{field.stats?.lastPlucked ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#a3ada7]">
                    {field.stats?.secondary?.label ?? "Model"}
                  </dt>
                  <dd className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[#1c2b24]">
                    {field.stats?.secondary?.warn && (
                      <AlertTriangle className="h-3.5 w-3.5 text-[#b42318]" aria-hidden />
                    )}
                    {field.stats?.secondary?.value ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#a3ada7]">Est. Yield</dt>
                  <dd className="mt-1 text-sm font-semibold text-[#1c2b24]">{field.stats?.yield ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#a3ada7]">Harvest Freq.</dt>
                  <dd className="mt-1">
                    <MiniSparkline
                      values={field.stats?.spark ?? [8, 8, 8, 8, 8, 8, 8]}
                      tone={field.statusTone === "not" ? "down" : "up"}
                    />
                  </dd>
                </div>
              </dl>
            </HarvestCard>
          ))}
        </div>

        <aside className="space-y-4">
          <HarvestCard className="p-5">
            <h2 className="text-base font-bold text-[#1b2a22]">Estate Overview</h2>
            <p className="mt-4 text-[42px] font-bold leading-none tabular-nums text-[#178a45]">
              {estateOverview.readyPercent}%
            </p>
            <p className="mt-1 text-sm text-[#7e8c84]">Total acreage ready now</p>
            <ul className="mt-6 space-y-3">
              {(estateOverview.legend ?? []).map((item) => (
                <li key={item.label} className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2 text-[#5f6f66]">
                    <span className={`h-2.5 w-2.5 rounded-full ${legendDotClass(item.tone)}`} />
                    {item.label}
                  </span>
                  <span className="font-semibold text-[#1c2b24]">{item.count} Fields</span>
                </li>
              ))}
            </ul>
          </HarvestCard>

          <div className="rounded-2xl bg-[#1f2933] p-5 text-white shadow-[0_8px_24px_rgba(31,41,51,0.2)]">
            <p className="inline-flex items-center gap-2 text-sm font-bold">
              <Thermometer className="h-4 w-4 text-[#7bc89a]" />
              Env. Context
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/80">{envContext.body}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">Avg Temp</p>
                <p className="mt-1 text-lg font-bold">{envContext.avgTemp}</p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/55">Humidity</p>
                <p className="mt-1 text-lg font-bold">{envContext.humidity}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 rounded-xl bg-[#14532d] px-3 py-3 text-xs leading-relaxed text-[#d1fae5]">
            {envContext.telemetryNote && (
              <p className="mt-3 text-[11px] leading-relaxed text-white/60">{envContext.telemetryNote}</p>
            )}
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {envContext.alert}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
