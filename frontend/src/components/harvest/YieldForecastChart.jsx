import { useMemo } from "react";
import { YIELD_FORECAST } from "../../data/harvestDashboard";

const W = 640;
const H = 260;
const PAD = { l: 44, r: 16, t: 24, b: 32 };

function linePath(points) {
  if (!points.length) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }
  return d;
}

export default function YieldForecastChart() {
  const geometry = useMemo(() => {
    const maxY = 15000;
    const series = YIELD_FORECAST;
    const span = series.length - 1;
    const baseY = H - PAD.b;
    const yFor = (value) => PAD.t + (1 - value / maxY) * (H - PAD.t - PAD.b);
    const xFor = (index) => PAD.l + (index / span) * (W - PAD.l - PAD.r);
    const points = series.map((point, index) => ({
      ...point,
      x: xFor(index),
      yPred: yFor(point.predicted),
      yActual: point.actual != null ? yFor(point.actual) : null,
    }));
    return { maxY, baseY, yFor, points };
  }, []);

  const predPts = geometry.points.map((p) => ({ x: p.x, y: p.yPred }));
  const actualPts = geometry.points.filter((p) => p.yActual != null).map((p) => ({ x: p.x, y: p.yActual }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[240px] w-full" role="img" aria-label="30 day yield forecast">
      {[0, 5000, 10000, 15000].map((tick) => (
        <g key={tick}>
          <line x1={PAD.l} x2={W - PAD.r} y1={geometry.yFor(tick)} y2={geometry.yFor(tick)} stroke="#eef2ef" />
          <text
            x={PAD.l - 8}
            y={geometry.yFor(tick) + 4}
            textAnchor="end"
            fill="#a3ada7"
            fontSize="11"
            fontFamily="Inter, Segoe UI, sans-serif"
          >
            {tick === 0 ? "0" : `${tick / 1000}k`}
          </text>
        </g>
      ))}

      <path
        d={linePath(actualPts)}
        fill="none"
        stroke="#c5cec8"
        strokeWidth="2"
        strokeDasharray="6 5"
        strokeLinecap="round"
      />
      <path
        d={linePath(predPts)}
        fill="none"
        stroke="#178a45"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {geometry.points
        .filter((p) => p.label)
        .map((point) => (
          <text
            key={point.label}
            x={point.x}
            y={H - 8}
            textAnchor="middle"
            fill="#a3ada7"
            fontSize="11"
            fontFamily="Inter, Segoe UI, sans-serif"
          >
            {point.label}
          </text>
        ))}

      <g transform={`translate(${W - PAD.r - 120}, ${PAD.t})`}>
        <line x1="0" y1="6" x2="18" y2="6" stroke="#178a45" strokeWidth="2.5" />
        <text x="24" y="10" fill="#5f7368" fontSize="11" fontFamily="Inter, Segoe UI, sans-serif">
          AI Prediction
        </text>
        <line x1="0" y1="22" x2="18" y2="22" stroke="#c5cec8" strokeWidth="2" strokeDasharray="5 4" />
        <text x="24" y="26" fill="#5f7368" fontSize="11" fontFamily="Inter, Segoe UI, sans-serif">
          Actual Yield
        </text>
      </g>
    </svg>
  );
}
