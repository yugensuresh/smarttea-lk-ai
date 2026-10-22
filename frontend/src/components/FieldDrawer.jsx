import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { flagClass, scoreClass, statusClass } from "../data/dashboard";
import { useDashboard } from "../context/DashboardContext";

export default function FieldDrawer() {
  const { inspectorField, closeField } = useDashboard();
  if (!inspectorField) return null;

  const field = inspectorField;
  const metrics = [
    ["Tea clone", field.clone],
    ["Canopy humidity", `${field.humidity}%`],
    ["Leaf wetness", field.leafWetness],
    ["Temperature", field.temperature],
    ["Spore pressure", field.sporePressure],
    ["Estate", field.estate],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-[#10241c]/35" onClick={closeField}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="field-title"
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`h-1.5 ${field.severity === "critical" ? "bg-[#e23b45]" : "bg-[#d4a24a]"}`} />
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`grid h-7 w-7 place-items-center rounded-lg ${flagClass(field.severity)}`}>
                <span className="text-xs font-bold">!</span>
              </span>
              <h2 id="field-title" className="text-lg font-semibold text-[#1c2b24]">
                {field.name}
              </h2>
            </div>
            <p className="mt-1 text-sm text-[#6d7c74]">{field.sector}</p>
          </div>
          <button
            type="button"
            onClick={closeField}
            className="grid h-9 w-9 place-items-center rounded-full text-[#5c6d64] hover:bg-[#f4f6f4]"
            aria-label="Close field details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">RISK SCORE</p>
              <p className={`mt-1 text-[40px] leading-none font-semibold tabular-nums ${scoreClass(field.score)}`}>
                {field.score}
                <span className="text-base font-medium text-[#98a29c]">/100</span>
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(field.status)}`}>
              {field.status}
            </span>
          </div>

          <p className="text-sm font-medium text-[#31443b]">{field.concern}</p>

          <dl className="grid grid-cols-2 gap-3">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#f6f8f6] px-3 py-2.5">
                <dt className="text-[11px] font-semibold tracking-wide text-[#8d9992] uppercase">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-[#1c2b24]">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-2xl bg-[#f3faf6] px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#1f7a45]">SUPERVISOR NOTE</p>
            <p className="mt-1.5 text-sm leading-6 text-[#2c4338]">{field.recommendation}</p>
          </div>

          <div className="rounded-2xl border border-[#eef2ef] px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#8d9992]">PLANTATION HEALTH MODULES</p>
            <div className="mt-2 flex flex-col gap-1.5 text-sm font-semibold">
              <Link to="/disease" onClick={closeField} className="text-[#178a45] hover:underline">
                Disease Detection
              </Link>
              <Link to="/disease#severity-assessment" onClick={closeField} className="text-[#178a45] hover:underline">
                Severity (on Disease Detection)
              </Link>
              <Link to="/risk" onClick={closeField} className="text-[#178a45] hover:underline">
                Risk Prediction
              </Link>
              <Link to="/pdvi" onClick={closeField} className="text-[#178a45] hover:underline">
                PDVI Scoring
              </Link>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-[#eef2ef] px-5 py-4">
          <Link
            to="/alerts"
            onClick={closeField}
            className="flex flex-1 items-center justify-center rounded-xl bg-[#10241c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173628]"
          >
            View active alerts
          </Link>
          <button
            type="button"
            className="rounded-xl border border-[#e3ebe6] px-4 py-2.5 text-sm font-semibold text-[#24352c] hover:bg-[#f6f8f6]"
            onClick={closeField}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
