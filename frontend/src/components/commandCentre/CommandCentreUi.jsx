import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { scoreClass, statusClass } from "../../data/dashboard";

/** Shared dashboard spacing & surfaces (align with `.panel` in index.css). */
export const cc = {
  sectionGap: "space-y-4",
  gridGap: "gap-4",
  cardBody: "p-5 sm:p-6",
  innerPad: "px-5 sm:px-6",
  border: "border-[#e6eeea]",
  divider: "border-[#eef2ef]",
  muted: "text-[#7d8b83]",
  body: "text-[#5f7368]",
  title: "text-[#1b2a22]",
};

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#178a45]">{eyebrow}</p>
        ) : null}
        <h2 className="text-lg font-semibold tracking-tight text-[#1b2a22] sm:text-xl">{title}</h2>
        {description ? (
          <p className={`mt-1 max-w-3xl text-[13px] leading-relaxed ${cc.muted}`}>{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function OverviewCardShell({ accent = "m01", children, className = "" }) {
  const accentBar = {
    m01: "from-[#178a45] to-[#7bc89a]",
    m02: "from-[#1e6b8a] to-[#7bc89a]",
    m02b: "from-[#2563eb] to-[#7bc89a]",
    m03: "from-[#5b4b8a] to-[#178a45]",
  }[accent];
  return (
    <article
      className={`cc-overview-card panel relative flex min-h-[168px] flex-col overflow-hidden ${cc.cardBody} ${className}`}
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accentBar}`} aria-hidden="true" />
      {children}
    </article>
  );
}

export function OverviewLabel({ children }) {
  return <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">{children}</p>;
}

export function OverviewMeta({ children }) {
  return <p className={`mt-1 text-xs ${cc.muted}`}>{children}</p>;
}

export function MetricBlock({ value, unit, description, tone = "default", badge }) {
  const valueTone =
    tone === "good"
      ? "text-[#178a45]"
      : tone === "risk"
        ? "text-[#e23d45]"
        : tone === "warn"
          ? "text-[#c98416]"
          : "text-[#1c2b24]";
  return (
    <div className="mt-4 flex items-end justify-between gap-2">
      <div className="min-w-0">
        <p className={`flex flex-wrap items-baseline gap-x-1 gap-y-0 ${valueTone}`}>
          <span className="text-3xl font-semibold tabular-nums tracking-tight">{value}</span>
          {unit ? <span className="text-sm font-medium text-[#8b9790]">{unit}</span> : null}
        </p>
        {description ? <p className={`mt-1 text-sm leading-snug ${cc.body}`}>{description}</p> : null}
      </div>
      {badge ? (
        <span className="shrink-0 rounded-full bg-[#f3ead8] px-2.5 py-1 text-xs font-semibold text-[#8d6b34]">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function MetricUnavailable({ message }) {
  return (
    <div className="mt-4">
      <p className="text-lg font-semibold text-[#8b9790]">Unavailable</p>
      {message ? <p className={`mt-1.5 text-sm leading-snug ${cc.body}`}>{message}</p> : null}
    </div>
  );
}

const DATA_KIND_STYLES = {
  catalog: "bg-[#eef1ef] text-[#5f7368]",
  model: "bg-[#e8f4fc] text-[#1e6b8a]",
  session: "bg-[#e7f7ec] text-[#14532d]",
  estate: "bg-[#f0eef8] text-[#5b4b8a]",
  sensor: "bg-[#e7f7ec] text-[#14532d]",
  unavailable: "bg-[#fef3e8] text-[#8d6b34]",
};

const DATA_KIND_LABELS = {
  catalog: "Catalog summary",
  model: "Model prediction",
  session: "Browser session",
  estate: "Estate overview",
  sensor: "Telemetry",
  unavailable: "Not on dashboard",
};

export function DataKindTag({ kind = "catalog" }) {
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        DATA_KIND_STYLES[kind] ?? DATA_KIND_STYLES.catalog
      }`}
    >
      {DATA_KIND_LABELS[kind] ?? DATA_KIND_LABELS.catalog}
    </span>
  );
}

export function EmptyStatePanel({ title, children, actionTo, actionLabel }) {
  return (
    <div className={`rounded-xl border border-dashed ${cc.border} bg-[#fafbfa] px-4 py-6 text-left`}>
      {title ? <p className="text-sm font-semibold text-[#24352c]">{title}</p> : null}
      <div className={`${title ? "mt-1.5" : ""} text-sm leading-relaxed ${cc.muted}`}>{children}</div>
      {actionTo && actionLabel ? (
        <Link to={actionTo} className="mt-3 inline-flex text-sm font-semibold text-[#178a45] hover:underline">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function InlineError({ children }) {
  return (
    <p className="mt-2 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-2.5 py-2 text-xs text-[#991b1b]" role="alert">
      {children}
    </p>
  );
}

export function CardFooterLink({ to, meta, children }) {
  return (
    <Link
      to={to}
      className={`group mt-auto flex items-center justify-between gap-2 border-t ${cc.divider} pt-4 text-[13px] font-medium text-[#5f7368] hover:text-[#173528]`}
    >
      <span>{children}</span>
      <span className="inline-flex items-center gap-1 text-[11px] text-[#8b9790]">
        {meta}
        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function ChartCard({ title, description, children }) {
  return (
    <article className={`panel ${cc.cardBody}`}>
      <h3 className="text-[15px] font-semibold text-[#1b2a22]">{title}</h3>
      {description ? <p className={`mt-1 text-[12px] leading-relaxed ${cc.muted}`}>{description}</p> : null}
      <div className="mt-4">{children}</div>
    </article>
  );
}

export function ChartLegendItem({ colorClass, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] ${cc.body}`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${colorClass}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function MemberPanel({ badge, title, subtitle, children, footer }) {
  return (
    <article className="panel flex h-full flex-col overflow-hidden">
      <div className={`border-b ${cc.divider} bg-[#fafbfa] ${cc.innerPad} py-4`}>
        <span className="inline-flex rounded-md bg-[#e7f7ec] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#14532d]">
          {badge}
        </span>
        <h3 className="mt-2 text-base font-semibold text-[#1b2a22]">{title}</h3>
        {subtitle ? <p className={`mt-0.5 text-[12px] ${cc.muted}`}>{subtitle}</p> : null}
      </div>
      <div className={`flex flex-1 flex-col gap-3 ${cc.innerPad} py-4`}>{children}</div>
      {footer ? (
        <div className={`border-t ${cc.divider} ${cc.innerPad} py-3`}>{footer}</div>
      ) : null}
    </article>
  );
}

export function KpiRow({ label, value, hint, tone = "default" }) {
  const valueClass =
    tone === "risk"
      ? "text-[#e23d45]"
      : tone === "good"
        ? "text-[#178a45]"
        : tone === "warn"
          ? "text-[#c98416]"
          : "text-[#1c2b24]";
  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border ${cc.divider} bg-[#fafbfa] px-3 py-2.5`}>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8d9992]">{label}</p>
        {hint ? <p className={`mt-0.5 text-[12px] ${cc.muted}`}>{hint}</p> : null}
      </div>
      <p className={`shrink-0 text-right text-sm font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

export function ModuleLinkGrid({ links }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map(({ to, label }) => (
        <Link key={to} to={to} className={btnSecondaryClass}>
          {label}
        </Link>
      ))}
    </div>
  );
}

export const btnPrimaryClass =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#10241c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#173628] disabled:opacity-60";

export const btnSecondaryClass =
  "inline-flex items-center rounded-lg border border-[#e3ebe6] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#24352c] shadow-sm hover:border-[#b7dcc6] hover:bg-[#f8fbf9]";

export function BtnPrimary({ children, className = "", ...props }) {
  return (
    <button type="button" className={`${btnPrimaryClass} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function StatusChip({ ok, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        ok ? "bg-[#e7f7ec] text-[#14532d]" : "bg-[#eef1ef] text-[#5f7368]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${ok ? "bg-[#22a35a]" : "bg-[#b0b8b3]"}`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

/** Status pill — color plus visible label (not color-only). */
export function StatusLabel({ children, statusKey }) {
  const text = children ?? statusKey ?? "—";
  const key = statusKey ?? text;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass(key)}`}>{text}</span>
  );
}

export function ScoreValue({ score, suffix = "/100" }) {
  return (
    <span className={`font-semibold tabular-nums ${scoreClass(score)}`}>
      {score}
      {suffix ? <span className="text-xs font-medium text-[#8b9790]"> {suffix}</span> : null}
    </span>
  );
}

export function TableShell({ children }) {
  return <div className="panel overflow-hidden">{children}</div>;
}

export function tableHeadClass() {
  return `border-b ${cc.divider} bg-[#fafbfa] text-[11px] font-semibold tracking-wide text-[#8d9992]`;
}

export function TableTh({ children, className = "", colSpan }) {
  return (
    <th colSpan={colSpan} className={`px-4 py-2.5 text-left ${className}`}>
      {children}
    </th>
  );
}

export function TableTd({ children, className = "" }) {
  return <td className={`px-4 py-3 text-sm text-[#24352c] ${className}`}>{children}</td>;
}

export function EmptyState({ children }) {
  return (
    <p className={`rounded-xl border border-dashed ${cc.border} bg-[#fafbfa] px-4 py-8 text-center text-sm ${cc.muted}`}>
      {children}
    </p>
  );
}
