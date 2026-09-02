import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortal } from "@/hooks/usePortal";
import { formatDate } from "@/lib/atech";

export const Route = createFileRoute("/_authenticated/portal/grades")({
  component: GradesPage,
});

function GradesPage() {
  const { data: portal } = usePortal();
  const { data } = useQuery({
    queryKey: ["my-grades", portal?.userId],
    enabled: Boolean(portal?.userId),
    queryFn: async () => {
      const [grades, courses] = await Promise.all([
        supabase
          .from("grades")
          .select("*")
          .eq("student_user_id", portal!.userId)
          .order("created_at", { ascending: false }),
        supabase.from("courses").select("code, name"),
      ]);
      return { grades: grades.data ?? [], courses: courses.data ?? [] };
    },
  });

  const grades = data?.grades ?? [];
  const scores = grades.map((g) => Number(g.score ?? 0)).filter((n) => n > 0);
  const average = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Grades & results</h1>
        <p className="text-sm text-muted-foreground">
          Student ID {portal?.profile?.student_id ?? "—"} · average score {average}
        </p>
      </div>

      <div className="card-elevated overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Course</th>
              <th className="p-3">Assessment</th>
              <th className="p-3">Score</th>
              <th className="p-3">Grade</th>
              <th className="p-3">Remarks</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="p-3">
                  {data?.courses.find((c) => c.code === g.course_code)?.name ?? g.course_code}
                </td>
                <td className="p-3">{g.assessment}</td>
                <td className="p-3">{g.score ?? "—"}</td>
                <td className="p-3 font-semibold">{g.grade || "—"}</td>
                <td className="p-3 text-muted-foreground">{g.remarks || "—"}</td>
                <td className="p-3 text-muted-foreground">{formatDate(g.created_at)}</td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={6}>
                  No results have been published yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
