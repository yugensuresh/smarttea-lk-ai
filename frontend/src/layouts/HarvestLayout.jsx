import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import HarvestSidebar from "../components/harvest/HarvestSidebar";

const titles = {
  "/harvest/forecasting": "Yield Forecasting",
  "/harvest/readiness": "Harvest Readiness",
  "/harvest/risk": "Climate Risk Assessment",
  "/harvest/thrri": "THRRI Results",
  "/harvest/planning": "Field Planning",
  "/harvest/support": "Support",
};

export default function HarvestLayout() {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "") || "/harvest/forecasting";
    document.title = `${titles[path] ?? "Harvest"} · SmartTea-LK`;
    document.getElementById("harvest-main")?.scrollTo({ top: 0 });
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7f6] text-[#1c2b24]">
      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#10241c]/25 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <HarvestSidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-[#e8ece9] bg-white px-4 lg:hidden">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-[#3e4f46] hover:bg-[#f4f6f4]"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-2 text-sm font-semibold text-[#24352c]">Harvest Intelligence</span>
        </header>
        <main id="harvest-main" className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
