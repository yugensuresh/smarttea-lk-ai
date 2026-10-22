import { ArrowRight, ChevronRight, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { flagClass, scoreClass } from "../data/dashboard";
import { ESTATES, useDashboard } from "../context/DashboardContext";
import { countPriorityFields } from "../utils/commandCentreMetrics";
import { btnPrimaryClass, SectionHeader, StatusLabel, tableHeadClass } from "./commandCentre/CommandCentreUi";

export default function PriorityTable() {
  const navigate = useNavigate();
  const { filteredFields, openField, query, estates, fields, dashboardLoading } = useDashboard();
  const filtering = query.trim().length > 0 || estates.length !== ESTATES.length;
  const priorityCount = countPriorityFields(filteredFields);

  return (
    <section id="priority-fields" className="scroll-mt-4 space-y-4">
      <SectionHeader
        eyebrow="PLANTATION HEALTH · FIELDS"
        title="High-priority fields"
        description={`Dashboard catalog — ${priorityCount} priority row${priorityCount === 1 ? "" : "s"} (score ≥70 or action required), aligned with Priority Actions.${
          filtering ? ` Showing ${filteredFields.length} of ${fields.length} listed fields.` : ""
        }`}
        action={
          <button
            type="button"
            onClick={() => navigate("/alerts")}
            className={btnPrimaryClass}
          >
            View alerts
            <ArrowRight className="h-4 w-4" />
          </button>
        }
      />
      <div className="panel overflow-hidden">

      {dashboardLoading && (
        <p className="px-5 py-4 text-sm text-[#8b9790]">Loading priority fields…</p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className={tableHeadClass()}>
              <th className="px-5 py-3 font-semibold">FIELD NAME</th>
              <th className="px-3 py-3 font-semibold">ESTATE SECTOR</th>
              <th className="px-3 py-3 font-semibold">RISK SCORE</th>
              <th className="px-3 py-3 font-semibold">PRIMARY CONCERN</th>
              <th className="px-3 py-3 font-semibold">STATUS</th>
              <th className="px-5 py-3 text-right font-semibold">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredFields.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-[#7d8b83]">
                  No fields match this search or estate filter.
                </td>
              </tr>
            )}
            {filteredFields.map((field) => (
              <tr
                key={field.id}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${field.name}`}
                onClick={() => openField(field.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openField(field.id);
                  }
                }}
                className="cursor-pointer border-b border-[#f2f5f3] last:border-0 hover:bg-[#f7faf8] focus-visible:bg-[#f7faf8]"
              >
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-2.5">
                    <span className={`grid h-7 w-7 place-items-center rounded-lg ${flagClass(field.severity)}`}>
                      <Flag className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm font-semibold text-[#1c2b24]">{field.name}</span>
                  </span>
                </td>
                <td className="px-3 py-3.5 text-sm text-[#5d6d64]">{field.sector}</td>
                <td className={`px-3 py-3.5 text-sm font-semibold tabular-nums ${scoreClass(field.score)}`}>
                  {field.score}
                  <span className="text-[12px] font-medium opacity-70">/100</span>
                </td>
                <td className="px-3 py-3.5 text-sm text-[#31443b]">{field.concern}</td>
                <td className="px-3 py-3.5">
                  <StatusLabel statusKey={field.status}>{field.status}</StatusLabel>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#5c6d64]">
                    Inspect Field
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </section>
  );
}
