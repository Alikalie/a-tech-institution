import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/portal/schedule")({
  component: SchedulePage,
});

function SchedulePage() {
  const { data } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const [schedules, courses] = await Promise.all([
        supabase.from("schedules").select("*").order("day_label"),
        supabase.from("courses").select("code, name"),
      ]);
      return { schedules: schedules.data ?? [], courses: courses.data ?? [] };
    },
  });

  const rows = data?.schedules ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Class timetable</h1>
        <p className="text-sm text-muted-foreground">
          Published by the A-TECH administration. Check back for changes.
        </p>
      </div>
      <div className="card-elevated overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Course</th>
              <th className="p-3">Class</th>
              <th className="p-3">Day</th>
              <th className="p-3">Time</th>
              <th className="p-3">Venue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="p-3">
                  {data?.courses.find((c) => c.code === s.course_code)?.name ?? s.course_code}
                </td>
                <td className="p-3">{s.title}</td>
                <td className="p-3">{s.day_label}</td>
                <td className="p-3">{s.time_label}</td>
                <td className="p-3 text-muted-foreground">{s.venue}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-6 text-center text-muted-foreground" colSpan={5}>
                  No classes scheduled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
