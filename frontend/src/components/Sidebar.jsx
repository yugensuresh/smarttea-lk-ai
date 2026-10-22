import {
  Bell,
  ChartColumn,
  ChevronDown,
  CircleQuestionMark,
  FileText,
  Gauge,
  LayoutDashboard,
  Leaf,
  LineChart,
  MapPin,
  Microscope,
  Radio,
  Settings,
  Shield,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useDashboard } from "../context/DashboardContext";
import { plantationHealthNav, SEVERITY_LEGACY_PATH } from "../config/member01Nav";

const dashboardItem = {
  to: "/",
  label: "Dashboard",
  icon: LayoutDashboard,
  end: true,
};

const harvestIntelligence = [
  { to: "/harvest/readiness", label: "Harvest Readiness", icon: Gauge },
  { to: "/harvest/forecasting", label: "Yield Forecasting", icon: LineChart },
  { to: "/harvest/risk", label: "Climate Risk Assessment", icon: Shield },
  { to: "/harvest/thrri", label: "THRRI Results", icon: FileText },
];

const sustainabilityQuality = [
  { to: "/intel/predictions", label: "Tea Quality Prediction", icon: Radio },
  { to: "/intel/sustainability-assessment", label: "Sustainability Assessment", icon: Leaf },
  { to: "/intel/index", label: "STII", icon: MapPin },
];

const plantationIntelligence = [
  { to: plantationHealthNav[0].to, label: plantationHealthNav[0].label, icon: Microscope },
  { to: plantationHealthNav[1].to, label: plantationHealthNav[1].label, icon: TriangleAlert },
  { to: plantationHealthNav[2].to, label: plantationHealthNav[2].label, icon: ChartColumn },
];

const HARVEST_INTELLIGENCE_PATHS = new Set(harvestIntelligence.map((item) => item.to));
const SUSTAINABILITY_QUALITY_PATHS = new Set([
  ...sustainabilityQuality.map((item) => item.to),
  "/intel/sustainability",
  "/intel/performance",
]);
const INTELLIGENCE_PATHS = new Set([...plantationIntelligence.map((item) => item.to), SEVERITY_LEGACY_PATH]);

const operations = [
  { to: "/alerts", label: "Active Alerts", icon: Bell, badge: true },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/support", label: "Support", icon: CircleQuestionMark },
];

function LogoMark() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#178a45] text-white">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 19c8.2 0 12.4-6.4 14.4-14.6C12.6 5.6 8.8 8.8 6.4 13.2" strokeLinecap="round" />
        <path d="M8.2 14.2c2-2.2 4.2-3.4 7.2-4.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function NavItem({ item, onNavigate, badge, nested = false }) {
  const location = useLocation();
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => {
        const active = isActive || item.alsoActive?.includes(location.pathname);
        return `flex items-center gap-2.5 rounded-xl py-2 text-sm font-medium leading-snug transition-colors ${
          nested ? "pl-9 pr-3" : "px-3"
        } ${active ? "bg-[#d9f5e3] text-[#173528]" : "text-[#3e4f46] hover:bg-white/80"}`;
      }}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        <span className="min-w-0 flex-1 whitespace-normal leading-snug">{item.label}</span>
      {item.badge && (
        <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#f8d4d8] px-1 text-[11px] font-semibold text-[#e11d48]">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function MemberSectionToggle({ title, open, onToggle, routeActive, children }) {
  return (
    <div className="space-y-0.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium leading-snug transition-colors ${
          routeActive ? "text-[#173528]" : "text-[#3e4f46] hover:bg-white/80"
        }`}
      >
        <span className="min-w-0 flex-1 whitespace-normal pr-1 leading-snug">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#8b9790] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && children}
    </div>
  );
}

function useCollapsibleSection(pathSet, pathname) {
  const routeActive = pathSet.size > 0 && pathSet.has(pathname);
  const [open, setOpen] = useState(routeActive);
  const [trackedPath, setTrackedPath] = useState(pathname);

  if (trackedPath !== pathname) {
    setTrackedPath(pathname);
    if (pathSet.has(pathname)) {
      setOpen(true);
    }
  }

  return { open, setOpen, routeActive };
}

function HarvestIntelligenceNav({ onNavigate }) {
  const location = useLocation();
  const { open, setOpen, routeActive } = useCollapsibleSection(HARVEST_INTELLIGENCE_PATHS, location.pathname);

  return (
    <MemberSectionToggle
      title="Climate & Harvest"
      open={open}
      routeActive={routeActive}
      onToggle={() => setOpen((value) => !value)}
    >
      <div className="space-y-0.5">
        {harvestIntelligence.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} nested />
        ))}
      </div>
    </MemberSectionToggle>
  );
}

function SustainabilityQualityNav({ onNavigate }) {
  const location = useLocation();
  const { open, setOpen, routeActive } = useCollapsibleSection(
    SUSTAINABILITY_QUALITY_PATHS,
    location.pathname,
  );

  return (
    <MemberSectionToggle
      title="Quality & Sustainability"
      open={open}
      routeActive={routeActive}
      onToggle={() => setOpen((value) => !value)}
    >
      <div className="space-y-0.5">
        {sustainabilityQuality.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} nested />
        ))}
      </div>
    </MemberSectionToggle>
  );
}

function PlantationIntelligenceNav({ onNavigate }) {
  const location = useLocation();
  const { open, setOpen, routeActive } = useCollapsibleSection(INTELLIGENCE_PATHS, location.pathname);

  return (
    <MemberSectionToggle
      title="Disease & Plantation Health"
      open={open}
      routeActive={routeActive}
      onToggle={() => setOpen((value) => !value)}
    >
      <div className="space-y-0.5">
        {plantationIntelligence.map((item) => (
          <NavItem key={item.to} item={item} onNavigate={onNavigate} nested />
        ))}
      </div>
    </MemberSectionToggle>
  );
}

const RESOURCE_OPTIMIZATION_PATHS = new Set();

function ResourceOptimizationNav() {
  const location = useLocation();
  const { open, setOpen, routeActive } = useCollapsibleSection(RESOURCE_OPTIMIZATION_PATHS, location.pathname);

  return (
    <MemberSectionToggle
      title="Resource Optimization"
      open={open}
      routeActive={routeActive}
      onToggle={() => setOpen((value) => !value)}
    />
  );
}

export default function Sidebar({ open, onNavigate }) {
  const { alerts, setReportOpen } = useDashboard();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(100vw,340px)] flex-col border-r border-[#e6ece8] bg-[#f3f6f2] px-3.5 py-4 transition-transform duration-200 lg:static lg:z-auto lg:w-[340px] lg:max-w-[360px] lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <NavLink to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2">
        <LogoMark />
        <span className="leading-tight">
          <span className="block text-[15px] font-bold tracking-tight text-[#1b2a22]">SmartTea-LK</span>
          <span className="block text-[11px] text-[#8b9790]">AI Plantation Intel</span>
        </span>
      </NavLink>

      <nav className="mt-6 flex-1 overflow-y-auto pr-1">
        <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.16em] text-[#a0aaa4]">MONITORING</p>
        <div className="space-y-0.5">
          <NavItem item={dashboardItem} onNavigate={onNavigate} />
          <PlantationIntelligenceNav onNavigate={onNavigate} />
          <HarvestIntelligenceNav onNavigate={onNavigate} />
          <SustainabilityQualityNav onNavigate={onNavigate} />
          <ResourceOptimizationNav />
        </div>

        <p className="mt-6 mb-1.5 px-3 text-[10px] font-semibold tracking-[0.16em] text-[#a0aaa4]">OPERATIONS</p>
        <div className="space-y-0.5">
          {operations.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} badge={alerts.length} />
          ))}
        </div>
      </nav>

      <button
        type="button"
        onClick={() => {
          setReportOpen(true);
          onNavigate();
        }}
        className="mt-4 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#10241c] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#173628]"
      >
        <FileText className="h-4 w-4" />
        Generate Report
      </button>
    </aside>
  );
}
