import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Save, Send, Award } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadCertificate, type CertificateValues } from "@/lib/certificate";
import { certificateSchema, certificateStatistics } from "@/lib/certificate-rules";
import { saveCertificate } from "@/lib/certificates.functions";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApplicationDetails } from "./ApplicationDetails";

export function CertificatesPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const empty: CertificateValues = { fullName: "", courseName: "", startDate: today, endDate: today, issueDate: today, number: "", director: "", headOfDepartment: "", studentId: "", reference: "", duration: "", award: "" };
  const [form, setForm] = useState(empty);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const save = useServerFn(saveCertificate);
  const client = useQueryClient();
  const { data: content } = useSiteContent();
  const records = useQuery({ queryKey: ["certificate-admin-records"], queryFn: async () => {
    const [apps, courses, certificates, grades, files] = await Promise.all([
      supabase.from("applications").select("*").eq("status", "accepted").order("full_name"),
      supabase.from("courses").select("*"), supabase.from("certificates").select("*"),
      supabase.from("grades").select("student_user_id,course_code,score"),
      supabase.from("application_documents").select("application_id"),
    ]);
    for (const result of [apps, courses, certificates, grades, files]) if (result.error) throw new Error(result.error.message);
    return { apps: apps.data ?? [], courses: courses.data ?? [], certificates: certificates.data ?? [], grades: grades.data ?? [], files: files.data ?? [] };
  } });
  const app = records.data?.apps.find((a) => a.id === selected);
  const existing = records.data?.certificates.find((c) => c.application_id === selected);
  const course = records.data?.courses.find((c) => c.code === app?.course_code);
  const stats = certificateStatistics((records.data?.grades ?? []).filter((g) => g.student_user_id === app?.user_id && g.course_code === app?.course_code).map((g) => g.score));
  async function persist(issue: boolean) {
    const validated = certificateSchema.safeParse(form);
    if (!validated.success) { toast.error(validated.error.issues[0]?.message || "Check certificate information"); return; }
    setBusy(true);
    try { await save({ data: { applicationId: selected, values: validated.data, issue } }); await client.invalidateQueries({ queryKey: ["certificate-admin-records"] }); toast.success(issue ? "Certificate issued to student" : "Certificate draft saved"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save certificate"); }
    finally { setBusy(false); }
  }
  return <section className="space-y-5">
    <h2 className="gold-rule flex items-center gap-2 pb-2 text-xl"><Award className="text-primary" />Certificates of achievement</h2>
    {records.isPending && <p role="status">Loading students…</p>}
    {records.error && <p role="alert" className="text-destructive">{records.error.message}<Button variant="link" onClick={() => records.refetch()}>Retry</Button></p>}
    <label className="block text-sm">Accepted student<select className="mt-2 h-10 w-full rounded border bg-background px-3" value={selected} disabled={busy} onChange={(e) => {
      setSelected(e.target.value);
      const a = records.data?.apps.find((item) => item.id === e.target.value);
      if (!a) { setForm(empty); return; }
      const c = records.data?.courses.find((item) => item.code === a.course_code);
      const saved = records.data?.certificates.find((item) => item.application_id === a.id);
      const parsed = certificateSchema.safeParse(saved?.values);
      setForm(parsed.success ? parsed.data : { ...empty, fullName: a.full_name, courseName: c?.name || a.course_code, studentId: a.student_id || "", reference: a.reference, duration: c?.duration || "", number: `CERT/${a.student_id || a.reference}`, director: content?.signatory_name || "A-TECH" });
    }}><option value="">Select student</option>{(records.data?.apps ?? []).map((a) => <option key={a.id} value={a.id}>{a.full_name} · {a.student_id || a.reference} · {a.course_code}</option>)}</select></label>
    {app && <>
      <dl className="grid grid-cols-2 gap-4 border-y py-4 sm:grid-cols-4">{[["Application", app.reference], ["Admission", app.status], ["Documents", records.data?.files.filter((f) => f.application_id === app.id).length ?? 0], ["Results / average", `${stats.results} / ${stats.average ?? "—"}`]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words font-semibold">{value}</dd></div>)}</dl>
      <ApplicationDetails application={app} course={course} />
      <p className="text-sm font-semibold text-primary">{existing?.status === "issued" ? "Issued to student" : existing ? "Saved draft" : "Not issued"}</p>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void persist(true); }}>
        {([["fullName", "Student full name"], ["courseName", "Course / programme"], ["startDate", "Start date"], ["endDate", "End date"], ["number", "Certificate number"], ["issueDate", "Issue date"], ["duration", "Course duration"], ["award", "Achievement / distinction"], ["director", "Director name"], ["headOfDepartment", "Head of department"]] as const).map(([key, label]) => <label key={key} className="text-sm">{label}<Input className="mt-1" type={key.endsWith("Date") ? "date" : "text"} required={["fullName", "courseName", "startDate", "endDate", "number", "issueDate"].includes(key)} maxLength={key === "fullName" || key === "courseName" || key === "award" || key === "number" ? 150 : 90} value={form[key]} disabled={busy} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="button" variant="outline" disabled={busy} onClick={async () => { const result = certificateSchema.safeParse(form); if (!result.success) { toast.error("Complete certificate information first"); return; } try { await downloadCertificate(result.data); } catch { toast.error("Could not download PDF"); } }}><Download />Preview PDF</Button>
          <Button type="button" variant="secondary" disabled={busy || existing?.status === "issued"} onClick={() => persist(false)}><Save />Save draft</Button>
          <Button type="submit" disabled={busy}><Send />{busy ? "Saving…" : existing?.status === "issued" ? "Publish revision" : "Issue to student"}</Button>
        </div>
      </form>
    </>}
  </section>;
}