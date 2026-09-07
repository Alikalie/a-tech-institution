import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/hooks/usePortal";
import {
  downloadAcceptancePDF,
  downloadApplicationDoc,
  downloadApplicationPDF,
  formatDate,
  statusTone,
  type ApplicationRecord,
  type Course,
} from "@/lib/atech";

export const Route = createFileRoute("/_authenticated/portal/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { data: portal } = usePortal();
  const { data } = useQuery({
    queryKey: ["my-applications", portal?.userId],
    enabled: Boolean(portal?.userId),
    queryFn: async () => {
      const [apps, courses, documents] = await Promise.all([
        supabase
          .from("applications")
          .select("*")
          .eq("user_id", portal!.userId)
          .order("submitted_at", { ascending: false }),
        supabase.from("courses").select("*").order("sort_order"),
        supabase
          .from("application_documents")
          .select("application_id, doc_type, storage_path")
          .eq("doc_type", "Passport photograph"),
      ]);
      const photos: Record<string, string> = {};
      await Promise.all(
        (documents.data ?? []).map(async (item) => {
          if (!item.application_id) return;
          const signed = await supabase.storage
            .from("application-documents")
            .createSignedUrl(item.storage_path, 300);
          if (signed.data?.signedUrl) photos[item.application_id] = signed.data.signedUrl;
        }),
      );
      return { apps: (apps.data ?? []) as ApplicationRecord[], courses: (courses.data ?? []) as Course[], photos };
    },
  });

  const apps = data?.apps ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">My applications & documents</h1>
        <p className="text-sm text-muted-foreground">
          Download your application form or acceptance letter at any time.
        </p>
      </div>

      {apps.length === 0 && (
        <div className="card-elevated p-6">
          <p className="text-sm text-muted-foreground">You have not submitted an application yet.</p>
          <Button asChild className="mt-3">
            <Link to="/portal/apply">Start an application</Link>
          </Button>
        </div>
      )}

      {apps.map((app) => {
        const course = data!.courses.find((c) => c.code === app.course_code);
        return (
          <article key={app.id} className="card-elevated p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{course?.name ?? app.course_code}</h2>
                <p className="text-xs text-muted-foreground">
                  Ref {app.reference} · submitted {formatDate(app.submitted_at)}
                </p>
              </div>
              <span className={`text-sm font-semibold ${statusTone(app.status)}`}>
                {app.status.toUpperCase()}
              </span>
            </div>
            {app.student_id && (
              <p className="mt-2 text-sm">
                A-TECH Student ID: <span className="font-semibold">{app.student_id}</span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => downloadApplicationPDF(app, course?.name ?? app.course_code, data?.photos[app.id])}>
                Download application PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadApplicationDoc(app, course?.name ?? app.course_code, data?.photos[app.id])}
              >
                Download Word (.doc)
              </Button>
              {app.status === "accepted" && course && (
                <Button size="sm" variant="secondary" onClick={() => downloadAcceptancePDF(app, course)}>
                  Download acceptance letter
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
