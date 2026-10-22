import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchAlerts } from "../api/alertsApi";
import { fetchDashboard } from "../api/dashboardApi";
import { fetchHarvestForecasting, fetchHarvestReadiness } from "../api/harvestApi";
import { fetchIntelOverview } from "../api/intelApi";
import {
  alerts as demoAlerts,
  estateStats as demoEstateStats,
  ESTATES as FALLBACK_ESTATES,
  fields as demoFields,
  trend as demoTrend,
} from "../data/dashboard";
import { readLeafWorkflow } from "../utils/leafWorkflow";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [range, setRange] = useState(30);
  const [query, setQuery] = useState("");
  const [estates, setEstates] = useState(() => [...FALLBACK_ESTATES]);
  const [inspectorId, setInspectorId] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [telemetryLive, setTelemetryLive] = useState(true);
  const [digest, setDigest] = useState(true);

  const [estateStats, setEstateStats] = useState(demoEstateStats);
  const [fields, setFields] = useState(demoFields);
  const [alerts, setAlerts] = useState(demoAlerts);
  const [trend, setTrend] = useState(demoTrend);
  const [detections, setDetections] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [dataSource, setDataSource] = useState("demo");

  const [member02Readiness, setMember02Readiness] = useState(null);
  const [member02Forecasting, setMember02Forecasting] = useState(null);
  const [member03Intel, setMember03Intel] = useState(null);
  const [memberErrors, setMemberErrors] = useState({});
  const [memberSources, setMemberSources] = useState({ m02Readiness: null, m02Forecast: null, m03: null });
  const [memberLoading, setMemberLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [workflow, setWorkflow] = useState(() => readLeafWorkflow());

  const loadDashboard = useCallback(async (days, { showLoading = false } = {}) => {
    if (showLoading) setDashboardLoading(true);
    setMemberLoading(true);
    setDashboardError("");
    setMemberErrors({});

    const results = await Promise.allSettled([
      fetchDashboard({ days }),
      fetchAlerts(),
      fetchHarvestReadiness(),
      fetchHarvestForecasting(),
      fetchIntelOverview(),
    ]);

    const [overviewResult, alertsResult, readinessResult, forecastResult, intelResult] = results;

    try {
      if (overviewResult.status === "fulfilled") {
        const overview = overviewResult.value;
        setEstateStats(overview.estateStats);
        setFields(overview.fields);
        setTrend(overview.trend);
        setDetections(overview.detections ?? []);
        setTelemetryLive(overview.telemetryLive);
        if (overview.estates?.length) {
          setEstates((current) => (current.length ? current : [...overview.estates]));
        }
        if (overview.error) setDashboardError(overview.error);
      } else {
        throw overviewResult.reason;
      }

      if (alertsResult.status === "fulfilled") {
        const alertsPayload = alertsResult.value;
        const overview = overviewResult.value;
        setAlerts(alertsPayload.alerts.length ? alertsPayload.alerts : overview.alerts);
        const source =
          overview.source === "api" && alertsPayload.source === "api" ? "api" : "demo";
        setDataSource(source);
        if (alertsPayload.error) {
          setDashboardError((prev) => prev || alertsPayload.error);
        }
      } else if (overviewResult.status === "fulfilled") {
        setAlerts(overviewResult.value.alerts);
        setDataSource(overviewResult.value.source === "api" ? "api" : "demo");
      }
    } catch (error) {
      setDashboardError(error.message ?? "Failed to load dashboard");
      setDataSource("error");
    }

    const nextMemberErrors = {};
    const nextMemberSources = { m02Readiness: null, m02Forecast: null, m03: null };

    if (readinessResult.status === "fulfilled") {
      setMember02Readiness(readinessResult.value);
      nextMemberSources.m02Readiness = readinessResult.value.source ?? "api";
    } else {
      setMember02Readiness(null);
      nextMemberErrors.harvestReadiness =
        readinessResult.reason?.message ?? "Harvest readiness unavailable";
    }

    if (forecastResult.status === "fulfilled") {
      setMember02Forecasting(forecastResult.value);
      nextMemberSources.m02Forecast = forecastResult.value.source ?? "api";
    } else {
      setMember02Forecasting(null);
      nextMemberErrors.harvestForecast =
        forecastResult.reason?.message ?? "Yield forecast unavailable";
    }

    if (intelResult.status === "fulfilled") {
      setMember03Intel(intelResult.value);
      nextMemberSources.m03 = intelResult.value.source ?? "api";
    } else {
      setMember03Intel(null);
      nextMemberErrors.intel = intelResult.reason?.message ?? "Intel overview unavailable";
    }

    setMemberErrors(nextMemberErrors);
    setMemberSources(nextMemberSources);
    setWorkflow(readLeafWorkflow());
    setFetchedAt(new Date());
    setMemberLoading(false);
    if (showLoading) setDashboardLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard(range);
  }, [loadDashboard, range]);

  useEffect(() => {
    function onWorkflow() {
      setWorkflow(readLeafWorkflow());
    }
    window.addEventListener("smarttea-lk:leaf-workflow-updated", onWorkflow);
    return () => window.removeEventListener("smarttea-lk:leaf-workflow-updated", onWorkflow);
  }, []);

  const openField = useCallback((id) => setInspectorId(id), []);
  const closeField = useCallback(() => setInspectorId(null), []);

  const filteredFields = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fields.filter((field) => {
      if (!estates.includes(field.estate)) return false;
      if (!q) return true;
      return [field.name, field.sector, field.estate, field.clone, field.concern, field.status]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [estates, fields, query]);

  const matchedAlerts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter((alert) => {
      if (!estates.includes(alert.estate)) return false;
      if (!q) return true;
      return `${alert.title} ${alert.place} ${alert.level}`.toLowerCase().includes(q);
    });
  }, [alerts, estates, query]);

  const inspectorField = fields.find((field) => field.id === inspectorId) ?? null;

  const value = {
    range,
    setRange,
    query,
    setQuery,
    estates,
    setEstates,
    estateStats,
    fields,
    trend,
    filteredFields,
    matchedAlerts,
    alerts,
    inspectorField,
    openField,
    closeField,
    reportOpen,
    setReportOpen,
    telemetryLive,
    setTelemetryLive,
    digest,
    setDigest,
    dashboardLoading,
    dashboardError,
    dataSource,
    detections,
    member02Readiness,
    member02Forecasting,
    member03Intel,
    memberErrors,
    memberSources,
    memberLoading,
    fetchedAt,
    workflow,
    refreshDashboard: () => loadDashboard(range, { showLoading: true }),
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}

export { FALLBACK_ESTATES as ESTATES };
