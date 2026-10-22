export default function IntelScoreRing({
  score,
  max = 100,
  size = 160,
  stroke = 12,
  label,
  sublabel,
  trend,
  trackColor = "#e8eeea",
  progressColor = "#153d2e",
  centerClass = "",
}) {
  const radius = size / 2 - stroke / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / max) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
          />
        </svg>
        <div className={`absolute inset-0 flex flex-col items-center justify-center text-center ${centerClass}`}>
          {label ?? (
            <>
              <span className="text-3xl font-bold tabular-nums text-[#153d2e]">{score}</span>
              {max !== 100 && (
                <span className="text-xs text-[#8b9790]">
                  / {max}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      {sublabel && <p className="mt-2 text-sm font-semibold text-[#178a45]">{sublabel}</p>}
      {trend && <p className="mt-1 text-xs font-medium text-[#178a45]">{trend}</p>}
    </div>
  );
}
