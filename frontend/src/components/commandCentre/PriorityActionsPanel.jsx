import { Link } from "react-router-dom";
import { useDashboard } from "../../context/DashboardContext";
import { countPriorityFields, countUnresolvedAlerts, isPriorityField } from "../../utils/commandCentreMetrics";
import { btnSecondaryClass, SectionHeader, StatusLabel, TableShell } from "./CommandCentreUi";

const LEVEL_ORDER = { Unresolved: 0, Warning: 1, Watch: 2 };

const MODULE_AREA = {
  plantation: "Plantation health",
  harvest: "Climate & harvest",
  quality: "Quality & sustainability",
};

function moduleAreaForAlert(alert) {
  if (/harvest|pluck|readiness/i.test(alert.title ?? "")) return MODULE_AREA.harvest;
  if (/quality|sustain|stii/i.test(alert.title ?? "")) return MODULE_AREA.quality;
  return MODULE_AREA.plantation;
}

function actionLink(item) {
  if (item.kind === "alert") return "/alerts";
  if (item.module === MODULE_AREA.harvest) return "/harvest/readiness";
  if (item.module === MODULE_AREA.quality) return "/intel/predictions";
  return "/disease";
}

export default function PriorityActionsPanel() {
  const { matchedAlerts, filteredFields } = useDashboard();

  const fieldActions = filteredFields.filter(isPriorityField).map((field) => ({
    id: `field-${field.id}`,
    kind: "field",
    priority: field.status === "Action Required" ? "Unresolved" : "Warning",
    title: field.concern || field.name,
    place: `${field.name} · ${field.estate}`,
    module: MODULE_AREA.plantation,
    status: field.status,
    fieldId: field.id,
  }));

  const alertActions = matchedAlerts.map((alert) => ({
    id: `alert-${alert.id}`,
    kind: "alert",
    priority: alert.level || "Watch",
    title: alert.title,
    place: alert.place,
    module: moduleAreaForAlert(alert),
    status: alert.level,
    fieldId: alert.fieldId,
  }));

  const seen = new Set();
  const merged = [];
  [...alertActions, ...fieldActions].forEach((item) => {
    const key = `${item.fieldId ?? ""}:${item.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });

  merged.sort((a, b) => (LEVEL_ORDER[a.priority] ?? 3) - (LEVEL_ORDER[b.priority] ?? 3));

  const unresolvedCount = countUnresolvedAlerts(matchedAlerts);
  const priorityFieldCount = countPriorityFields(filteredFields);

  return (
    <section className="space-y-4">
      <SectionHeader
        eyebrow="ACTIONS"
        title="Priority actions"
        description={`${unresolvedCount} unresolved alerts · ${priorityFieldCount} priority fields — deduplicated by field and title.`}
        action={
          <Link to="/alerts" className="text-[13px] font-semibold text-[#178a45] hover:underline">
            All alerts
          </Link>
        }
      />
      <TableShell>
        <ul className="divide-y divide-[#f0f4f1]">
          {merged.length === 0 ? (
            <li className="px-5 py-12 text-center text-sm text-[#7d8b83]">No priority items for the current filter.</li>
          ) : (
            merged.slice(0, 10).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-[#fcfdfc]">
                <StatusLabel statusKey={item.status}>{item.priority}</StatusLabel>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1c2b24]">{item.title}</p>
                  <p className="text-xs text-[#7d8b83]">
                    {item.place} · <span className="font-medium text-[#5f7368]">{item.module}</span>
                  </p>
                </div>
                <Link to={actionLink(item)} className={`${btnSecondaryClass} shrink-0 px-3 py-1.5`}>
                  Open
                </Link>
              </li>
            ))
          )}
        </ul>
      </TableShell>
    </section>
  );
}
