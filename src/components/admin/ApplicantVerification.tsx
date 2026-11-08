import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ScanSearch, Square, LoaderCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getApplicationFiles } from "@/lib/portal.functions";
import { verificationReport, type VerificationReport } from "@/lib/verification";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["applications"]["Row"];
export function ApplicantVerification({ application }: { application: Application }) {
  const [open, setOpen] = useState(false);
  return <><Button size="sm" variant="outline" onClick={() => setOpen(true)}><ScanSearch className="size-4" />AI verification</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Verify {application.full_name}</DialogTitle><DialogDescription>{application.reference} · Submitted answers and supporting evidence</DialogDescription></DialogHeader>
      {open && <VerificationBody application={application} />}
    </DialogContent></Dialog></>;
}
function VerificationBody({ application }: { application: Application }) {
  const filesFn = useServerFn(getApplicationFiles);
  const files = useQuery({ queryKey: ["verification-files", application.id], queryFn: () => filesFn({ data: { applicationId: application.id } }) });
  const [excluded, setExcluded] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const abort = useRef<AbortController | null>(null);
  const selected = (files.data ?? []).filter((f) => !excluded.includes(f.id));
  async function run(accessRestored = false) {
    setBusy(true); setError(""); setReport(null);
    const controller = new AbortController(); abort.current = controller;
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Sign in again to verify this application.");
      const response = await fetch("/api/public/verify-application", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ applicationId: application.id, documentIds: selected.map((f) => f.id), notes, accessRestored }), signal: controller.signal });
      if (!response.ok) {
        const failure = await response.json(); setBlocked(Boolean(failure.accessBlocked));
        throw new Error(failure.error ?? "AI verification is unavailable.");
      }
      if (!response.body) throw new Error("AI returned an empty response.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let completed = false;
      const receive = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === "error") { setBlocked(Boolean(event.accessBlocked)); throw new Error(event.error); }
        if (event.type === "result") { setReport(verificationReport.parse(event.report)); setBlocked(false); completed = true; }
      };
      while (true) { const chunk = await reader.read(); if (chunk.done) break; buffer += decoder.decode(chunk.value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop() ?? ""; lines.forEach(receive); }
      buffer += decoder.decode(); receive(buffer);
      if (!completed) throw new Error("Verification ended without a report. Check the evidence manually.");
    } catch (e) { setError(controller.signal.aborted ? "Verification stopped." : e instanceof Error ? e.message : "Verification could not complete."); }
    finally { setBusy(false); abort.current = null; }
  }
  return <div className="min-w-0 space-y-5">
    <details className="border-b pb-3"><summary className="cursor-pointer text-sm font-semibold">Submitted answers</summary><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
      {Object.entries(application).filter(([key]) => !["user_id", "id", "reviewed_at"].includes(key)).map(([key, value]) => <div key={key} className="min-w-0"><dt className="capitalize text-muted-foreground">{key.replaceAll("_", " ")}</dt><dd className="break-words">{value == null || value === "" ? "Not provided" : typeof value === "object" ? JSON.stringify(value) : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</dd></div>)}
    </dl></details>
    <div><h3 className="mb-2 text-sm font-semibold">Uploaded evidence ({selected.length} selected)</h3>
      {files.isLoading && <p className="text-sm text-muted-foreground">Loading documents…</p>}
      {files.error && <p role="alert" className="text-sm text-destructive">Could not load evidence. <Button size="sm" variant="outline" onClick={() => files.refetch()}>Try again</Button></p>}
      {files.data?.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
      <ul className="divide-y">{(files.data ?? []).map((f) => <li key={f.id} className="flex min-w-0 items-center gap-3 py-3"><Checkbox id={`evidence-${f.id}`} disabled={busy} checked={!excluded.includes(f.id)} onCheckedChange={(checked) => { setReport(null); setExcluded((old) => checked ? old.filter((id) => id !== f.id) : [...old, f.id]); }} />
        <label htmlFor={`evidence-${f.id}`} className="min-w-0 flex-1 text-sm"><span className="block font-medium">{f.docType}</span><span className="block break-all text-xs text-muted-foreground">{f.fileName}</span></label>
        {f.url && <Button asChild variant="ghost" size="icon"><a href={f.url} target="_blank" rel="noreferrer" aria-label={`Open ${f.docType}`}><ExternalLink className="size-4" /></a></Button>}
      </li>)}</ul>
    </div>
    <div><label htmlFor={`review-notes-${application.id}`} className="text-sm font-semibold">Verification focus (optional)</label><Textarea id={`review-notes-${application.id}`} value={notes} disabled={busy} maxLength={2000} className="mt-2" onChange={(e) => { setNotes(e.target.value); setReport(null); }} placeholder="For example: compare the qualification stated with the certificate." /></div>
    <p className="text-xs text-muted-foreground">Submitted answers and selected evidence are sent to Lovable AI. Medical and disability answers are excluded. Findings are advisory, not admission decisions. AI usage consumes workspace credits.</p>
    <div className="flex flex-wrap gap-2">{busy ? <Button variant="outline" onClick={() => abort.current?.abort()}><Square className="size-4" />Stop verification</Button> : <Button disabled={files.isLoading || Boolean(files.error) || blocked} onClick={() => run()}><ScanSearch className="size-4" />Run AI verification</Button>}
      {blocked && !busy && <Button variant="outline" onClick={() => { if (window.confirm("Only continue if AI access has been restored by your workspace administrator.")) run(true); }}>Access restored — start new review</Button>}
    </div>
    {busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />Reviewing answers and evidence…</p>}
    {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
    {report && <section aria-label="AI verification report" className="space-y-4 border-t pt-4"><h3 className="font-semibold">Verification report</h3><p className="text-sm">{report.summary}</p>
      {!report.findings.length && <p className="text-sm text-muted-foreground">No inconsistencies flagged in the provided evidence. Manual verification is still required.</p>}
      <ol className="divide-y">{report.findings.map((finding, i) => <li key={i} className="space-y-2 py-4 text-sm"><div className="flex flex-wrap items-center gap-2"><span className={finding.severity === "high" ? "text-destructive" : finding.severity === "medium" ? "text-warning" : "text-muted-foreground"}>{finding.severity.toUpperCase()} · {finding.category.replaceAll("_", " ")}</span><h4 className="font-semibold">{finding.title}</h4></div><p>{finding.explanation}</p><p className="break-words text-xs text-muted-foreground"><strong>Sources:</strong> {finding.sources.join("; ") || "Not cited — verify manually"}</p><p><strong>Follow-up:</strong> {finding.followUp}</p></li>)}</ol>
      <div className="text-xs text-muted-foreground"><h4 className="font-semibold">Limitations</h4><ul className="mt-1 list-disc space-y-1 pl-4">{report.limitations.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
    </section>}
  </div>;
}