export const editableTables = ["profiles", "applications", "payments", "grades", "schedules", "notifications", "application_documents", "id_cards", "programmes", "nav_links", "form_fields"] as const;
export function courseRemovalUpdate(now: string) {
  return { active: false, deleted_at: now };
}
export function matchesApplication(app: { full_name: string; reference: string; course_code: string; email?: string | null; status: string }, term: string, status: string) {
  return (status === "all" || app.status === status) && [app.full_name, app.reference, app.course_code, app.email].some((v) => v?.toLowerCase().includes(term.trim().toLowerCase()));
}