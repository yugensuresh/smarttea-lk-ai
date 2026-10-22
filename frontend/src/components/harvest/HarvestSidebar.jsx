import {
  FileText,
  Gauge,
  Headphones,
  LineChart,
  LogOut,
  Map,
  Shield,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const nav = [
  { to: "/harvest/readiness", label: "Harvest Readiness", icon: Gauge },
  { to: "/harvest/forecasting", label: "Yield Forecasting", icon: LineChart },
  { to: "/harvest/risk", label: "Climate Risk Assessment", icon: Shield },
  { to: "/harvest/thrri", label: "THRRI Results", icon: FileText },
  { to: "/harvest/planning", label: "Field Planning", icon: Map },
];

function NavItem({ item, onNavigate }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-[#178a45] text-white shadow-sm"
            : "text-[#5f6f66] hover:bg-[#f4f6f4]"
        }`
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function HarvestSidebar({ open, onNavigate }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[230px] flex-col border-r border-[#e8ece9] bg-white px-4 py-5 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <NavLink to="/harvest/forecasting" onClick={onNavigate} className="px-2">
        <span className="block font-serif text-[22px] font-bold tracking-tight text-[#1b2a22]">SmartTea-LK</span>
        <span className="mt-0.5 block text-[11px] font-medium text-[#8b9790]">Precision Analytics</span>
      </NavLink>

      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto pr-1">
        {nav.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-4 space-y-1 border-t border-[#eef2ef] pt-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#178a45] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#14703a]"
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </button>
        <NavLink
          to="/harvest/support"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#5f6f66] hover:bg-[#f4f6f4]"
        >
          <Headphones className="h-[18px] w-[18px]" />
          Support
        </NavLink>
        <NavLink
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[#5f6f66] hover:bg-[#f4f6f4]"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </NavLink>
      </div>
    </aside>
  );
}
