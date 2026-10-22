import { ArrowUpRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useDashboard } from "../context/DashboardContext";

const W = 760;
const H = 268;
const PAD = { l: 36, r: 16, t: 28, b: 32 };

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function linePath(points, minY, maxY) {
  if (!points.length) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6, minY, maxY);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6, minY, maxY);
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function areaPath(points, baseY, minY, maxY) {
  if (!points.length) return "";
  const last = points[points.length - 1];
  const first = points[0];
  return `${linePath(points, minY, maxY)} L ${last.x.toFixed(2)} ${baseY.toFixed(2)} L ${first.x.toFixed(2)} ${baseY.toFixed(2)} Z`;
}

function tone(risk) {
  if (risk >= 80) return "Critical";
  if (risk >= 60) return "High";
  return "Watch";
}

export default function RiskTrendChart() {
  const { range, trend, dashboardLoading, dataSource } = useDashboard();
  const [hoverDay, setHoverDay] = useState(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);

  const series = useMemo(() => {
    if (!trend?.length) return [];
    return range === 7 ? trend.filter((point) => point.day >= 24) : trend;
  }, [range, trend]);

  const geometry = useMemo(() => {
    const baseY = PAD.t + (H - PAD.t - PAD.b);
    const yFor = (value) => PAD.t + (1 - value / 100) * (H - PAD.t - PAD.b);
    if (!series.length) {
      return { minDay: 0, maxDay: 1, baseY, yFor, xFor: () => PAD.l, points: [] };
    }
    const minDay = series[0].day;
    const maxDay = series[series.length - 1].day;
    const span = Math.max(1, maxDay - minDay);
    const xFor = (day) => PAD.l + ((day - minDay) / span) * (W - PAD.l - PAD.r);
    const points = series.map((point) => ({
      ...point,
      x: xFor(point.day),
      yRisk: yFor(point.risk),
      yHumidity: yFor(point.humidity),
    }));
    return { minDay, maxDay, baseY, yFor, xFor, points };
  }, [series]);

  const active =
    geometry.points.find((point) => point.day === hoverDay) ??
    geometry.points.find((point) => point.critical) ??
    geometry.points[geometry.points.length - 1];

  const humidityPoints = geometry.points.map((point) => ({ x: point.x, y: point.yHumidity }));
  const riskPoints = geometry.points.map((point) => ({ x: point.x, y: point.yRisk }));
  const rightSide = active ? active.x / W > 0.62 : false;
  const highPoint = active ? active.yRisk / H < 0.38 : false;
  let tooltipTransform = "translate(-16%, -120%)";
  if (highPoint && rightSide) tooltipTransform = "translate(-104%, -78%)";
  else if (highPoint) tooltipTransform = "translate(8px, -78%)";
  else if (rightSide) tooltipTransform = "translate(-108%, -120%)";

  function handleMove(event) {
    if (!geometry.points.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const rel = ((event.clientX - rect.left) / rect.width) * W;
    let best = geometry.points[0];
    let bestDist = Infinity;
    geometry.points.forEach((point) => {
      const dist = Math.abs(point.x - rel);
      if (dist < bestDist) {
        best = point;
        bestDist = dist;
      }
    });
    setHoverDay(best.day);
  }

  const axisLabels = geometry.points.filter((point) => point.label);

  if (dashboardLoading) {
    return (
      <div className="p-5 sm:p-6">
        <p className="text-sm text-[#8b9790]">Loading disease risk trend…</p>
      </div>
    );
  }

  if (!series.length) {
    return (
      <div className="p-5 sm:p-6">
        <p className="text-sm text-[#7d8b83]">No trend data returned from the dashboard API.</p>
      </div>
    );
  }

  return (
    <section className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1b2a22]">Disease risk trend ({range} days)</h3>
          <p className="mt-0.5 text-[12px] text-[#7d8b83]">
            {dataSource === "api" ? "Dashboard API catalog series" : "Sample catalog series (offline)"} · risk index
            0–100, humidity % · not live sensor telemetry
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#5f6f66]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#e23b45]" aria-hidden="true" />
            Risk index
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#5f6f66]">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#1f7a4d]" aria-hidden="true" />
            Canopy humidity (%)
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#24352c] hover:text-[#178a45]"
            aria-expanded={analysisOpen}
            onClick={() => setAnalysisOpen((open) => !open)}
          >
            Analysis
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {analysisOpen && (
        <p className="mt-3 rounded-xl bg-[#f3faf6] px-3 py-2 text-sm text-[#345445]">
          Infection pressure and canopy humidity have moved together since day 21. The index peaked at 89 on day 28
          in Nuwara Eliya, above the critical band, and remains elevated today.
        </p>
      )}

      <div className="relative mt-2">
        {range === 30 && (
          <div className="pointer-events-none absolute top-2 left-10 z-10 flex items-center gap-2 rounded-lg border border-[#e6eeea] bg-white px-3 py-1.5 text-[12px] text-[#3e4f46] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e23b45]" />
            Threshold breached: Day 24 onwards
          </div>
        )}

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[260px] w-full max-w-full cursor-crosshair sm:h-[280px]"
          role="img"
          aria-label={`Disease risk and canopy humidity over ${range} days. Highlighted risk index ${active.risk}.`}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverDay(null)}
        >
          <defs>
            <linearGradient id="humidityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f7a4d" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#1f7a4d" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e24b4a" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#e24b4a" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={geometry.yFor(tick)}
                y2={geometry.yFor(tick)}
                stroke="#e7eee9"
              />
              <text
                x={PAD.l - 8}
                y={geometry.yFor(tick) + 4}
                textAnchor="end"
                fill="#a3ada7"
                fontSize="11"
                fontFamily="Inter, Segoe UI, sans-serif"
              >
                {tick}
              </text>
            </g>
          ))}

          <path d={areaPath(humidityPoints, geometry.baseY, PAD.t, geometry.baseY)} fill="url(#humidityFill)" />
          <path d={areaPath(riskPoints, geometry.baseY, PAD.t, geometry.baseY)} fill="url(#riskFill)" />
          <path
            d={linePath(humidityPoints, PAD.t, geometry.baseY)}
            fill="none"
            stroke="#1e7a4f"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={linePath(riskPoints, PAD.t, geometry.baseY)}
            fill="none"
            stroke="#e23d45"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <circle cx={active.x} cy={active.yHumidity} r="4.5" fill="#1e7a4f" stroke="#fff" strokeWidth="2" />
          <circle cx={active.x} cy={active.yRisk} r="4.5" fill="#e23d45" stroke="#fff" strokeWidth="2" />

          {axisLabels.map((point) => {
            const today = axisLabels.find((item) => item.label === "Today");
            const crowded = today && point.label === "Day 28" && today.x - point.x < 78;
            let anchor = "middle";
            let x = point.x;
            if (point.day === geometry.minDay) anchor = "start";
            if (point.label === "Today") {
              anchor = "end";
              x = Math.max(point.x, W - 8);
            } else if (crowded) {
              anchor = "end";
              x = (today?.x ?? point.x) - 56;
            }
            return (
              <text
                key={point.day}
                x={x}
                y={H - 8}
                textAnchor={anchor}
                fill="#a3ada7"
                fontSize="11"
                fontFamily="Inter, Segoe UI, sans-serif"
              >
                {point.label}
              </text>
            );
          })}
        </svg>

        <div
          className="pointer-events-none absolute z-10 w-[188px] rounded-lg bg-[#1c2420] px-3 py-2 text-white shadow-lg"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: `${(active.yRisk / H) * 100}%`,
            transform: tooltipTransform,
          }}
        >
          <p className="text-[12px] font-semibold">
            {active.day === 30 ? "Today" : `Day ${active.day}`} • {active.place || "Estate sensors"}
          </p>
          <p className="mt-0.5 text-[11px] text-[#d5ddd8]">
            Risk index: <span className="font-semibold text-[#ffb4b4]">{active.risk}</span> ({tone(active.risk)})
          </p>
          <p className="text-[11px] text-[#d5ddd8]">
            Humidity: <span className="font-semibold">{active.humidity}%</span>
          </p>
        </div>
      </div>
    </section>
  );
}
