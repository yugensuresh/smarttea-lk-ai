import { Download, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";

function downloadReport({ rows, preparedFor, estateStats }) {
  const generated = new Date().toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const fieldLines = rows.length
    ? rows.map(
        (field) =>
          `- ${field.name} | ${field.sector} | ${field.score}/100 | ${field.concern} | ${field.status}`,
      )
    : ["- No priority fields in the current filter."];

  const lines = [
    "SmartTea-LK Estate Health Report",
    `Prepared for: ${preparedFor}`,
    `Generated: ${generated}`,
    "",
    "Estate summary",
    `PDVI score: ${estateStats?.pdvi ?? "—"}/100 (${estateStats?.band ?? "—"})`,
    `Disease risk: ${estateStats?.diseaseRisk ?? "—"} — ${estateStats?.diseaseNote?.toLowerCase() ?? "—"} (${estateStats?.modelRisk ?? "—"}, ${estateStats?.riskEngine ?? "—"})`,
    `Fields requiring attention: ${rows.length} listed of ${estateStats?.totalFields ?? "—"}`,
    "",
    "High-priority fields",
    ...fieldLines,
    "",
    "Supervisor note",
    "Review fungicide timing on Nuwara Eliya Sector 2 and irrigation on Dimbula Lowland before the next cool night.",
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "smarttea-estate-report.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ReportModal() {
  const { reportOpen } = useDashboard();
  if (!reportOpen) return null;
  return <ReportDialog />;
}

function ReportDialog() {
  const { user } = useAuth();
  const { setReportOpen, filteredFields, estateStats } = useDashboard();
  const [downloaded, setDownloaded] = useState(false);
  const preparedFor = user?.fullName?.trim() || user?.email || "SmartTea user";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#10241c]/40 p-4"
      onClick={() => setReportOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        className="panel relative max-h-[85vh] w-full max-w-lg overflow-y-auto p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[#8d9992]">ESTATE BRIEF</p>
            <h2 id="report-title" className="mt-1 text-xl font-semibold text-[#1c2b24]">
              Estate Health Report
            </h2>
            <p className="mt-1 text-sm text-[#7d8b83]">Prepared for {preparedFor}</p>
          </div>
          <button
            type="button"
            onClick={() => setReportOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full text-[#5c6d64] hover:bg-[#f4f6f4]"
            aria-label="Close report"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["PDVI", `${estateStats?.pdvi ?? "—"}/100`],
            ["Disease", estateStats?.diseaseRisk ?? "—"],
            ["Fields", String(filteredFields.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#f6f8f6] px-3 py-2">
              <dt className="text-[11px] text-[#8d9992]">{label}</dt>
              <dd className="text-sm font-semibold text-[#1c2b24]">{value}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-4 space-y-2">
          {filteredFields.length === 0 && (
            <li className="text-sm text-[#7d8b83]">No priority fields in the current filter.</li>
          )}
          {filteredFields.map((field) => (
            <li key={field.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-[#1c2b24]">{field.name}</span>
              <span className="text-[#6d7c74]">
                {field.score}/100 · {field.status}
              </span>
            </li>
          ))}
        </ul>

        {downloaded && (
          <p className="mt-4 rounded-xl bg-[#e7f7ec] px-3 py-2 text-sm font-medium text-[#1c8a48]">
            Report downloaded.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-[#e3ebe6] px-4 py-2.5 text-sm font-semibold text-[#24352c]"
            onClick={() => setReportOpen(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#10241c] px-4 py-2.5 text-sm font-semibold text-white"
            onClick={() => {
              downloadReport({ rows: filteredFields, preparedFor, estateStats });
              setDownloaded(true);
            }}
          >
            <Download className="h-4 w-4" />
            Download report
          </button>
        </div>
      </div>
    </div>
  );
}
