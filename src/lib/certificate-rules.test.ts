import { describe, expect, it } from "vitest";
import { canIssueCertificate, certificateSchema, certificateStatistics } from "./certificate-rules";
describe("Student certificates", () => {
  it("allows only super admins to issue to accepted students", () => {
    expect(canIssueCertificate("super_admin", "accepted")).toBe(true);
    expect(canIssueCertificate("admin", "accepted")).toBe(false);
    expect(canIssueCertificate("student", "accepted")).toBe(false);
    expect(canIssueCertificate("super_admin", "submitted")).toBe(false);
  });
  it("includes zero scores and excludes unscored results from the average", () => {
    expect(certificateStatistics([0, 80, null])).toEqual({ results: 3, scored: 2, average: 40 });
    expect(certificateStatistics([]).average).toBeNull();
  });
  it("requires recipient information and chronological certificate dates", () => {
    const values = { fullName: "Student", courseName: "ICT", startDate: "2026-01-01", endDate: "2026-02-01", issueDate: "2026-02-02", number: "CERT/1", director: "Director", headOfDepartment: "HOD" };
    expect(certificateSchema.safeParse(values).success).toBe(true);
    expect(certificateSchema.safeParse({ ...values, fullName: "" }).success).toBe(false);
    expect(certificateSchema.safeParse({ ...values, endDate: "2025-01-01" }).success).toBe(false);
  });
});