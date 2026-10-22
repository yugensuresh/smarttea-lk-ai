import { useMemo } from "react";
import { PERFORMANCE_SERIES } from "../../data/qualitySustainability";

const W = 640;
const H = 220;
const PAD = { l: 8, r: 8, t: 16, b: 28 };

export default function QualityPerformanceChart() {
  const geometry = useMemo(() => {
    const series = PERFORMANCE_SERIES;
    const maxY = 100;
    const span = series.length - 1;
    const yFor = (v) => PAD.t + (1 - v / maxY) * (H - PAD.t - PAD.b);
    const xFor = (i) => PAD.l + (i / span) * (W - PAD.l - PAD.r);
    const pts = series.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
    const area = `${linePath(pts)} L ${pts[pts.length - 1].x} ${H - PAD.b} L ${pts[0].x} ${H - PAD.b} Z`;
    return { pts, area };
  }, []);

  const labels = ["01", "07", "14", "21", "30"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full" role="img" aria-label="Performance overview">
      <defs>
        <linearGradient id="qsArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c5cec8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#c5cec8" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={geometry.area} fill="url(#qsArea)" />
      <path
        d={linePath(geometry.pts)}
        fill="none"
        stroke="#94a39a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {labels.map((label, i) => (
        <text
          key={label}
          x={PAD.l + (i / (labels.length - 1)) * (W - PAD.l - PAD.r)}
          y={H - 6}
          textAnchor="middle"
          fill="#a3ada7"
          fontSize="11"
          fontFamily="Inter, Segoe UI, sans-serif"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function linePath(points) {
  if (!points.length) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
  }
  return d;
}
