import { describe, expect, it } from "vitest";
import {
  isValidatedSeverityModel,
  mapToDisplaySeverity,
  severityAssessEnabled,
} from "./severityAssessmentUi.js";

describe("severityAssessmentUi", () => {
  it("rejects heuristic as validated severity model", () => {
    expect(isValidatedSeverityModel({ inferenceEngine: "java-heuristic-v1", serviceConnected: true })).toBe(false);
  });

  it("maps severity levels to display labels", () => {
    expect(mapToDisplaySeverity("Moderate")).toBe("Moderate");
    expect(mapToDisplaySeverity("Severe")).toBe("Severe");
  });

  it("requires verified model01 for assess", () => {
    const noModel = severityAssessEnabled({
      hasSpecimen: true,
      model01: null,
      allowExperimental: true,
      severityModelReady: false,
      assessing: false,
    });
    expect(noModel.hasVerified).toBe(false);
    expect(noModel.canAssess).toBe(false);
  });

  it("experimental assess requires opt-in when no trained model", () => {
    const off = severityAssessEnabled({
      hasSpecimen: true,
      model01: { classId: "blister" },
      allowExperimental: false,
      severityModelReady: false,
      assessing: false,
    });
    expect(off.canAssess).toBe(false);

    const on = severityAssessEnabled({
      hasSpecimen: true,
      model01: { classId: "blister" },
      allowExperimental: true,
      severityModelReady: false,
      assessing: false,
    });
    expect(on.canAssess).toBe(true);
    expect(on.canRunExperimental).toBe(true);
  });
});
