import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadCertificate, type CertificateValues } from "@/lib/certificate";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function CertificatesPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<CertificateValues>({ fullName: "", courseName: "", startDate: today, endDate: today, issueDate: today, number: "", director: "", headOfDepartment: "" });
  const { data: content } = useSiteContent();
  const { data: apps } = useQuery({ queryKey: ["certificate-apps"], queryFn: async () => { const { data, error } = await supabase.from("applications").select("id,full_name,student_id,course_code").eq("status", "accepted"); if (error) throw error; return data ?? []; } });
  const { data: courses } = useQuery({ queryKey: ["certificate-courses"], queryFn: async () => (await supabase.from("courses").select("code,name")).data ?? [] });
  const [busy, setBusy] = useState(false);
  return <section className="space-y-5"><h2 className="gold-rule pb-2 text-xl">Certificates of achievement</h2>
    <label className="block text-sm">Accepted student<select className="mt-2 h-10 w-full rounded border bg-background px-3" defaultValue="" onChange={(e) => { const app = apps?.find((a) => a.id === e.target.value); if (app) setForm({ ...form, fullName: app.full_name, courseName: courses?.find((c) => c.code === app.course_code)?.name || app.course_code, number: app.student_id ? `CERT/${app.student_id}` : `CERT/${app.id.slice(0, 8).toUpperCase()}` }); }}><option value="">Select student</option>{(apps ?? []).map((app) => <option key={app.id} value={app.id}>{app.full_name} · {app.student_id}</option>)}</select></label>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (form.endDate < form.startDate) { toast.error("End date must be on or after the start date"); return; } setBusy(true); try { await downloadCertificate({ ...form, director: form.director || content?.signatory_name || "A-TECH" }); } catch { toast.error("Could not generate certificate"); } finally { setBusy(false); } }}>
      {([ ["fullName", "Student full name"], ["courseName", "Course / programme"], ["startDate", "Start date"], ["endDate", "End date"], ["number", "Certificate number"], ["issueDate", "Issue date"], ["director", "Director name"], ["headOfDepartment", "Head of department"] ] as const).map(([key, label]) => <label key={key} className="text-sm">{label}<Input className="mt-1" type={key.endsWith("Date") ? "date" : "text"} required={!["director", "headOfDepartment"].includes(key)} maxLength={key === "courseName" ? 150 : 90} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></label>)}
      <Button type="submit" disabled={busy} className="justify-self-start">Download certificate PDF</Button>
    </form>
  </section>;
}