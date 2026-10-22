import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { fetchHarvestThrri } from "../../api/harvestApi";

function Stub({ title, subtitle }) {
  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-[#e8ece9] bg-white px-5 py-12 text-center text-sm text-[#7d8b83]">
        This harvest module view is ready for backend integration.
      </div>
    </div>
  );
}

export function HarvestThrriResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await fetchHarvestThrri();
        if (active) setData(result);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1180px] pb-8">
      <PageHeader
        title="THRRI Results"
        subtitle="Combined harvest readiness and climate risk index for estate planning."
      />
      {loading && (
        <p className="flex items-center gap-2 text-sm text-[#8b9790]">
          <Loader2 className="h-4 w-4 animate-spin" /> Calculating THRRI…
        </p>
      )}
      {!loading && data && (
        <article className="rounded-2xl border border-[#e8ece9] bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">THRRI SCORE</p>
          <p className="mt-2 text-[48px] font-bold tabular-nums text-[#178a45]">
            {data.thrriScore ?? data.thrri_score ?? "—"}
          </p>
          <p className="mt-2 text-lg font-semibold text-[#1c2b24]">{data.recommendation ?? "—"}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-[#8b9790]">Readiness score</dt>
              <dd className="text-sm font-medium text-[#1c2b24]">
                {data.readinessScore ?? data.readiness_score ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[#8b9790]">High-risk score</dt>
              <dd className="text-sm font-medium text-[#1c2b24]">
                {data.highRiskScore ?? data.high_risk_score ?? "—"}
              </dd>
            </div>
          </dl>
          {(data.inferenceEngine || data.error) && (
            <p className="mt-4 text-xs text-[#8b9790]">
              {data.error ? `Error: ${data.error}` : `Engine: ${data.inferenceEngine}`}
            </p>
          )}
        </article>
      )}
    </div>
  );
}

export function HarvestFieldPlanning() {
  return <Stub title="Field Planning" subtitle="Crew assignments and sector scheduling for harvest windows." />;
}

export function HarvestSupport() {
  return <Stub title="Support" subtitle="Harvest analytics desk and module documentation." />;
}
