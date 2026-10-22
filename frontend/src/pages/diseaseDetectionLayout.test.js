import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(__dirname, "DiseaseDetection.jsx"), "utf8");

describe("DiseaseDetection layout contract", () => {
  it("uses stable xl two-column grid without flex-1 stretch on upload column", () => {
    expect(source).toMatch(/xl:grid-cols-2/);
    expect(source).toMatch(/items-start/);
    expect(source).not.toMatch(/flex flex-1 flex-col/);
  });

  it("always renders severity assessment block", () => {
    expect(source).toMatch(/id="severity-assessment"/);
    expect(source).toMatch(/hasSpecimen=\{Boolean\(specimen\)\}/);
  });

  it("export uses PDF helper and disables without verified session", () => {
    expect(source).toMatch(/import\("\.\.\/utils\/diseaseReportPdf"\)/);
    expect(source).toMatch(/canExportDiseaseReport/);
    expect(source).toMatch(/disabled=\{!exportEnabled \|\| exportBusy\}/);
  });
});
