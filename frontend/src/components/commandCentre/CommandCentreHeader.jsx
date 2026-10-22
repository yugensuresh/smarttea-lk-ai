import { RefreshCw, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ESTATES, useDashboard } from "../../context/DashboardContext";
import { btnPrimaryClass, btnSecondaryClass, StatusChip } from "./CommandCentreUi";

function formatFreshness(date) {
  if (!date) return "Not loaded yet";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CommandCentreHeader() {
  const {
    range,
    setRange,
    telemetryLive,
    query,
    estates,
    setEstates,
    fields,
    matchedAlerts,
    dashboardError,
    dataSource,
    dashboardLoading,
    memberLoading,
    fetchedAt,
    member02Readiness,
    member03Intel,
    refreshDashboard,
  } = useDashboard();
  const [filterOpen, setFilterOpen] = useState(false);
  const filtering = estates.length !== ESTATES.length;
  const refreshing = dashboardLoading || memberLoading;

  useEffect(() => {
    if (!filterOpen) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setFilterOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filterOpen]);

  function toggleEstate(estate) {
    setEstates((current) =>
      current.includes(estate) ? current.filter((item) => item !== estate) : [...current, estate],
    );
  }

  return (
    <header className="cc-hero panel overflow-hidden">
      <div className="relative px-4 py-5 sm:px-6 sm:py-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#f3faf6] via-white to-[#f4f6f3] opacity-90" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#178a45]">SMARTTEA-LK</p>
            <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[#1b2a22] sm:text-[32px]">
              Plantation Command Centre
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5f7368]">
              Enterprise view across disease health, harvest intelligence, and quality & sustainability — powered by
              the same integrated services as each detailed module page.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <StatusChip ok={dataSource === "api"} label={dataSource === "api" ? "Dashboard connected" : "Dashboard sample"} />
              <StatusChip ok={telemetryLive} label={telemetryLive ? "Estate telemetry live" : "Telemetry paused"} />
              <StatusChip
                ok={Boolean(member02Readiness?.serviceConnected)}
                label={member02Readiness?.serviceConnected ? "Harvest ML" : "Harvest ML idle"}
              />
              <StatusChip
                ok={Boolean(member03Intel?.serviceConnected)}
                label={member03Intel?.serviceConnected ? "Intel ML" : "Intel ML idle"}
              />
            </div>

            <p className="mt-3 text-[12px] text-[#7d8b83]">
              Data refreshed <span className="font-semibold text-[#24352c]">{formatFreshness(fetchedAt)}</span>
              <span className="mx-2 text-[#d5ddd6]">·</span>
              Model inference runs in module pages, not this summary layer
            </p>

            {query.trim() && matchedAlerts.length > 0 && (
              <Link to="/alerts" className="mt-2 inline-flex text-[13px] font-semibold text-[#178a45] hover:underline">
                {matchedAlerts.length} alert{matchedAlerts.length === 1 ? "" : "s"} match search
              </Link>
            )}

            {dashboardError && dataSource !== "api" && (
              <p className="mt-2 text-[12px] text-[#991b1b]" role="alert">
                {dashboardError}{" "}
                <button type="button" onClick={refreshDashboard} className="font-semibold underline">
                  Retry
                </button>
              </p>
            )}
          </div>

          <div className="relative z-10 flex flex-col items-end gap-2">
            {filterOpen && (
              <button
                type="button"
                className="fixed inset-0 z-20 cursor-default"
                aria-label="Close filters"
                onClick={() => setFilterOpen(false)}
              />
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex gap-1.5 rounded-xl border border-[#e6eeea] bg-white/90 p-1 shadow-sm">
                {[7, 30].map((value) => {
                  const active = range === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setRange(value)}
                      className={`min-w-[52px] rounded-lg px-2 py-1.5 text-center transition ${
                        active ? "bg-[#178a45] text-white shadow-sm" : "text-[#5f7368] hover:bg-[#f4f6f4]"
                      }`}
                    >
                      <span className="block text-sm font-semibold leading-none">{value}d</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                aria-expanded={filterOpen}
                onClick={() => setFilterOpen((open) => !open)}
                className={`${btnSecondaryClass} gap-2 px-3 py-2 text-[13px]`}
              >
                <SlidersHorizontal className="h-4 w-4 text-[#5f7368]" />
                Estates
                {filtering && <span className="h-1.5 w-1.5 rounded-full bg-[#178a45]" />}
              </button>
              <button
                type="button"
                disabled={refreshing}
                onClick={refreshDashboard}
                className={`${btnPrimaryClass} px-3.5 py-2 text-[13px]`}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
            {filterOpen && (
              <div className="panel absolute top-full right-0 z-30 mt-2 w-60 p-3 shadow-lg">
                <p className="px-1 text-[11px] font-semibold tracking-[0.14em] text-[#8d9992]">ESTATE FILTER</p>
                <label className="mt-2 flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-[#24352c] hover:bg-[#f6f8f6]">
                  <input
                    type="checkbox"
                    checked={estates.length === ESTATES.length}
                    onChange={() => setEstates(estates.length === ESTATES.length ? [] : [...ESTATES])}
                  />
                  All estates
                </label>
                {ESTATES.map((estate) => {
                  const count = fields.filter((field) => field.estate === estate).length;
                  return (
                    <label
                      key={estate}
                      className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm text-[#24352c] hover:bg-[#f6f8f6]"
                    >
                      <input type="checkbox" checked={estates.includes(estate)} onChange={() => toggleEstate(estate)} />
                      <span className="flex-1">{estate}</span>
                      <span className="text-xs text-[#8b9790]">{count}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
