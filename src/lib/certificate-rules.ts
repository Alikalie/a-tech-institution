import { z } from "zod";

const text = z.string().trim().min(1).max(150);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Invalid date");
export const certificateSchema = z.object({
  fullName: text, courseName: text, startDate: date, endDate: date, issueDate: date,
  number: text, director: z.string().trim().max(90), headOfDepartment: z.string().trim().max(90),
  studentId: z.string().max(90).default(""), reference: z.string().max(90).default(""),
  duration: z.string().max(90).default(""), award: z.string().trim().max(150).default(""),
}).refine((v) => v.endDate >= v.startDate, "End date must be on or after the start date");
export type CertificateValues = z.infer<typeof certificateSchema>;
export function certificateStatistics(scores: (number | null)[]) {
  const recorded = scores.filter((v): v is number => v !== null && Number.isFinite(v));
  return { results: scores.length, scored: recorded.length, average: recorded.length ? Number((recorded.reduce((a, b) => a + b, 0) / recorded.length).toFixed(1)) : null };
}
export function canIssueCertificate(role: string, applicationStatus: string) {
  return role === "super_admin" && applicationStatus === "accepted";
}