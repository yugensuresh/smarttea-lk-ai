import { useDashboard } from "../context/DashboardContext";

export function useCommandCentreData() {
  const {
    member02Readiness,
    member02Forecasting,
    member03Intel,
    memberErrors,
    memberLoading,
    fetchedAt,
    workflow,
    refreshDashboard,
  } = useDashboard();

  return {
    loading: memberLoading,
    errors: memberErrors,
    readiness: member02Readiness,
    forecasting: member02Forecasting,
    intel: member03Intel,
    workflow,
    fetchedAt,
    refreshSupplemental: refreshDashboard,
  };
}
