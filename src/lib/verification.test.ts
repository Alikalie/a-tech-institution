import { describe, expect, it } from "vitest";
import { canVerify, selectEvidence, verificationInput } from "./verification";
describe("Applicant AI verification permissions and evidence", () => {
  it("allows super admins only", () => {
    expect(canVerify(["super_admin"])).toBe(true);
    for (const roles of [[], ["admin"], ["applicant"], ["tutor"], ["student"]]) expect(canVerify(roles)).toBe(false);
  });
  it("rejects another application's uploaded evidence", () => {
    expect(() => selectEvidence([{ id: "doc", application_id: "other" }], ["doc"], "submitted")).toThrow();
  });
  it("includes exactly the selected evidence", () => {
    expect(selectEvidence([{ id: "a", application_id: "app" }, { id: "b", application_id: "app" }], ["b"], "app")).toEqual([{ id: "b", application_id: "app" }]);
  });
  it("rejects duplicate evidence and malformed application IDs", () => {
    expect(() => selectEvidence([{ id: "a", application_id: "app" }], ["a", "a"], "app")).toThrow();
    expect(verificationInput.safeParse({ applicationId: "bad", documentIds: [] }).success).toBe(false);
  });
});