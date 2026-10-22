import { describe, expect, it } from "vitest";
import { DISEASE_MAX_BYTES, isAcceptedExtension, validateDiseaseUploadBasics } from "./diseaseUploadValidation.js";

describe("validateDiseaseUploadBasics", () => {
  it("accepts jpeg by extension when mime is missing", () => {
    const file = { name: "leaf.JPG", type: "", size: 1024 };
    expect(validateDiseaseUploadBasics(file).ok).toBe(true);
  });

  it("rejects unsupported extensions", () => {
    const file = { name: "Logo.svg", type: "image/svg+xml", size: 1024 };
    expect(validateDiseaseUploadBasics(file).ok).toBe(false);
  });

  it("rejects oversized files", () => {
    const file = { name: "big.png", type: "image/png", size: DISEASE_MAX_BYTES + 1 };
    expect(validateDiseaseUploadBasics(file).ok).toBe(false);
  });

  it("rejects empty files", () => {
    const file = { name: "empty.png", type: "image/png", size: 0 };
    expect(validateDiseaseUploadBasics(file).ok).toBe(false);
  });
});

describe("isAcceptedExtension", () => {
  it("matches png and jpeg variants", () => {
    expect(isAcceptedExtension("x.png")).toBe(true);
    expect(isAcceptedExtension("x.jpeg")).toBe(true);
    expect(isAcceptedExtension("x.gif")).toBe(false);
  });
});
