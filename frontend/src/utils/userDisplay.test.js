import { describe, expect, it } from "vitest";
import { userInitials, userRoleLabel } from "./userDisplay";

describe("userInitials", () => {
  it("returns ? for empty names", () => {
    expect(userInitials("")).toBe("?");
    expect(userInitials(null)).toBe("?");
  });

  it("uses first and last initial for multi-part names", () => {
    expect(userInitials("Asela Perera")).toBe("AP");
  });

  it("uses two letters for a single name", () => {
    expect(userInitials("Demo")).toBe("DE");
  });
});

describe("userRoleLabel", () => {
  it("falls back when role is missing", () => {
    expect(userRoleLabel({ fullName: "A" })).toBe("Plantation user");
  });

  it("uses role when provided", () => {
    expect(userRoleLabel({ role: "Field supervisor" })).toBe("Field supervisor");
  });
});
