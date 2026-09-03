import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listAccounts,
  listApplications,
  issuePaymentCode,
  setUserRole,
  decideApplication,
} from "@/lib/portal.functions";
import { formatDate, statusTone } from "@/lib/atech";

export const Route = createFileRoute("/_authenticated/portal/admin")({
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const accountsFn = useServerFn(listAccounts);
  const applicationsFn = useServerFn(listApplications);
  const issueFn = useServerFn(issuePaymentCode);
  const roleFn = useServerFn(setUserRole);
  const decideFn = useServerFn(decideApplication);
  const [search, setSearch] = useState("");

  const accounts = useQuery({ queryKey: ["admin-accounts"], queryFn: () => accountsFn() });
  const applications = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => applicationsFn(),
  });

  const issue = useMutation({
    mutationFn: (userId: string) => issueFn({ data: { userId } }),
    onSuccess: (res) => {
      toast.success(`Verification code ${res.code} issued and sent to the applicant.`);
      qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const role = useMutation({
    mutationFn: (v: { userId: string; role: "admin" | "tutor" | "student"; grant: boolean }) =>
      roleFn({ data: v }),
    onSuccess: () => {
      toast.success("Roles updated.");
      qc.invalidateQueries({ queryKey: ["admin-accounts"] });
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
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const term = search.trim().toLowerCase();
  const rows = (accounts.data ?? []).filter((a) =>
    !term
      ? true
      : [a.full_name, a.email, a.phone, a.student_id, a.payment?.reference]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="gold-rule pb-2 text-2xl">Administration</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate payment verification codes, manage roles and decide applications.
        </p>
      </header>

      <section className="card-elevated p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg">User accounts ({rows.length})</h2>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, reference…"
            className="max-w-xs"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
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
              {rows.map((a) => (
                <tr key={a.id} className="border-b align-top">
                  <td className="py-3 pr-3">
                    <div className="font-medium">{a.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                    {a.student_id ? (
                      <div className="text-xs text-accent">{a.student_id}</div>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    {a.roles.length ? a.roles.join(", ") : "applicant"}
                  </td>
                  <td className={`py-3 pr-3 text-xs ${a.verified ? "text-success" : "text-warning"}`}>
                    {a.verified ? "Verified" : "Pending"}
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    <div className="font-mono text-sm">{a.payment?.code ?? "—"}</div>
                    <div className="text-muted-foreground">{a.payment?.reference ?? "no payment record"}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={issue.isPending}
                        onClick={() => issue.mutate(a.id)}
                      >
                        {a.payment?.code ? "Regenerate code" : "Generate code"}
                      </Button>
                      {(["tutor", "admin"] as const).map((r) => (
                        <Button
                          key={r}
                          size="sm"
                          variant="outline"
                          disabled={role.isPending}
                          onClick={() =>
                            role.mutate({ userId: a.id, role: r, grant: !a.roles.includes(r) })
                          }
                        >
                          {a.roles.includes(r) ? `Remove ${r}` : `Make ${r}`}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    {accounts.isLoading ? "Loading accounts…" : "No accounts found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-elevated p-4">
        <h2 className="text-lg">Applications ({applications.data?.length ?? 0})</h2>
        <div className="mt-4 space-y-3">
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
                <div className={`text-xs font-semibold ${statusTone(app.status)}`}>{app.status}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={decide.isPending || app.status === "accepted"}
                  onClick={() =>
                    decide.mutate({ applicationId: app.id, decision: "accepted" })
                  }
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={decide.isPending || app.status === "rejected"}
                  onClick={() =>
                    decide.mutate({ applicationId: app.id, decision: "rejected" })
                  }
                >
                  Reject
                </Button>
              </div>
            </article>
          ))}
          {!applications.data?.length ? (
            <p className="text-sm text-muted-foreground">
              {applications.isLoading ? "Loading applications…" : "No applications submitted yet."}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
