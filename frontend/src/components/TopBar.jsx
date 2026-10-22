import { Bell, Leaf, LogOut, Menu, Search, Settings, SlidersHorizontal, User, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import { userRoleLabel } from "../utils/userDisplay";
import UserAvatar from "./UserAvatar";

export default function TopBar({ onMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const {
    query,
    setQuery,
    telemetryLive,
    setTelemetryLive,
    alerts,
    digest,
    setReportOpen,
    openField,
  } = useDashboard();
  const [menu, setMenu] = useState(null);
  const [menuPath, setMenuPath] = useState(location.pathname);
  const profileRef = useRef(null);
  const profileMenuId = useId();

  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname);
    setMenu(null);
  }

  const displayName = user?.fullName?.trim() || user?.email || "Account";
  const roleLabel = userRoleLabel(user);

  useEffect(() => {
    if (menu !== "profile") return;
    function onKey(event) {
      if (event.key === "Escape") setMenu(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const onDiseasePage = location.pathname === "/disease";
  const statusLive = telemetryLive;
  const statusLabel = onDiseasePage
    ? statusLive
      ? "System Live"
      : "System Paused"
    : statusLive
      ? "Live Telemetry"
      : "Telemetry Paused";

  async function handleSignOut() {
    setMenu(null);
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="relative z-40 flex h-[68px] shrink-0 items-center gap-3 border-b border-[#e6ece8] bg-white px-4 sm:px-6">
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full text-[#3e4f46] hover:bg-[#f4f6f4] lg:hidden"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2 md:flex">
        <Leaf className="h-4 w-4 text-[#178a45]" strokeWidth={2.2} />
        <span className="whitespace-nowrap text-sm font-semibold text-[#24352c]">Plantation Health Intelligence</span>
      </div>

      <div className="mx-1 hidden h-6 w-px bg-[#e6ece8] md:block" />

      <label className="relative min-w-0 flex-1 max-w-[420px]">
        <span className="sr-only">Search fields, tea clones, alerts</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#91a099]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search fields, tea clones, alerts..."
          className="h-10 w-full rounded-full bg-[#f4f6f4] pr-9 pl-10 text-sm text-[#1c2b24] ring-1 ring-transparent outline-none placeholder:text-[#9aa69f] focus:bg-white focus:ring-[#d5e6da]"
        />
        {query && (
          <button
            type="button"
            className="absolute top-1/2 right-2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-[#6d7c74] hover:bg-[#e7eee9]"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </label>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setTelemetryLive((live) => !live)}
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            telemetryLive ? "bg-[#e7f7ec] text-[#1c8a48]" : "bg-[#eef1ef] text-[#7d8b83]"
          }`}
          aria-pressed={telemetryLive}
          title={onDiseasePage ? "Toggle model service status" : "Toggle estate sensor telemetry"}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusLive ? "bg-[#1fa34a] live-dot" : "bg-[#b0b8b3]"}`} />
          <span className="hidden sm:inline">{statusLabel}</span>
        </button>

        <div className="relative">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-[#5c6d64] hover:bg-[#f4f6f4]"
            aria-label="Alerts"
            aria-expanded={menu === "bell"}
            onClick={() => setMenu((current) => (current === "bell" ? null : "bell"))}
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>
          {menu === "bell" && (
            <div className="panel absolute right-0 z-30 mt-2 w-80 p-3">
              <div className="flex items-center justify-between px-1 pb-2">
                <p className="text-sm font-semibold text-[#1c2b24]">Active alerts</p>
                <span className="text-xs text-[#8b9790]">{digest ? "Daily digest on" : "Daily digest off"}</span>
              </div>
              <ul className="space-y-1">
                {alerts.map((alert) => (
                  <li key={alert.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col rounded-xl px-2 py-2 text-left hover:bg-[#f6f8f6]"
                      onClick={() => {
                        if (alert.fieldId) openField(alert.fieldId);
                        setMenu(null);
                      }}
                    >
                      <span className="text-sm font-medium text-[#1c2b24]">{alert.title}</span>
                      <span className="text-xs text-[#7d8b83]">
                        {alert.place} · {alert.time}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link
                to="/alerts"
                onClick={() => setMenu(null)}
                className="mt-2 block rounded-xl px-2 py-2 text-sm font-semibold text-[#178a45] hover:bg-[#f3faf6]"
              >
                View all alerts
              </Link>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-[#5c6d64] hover:bg-[#f4f6f4]"
            aria-label="Board tools"
            aria-expanded={menu === "tools"}
            onClick={() => setMenu((current) => (current === "tools" ? null : "tools"))}
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" />
          </button>
          {menu === "tools" && (
            <div className="panel absolute right-0 z-30 mt-2 w-56 p-2">
              <Link to="/alerts" className="block rounded-xl px-3 py-2 text-sm font-medium text-[#24352c] hover:bg-[#f6f8f6]" onClick={() => setMenu(null)}>
                Active alerts
              </Link>
              <Link to="/settings" className="block rounded-xl px-3 py-2 text-sm font-medium text-[#24352c] hover:bg-[#f6f8f6]" onClick={() => setMenu(null)}>
                Settings
              </Link>
              <button
                type="button"
                className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#24352c] hover:bg-[#f6f8f6]"
                onClick={() => {
                  setMenu(null);
                  setReportOpen(true);
                }}
              >
                Generate report
              </button>
            </div>
          )}
        </div>

        <div className="mx-1 hidden h-8 w-px bg-[#e6ece8] sm:block" />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 text-left transition-colors hover:bg-[#f4f6f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#178a45] focus-visible:ring-offset-2"
            aria-expanded={menu === "profile"}
            aria-haspopup="menu"
            aria-controls={menu === "profile" ? profileMenuId : undefined}
            onClick={() => setMenu((current) => (current === "profile" ? null : "profile"))}
          >
            <UserAvatar name={displayName} />
            <span className="hidden leading-tight sm:block">
              <span className="block max-w-[160px] truncate text-[13px] font-semibold text-[#1c2b24]">{displayName}</span>
              <span className="block max-w-[160px] truncate text-[11px] text-[#8b9790]">{roleLabel}</span>
            </span>
          </button>

          {menu === "profile" && (
            <div
              id={profileMenuId}
              role="menu"
              className="panel absolute right-0 z-30 mt-2 w-72 overflow-hidden p-0"
            >
              <div className="flex items-center gap-3 border-b border-[#eef2ef] px-4 py-3">
                <UserAvatar name={displayName} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1c2b24]">{displayName}</p>
                  <p className="truncate text-xs text-[#7d8b83]">{user?.email}</p>
                </div>
              </div>
              <div className="p-1.5">
                <Link
                  role="menuitem"
                  to="/profile"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[#24352c] hover:bg-[#f6f8f6] focus-visible:bg-[#f6f8f6] focus-visible:outline-none"
                  onClick={() => setMenu(null)}
                >
                  <User className="h-4 w-4 text-[#5c6d64]" aria-hidden="true" />
                  My Profile
                </Link>
                <Link
                  role="menuitem"
                  to="/settings"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[#24352c] hover:bg-[#f6f8f6] focus-visible:bg-[#f6f8f6] focus-visible:outline-none"
                  onClick={() => setMenu(null)}
                >
                  <Settings className="h-4 w-4 text-[#5c6d64]" aria-hidden="true" />
                  Account Settings
                </Link>
                <button
                  role="menuitem"
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#b42318] hover:bg-[#fef3f2] focus-visible:bg-[#fef3f2] focus-visible:outline-none"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {menu && (
        <button
          type="button"
          className="fixed inset-0 z-20 cursor-default"
          aria-label="Close menu"
          onClick={() => setMenu(null)}
        />
      )}
    </header>
  );
}
