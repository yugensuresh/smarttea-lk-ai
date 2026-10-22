export default function MiniSparkline({ values, tone = "up" }) {
  if (!values?.length) return null;
  const w = 72;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - 4 - ((v - min) / span) * (h - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const stroke = tone === "down" ? "#e57373" : "#178a45";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-[72px]" aria-hidden="true">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
    </svg>
  );
}
