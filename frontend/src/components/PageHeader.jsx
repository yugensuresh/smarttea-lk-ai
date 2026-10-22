export default function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 flex items-center gap-2 text-[13px] text-[#3e5348]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22a35a]" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] font-bold tracking-[-0.03em] text-[#1b2a22]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-[#7e8c84]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
