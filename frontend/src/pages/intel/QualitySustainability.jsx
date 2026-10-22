import {
  ArrowRight,
  Download,
  Layers,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Truck,
  Droplets,
} from "lucide-react";
import { Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchIntelOverview } from "../../api/intelApi";
import QualityPerformanceChart from "../../components/intel/QualityPerformanceChart";
import { QS_KPIS as demoKpis, RECOMMENDATIONS } from "../../data/qualitySustainability";
import { normalizeIntelOverview } from "../../utils/intelPresentation";

const REC_ICONS = {
  droplet: Droplets,
  layers: Layers,
  truck: Truck,
};

function badgeClass(tone) {
  if (tone === "priority") return "bg-[#fde8e8] text-[#b42318]";
  if (tone === "scheduled") return "bg-[#dbeafe] text-[#1e5a8a]";
  return "bg-[#ede9fe] text-[#6d28d9]";
}

function IntelCard({ children, className = "" }) {
  return (
    <article className={`rounded-2xl border border-[#e8ece9] bg-white shadow-[0_1px_3px_rgba(16,40,28,0.05)] ${className}`}>
      {children}
    </article>
  );
}

export default function QualitySustainability() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usingDemo, setUsingDemo] = useState(true);
  const [kpis, setKpis] = useState(demoKpis);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchIntelOverview();
        if (!active) return;
        const normalized = normalizeIntelOverview(data);
        if (!normalized.live) {
          setUsingDemo(true);
          setError(data.error ?? "Live intel overview unavailable");
          return;
        }
        setUsingDemo(false);
        setKpis({
          quality: {
            value: normalized.qualityScoreEquivalent ?? "—",
            delta: normalized.teaGrade ? `Grade ${normalized.teaGrade} · model forecast` : "—",
            conf: normalized.teaQualityConfidence,
            code: "Q-PRED-LIVE",
          },
          sustainability: {
            grade: normalized.sustainabilityLabel ?? "—",
            note: normalized.sustainabilityScore != null ? `${normalized.sustainabilityScore}/100 · model score` : "—",
            code: "SUST-IDX-LIVE",
          },
          resourceEfficiency: normalized.sustainabilityScore ?? demoKpis.resourceEfficiency,
          stiiScore:
            normalized.stiiScore != null
              ? `${normalized.stiiScore}/100${normalized.stiiTier ? ` · ${normalized.stiiTier}` : ""}`
              : demoKpis.stiiScore,
        });
      } catch (err) {
        if (active) {
          setUsingDemo(true);
          setError(err.message ?? "Intel overview API unavailable");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const qualityDisplay = kpis.quality.value;

  return (
    <div className="mx-auto max-w-[1180px] pb-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] font-bold tracking-tight text-[#153d2e]">Quality & Sustainability</h1>
          <p className="mt-2 text-sm text-[#7e8c84]">
            Estate overview from catalog default inputs when ML is connected; charts and recommendations below are
            illustrative.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#e8ece9] bg-white px-4 py-2 text-sm font-semibold text-[#3e4f46] hover:bg-[#f4f6f4]"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#153d2e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#10241c]"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </header>

      {loading && (
        <p className="mb-4 flex items-center gap-2 text-sm text-[#8b9790]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading quality & sustainability scores…
        </p>
      )}
      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-[#f6f8f6] px-3 py-2 text-sm text-[#5f7368]">
          <WifiOff className="h-4 w-4" /> {error} — showing demo KPIs.
        </p>
      )}
      {!usingDemo && !loading && (
        <p className="mb-4 text-xs font-medium text-[#1a7a45]">Live model scores (catalog default inputs)</p>
      )}
      {usingDemo && !loading && !error && (
        <p className="mb-4 text-xs font-medium text-[#8b9790]">Demo KPI placeholders</p>
      )}

      <section className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <IntelCard className="p-5">
            <p className="text-[10px] font-semibold tracking-wide text-[#a3ada7]">{kpis.quality.code}</p>
            <div className="mt-3 flex items-start gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d9f5e3] text-[#153d2e]">
                <Sprout className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-[#7e8c84]">Numeric quality score (STII mapping)</p>
                <p className="text-[32px] font-bold tabular-nums leading-none text-[#153d2e]">{qualityDisplay}</p>
                <p className="mt-1 text-xs font-semibold text-[#178a45]">{kpis.quality.delta}</p>
                {kpis.quality.conf != null && (
                  <p className="mt-1 text-xs text-[#8b9790]">Top class probability: {kpis.quality.conf}%</p>
                )}
              </div>
            </div>
          </IntelCard>

          <IntelCard className="p-5">
            <p className="text-[10px] font-semibold tracking-wide text-[#a3ada7]">{kpis.sustainability.code}</p>
            <div className="mt-3 flex items-start gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#153d2e] text-white">
                <Shield className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-[#7e8c84]">Sustainability performance</p>
                <p className="text-[32px] font-bold leading-none text-[#153d2e]">{kpis.sustainability.grade}</p>
                <p className="mt-1 text-xs text-[#7e8c84]">{kpis.sustainability.note}</p>
              </div>
            </div>
          </IntelCard>

          <div className="grid grid-cols-2 gap-3">
            <IntelCard className="p-4">
              <p className="text-[10px] font-semibold text-[#a3ada7]">Sustainability score</p>
              <p className="mt-2 text-xl font-bold text-[#153d2e]">{kpis.resourceEfficiency}%</p>
            </IntelCard>
            <IntelCard className="p-4">
              <p className="text-[10px] font-semibold text-[#a3ada7]">STII Score</p>
              <p className="mt-2 text-xl font-bold text-[#153d2e]">{kpis.stiiScore}</p>
            </IntelCard>
          </div>
        </div>

        <IntelCard className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#153d2e]">Performance Overview</h2>
              <p className="text-xs text-[#7e8c84]">Illustrative trend series — not from live model output.</p>
            </div>
          </div>
          <QualityPerformanceChart />
        </IntelCard>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-bold text-[#153d2e]">
          <Sparkles className="h-5 w-5 text-[#178a45]" />
          Key Recommendations
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {RECOMMENDATIONS.map((item) => {
            const Icon = REC_ICONS[item.icon];
            return (
              <IntelCard key={item.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4f6f4] text-[#153d2e]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold tracking-wide ${badgeClass(item.badgeTone)}`}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#153d2e]">{item.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-relaxed text-[#7e8c84]">{item.body}</p>
                <button type="button" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#153d2e] hover:underline">
                  {item.action}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </IntelCard>
            );
          })}
        </div>
      </section>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2ef] pt-4 text-[10px] font-semibold tracking-wide text-[#a3ada7]">
        <p>{usingDemo ? "KPI SOURCE: DEMO DATA" : "KPI SOURCE: LIVE MODEL (DEFAULT INPUTS)"}</p>
        <div className="flex gap-4">
          <Link to="/intel/sustainability-assessment" className="hover:text-[#153d2e]">
            Sustainability Assessment
          </Link>
        </div>
      </footer>
    </div>
  );
}
