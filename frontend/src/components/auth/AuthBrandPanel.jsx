import { AuthLogoMark } from "./AuthLogo";

export default function AuthBrandPanel({ className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src="/auth-tea-plantation.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8, 28, 22, 0.55) 0%, rgba(8, 28, 22, 0.72) 45%, rgba(6, 20, 16, 0.88) 100%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col p-6 sm:p-8 lg:p-9">
        <div className="flex select-none items-center gap-2.5">
          <AuthLogoMark className="h-9 w-9 rounded-[10px] ring-1 ring-white/20" />
          <span className="text-sm font-bold tracking-[0.18em] text-white">SMARTTEA-LK</span>
        </div>

        <div className="mt-10 flex max-w-md flex-1 flex-col justify-end sm:mt-12 lg:mt-14">
          <h2 className="font-sans text-[26px] font-bold leading-[1.15] tracking-tight text-white sm:text-[28px] lg:text-[32px]">
            INTELLIGENCE FOR A
            <br />
            HEALTHIER TEA
            <br />
            PLANTATION.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/82 sm:text-[15px]">
            Transform tea plantation management with AI-powered disease detection, climate-aware forecasting, and
            sustainable farming insights.
          </p>
          <p className="mt-4 text-sm font-semibold text-[#a7f3d0]">Smarter decisions. Sustainable growth.</p>
        </div>
      </div>
    </div>
  );
}
