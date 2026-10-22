export default function ClassProbabilityBreakdown({ items, activeId }) {
  return (
    <ul className="space-y-2" aria-label="Class probability breakdown">
      {items.map((row) => {
        const active = row.id === activeId;
        return (
          <li key={row.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className={`font-medium ${active ? "text-[#173528]" : "text-[#5f7368]"}`}>{row.label}</span>
              <span className={`tabular-nums ${active ? "font-semibold text-[#178a45]" : "text-[#8b9790]"}`}>
                {row.pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#e8eeea]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${active ? "bg-[#178a45]" : "bg-[#b8c9be]"}`}
                style={{ width: `${Math.min(row.pct, 100)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
