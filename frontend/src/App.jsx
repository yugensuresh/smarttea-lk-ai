import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import FieldDrawer from "./components/FieldDrawer";
import ReportModal from "./components/ReportModal";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";
import DiseaseDetection from "./pages/DiseaseDetection";
import EstateOverview from "./pages/EstateOverview";
import PdviScoring from "./pages/PdviScoring";
import RiskPrediction from "./pages/RiskPrediction";
import SeverityEstimation from "./pages/SeverityEstimation";
import HarvestForecasting from "./pages/harvest/HarvestForecasting";
import HarvestReadiness from "./pages/harvest/HarvestReadiness";
import HarvestRiskAssessment from "./pages/harvest/HarvestRiskAssessment";
import {
  HarvestFieldPlanning,
  HarvestSupport,
  HarvestThrriResults,
} from "./pages/harvest/HarvestStubPages";
import IntelligenceIndex from "./pages/intel/IntelligenceIndex";
import { IntelRecommendations, IntelSupport } from "./pages/intel/IntelStubPages";
import QualityPrediction from "./pages/intel/QualityPrediction";
import SustainabilityAssessment from "./pages/intel/SustainabilityAssessment";
import AuthPage from "./pages/auth/AuthPage";
import GuestOnly from "./components/GuestOnly";
import RequireAuth from "./components/RequireAuth";
import { AuthProvider } from "./context/AuthContext";
import ProfilePage from "./pages/ProfilePage";
import {
  ActiveAlerts,
  ReportsPage,
  SettingsPage,
  SupportPage,
} from "./pages/WorkspacePages";

const titles = {
  "/": "Plantation Command Centre",
  "/disease": "Disease Detection",
  "/severity": "Severity Estimation",
  "/risk": "Risk Prediction",
  "/pdvi": "PDVI Scoring",
  "/alerts": "Active Alerts",
  "/reports": "Reports",
  "/settings": "Settings",
  "/profile": "My Profile",
  "/support": "Support",
  "/harvest/forecasting": "Yield Forecasting",
  "/harvest/readiness": "Harvest Readiness",
  "/harvest/risk": "Climate Risk Assessment",
  "/harvest/thrri": "THRRI Results",
  "/harvest/planning": "Field Planning",
  "/harvest/support": "Harvest Support",
  "/intel/predictions": "Tea Quality Prediction",
  "/intel/sustainability-assessment": "Sustainability Assessment",
  "/intel/index": "STII",
  "/intel/recommendations": "Recommendations",
  "/intel/support": "Plantation Intel Support",
};

function pageTitle(pathname) {
  const path = pathname.replace(/\/$/, "") || "/";
  return titles[path] ?? "SmartTea-LK";
}

function Shell() {
  const location = useLocation();
  const { closeField, setReportOpen } = useDashboard();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    document.title = `${pageTitle(location.pathname)} · SmartTea-LK`;
    document.getElementById("app-main")?.scrollTo({ top: 0 });
    closeField();
    setReportOpen(false);
    setNavOpen(false);
  }, [location.pathname, closeField, setReportOpen]);

  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape") return;
      closeField();
      setReportOpen(false);
      setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeField, setReportOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f3] text-[#1c2b24]">
      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#10241c]/30 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setNavOpen(true)} />
        <main id="app-main" className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6 lg:px-7">
          <Routes>
            <Route path="/" element={<EstateOverview />} />
            <Route path="/disease" element={<DiseaseDetection />} />
            <Route path="/severity" element={<SeverityEstimation />} />
            <Route path="/disease-detection" element={<Navigate to="/disease" replace />} />
            <Route path="/risk" element={<RiskPrediction />} />
            <Route path="/pdvi" element={<PdviScoring />} />
            <Route path="/map" element={<Navigate to="/" replace />} />
            <Route path="/harvest/forecasting" element={<HarvestForecasting />} />
            <Route path="/harvest/readiness" element={<HarvestReadiness />} />
            <Route path="/harvest/risk" element={<HarvestRiskAssessment />} />
            <Route path="/harvest/thrri" element={<HarvestThrriResults />} />
            <Route path="/harvest/planning" element={<HarvestFieldPlanning />} />
            <Route path="/harvest/support" element={<HarvestSupport />} />
            <Route path="/harvest" element={<Navigate to="/harvest/forecasting" replace />} />
            <Route path="/intel/predictions" element={<QualityPrediction />} />
            <Route path="/intel/sustainability-assessment" element={<SustainabilityAssessment />} />
            <Route path="/intel/index" element={<IntelligenceIndex />} />
            <Route path="/intel/sustainability" element={<Navigate to="/intel/predictions" replace />} />
            <Route path="/intel/performance" element={<Navigate to="/intel/index" replace />} />
            <Route path="/intel/recommendations" element={<IntelRecommendations />} />
            <Route path="/intel/support" element={<IntelSupport />} />
            <Route path="/intel" element={<Navigate to="/intel/predictions" replace />} />
            <Route path="/alerts" element={<ActiveAlerts />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <FieldDrawer />
      <ReportModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <AuthPage initialMode="login" />
            </GuestOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestOnly>
              <AuthPage initialMode="signup" />
            </GuestOnly>
          }
        />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <DashboardProvider>
                <Shell />
              </DashboardProvider>
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
