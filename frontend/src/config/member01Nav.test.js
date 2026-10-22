import { describe, expect, it } from "vitest";
import {
  DISEASE_DETECTION_PATH,
  plantationHealthNav,
  SEVERITY_LEGACY_PATH,
} from "./member01Nav.js";

describe("member01Nav", () => {
  it("lists Disease Detection, Risk, and PDVI only (no standalone severity)", () => {
    expect(plantationHealthNav.map((item) => item.to)).toEqual(["/disease", "/risk", "/pdvi"]);
    expect(plantationHealthNav.some((item) => /severity/i.test(item.label))).toBe(false);
  });

  it("defines legacy severity path for redirects", () => {
    expect(SEVERITY_LEGACY_PATH).toBe("/severity");
    expect(DISEASE_DETECTION_PATH).toBe("/disease");
  });
});
