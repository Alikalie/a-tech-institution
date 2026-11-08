import { z } from "zod";

export const verificationInput = z.object({
  applicationId: z.string().uuid(),
  documentIds: z.array(z.string().uuid()).max(12),
  notes: z.string().max(2000).default(""),
  accessRestored: z.boolean().default(false),
});
export const verificationReport = z.object({
  summary: z.string(),
  findings: z.array(z.object({
    category: z.enum(["inconsistency", "missing_evidence", "unreadable", "needs_confirmation"]),
    severity: z.enum(["high", "medium", "low"]),
    title: z.string(),
    explanation: z.string(),
    sources: z.array(z.string()),
    followUp: z.string(),
  }).strict()),
  limitations: z.array(z.string()),
}).strict();
export type VerificationReport = z.infer<typeof verificationReport>;
export const expectedEvidence = ["Passport photograph", "Educational certificate", "National ID / Passport", "Payment receipt"];
export function canVerify(roles: string[]) { return roles.includes("super_admin"); }
export function selectEvidence<T extends { id: string; application_id: string | null }>(documents: T[], ids: string[], applicationId: string) {
  const chosen = documents.filter((d) => ids.includes(d.id) && d.application_id === applicationId);
  if (new Set(ids).size !== ids.length || chosen.length !== ids.length) throw new Error("Selected evidence does not belong to this application.");
  return chosen;
}