import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  listAccounts,
  listApplications,
  listPayments,
  listGradesAdmin,
  listActivity,
  listNotificationsAdmin,
  adminOverview,
  adminIdentity,
  issuePaymentCode,
  issueStudentId,
  setUserRole,
  clearUserRoles,
  decideApplication,
  saveCourse,
  deleteCourse,
  saveSchedule,
  deleteSchedule,
  sendNotification,
} from "@/lib/portal.functions";
import { formatDate, statusTone } from "@/lib/atech";

export const Route = createFileRoute("/_authenticated/portal/admin")({
  component: AdminPage,
});

const SECTIONS = [
  "Dashboard",
  "Applicants",
  "Students",
  "Tutors",
  "Courses",
  "Programmes",
  "Payments",
  "Applications",
  "Student IDs",
  "Grades",
  "Results",
  "Timetable",
  "Notifications",
  "Documents",
  "Reports",
  "Users",
  "Permissions",
  "Audit logs",
  "System settings",
] as const;
type Section = (typeof SECTIONS)[number];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-elevated p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-elevated p-4">
      <h2 className="gold-rule pb-2 text-lg">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AdminPage() {
  const qc = useQueryClient();
  const [section, setSection] = useState<Section>("Dashboard");
  const [search, setSearch] = useState("");

  const accountsFn = useServerFn(listAccounts);
  const applicationsFn = useServerFn(listApplications);
  const paymentsFn = useServerFn(listPayments);
  const gradesFn = useServerFn(listGradesAdmin);
  const activityFn = useServerFn(listActivity);
  const notificationsFn = useServerFn(listNotificationsAdmin);
  const overviewFn = useServerFn(adminOverview);
  const identityFn = useServerFn(adminIdentity);

  const issueFn = useServerFn(issuePaymentCode);
  const studentIdFn = useServerFn(issueStudentId);
  const roleFn = useServerFn(setUserRole);
  const clearRolesFn = useServerFn(clearUserRoles);
  const decideFn = useServerFn(decideApplication);
  const saveCourseFn = useServerFn(saveCourse);
  const deleteCourseFn = useServerFn(deleteCourse);
  const saveScheduleFn = useServerFn(saveSchedule);
  const deleteScheduleFn = useServerFn(deleteSchedule);
  const notifyFn = useServerFn(sendNotification);

  const identity = useQuery({ queryKey: ["admin-identity"], queryFn: () => identityFn() });
  const isSuper = Boolean(identity.data?.isSuperAdmin);

  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => overviewFn() });
  const accounts = useQuery({ queryKey: ["admin-accounts"], queryFn: () => accountsFn() });
  const applications = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => applicationsFn(),
  });
  const payments = useQuery({ queryKey: ["admin-payments"], queryFn: () => paymentsFn() });
  const grades = useQuery({ queryKey: ["admin-grades"], queryFn: () => gradesFn() });
  const activity = useQuery({ queryKey: ["admin-activity"], queryFn: () => activityFn() });
  const notifications = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => notificationsFn(),
  });
  const courses = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () =>
      (await supabase.from("courses").select("*").order("sort_order")).data ?? [],
  });
  const schedules = useQuery({
    queryKey: ["admin-schedules"],
    queryFn: async () =>
      (await supabase.from("schedules").select("*").order("created_at")).data ?? [],
  });

  function refreshAll() {
    qc.invalidateQueries();
  }

  const issue = useMutation({
    mutationFn: (userId: string) => issueFn({ data: { userId } }),
    onSuccess: (res) => {
      toast.success(`Code ${res.code} issued to ${res.codeName}. It works for that name only.`);
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const role = useMutation({
    mutationFn: (v: {
      userId: string;
      role: "super_admin" | "admin" | "tutor" | "student";
      grant: boolean;
    }) => roleFn({ data: v }),
    onSuccess: () => {
      toast.success("Roles updated.");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearRoles = useMutation({
    mutationFn: (userId: string) => clearRolesFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("Account demoted to an empty user.");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const studentId = useMutation({
    mutationFn: (userId: string) => studentIdFn({ data: { userId } }),
    onSuccess: (res) => {
      toast.success(`Student ID ${res.studentId} assigned.`);
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: (v: { applicationId: string; decision: "accepted" | "rejected" }) =>
      decideFn({ data: v }),
    onSuccess: (res) => {
      toast.success(
        res.status === "accepted"
          ? `Accepted. Student ID ${res.studentId} issued.`
          : "Application rejected.",
      );
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const term = search.trim().toLowerCase();
  const rows = useMemo(
    () =>
      (accounts.data ?? []).filter((a) =>
        !term
          ? true
          : [a.full_name, a.email, a.phone, a.student_id, a.payment?.reference, a.payment?.code]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(term)),
      ),
    [accounts.data, term],
  );

  const applicantRows = rows.filter((a) => !a.student_id);
  const studentRows = rows.filter((a) => a.student_id);
  const tutorRows = rows.filter((a) => a.roles.includes("tutor"));
  const staffRows = rows.filter(
    (a) => a.roles.includes("admin") || a.roles.includes("super_admin"),
  );

  const nameFor = (id: string) =>
    (accounts.data ?? []).find((a) => a.id === id)?.full_name || id.slice(0, 8);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="gold-rule pb-2 text-2xl">Administration</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isSuper
            ? "Super administrator — full control of accounts, roles, admissions and academics."
            : "Administrator console."}
        </p>
      </header>

      <nav className="flex flex-wrap gap-1">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
              section === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </nav>

      {["Applicants", "Students", "Tutors", "Users", "Permissions", "Student IDs"].includes(
        section,
      ) ? (
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, reference, code…"
          className="max-w-sm"
        />
      ) : null}

      {section === "Dashboard" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Accounts" value={overview.data?.accounts ?? 0} />
            <Stat label="Verified" value={overview.data?.verified ?? 0} />
            <Stat label="Students" value={overview.data?.students ?? 0} />
            <Stat label="Tutors" value={overview.data?.tutors ?? 0} />
            <Stat label="Applications" value={overview.data?.applications ?? 0} />
            <Stat label="Pending review" value={overview.data?.pending ?? 0} />
            <Stat label="Accepted" value={overview.data?.accepted ?? 0} />
            <Stat label="Rejected" value={overview.data?.rejected ?? 0} />
            <Stat label="Codes issued" value={overview.data?.codesIssued ?? 0} />
            <Stat label="Codes used" value={overview.data?.codesUsed ?? 0} />
            <Stat label="Courses" value={overview.data?.courses ?? 0} />
            <Stat label="Results recorded" value={overview.data?.grades ?? 0} />
          </div>
          <Panel title="Recent activity">
            <ul className="space-y-2 text-sm">
              {(activity.data ?? []).slice(0, 8).map((a) => (
                <li key={a.id} className="flex justify-between gap-3 border-b pb-2">
                  <span>
                    <span className="font-medium">{a.action}</span>{" "}
                    <span className="text-muted-foreground">{a.detail}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDate(a.created_at)}
                  </span>
                </li>
              ))}
              {!activity.data?.length ? (
                <li className="text-sm text-muted-foreground">No activity recorded yet.</li>
              ) : null}
            </ul>
          </Panel>
        </div>
      )}

      {(section === "Applicants" || section === "Users" || section === "Permissions") && (
        <Panel
          title={
            section === "Permissions"
              ? "Roles & permissions"
              : section === "Users"
                ? `User accounts (${rows.length})`
                : `Applicants (${applicantRows.length})`
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Account</th>
                  <th className="py-2 pr-3">Roles</th>
                  <th className="py-2 pr-3">Verified</th>
                  <th className="py-2 pr-3">Payment code</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(section === "Applicants" ? applicantRows : rows).map((a) => (
                  <tr key={a.id} className="border-b align-top">
                    <td className="py-3 pr-3">
                      <div className="font-medium">{a.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{a.email}</div>
                      {a.student_id ? (
                        <div className="text-xs text-accent">{a.student_id}</div>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      {a.roles.length ? a.roles.join(", ") : "empty user"}
                    </td>
                    <td
                      className={`py-3 pr-3 text-xs ${a.verified ? "text-success" : "text-warning"}`}
                    >
                      {a.verified ? "Verified" : "Pending"}
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      <div className="font-mono text-sm">{a.payment?.code ?? "—"}</div>
                      <div className="text-muted-foreground">
                        {a.payment?.code_name ? `issued to ${a.payment.code_name}` : "not issued"}
                        {a.payment?.code_used ? " · used" : ""}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" disabled={issue.isPending} onClick={() => issue.mutate(a.id)}>
                          {a.payment?.code ? "Regenerate code" : "Generate code"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={role.isPending}
                          onClick={() =>
                            role.mutate({
                              userId: a.id,
                              role: "tutor",
                              grant: !a.roles.includes("tutor"),
                            })
                          }
                        >
                          {a.roles.includes("tutor") ? "Remove tutor" : "Make tutor"}
                        </Button>
                        {isSuper && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={role.isPending}
                              onClick={() =>
                                role.mutate({
                                  userId: a.id,
                                  role: "admin",
                                  grant: !a.roles.includes("admin"),
                                })
                              }
                            >
                              {a.roles.includes("admin") ? "Remove admin" : "Make admin"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={role.isPending}
                              onClick={() =>
                                role.mutate({
                                  userId: a.id,
                                  role: "super_admin",
                                  grant: !a.roles.includes("super_admin"),
                                })
                              }
                            >
                              {a.roles.includes("super_admin")
                                ? "Remove super admin"
                                : "Make super admin"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={clearRoles.isPending}
                              onClick={() => clearRoles.mutate(a.id)}
                            >
                              Demote to empty user
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {accounts.isLoading ? "Loading accounts…" : "No accounts found."}
            </p>
          ) : null}
        </Panel>
      )}

      {section === "Students" && (
        <Panel title={`Students (${studentRows.length})`}>
          <ul className="space-y-2 text-sm">
            {studentRows.map((s) => (
              <li key={s.id} className="flex flex-wrap justify-between gap-2 border-b pb-2">
                <span>
                  <span className="font-medium">{s.full_name}</span>{" "}
                  <span className="text-xs text-muted-foreground">{s.email}</span>
                </span>
                <span className="font-mono text-xs text-accent">{s.student_id}</span>
              </li>
            ))}
            {!studentRows.length ? (
              <li className="text-sm text-muted-foreground">No students admitted yet.</li>
            ) : null}
          </ul>
        </Panel>
      )}

      {section === "Tutors" && (
        <Panel title={`Tutors (${tutorRows.length})`}>
          <ul className="space-y-2 text-sm">
            {tutorRows.map((t) => (
              <li key={t.id} className="flex flex-wrap justify-between gap-2 border-b pb-2">
                <span>
                  <span className="font-medium">{t.full_name}</span>{" "}
                  <span className="text-xs text-muted-foreground">{t.email}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {(grades.data ?? []).filter((g) => g.tutor_id === t.id).length} results uploaded
                </span>
              </li>
            ))}
            {!tutorRows.length ? (
              <li className="text-sm text-muted-foreground">No tutors assigned yet.</li>
            ) : null}
          </ul>
        </Panel>
      )}

      {(section === "Courses" || section === "Programmes") && (
        <CoursesPanel
          courses={courses.data ?? []}
          onSave={async (v) => {
            try {
              await saveCourseFn({ data: v });
              toast.success("Course saved.");
              refreshAll();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
          onDelete={async (code) => {
            try {
              await deleteCourseFn({ data: { code } });
              toast.success("Course removed.");
              refreshAll();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}

      {section === "Payments" && (
        <Panel title={`Payments (${payments.data?.length ?? 0})`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Reference</th>
                  <th className="py-2 pr-3">Account</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Bound to</th>
                  <th className="py-2 pr-3">Used</th>
                </tr>
              </thead>
              <tbody>
                {(payments.data ?? []).map((p) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-2 pr-3 font-mono text-xs">{p.reference}</td>
                    <td className="py-2 pr-3">{nameFor(p.user_id)}</td>
                    <td className={`py-2 pr-3 text-xs ${statusTone(p.status)}`}>{p.status}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{p.code ?? "—"}</td>
                    <td className="py-2 pr-3 text-xs">{p.code_name ?? "—"}</td>
                    <td className="py-2 pr-3 text-xs">{p.code_used ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {section === "Applications" && (
        <Panel title={`Applications (${applications.data?.length ?? 0})`}>
          <div className="space-y-3">
            {(applications.data ?? []).map((app) => (
              <article
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">
                    {app.full_name} — {app.course_code}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {app.reference} · submitted {formatDate(app.submitted_at)}
                    {app.student_id ? ` · ${app.student_id}` : ""}
                  </div>
                  <div className={`text-xs font-semibold ${statusTone(app.status)}`}>
                    {app.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={decide.isPending || app.status === "accepted"}
                    onClick={() => decide.mutate({ applicationId: app.id, decision: "accepted" })}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decide.isPending || app.status === "rejected"}
                    onClick={() => decide.mutate({ applicationId: app.id, decision: "rejected" })}
                  >
                    Reject
                  </Button>
                </div>
              </article>
            ))}
            {!applications.data?.length ? (
              <p className="text-sm text-muted-foreground">No applications submitted yet.</p>
            ) : null}
          </div>
        </Panel>
      )}

      {section === "Student IDs" && (
        <Panel title="Student ID allocation">
          <ul className="space-y-2 text-sm">
            {rows.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <span>
                  <span className="font-medium">{a.full_name || a.email}</span>{" "}
                  <span className="font-mono text-xs text-accent">{a.student_id ?? "no ID"}</span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={Boolean(a.student_id) || studentId.isPending}
                  onClick={() => studentId.mutate(a.id)}
                >
                  Generate Student ID
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {(section === "Grades" || section === "Results") && (
        <Panel title={`${section} (${grades.data?.length ?? 0})`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-3">Student ID</th>
                  <th className="py-2 pr-3">Course</th>
                  <th className="py-2 pr-3">Assessment</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Grade</th>
                  <th className="py-2 pr-3">Tutor</th>
                </tr>
              </thead>
              <tbody>
                {(grades.data ?? []).map((g) => (
                  <tr key={g.id} className="border-b">
                    <td className="py-2 pr-3 font-mono text-xs">{g.student_id}</td>
                    <td className="py-2 pr-3">{g.course_code}</td>
                    <td className="py-2 pr-3">{g.assessment}</td>
                    <td className="py-2 pr-3">{g.score ?? "—"}</td>
                    <td className="py-2 pr-3">{g.grade ?? "—"}</td>
                    <td className="py-2 pr-3 text-xs">{nameFor(g.tutor_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!grades.data?.length ? (
            <p className="text-sm text-muted-foreground">No results recorded yet.</p>
          ) : null}
        </Panel>
      )}

      {section === "Timetable" && (
        <TimetablePanel
          courses={courses.data ?? []}
          schedules={schedules.data ?? []}
          onSave={async (v) => {
            try {
              await saveScheduleFn({ data: v });
              toast.success("Timetable entry added.");
              refreshAll();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
          onDelete={async (id) => {
            await deleteScheduleFn({ data: { id } });
            toast.success("Entry removed.");
            refreshAll();
          }}
        />
      )}

      {section === "Notifications" && (
        <NotificationsPanel
          accounts={(accounts.data ?? []).map((a) => ({
            id: a.id,
            name: a.full_name || a.email,
          }))}
          recent={notifications.data ?? []}
          onSend={async (v) => {
            try {
              const res = await notifyFn({ data: v });
              toast.success(`Sent to ${res.sent} recipient(s).`);
              refreshAll();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}

      {section === "Documents" && (
        <Panel title="Documents">
          <p className="text-sm text-muted-foreground">
            Application forms and acceptance letters are generated on demand as PDF or Word files
            from each accepted application. Applicants and students download them from
            <span className="font-medium"> My applications</span>. Accepted applications:{" "}
            {(applications.data ?? []).filter((a) => a.status === "accepted").length}.
          </p>
        </Panel>
      )}

      {section === "Reports" && (
        <Panel title="Reports">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Verification rate" value={`${pct(overview.data?.verified, overview.data?.accounts)}%`} />
            <Stat label="Acceptance rate" value={`${pct(overview.data?.accepted, overview.data?.applications)}%`} />
            <Stat label="Code usage" value={`${pct(overview.data?.codesUsed, overview.data?.codesIssued)}%`} />
            <Stat label="Applications per course" value={courses.data?.length ?? 0} />
            <Stat label="Timetable entries" value={overview.data?.schedules ?? 0} />
            <Stat label="Results recorded" value={overview.data?.grades ?? 0} />
          </div>
          <div className="mt-4 space-y-1 text-sm">
            {(courses.data ?? []).map((c) => (
              <div key={c.code} className="flex justify-between border-b py-1">
                <span>
                  {c.code} — {c.name}
                </span>
                <span className="text-muted-foreground">
                  {(applications.data ?? []).filter((a) => a.course_code === c.code).length}{" "}
                  applications
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {section === "Audit logs" && (
        <Panel title={`Audit logs (${activity.data?.length ?? 0})`}>
          <ul className="space-y-2 text-sm">
            {(activity.data ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b pb-2">
                <span>
                  <span className="font-medium">{a.action}</span>{" "}
                  <span className="text-muted-foreground">{a.detail}</span>
                  <span className="block text-xs text-muted-foreground">
                    by {a.actor_id ? nameFor(a.actor_id) : "system"}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
              </li>
            ))}
            {!activity.data?.length ? (
              <li className="text-sm text-muted-foreground">Nothing logged yet.</li>
            ) : null}
          </ul>
        </Panel>
      )}

      {section === "System settings" && (
        <Panel title="System settings">
          <ul className="space-y-2 text-sm">
            <li>
              Signed in as <span className="font-medium">{identity.data?.isSuperAdmin ? "Super administrator" : "Administrator"}</span>
            </li>
            <li>Student ID format: <span className="font-mono">ATECH/YEAR/0000</span></li>
            <li>Payment verification: 6-digit code bound to the applicant's registered name, single use.</li>
            <li>Access control: role-based row level security on every table.</li>
          </ul>
          <Button className="mt-4" variant="outline" size="sm" onClick={refreshAll}>
            Refresh all data
          </Button>
        </Panel>
      )}
    </div>
  );
}

function pct(a?: number, b?: number) {
  if (!a || !b) return 0;
  return Math.round((a / b) * 100);
}

type CourseRow = { code: string; name: string; duration: string; sort_order: number };

function CoursesPanel({
  courses,
  onSave,
  onDelete,
}: {
  courses: CourseRow[];
  onSave: (v: { code: string; name: string; duration: string; sortOrder: number }) => void;
  onDelete: (code: string) => void;
}) {
  const [form, setForm] = useState({ code: "", name: "", duration: "", sortOrder: "0" });
  return (
    <Panel title={`Courses & programmes (${courses.length})`}>
      <form
        className="grid gap-3 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            code: form.code,
            name: form.name,
            duration: form.duration,
            sortOrder: Number(form.sortOrder),
          });
          setForm({ code: "", name: "", duration: "", sortOrder: "0" });
        }}
      >
        <div>
          <Label htmlFor="c-code">Code</Label>
          <Input
            id="c-code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="c-name">Name</Label>
          <Input
            id="c-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="c-dur">Duration</Label>
          <Input
            id="c-dur"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="c-sort">Order</Label>
            <Input
              id="c-sort"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </div>
          <Button type="submit">Save</Button>
        </div>
      </form>

      <ul className="mt-5 space-y-2 text-sm">
        {courses.map((c) => (
          <li key={c.code} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <span>
              <span className="font-mono text-xs text-accent">{c.code}</span>{" "}
              <span className="font-medium">{c.name}</span>{" "}
              <span className="text-xs text-muted-foreground">{c.duration}</span>
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    code: c.code,
                    name: c.name,
                    duration: c.duration,
                    sortOrder: String(c.sort_order),
                  })
                }
              >
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(c.code)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

type ScheduleRow = {
  id: string;
  course_code: string;
  title: string;
  day_label: string;
  time_label: string;
  venue: string;
};

function TimetablePanel({
  courses,
  schedules,
  onSave,
  onDelete,
}: {
  courses: CourseRow[];
  schedules: ScheduleRow[];
  onSave: (v: {
    courseCode: string;
    title: string;
    dayLabel: string;
    timeLabel: string;
    venue: string;
  }) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState({
    courseCode: "",
    title: "",
    dayLabel: "Monday",
    timeLabel: "09:00 – 11:00",
    venue: "",
  });
  return (
    <Panel title={`Timetable (${schedules.length})`}>
      <form
        className="grid gap-3 sm:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <div>
          <Label htmlFor="s-course">Course</Label>
          <select
            id="s-course"
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={form.courseCode}
            onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
          >
            <option value="">Select…</option>
            {courses.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="s-title">Session</Label>
          <Input
            id="s-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="s-day">Day</Label>
          <Input
            id="s-day"
            value={form.dayLabel}
            onChange={(e) => setForm({ ...form, dayLabel: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="s-time">Time</Label>
          <Input
            id="s-time"
            value={form.timeLabel}
            onChange={(e) => setForm({ ...form, timeLabel: e.target.value })}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="s-venue">Venue</Label>
            <Input
              id="s-venue"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
          </div>
          <Button type="submit">Add</Button>
        </div>
      </form>

      <ul className="mt-5 space-y-2 text-sm">
        {schedules.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <span>
              <span className="font-mono text-xs text-accent">{s.course_code}</span>{" "}
              <span className="font-medium">{s.title}</span>{" "}
              <span className="text-xs text-muted-foreground">
                {s.day_label} · {s.time_label} · {s.venue}
              </span>
            </span>
            <Button size="sm" variant="destructive" onClick={() => onDelete(s.id)}>
              Remove
            </Button>
          </li>
        ))}
        {!schedules.length ? (
          <li className="text-sm text-muted-foreground">No timetable entries yet.</li>
        ) : null}
      </ul>
    </Panel>
  );
}

function NotificationsPanel({
  accounts,
  recent,
  onSend,
}: {
  accounts: { id: string; name: string }[];
  recent: { id: string; title: string; message: string; created_at: string }[];
  onSend: (v: { audience: string; userId?: string; title: string; message: string }) => void;
}) {
  const [form, setForm] = useState({ audience: "all", userId: "", title: "", message: "" });
  return (
    <Panel title="Notifications & announcements">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSend(form);
          setForm({ ...form, title: "", message: "" });
        }}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="n-aud">Audience</Label>
            <select
              id="n-aud"
              className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            >
              <option value="all">Everyone</option>
              <option value="students">Students</option>
              <option value="tutors">Tutors</option>
              <option value="user">One account</option>
            </select>
          </div>
          {form.audience === "user" && (
            <div>
              <Label htmlFor="n-user">Account</Label>
              <select
                id="n-user"
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
              >
                <option value="">Select…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="n-title">Title</Label>
            <Input
              id="n-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="A-TECH"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="n-msg">Message</Label>
          <Textarea
            id="n-msg"
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        <Button type="submit">Send notification</Button>
      </form>

      <ul className="mt-5 space-y-2 text-sm">
        {recent.slice(0, 15).map((n) => (
          <li key={n.id} className="border-b pb-2">
            <div className="font-medium">{n.title}</div>
            <div className="text-xs text-muted-foreground">
              {n.message} · {formatDate(n.created_at)}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
