import {
  CircleQuestionMark,
  FileText,
  Leaf,
  Lightbulb,
  LogOut,
  MapPin,
  Radio,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const nav = [
  { to: "/intel/predictions", label: "Tea Quality Prediction", icon: Radio },
  { to: "/intel/sustainability-assessment", label: "Sustainability Assessment", icon: Leaf },
  { to: "/intel/index", label: "STII", icon: MapPin },
  { to: "/intel/recommendations", label: "Recommendations", icon: Lightbulb },
];

function isItemActive(item, pathname) {
  if (item.matchPrefix) {
    return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}-`);
  }
  return item.end ? pathname === item.to : pathname.startsWith(item.to);
}

function NavItem({ item, onNavigate, pathname }) {
  const Icon = item.icon;
  const active = item.matchPrefix ? isItemActive(item, pathname) : undefined;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => {
        const on = item.matchPrefix ? active : isActive;
        return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          on ? "bg-[#d9f5e3] text-[#153d2e]" : "text-[#3e4f46] hover:bg-[#f4f6f4]"
        }`;
      }}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function PlantationIntelSidebar({ open, onNavigate }) {
  const { pathname } = useLocation();
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-[#e8ece9] bg-white px-4 py-5 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <NavLink to="/intel/predictions" onClick={onNavigate} className="px-2">
        <span className="block font-serif text-[22px] font-bold tracking-tight text-[#153d2e]">Plantation Intel</span>
        <span className="mt-0.5 block text-[11px] font-medium text-[#8b9790]">V3.2 Premium Edition</span>
      </NavLink>

      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto pr-1">
        {nav.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} pathname={pathname} />
        ))}
      </nav>

      <div className="mt-4 space-y-1 border-t border-[#eef2ef] pt-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#153d2e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#10241c]"
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </button>
        <NavLink
          to="/intel/support"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#5f6f66] hover:bg-[#f4f6f4]"
        >
          <CircleQuestionMark className="h-[18px] w-[18px]" />
          Support
        </NavLink>
        <NavLink
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#5f6f66] hover:bg-[#f4f6f4]"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign Out
        </NavLink>
      </div>
    </aside>
  );
}
