import { useMemo, useState } from "react";
import { HOURLY_TREND, RISK_CATEGORY_COLORS } from "../data/riskModel";

const W = 920;
const H = 300;
const PAD = { l: 48, r: 52, t: 40, b: 40 };

const VIEWS = [
  { id: "both", label: "Environment + risk" },
  { id: "environment", label: "Environment" },
  { id: "risk", label: "Risk category" },
];

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

export default function EnvironmentalRisk72Chart({ hourlyTrend = HOURLY_TREND }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [view, setView] = useState("both");

  const geometry = useMemo(() => {
    const span = Math.max(1, hourlyTrend.length - 1);
    const baseY = PAD.t + (H - PAD.t - PAD.b);
    const yHumidity = (value) => PAD.t + (1 - (value - 40) / 60) * (H - PAD.t - PAD.b);
    const yTemp = (value) => PAD.t + (1 - (value - 18) / 10) * (H - PAD.t - PAD.b);
    const yRisk = (value) => PAD.t + (1 - value / 100) * (H - PAD.t - PAD.b);
    const xFor = (index) => PAD.l + (index / span) * (W - PAD.l - PAD.r);
    const points = hourlyTrend.map((point, index) => ({
      ...point,
      index,
      x: xFor(index),
      yHumidity: yHumidity(point.humidity),
      yTemperature: yTemp(point.temperature),
      yRisk: yRisk(point.riskScore),
    }));
    return { baseY, yHumidity, yTemp, yRisk, points };
  }, [hourlyTrend]);

  const active = geometry.points[hoverIndex ?? geometry.points.length - 1];
  const showEnv = view === "both" || view === "environment";
  const showRisk = view === "both" || view === "risk";

  function handleMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const rel = ((event.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    geometry.points.forEach((point, index) => {
      const dist = Math.abs(point.x - rel);
      if (dist < bestDist) {
        best = index;
        bestDist = dist;
      }
    });
    setHoverIndex(best);
  }

  return (
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-[#1b2a22]">72-Hour Environmental Risk Trend</h2>
            <span className="rounded-md bg-[#f8efd8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8d6b34]">
              Sample data
            </span>
          </div>
          <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-[#7e8c84]">
            Illustrative humidity, temperature, and demo risk scores for the past 72 hours. Not live sensor
            or inference output.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-[#e6ece8] bg-[#fafbfa] p-1">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                view === option.id ? "bg-[#178a45] text-white" : "text-[#5f7368] hover:bg-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-[#5f6f66]">
        {showEnv && (
          <>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#c4845a]" />
              Relative humidity (%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#1f7a4d]" />
              Air temperature (°C)
            </span>
          </>
        )}
        {showRisk && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-[#991b1b]" />
            Demo risk score (0–100)
          </span>
        )}
      </div>

      {active && (
        <p className="mt-2 text-xs text-[#7e8c84]">
          <span className="font-semibold text-[#3e4f46]">{active.label}:</span> RH {active.humidity}% · Temp{" "}
          {active.temperature}°C · Demo risk {active.riskScore} ({active.riskCategory})
        </p>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 h-[280px] w-full cursor-crosshair"
        role="img"
        aria-label="72 hour environmental and demo risk trend chart"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={`risk-${tick}`}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={geometry.yRisk(tick)}
              y2={geometry.yRisk(tick)}
              stroke="#eef2ef"
            />
            {showRisk && (
              <text
                x={W - PAD.r + 6}
                y={geometry.yRisk(tick) + 4}
                textAnchor="start"
                fill="#a3ada7"
                fontSize="10"
                fontFamily="Inter, Segoe UI, sans-serif"
              >
                {tick}
              </text>
            )}
          </g>
        ))}

        {showEnv &&
          [50, 70, 90].map((tick) => (
            <text
              key={`rh-${tick}`}
              x={PAD.l - 10}
              y={geometry.yHumidity(tick) + 4}
              textAnchor="end"
              fill="#c4845a"
              fontSize="10"
              fontFamily="Inter, Segoe UI, sans-serif"
            >
              {tick}%
            </text>
          ))}

        {showEnv &&
          [20, 24, 28].map((tick) => (
            <text
              key={`t-${tick}`}
              x={PAD.l - 10}
              y={geometry.yTemp(tick) + 4}
              textAnchor="end"
              fill="#1f7a4d"
              fontSize="10"
              fontFamily="Inter, Segoe UI, sans-serif"
            >
              {tick}°
            </text>
          ))}

        {showRisk && (
          <path
            d={linePath(
              geometry.points.map((p) => ({ x: p.x, y: p.yRisk })),
              PAD.t,
              geometry.baseY,
            )}
            fill="none"
            stroke="#991b1b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={view === "both" ? "0" : "0"}
          />
        )}

        {showEnv && (
          <>
            <path
              d={linePath(
                geometry.points.map((p) => ({ x: p.x, y: p.yTemperature })),
                PAD.t,
                geometry.baseY,
              )}
              fill="none"
              stroke="#1e7a4f"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={linePath(
                geometry.points.map((p) => ({ x: p.x, y: p.yHumidity })),
                PAD.t,
                geometry.baseY,
              )}
              fill="none"
              stroke="#c4845a"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </>
        )}

        {geometry.points.map((point) => (
          <circle
            key={`cat-${point.label}`}
            cx={point.x}
            cy={point.yRisk}
            r="3"
            fill={RISK_CATEGORY_COLORS[point.riskCategory] ?? "#8b9790"}
            opacity={showRisk ? 0.9 : 0}
          />
        ))}

        {active && showEnv && (
          <>
            <circle cx={active.x} cy={active.yHumidity} r="4.5" fill="#c4845a" stroke="#fff" strokeWidth="2" />
            <circle cx={active.x} cy={active.yTemperature} r="4" fill="#1e7a4f" stroke="#fff" strokeWidth="2" />
          </>
        )}
        {active && showRisk && (
          <circle cx={active.x} cy={active.yRisk} r="4.5" fill="#991b1b" stroke="#fff" strokeWidth="2" />
        )}

        {geometry.points.map((point) => {
          const anchor = point.now ? "end" : point.index === 0 ? "start" : "middle";
          let x = point.x;
          if (point.now) x = W - PAD.r;
          return (
            <text
              key={point.label}
              x={x}
              y={H - 12}
              textAnchor={anchor}
              fill={point.now ? "#178a45" : "#a3ada7"}
              fontSize="11"
              fontWeight={point.now ? "600" : "400"}
              fontFamily="Inter, Segoe UI, sans-serif"
            >
              {point.label}
            </text>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#8b9790]">
        {Object.entries(RISK_CATEGORY_COLORS).map(([label, color]) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label} (demo class)
          </span>
        ))}
      </div>
    </section>
  );
}
