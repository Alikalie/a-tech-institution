import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { usePortal, primaryRole } from "@/hooks/usePortal";
import { claimFirstAdmin } from "@/lib/portal.functions";
import { formatDate, statusTone } from "@/lib/atech";

export const Route = createFileRoute("/_authenticated/portal/")({
  component: Dashboard,
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-elevated p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Dashboard() {
  const { data, refresh } = usePortal();
  const role = primaryRole(data?.roles ?? []);
  const profile = data?.profile;

  const { data: mine } = useQuery({
    queryKey: ["dashboard-mine", data?.userId],
    enabled: Boolean(data?.userId),
    queryFn: async () => {
      const [apps, notes, grades] = await Promise.all([
        supabase.from("applications").select("*").order("submitted_at", { ascending: false }),
        supabase.from("notifications").select("*").eq("read", false),
        supabase.from("grades").select("*").eq("student_user_id", data!.userId),
      ]);
      return {
        apps: apps.data ?? [],
        unread: (notes.data ?? []).length,
        grades: grades.data ?? [],
      };
    },
  });

  const { data: adminStats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: role === "admin",
    queryFn: async () => {
      const [profiles, apps, payments, roles] = await Promise.all([
        supabase.from("profiles").select("id, student_id"),
        supabase.from("applications").select("status"),
        supabase.from("payments").select("status"),
        supabase.from("user_roles").select("role"),
      ]);
      const a = apps.data ?? [];
      return {
        applicants: (profiles.data ?? []).length,
        students: (profiles.data ?? []).filter((p) => p.student_id).length,
        tutors: (roles.data ?? []).filter((r) => r.role === "tutor").length,
        pending: a.filter((x) => x.status === "submitted").length,
        accepted: a.filter((x) => x.status === "accepted").length,
        rejected: a.filter((x) => x.status === "rejected").length,
        paid: (payments.data ?? []).filter((p) => p.status === "paid").length,
        unpaid: (payments.data ?? []).filter((p) => p.status !== "paid").length,
      };
    },
  });

  const latest = mine?.apps?.[0];
  const steps = [
    ["Account created", true],
    ["Payment verified", Boolean(profile?.verified)],
    ["Application submitted", Boolean(latest)],
    ["Under review", latest?.status === "submitted" || latest?.status === "accepted"],
    ["Decision", latest?.status === "accepted" || latest?.status === "rejected"],
    ["Admission", Boolean(profile?.student_id)],
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {profile?.full_name || "A-TECH member"}</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.student_id
            ? `Student ID: ${profile.student_id}`
            : `Payment reference: ${data?.payment?.reference ?? "—"}`}
        </p>
      </div>

      {role === "admin" && adminStats && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total accounts" value={adminStats.applicants} />
            <Stat label="Students" value={adminStats.students} />
            <Stat label="Tutors" value={adminStats.tutors} />
            <Stat label="Pending applications" value={adminStats.pending} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Accepted" value={adminStats.accepted} />
            <Stat label="Rejected" value={adminStats.rejected} />
            <Stat label="Payments confirmed" value={adminStats.paid} />
            <Stat label="Payments pending" value={adminStats.unpaid} />
          </div>
          <Button asChild>
            <Link to="/portal/admin">Open administration</Link>
          </Button>
        </>
      )}

      {role === "student" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Results recorded" value={mine?.grades.length ?? 0} />
          <Stat label="Unread notifications" value={mine?.unread ?? 0} />
          <Stat label="Student ID" value={profile?.student_id ?? "—"} />
        </div>
      )}

      {(role === "applicant" || role === "student") && (
        <section className="card-elevated p-5">
          <h2 className="text-lg font-semibold">Application progress</h2>
          {latest && (
            <p className={`mt-1 text-sm font-semibold ${statusTone(latest.status)}`}>
              Status: {latest.status.toUpperCase()} · submitted {formatDate(latest.submitted_at)}
            </p>
          )}
          <ol className="mt-4 space-y-2 text-sm">
            {steps.map(([label, done]) => (
              <li key={label} className={done ? "text-foreground" : "text-muted-foreground"}>
                {done ? "✓" : "○"} {label}
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            {!profile?.verified ? (
              <Button asChild>
                <Link to="/portal/verify">Verify payment code</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/portal/apply">Apply for a course</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/portal/applications">My applications</Link>
            </Button>
          </div>
        </section>
      )}

      {role === "tutor" && (
        <Button asChild>
          <Link to="/portal/tutor">Manage students & grades</Link>
        </Button>
      )}

      {role !== "admin" && (
        <section className="card-elevated p-5">
          <h2 className="text-sm font-semibold">Set up the administrator account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            If A-TECH has no administrator yet, the first account can claim it. This stops working
            as soon as one administrator exists.
          </p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await claimFirstAdmin();
              if (res.claimed) {
                toast.success("You are now the A-TECH administrator.");
                refresh();
              } else {
                toast.error("An administrator already exists.");
              }
            }}
          >
            Claim administrator
          </Button>
        </section>
      )}
    </div>
  );
}
