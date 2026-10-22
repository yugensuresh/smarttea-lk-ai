import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import IntelTopBar from "../components/intel/IntelTopBar";
import PlantationIntelSidebar from "../components/intel/PlantationIntelSidebar";

const titles = {
  "/intel": "Tea Quality Prediction",
  "/intel/predictions": "Tea Quality Prediction",
  "/intel/sustainability-assessment": "Sustainability Assessment",
  "/intel/index": "STII",
  "/intel/recommendations": "Recommendations",
  "/intel/support": "Support",
};

function topBarMode(pathname) {
  if (pathname === "/intel/predictions") return "none";
  if (pathname === "/intel/index") return "nav";
  return "search";
}

export default function PlantationIntelLayout() {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const path = location.pathname.replace(/\/$/, "") || "/intel";
  const mode = topBarMode(path);

  useEffect(() => {
    document.title = `${titles[path] ?? "Plantation Intel"} · SmartTea-LK`;
    document.getElementById("intel-main")?.scrollTo({ top: 0 });
    setNavOpen(false);
  }, [location.pathname, path]);

  const searchPlaceholder = "Search analytics...";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb] text-[#1c2b24]">
      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#10241c]/25 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <PlantationIntelSidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <IntelTopBar mode={mode} onMenu={() => setNavOpen(true)} searchPlaceholder={searchPlaceholder} />
        {mode === "none" && (
          <header className="flex h-14 shrink-0 items-center border-b border-[#e8ece9] bg-white px-4 lg:hidden">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full text-[#3e4f46] hover:bg-[#f4f6f4]"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="ml-2 text-sm font-semibold text-[#153d2e]">Plantation Intel</span>
          </header>
        )}
        <main id="intel-main" className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
