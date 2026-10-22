export default function IntelPageHeader({ title, description, statusLabel, statusLive = false }) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <h1 className="font-serif text-[28px] font-bold tracking-tight text-[#153d2e] sm:text-[30px]">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-[#7e8c84]">{description}</p>}
      </div>
      {statusLabel && (
        <span className="inline-flex items-center gap-2 rounded-full border border-[#e8ece9] bg-white px-3 py-1.5 text-xs font-medium text-[#5f6f66]">
          <span className={`h-2 w-2 rounded-full ${statusLive ? "bg-[#178a45]" : "bg-[#a3ada7]"}`} aria-hidden="true" />
          {statusLabel}
        </span>
      )}
    </header>
  );
}

export function IntelCompactPlaceholder({ children, tone = "neutral" }) {
  const styles =
    tone === "error"
      ? "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
      : "border-[#e8ece9] bg-[#fafbfa] text-[#8b9790]";
  return (
    <section className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </section>
  );
}
