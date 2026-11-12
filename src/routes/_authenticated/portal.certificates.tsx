import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Download, Award } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { certificateSchema, certificateStatistics } from "@/lib/certificate-rules";
import { downloadCertificate } from "@/lib/certificate";
import { Button } from "@/components/ui/button";

const studentCertificates = queryOptions({ queryKey: ["student-certificates"], staleTime: 0, queryFn: async () => {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Sign in to view certificates");
  const [certificates, applications, grades, files] = await Promise.all([
    supabase.from("certificates").select("*").eq("user_id", auth.user.id).eq("status", "issued").order("issued_at", { ascending: false }),
    supabase.from("applications").select("*").eq("user_id", auth.user.id),
    supabase.from("grades").select("course_code,score").eq("student_user_id", auth.user.id),
    supabase.from("application_documents").select("application_id").eq("user_id", auth.user.id),
  ]);
  for (const result of [certificates, applications, grades, files]) if (result.error) throw new Error(result.error.message);
  return { certificates: certificates.data ?? [], applications: applications.data ?? [], grades: grades.data ?? [], files: files.data ?? [] };
} });
export const Route = createFileRoute("/_authenticated/portal/certificates")({
  head: () => ({ meta: [
    { title: "My Certificates | A-TECH" }, { name: "description", content: "Your issued A-TECH certificates and course achievement records." },
    { property: "og:title", content: "My Certificates | A-TECH" }, { property: "og:description", content: "Your issued A-TECH certificates and course achievement records." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(studentCertificates), component: CertificatesPage,
});
function CertificatesPage() {
  const { data } = useSuspenseQuery(studentCertificates);
  return <div className="space-y-6"><h1 className="flex items-center gap-2 text-2xl font-bold"><Award className="text-primary" />My certificates</h1>
    {data.certificates.length === 0 && <p className="border-y py-8 text-muted-foreground">No certificates have been issued yet.</p>}
    {data.certificates.map((certificate) => {
      const parsed = certificateSchema.safeParse(certificate.values);
      if (!parsed.success) return <p key={certificate.id} role="alert">Certificate information unavailable. Contact A-TECH.</p>;
      const values = parsed.data;
      const application = data.applications.find((a) => a.id === certificate.application_id);
      const stats = certificateStatistics(data.grades.filter((g) => g.course_code === application?.course_code).map((g) => g.score));
      const facts = [["Student ID", values.studentId], ["Application reference", values.reference], ["Admission", application?.status], ["Submitted", application?.submitted_at.slice(0, 10)], ["Duration", values.duration], ["Training dates", `${values.startDate} – ${values.endDate}`], ["Documents submitted", data.files.filter((f) => f.application_id === certificate.application_id).length], ["Results recorded", stats.results], ["Average score", stats.average ?? "—"], ["Issued", values.issueDate]];
      return <article key={certificate.id} className="card-elevated overflow-hidden"><div className="brand-bar p-5"><p className="text-xs uppercase text-gold-soft">Certificate of achievement</p><h2 className="mt-2 break-words text-xl text-primary-foreground">{values.courseName}</h2><p className="mt-1 break-words text-sm text-primary-foreground">{values.fullName}</p></div><div className="space-y-5 p-5"><p className="break-words text-sm font-semibold">{values.number}</p><dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{facts.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words text-sm font-semibold">{value || (value === 0 ? "0" : "—")}</dd></div>)}</dl><Button onClick={async () => { try { await downloadCertificate(values); } catch { toast.error("Could not download certificate"); } }}><Download />Download certificate PDF</Button></div></article>;
    })}
  </div>;
}