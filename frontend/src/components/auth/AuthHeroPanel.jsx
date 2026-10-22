import { Leaf, Shield, Sparkles } from "lucide-react";

export default function AuthHeroPanel() {
  return (
    <div className="relative hidden min-h-full flex-1 overflow-hidden bg-[#10241c] lg:flex lg:flex-col">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "linear-gradient(145deg, #0d1f18 0%, #153d2e 42%, #178a45 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-between p-10 xl:p-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#d9f5e3] ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" />
            AI Plantation Intelligence
          </p>
          <h2 className="mt-6 max-w-md font-serif text-3xl font-bold leading-tight text-white xl:text-4xl">
            Grow smarter with data-driven tea estate management.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
            Monitor crop health, forecast harvest windows, and optimize sustainability from one unified platform.
          </p>
        </div>

        <div className="relative mt-10 flex-1">
          <svg
            viewBox="0 0 520 320"
            className="mx-auto h-full max-h-[280px] w-full max-w-lg drop-shadow-2xl"
            role="img"
            aria-label="Stylized tea plantation hills illustration"
          >
            <defs>
              <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7bc89a" />
                <stop offset="100%" stopColor="#178a45" />
              </linearGradient>
              <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5aad78" />
                <stop offset="100%" stopColor="#0f5c38" />
              </linearGradient>
              <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1a3d32" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10241c" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect width="520" height="320" fill="url(#sky)" />
            <ellipse cx="260" cy="340" rx="320" ry="120" fill="url(#hill2)" opacity="0.95" />
            <ellipse cx="200" cy="360" rx="280" ry="110" fill="url(#hill1)" opacity="0.85" />
            {[...Array(8)].map((_, row) =>
              [...Array(12)].map((__, col) => {
                const x = 40 + col * 38 + (row % 2) * 18;
                const y = 120 + row * 22;
                return (
                  <circle key={`${row}-${col}`} cx={x} cy={y} r="5" fill="#d9f5e3" opacity="0.35" />
                );
              }),
            )}
            <path
              d="M80 200 Q260 80 440 200"
              fill="none"
              stroke="#d9f5e3"
              strokeWidth="1.5"
              strokeDasharray="6 8"
              opacity="0.4"
            />
          </svg>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Leaf, label: "Crop health analytics" },
            { icon: Shield, label: "Climate risk insights" },
            { icon: Sparkles, label: "Quality forecasting" },
          ].map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-xl bg-white/8 px-3 py-2.5 text-xs font-medium text-white/85 ring-1 ring-white/10"
            >
              <Icon className="h-4 w-4 shrink-0 text-[#a7f3d0]" strokeWidth={1.75} />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
