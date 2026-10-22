import { useMemo } from "react";
import { PRODUCTION_TRAJECTORY } from "../../data/harvestForecasting";

const W = 720;
const H = 280;
const PAD = { l: 48, r: 20, t: 28, b: 36 };

function linePath(points) {
  if (!points.length) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }
  return d;
}

export default function ProductionTrajectoryChart() {
  const geometry = useMemo(() => {
    const maxY = 15000;
    const series = PRODUCTION_TRAJECTORY;
    const span = series.length - 1;
    const yFor = (value) => PAD.t + (1 - value / maxY) * (H - PAD.t - PAD.b);
    const xFor = (index) => PAD.l + (index / span) * (W - PAD.l - PAD.r);
    const points = series.map((point, index) => ({
      ...point,
      x: xFor(index),
      yHist: point.historical != null ? yFor(point.historical) : null,
      yPred: point.predicted != null ? yFor(point.predicted) : null,
    }));
    const nowIndex = points.findIndex((p) => p.isNow);
    const nowX = nowIndex >= 0 ? points[nowIndex].x : null;
    return { maxY, yFor, points, nowX, nowIndex };
  }, []);

  const histPts = geometry.points
    .filter((p) => p.yHist != null)
    .map((p) => ({ x: p.x, y: p.yHist }));

  const predPts = (() => {
    const pts = [];
    const nowIdx = geometry.nowIndex;
    if (nowIdx > 0) {
      const prev = geometry.points[nowIdx - 1];
      if (prev.yHist != null) pts.push({ x: prev.x, y: prev.yHist });
    }
    geometry.points.slice(nowIdx >= 0 ? nowIdx : 0).forEach((p) => {
      if (p.yPred != null) pts.push({ x: p.x, y: p.yPred });
    });
    return pts;
  })();

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[260px] w-full" role="img" aria-label="Production trajectory">
      {[0, 5000, 10000, 15000].map((tick) => (
        <g key={tick}>
          <line x1={PAD.l} x2={W - PAD.r} y1={geometry.yFor(tick)} y2={geometry.yFor(tick)} stroke="#eef2ef" />
          <text
            x={PAD.l - 10}
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

      {geometry.nowX != null && (
        <>
          <line
            x1={geometry.nowX}
            x2={geometry.nowX}
            y1={PAD.t}
            y2={H - PAD.b}
            stroke="#d1d9d4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={geometry.nowX}
            y={PAD.t - 6}
            textAnchor="middle"
            fill="#8b9790"
            fontSize="10"
            fontFamily="Inter, Segoe UI, sans-serif"
          >
            Now
          </text>
        </>
      )}

      <path
        d={linePath(histPts)}
        fill="none"
        stroke="#178a45"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={linePath(predPts)}
        fill="none"
        stroke="#178a45"
        strokeWidth="2.5"
        strokeDasharray="7 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {geometry.points.map((point) => (
        <text
          key={point.label}
          x={point.x}
          y={H - 10}
          textAnchor="middle"
          fill={point.isNow ? "#178a45" : "#a3ada7"}
          fontSize="11"
          fontWeight={point.isNow ? "600" : "400"}
          fontFamily="Inter, Segoe UI, sans-serif"
        >
          {point.label}
          {point.isNow ? " (Now)" : ""}
        </text>
      ))}

      <g transform={`translate(${W - PAD.r - 128}, ${PAD.t})`}>
        <line x1="0" y1="6" x2="20" y2="6" stroke="#178a45" strokeWidth="2.75" />
        <text x="28" y="10" fill="#5f7368" fontSize="11" fontFamily="Inter, Segoe UI, sans-serif">
          Historical
        </text>
        <line x1="0" y1="24" x2="20" y2="24" stroke="#178a45" strokeWidth="2.5" strokeDasharray="6 5" />
        <text x="28" y="28" fill="#5f7368" fontSize="11" fontFamily="Inter, Segoe UI, sans-serif">
          Predicted
        </text>
      </g>
    </svg>
  );
}
