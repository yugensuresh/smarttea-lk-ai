import { ArrowRight, ChartColumn, Microscope, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDashboard } from "../../context/DashboardContext";
import { readLeafWorkflow, workflowPipelineStatus } from "../../utils/leafWorkflow";

const links = [
  { to: "/disease", label: "Disease Detection", icon: Microscope, hint: "Leaf disease identification" },
  { to: "/risk", label: "Risk Prediction", icon: TriangleAlert, hint: "Environmental disease risk" },
  { to: "/pdvi", label: "PDVI Scoring", icon: ChartColumn, hint: "Plantation vulnerability index" },
];

function SummaryCard({ title, children, demo }) {
  return (
    <article className="panel flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#1b2a22]">{title}</h3>
        {demo && (
          <span className="shrink-0 rounded-md bg-[#f8efd8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8d6b34]">
            Demo
          </span>
        )}
      </div>
      <div className="mt-3 flex-1 text-sm text-[#5f7368]">{children}</div>
    </article>
  );
}

export default function Member01Summary() {
  const { estateStats, fields, alerts, dataSource, detections } = useDashboard();
  const demo = dataSource !== "api";
  const [pipeline, setPipeline] = useState({ model01: false, model02: false, pdvi: false });

  useEffect(() => {
    function refresh() {
      setPipeline(workflowPipelineStatus(readLeafWorkflow()));
    }
    refresh();
    window.addEventListener("smarttea-lk:leaf-workflow-updated", refresh);
    return () => window.removeEventListener("smarttea-lk:leaf-workflow-updated", refresh);
  }, []);
  const priorityCount = fields.filter((f) => f.score >= 70).length;
  const recentDetection = detections?.[0];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
        <div>
          <h2 className="text-base font-semibold text-[#1b2a22]">Disease &amp; Plantation Health</h2>
          <p className="mt-0.5 text-[13px] text-[#7e8c84]">
            Compact summaries from disease, risk, and PDVI modules — open each area for full analysis.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e3ebe6] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#24352c] shadow-sm hover:bg-[#fbfcfb]"
            >
              <Icon className="h-3.5 w-3.5 text-[#178a45]" />
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="rounded-xl border border-[#eef2ef] bg-[#fafbfa] px-4 py-2 text-xs text-[#5f7368]">
        Session pipeline:{" "}
        <span className={pipeline.model01 ? "font-semibold text-[#178a45]" : "text-[#b0bab4]"}>Disease</span>
        {" → "}
        <span className={pipeline.model02 ? "font-semibold text-[#178a45]" : "text-[#b0bab4]"}>Risk</span>
        {" → "}
        <span className={pipeline.pdvi ? "font-semibold text-[#178a45]" : "text-[#b0bab4]"}>PDVI</span>
        {!pipeline.model01 && " — start on Disease Detection"}
      </p>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Latest disease activity" demo={demo}>
          {recentDetection ? (
            <>
              <p className="font-medium text-[#1c2b24]">{recentDetection.name}</p>
              <p className="mt-1 text-[13px]">{recentDetection.field}</p>
              <p className="mt-2 text-[12px] text-[#8b9790]">
                Illustrative dashboard record — confirm via{" "}
                <Link to="/disease" className="font-semibold text-[#178a45] hover:underline">
                  Disease Detection
                </Link>
                .
              </p>
            </>
          ) : (
            <p>No recent detection summary. Analyze a leaf on Disease Detection.</p>
          )}
        </SummaryCard>

        <SummaryCard title="Environmental disease risk" demo={demo}>
          <p>
            Primary concern:{" "}
            <span className="font-semibold text-[#1c2b24]">{estateStats?.diseaseRisk ?? "—"}</span>
          </p>
          <p className="mt-2 text-[13px]">{estateStats?.diseaseNote ?? "—"}</p>
          <Link to="/risk" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#178a45] hover:underline">
            Open Risk Prediction <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </SummaryCard>

        <SummaryCard title="PDVI summary" demo={demo}>
          <p className="text-2xl font-bold tabular-nums text-[#1c2b24]">
            {estateStats?.pdvi ?? "—"}
            <span className="text-sm font-medium text-[#8b9790]"> / 100</span>
          </p>
          <p className="mt-1">{estateStats?.band ?? "—"}</p>
          <Link to="/pdvi" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#178a45] hover:underline">
            View PDVI Scoring <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </SummaryCard>

        <SummaryCard title="Attention required" demo={demo}>
          <p>
            <span className="text-2xl font-bold tabular-nums text-[#e23b45]">{priorityCount}</span>{" "}
            <span className="text-[13px]">priority fields</span>
          </p>
          <p className="mt-2 text-[13px]">
            {alerts.filter((a) => a.level === "Unresolved").length} unresolved alerts
          </p>
          <Link to="/alerts" className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#178a45] hover:underline">
            Active Alerts <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </SummaryCard>
      </div>
    </section>
  );
}
