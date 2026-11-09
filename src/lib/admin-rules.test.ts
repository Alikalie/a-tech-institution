import { describe, expect, it } from "vitest";
import { courseRemovalUpdate, matchesApplication } from "./admin-rules";
describe("Administration rules", () => {
  it("removes courses from new applications without deleting historical references", () => {
    expect(courseRemovalUpdate("2026-11-09T10:31:00Z")).toEqual({ active: false, deleted_at: "2026-11-09T10:31:00Z" });
  });
  it("filters applications by submitted status", () => {
    expect(matchesApplication({ full_name: "Student", reference: "APP-1", course_code: "ICT", status: "submitted" }, "", "accepted")).toBe(false);
  });
  it("searches submitted applicants by reference", () => {
    expect(matchesApplication({ full_name: "Student", reference: "APP-123", course_code: "ICT", status: "submitted" }, "app-123", "submitted")).toBe(true);
  });
});