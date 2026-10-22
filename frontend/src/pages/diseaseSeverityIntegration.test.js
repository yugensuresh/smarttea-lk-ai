import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("Disease + severity integration (static)", () => {
  it("DiseaseDetection embeds DiseaseSeverityAssessment", () => {
    const src = readFileSync(join(root, "pages", "DiseaseDetection.jsx"), "utf8");
    expect(src).toContain("DiseaseSeverityAssessment");
    expect(src).toContain('id="severity-assessment"');
    expect(src).toContain("<DiseaseSeverityAssessment");
    expect(src).not.toMatch(/\{specimen &&[\s\S]*DiseaseSeverityAssessment/);
    expect(src).not.toContain('to="/severity"');
  });

  it("SeverityEstimation redirects to Disease Detection", () => {
    const src = readFileSync(join(root, "pages", "SeverityEstimation.jsx"), "utf8");
    expect(src).toContain("Navigate");
    expect(src).toContain("#severity-assessment");
  });
});
