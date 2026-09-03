import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listStudents, uploadGrade } from "@/lib/portal.functions";

export const Route = createFileRoute("/_authenticated/portal/tutor")({
  component: TutorPage,
});

const empty = {
  studentId: "",
  courseCode: "",
  assessment: "",
  score: "",
  grade: "",
  remarks: "",
};

function TutorPage() {
  const qc = useQueryClient();
  const studentsFn = useServerFn(listStudents);
  const uploadFn = useServerFn(uploadGrade);
  const [form, setForm] = useState(empty);

  const students = useQuery({ queryKey: ["tutor-students"], queryFn: () => studentsFn() });
  const courses = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: () =>
      uploadFn({
        data: {
          studentId: form.studentId,
          courseCode: form.courseCode,
          assessment: form.assessment,
          score: Number(form.score),
          grade: form.grade,
          remarks: form.remarks,
        },
      }),
    onSuccess: (res) => {
      if (!res.ok) return toast.error(res.message);
      toast.success(res.message);
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["tutor-students"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="gold-rule pb-2 text-2xl">Students, grades &amp; results</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload results against an A-TECH Student ID. Students see them instantly in their portal.
        </p>
      </header>

      <section className="card-elevated p-4">
        <h2 className="text-lg">Upload a result</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            upload.mutate();
          }}
        >
          <div>
            <Label htmlFor="studentId">A-TECH Student ID</Label>
            <Input
              id="studentId"
              value={form.studentId}
              onChange={set("studentId")}
              placeholder="ATECH/2026/0001"
              required
            />
          </div>
          <div>
            <Label htmlFor="courseCode">Course</Label>
            <select
              id="courseCode"
              value={form.courseCode}
              onChange={(e) => setForm((f) => ({ ...f, courseCode: e.target.value }))}
              required
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select a course</option>
              {(courses.data ?? []).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="assessment">Assessment</Label>
            <Input id="assessment" value={form.assessment} onChange={set("assessment")} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="score">Score (%)</Label>
              <Input id="score" type="number" min={0} max={100} value={form.score} onChange={set("score")} />
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" value={form.grade} onChange={set("grade")} placeholder="A" />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea id="remarks" value={form.remarks} onChange={set("remarks")} rows={3} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={upload.isPending}>
              {upload.isPending ? "Uploading…" : "Upload result"}
            </Button>
          </div>
        </form>
      </section>

      <section className="card-elevated p-4">
        <h2 className="text-lg">Class list ({students.data?.length ?? 0})</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3">Student ID</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Contact</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {(students.data ?? []).map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="py-2 pr-3 font-mono text-xs">{s.student_id}</td>
                  <td className="py-2 pr-3">{s.full_name}</td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">
                    {s.email} {s.phone ? `· ${s.phone}` : ""}
                  </td>
                  <td className="py-2 pr-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setForm((f) => ({ ...f, studentId: s.student_id ?? "" }))}
                    >
                      Grade
                    </Button>
                  </td>
                </tr>
              ))}
              {!students.data?.length ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    {students.isLoading ? "Loading students…" : "No students with an issued ID yet."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
