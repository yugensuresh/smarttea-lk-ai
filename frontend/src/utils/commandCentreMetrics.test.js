import { describe, expect, it } from "vitest";
import {
  countPriorityFields,
  countUnresolvedAlerts,
  harvestReadinessOverview,
  isPriorityField,
  yieldForecastIsDisplayable,
  yieldForecastMetrics,
} from "./commandCentreMetrics";

describe("commandCentreMetrics", () => {
  it("counts priority fields consistently", () => {
    const fields = [
      { id: "1", score: 92, status: "Action Required" },
      { id: "2", score: 50, status: "Normal" },
      { id: "3", score: 78, status: "Warning" },
    ];
    expect(isPriorityField(fields[0])).toBe(true);
    expect(isPriorityField(fields[1])).toBe(false);
    expect(isPriorityField(fields[2])).toBe(true);
    expect(countPriorityFields(fields)).toBe(2);
  });

  it("uses API overview when legend sums match field count", () => {
    const payload = {
      fields: [
        { statusTone: "ready" },
        { statusTone: "near" },
        { statusTone: "not" },
      ],
      estateOverview: {
        readyPercent: 33,
        legend: [
          { tone: "ready", count: 1 },
          { tone: "near", count: 1 },
          { tone: "not", count: 1 },
        ],
      },
    };
    const overview = harvestReadinessOverview(payload);
    expect(overview.readyPercent).toBe(33);
    expect(overview.source).toBe("api-estateOverview");
  });

  it("detects displayable yield KPI only when live with a real value", () => {
    expect(
      yieldForecastIsDisplayable(
        yieldForecastMetrics({
          kpis: { predictedYield: { value: "1,200", unit: "kg", live: true } },
        }),
      ),
    ).toBe(true);
    expect(
      yieldForecastIsDisplayable(
        yieldForecastMetrics({
          kpis: { predictedYield: { value: "—", unit: "kg", live: false, delta: "No live yield prediction" } },
        }),
      ),
    ).toBe(false);
  });

  it("counts unresolved alerts", () => {
    expect(
      countUnresolvedAlerts([
        { level: "Unresolved" },
        { level: "Watch" },
        { level: "Unresolved" },
      ]),
    ).toBe(2);
  });
});
