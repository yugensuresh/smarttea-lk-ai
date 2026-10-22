import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { ESTATES, useDashboard } from "../context/DashboardContext";
import { userRoleLabel } from "../utils/userDisplay";
import UserAvatar from "../components/UserAvatar";
import { reportHistory, scoreClass, statusClass } from "../data/dashboard";
function EmptyNote({ children }) {
  return <div className="panel px-5 py-10 text-center text-sm text-[#7d8b83]">{children}</div>;
}

export function ActiveAlerts() {
  const { matchedAlerts, openField, query, alerts, estateStats } = useDashboard();
  const unresolved = alerts.filter((alert) => alert.level === "Unresolved").length;

  return (
    <div>
      <PageHeader
        title="Active Alerts"
        subtitle={`${alerts.length} open signals, ${unresolved} unresolved. ${estateStats?.primaryDisease ?? "Disease"} remains the primary concern.`}
      />
      {matchedAlerts.length === 0 ? (
        <EmptyNote>No alerts match the current search or estate filter.</EmptyNote>
      ) : (
        <div className="panel divide-y divide-[#f0f4f1]">
          {query.trim() && (
            <p className="px-5 py-3 text-sm text-[#1f7a45]">Showing {matchedAlerts.length} matching alerts</p>
          )}
          {matchedAlerts.map((alert) => (
            <div key={alert.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-[#1c2b24]">{alert.title}</p>
                <p className="mt-0.5 text-sm text-[#6d7c74]">
                  {alert.place} · {alert.time}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(alert.level)}`}>
                  {alert.level}
                </span>
                {alert.fieldId && (
                  <button
                    type="button"
                    onClick={() => openField(alert.fieldId)}
                    className="text-sm font-semibold text-[#178a45]"
                  >
                    Inspect field
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportsPage() {
  const { setReportOpen } = useDashboard();

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Estate briefs for supervisors. Generate a fresh report from the current field filter."
        action={
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="rounded-xl bg-[#10241c] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Generate Report
          </button>
        }
      />
      <div className="panel divide-y divide-[#f0f4f1]">
        {reportHistory.map((report) => (
          <div key={report.id} className="flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-[#1c2b24]">{report.name}</p>
              <p className="mt-0.5 text-sm text-[#6d7c74]">{report.range}</p>
            </div>
            <p className="text-sm text-[#8b9790]">{report.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const { telemetryLive, setTelemetryLive, digest, setDigest } = useDashboard();
  const displayName = user?.fullName?.trim() || user?.email || "Account";

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Account details and dashboard preferences."
      />
      <form
        className="panel max-w-xl space-y-5 p-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="rounded-xl border border-[#e3ebe6] bg-[#fafbfa] p-4">
          <p className="text-sm font-semibold text-[#1c2b24]">Signed in as</p>
          <div className="mt-3 flex items-center gap-3">
            <UserAvatar name={displayName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#24352c]">{displayName}</p>
              <p className="truncate text-sm text-[#7d8b83]">{user?.email}</p>
              <p className="text-xs text-[#8b9790]">{userRoleLabel(user)}</p>
            </div>
          </div>
          <Link to="/profile" className="mt-3 inline-block text-sm font-semibold text-[#178a45] hover:underline">
            View full profile
          </Link>
        </div>

        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-[#1c2b24]">Live telemetry</span>
            <span className="block text-sm text-[#7d8b83]">Estate sensor feed on the overview and top bar.</span>
          </span>
          <input
            type="checkbox"
            checked={telemetryLive}
            onChange={(event) => setTelemetryLive(event.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-[#1c2b24]">Daily alert digest</span>
            <span className="block text-sm text-[#7d8b83]">Shown in the notification menu.</span>
          </span>
          <input
            type="checkbox"
            checked={digest}
            onChange={(event) => setDigest(event.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </form>
    </div>
  );
}

const faqs = [
  {
    q: "What is PDVI?",
    a: "The Plantation Disease Vulnerability Index blends spore pressure, canopy humidity, leaf wetness, and night temperature into a 0–100 field score.",
  },
  {
    q: "Which model flags blister blight?",
    a: "Environmental disease risk uses historical sensor patterns and your field inputs. It drives the disease-risk card.",
  },
  {
    q: "How fresh is the telemetry?",
    a: "Estate sensors publish on a live feed. Pause it from the top bar or from Settings when you are reviewing a saved window.",
  },
];

export function SupportPage() {
  const [openIndex, setOpenIndex] = useState(0);
  const contacts = [
    { title: "Estate desk", detail: "Nuwara Eliya control room", meta: "desk@smarttea.lk" },
    { title: "Model support", detail: "PDVI and disease models", meta: "models@smarttea.lk" },
    { title: "Field supervisors", detail: "Dimbula and Kandy Ridge", meta: "+94 11 555 0148" },
  ];

  return (
    <div>
      <PageHeader title="Support" subtitle="Desk contacts and a short guide to the scores on this board." />
      <div className="grid gap-4 lg:grid-cols-3">
        {contacts.map((contact) => (
          <article key={contact.title} className="panel p-5">
            <h2 className="text-sm font-semibold text-[#1c2b24]">{contact.title}</h2>
            <p className="mt-1 text-sm text-[#6d7c74]">{contact.detail}</p>
            <p className="mt-3 text-sm font-medium text-[#178a45]">{contact.meta}</p>
          </article>
        ))}
      </div>
      <div className="panel mt-4 divide-y divide-[#f0f4f1]">
        {faqs.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.q}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#1c2b24]"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                {item.q}
                <span className="text-[#8b9790]">{open ? "–" : "+"}</span>
              </button>
              {open && <p className="px-5 pb-4 text-sm leading-6 text-[#4d6258]">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
