import { Bell, Menu, Search, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const indexNav = [
  { to: "/intel/predictions", label: "Tea Quality" },
  { to: "/intel/sustainability-assessment", label: "Sustainability" },
  { to: "/intel/index", label: "STII", end: true },
];

function ProfileActions() {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-[#5f6f66] hover:bg-[#f4f6f4]" aria-label="Notifications">
        <Bell className="h-[18px] w-[18px]" />
      </button>
      <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-[#5f6f66] hover:bg-[#f4f6f4]" aria-label="Settings">
        <Settings className="h-[18px] w-[18px]" />
      </button>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#d9f5e3] text-xs font-bold text-[#153d2e]">YK</span>
    </div>
  );
}

export default function IntelTopBar({ mode, onMenu, searchPlaceholder = "Search analytics..." }) {
  if (mode === "none") return null;

  if (mode === "nav") {
    return (
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[#e8ece9] bg-white px-4 lg:px-6">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full text-[#3e4f46] hover:bg-[#f4f6f4] lg:hidden"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <NavLink to="/intel" className="shrink-0 font-serif text-lg font-bold text-[#153d2e] lg:text-xl">
          SmartTea-LK
        </NavLink>
        <nav className="mx-auto hidden items-center gap-6 lg:flex">
          {indexNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? "border-b-2 border-[#153d2e] pb-0.5 text-[#153d2e]" : "text-[#7e8c84] hover:text-[#153d2e]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <ProfileActions />
      </header>
    );
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[#e8ece9] bg-white px-4 lg:px-6">
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full text-[#3e4f46] hover:bg-[#f4f6f4] lg:hidden"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      <NavLink to="/intel" className="shrink-0 font-serif text-lg font-bold text-[#153d2e] lg:hidden">
        SmartTea-LK
      </NavLink>
      <div className="relative mx-auto hidden w-full max-w-md lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a3ada7]" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          className="w-full rounded-full border border-[#e8ece9] bg-[#f9fafb] py-2 pl-10 pr-4 text-sm text-[#1c2b24] outline-none placeholder:text-[#a3ada7] focus:border-[#153d2e]/30 focus:ring-2 focus:ring-[#153d2e]/10"
        />
      </div>
      <ProfileActions />
    </header>
  );
}
