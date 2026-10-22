import { ChevronRight, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";

function Card({ children }) {
  return <article className="panel flex min-h-[148px] flex-col p-4 sm:p-5">{children}</article>;
}

function FooterLink({ to, onClick, children, dot = false }) {
  const className =
    "mt-auto flex items-center justify-between pt-4 text-[13px] font-medium text-[#5f7368] hover:text-[#173528]";
  const content = (
    <>
      <span className="inline-flex items-center gap-2">
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-[#22a35a]" />}
        {children}
      </span>
      <ChevronRight className="h-4 w-4 text-[#9aaba3]" />
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${className} w-full text-left`}>
      {content}
    </button>
  );
}

export default function KpiGrid() {
  const { telemetryLive, estateStats, fields, alerts, dashboardLoading } = useDashboard();

  if (dashboardLoading || !estateStats) {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((key) => (
          <Card key={key}>
            <p className="text-sm text-[#8b9790]">Loading dashboard metrics…</p>
          </Card>
        ))}
      </section>
    );
  }

  const priority = fields.length;
  const normal = Math.max(0, estateStats.totalFields - priority);
  const unresolved = alerts.filter((alert) => alert.level === "Unresolved").length;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <div className="flex items-start justify-between gap-3">
          <p className="min-h-8 text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">PDVI SCORE</p>
          <span className="rounded-full bg-[#e5f6ea] px-2 py-0.5 text-[11px] font-semibold text-[#1d8a4e]">
            {estateStats.modelPdvi}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-[38px] leading-none font-semibold tracking-tight text-[#1c2b24] tabular-nums">
              {estateStats.pdvi}
            </span>
            <span className="text-sm text-[#98a29c]">/100</span>
          </div>
          <span className="rounded-full bg-[#f3ead8] px-2.5 py-1 text-xs font-semibold text-[#8d6b34]">
            {estateStats.band}
          </span>
        </div>
        <FooterLink to="/pdvi" dot>
          {telemetryLive ? "Verified Sensor Feed" : "Sensor feed paused"}
        </FooterLink>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <p className="min-h-8 text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">DISEASE RISK</p>
          <span className="rounded-full bg-[#fde8ea] px-2 py-0.5 text-[11px] font-semibold text-[#e14b55]">
            {estateStats.modelRisk}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[34px] leading-none font-semibold tracking-tight text-[#e23d45]">
            {estateStats.diseaseRisk}
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-[#6d7c74]">
            {estateStats.diseaseNote}
            <TriangleAlert className="h-4 w-4 text-[#e23b45]" />
          </span>
        </div>
        <FooterLink to="/risk">{estateStats.riskEngine}</FooterLink>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <p className="min-h-8 max-w-[150px] text-[11px] leading-4 font-semibold tracking-[0.12em] text-[#8d9992]">
            FIELDS REQUIRING ATTENTION
          </p>
          <span className="rounded-full bg-[#fde8ea] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-[#e14b55]">
            {priority} Priority
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[38px] leading-none font-semibold tracking-tight text-[#1c2b24] tabular-nums">
              {priority}
            </span>
            <span className="text-sm text-[#8b9790]">/{estateStats.totalFields} Fields</span>
          </div>
          <span className="pb-1 text-sm font-medium text-[#3c9a62]">{normal} Normal</span>
        </div>
        <FooterLink
          onClick={() => document.getElementById("priority-fields")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        >
          Supervisor action required
        </FooterLink>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <p className="min-h-8 text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">ACTIVE ALERTS</p>
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#e23b45]" />
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[38px] leading-none font-semibold tracking-tight text-[#e23d45] tabular-nums">
              {unresolved}
            </span>
            <span className="text-sm text-[#8b9790]">Unresolved</span>
          </div>
          <span className="pb-1 text-sm text-[#5c6b63]">{estateStats.primaryDisease}</span>
        </div>
        <FooterLink to="/alerts">{estateStats.alertPlaces}</FooterLink>
      </Card>
    </section>
  );
}
