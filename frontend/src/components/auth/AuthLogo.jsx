export function AuthLogoMark({ className = "h-10 w-10" }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-[12px] bg-[#178a45] text-white ${className}`}>
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 19c8.2 0 12.4-6.4 14.4-14.6C12.6 5.6 8.8 8.8 6.4 13.2" strokeLinecap="round" />
        <path d="M8.2 14.2c2-2.2 4.2-3.4 7.2-4.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function AuthLogo({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <AuthLogoMark />
      <div className={compact ? "leading-tight" : ""}>
        <p className="text-lg font-bold tracking-tight text-[#1b2a22] sm:text-xl">SmartTea-LK</p>
        {!compact && (
          <p className="mt-0.5 text-xs text-[#7e8c84] sm:text-sm">Intelligent Insights for Sustainable Tea Plantations</p>
        )}
      </div>
    </div>
  );
}
