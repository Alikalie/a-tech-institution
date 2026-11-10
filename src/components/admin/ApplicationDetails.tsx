import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getApplicationFiles } from "@/lib/portal.functions";
import { downloadApplicationPDF, downloadAcceptancePDF, loadLetterSettings, type Course } from "@/lib/atech";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["applications"]["Row"];
function answer(value: unknown): string {
  if (value === null || value === "" || value === undefined) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return Object.entries(value).map(([k, v]) => `${k.replaceAll("_", " ")}: ${answer(v)}`).join("\n");
  return String(value);
}
export function ApplicationDetails({ application, course }: { application: Application; course?: Course | undefined }) {
  const [open, setOpen] = useState(false);
  const filesFn = useServerFn(getApplicationFiles);
  const files = useQuery({ queryKey: ["application-files", application.id], enabled: open, staleTime: 0, queryFn: () => filesFn({ data: { applicationId: application.id } }) });
  const photo = files.data?.find((f) => f.docType === "Passport photograph")?.url;
  return <><Button size="sm" variant="outline" onClick={() => setOpen(true)}><FileText />View full details</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto">
      <DialogHeader><DialogTitle>{application.full_name}</DialogTitle><DialogDescription>{application.reference} · {course?.name || application.course_code} · {application.status}</DialogDescription></DialogHeader>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_128px]">
        <div className="flex flex-wrap items-start gap-2"><Button size="sm" disabled={files.isLoading} onClick={() => downloadApplicationPDF(application, course?.name || application.course_code, photo)}>Download application PDF</Button>
          {application.status === "accepted" && course && <Button size="sm" variant="secondary" onClick={async () => downloadAcceptancePDF(application, course, await loadLetterSettings())}>Acceptance letter</Button>}
        </div>
        {photo ? <img src={photo} alt={`Passport photograph of ${application.full_name}`} className="h-40 w-32 rounded border object-cover" /> : <div className="flex h-40 w-32 items-center justify-center border text-center text-xs text-muted-foreground">No passport photograph</div>}
      </div>
      <section><h3 className="mb-3 font-semibold">Submitted answers</h3><dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {Object.entries(application).filter(([key]) => !["id", "user_id"].includes(key)).map(([key, val]) => <div key={key} className="min-w-0 border-b pb-2"><dt className="text-xs capitalize text-muted-foreground">{key.replaceAll("_", " ")}</dt><dd className="mt-1 whitespace-pre-line break-words text-sm">{answer(val)}</dd></div>)}
      </dl></section>
      <section><h3 className="font-semibold">Uploaded documents</h3>{files.isLoading && <p role="status">Loading documents…</p>}{files.error && <p role="alert" className="text-destructive">Could not load documents. <Button variant="link" onClick={() => files.refetch()}>Retry</Button></p>}
        <ul className="divide-y">{(files.data ?? []).map((file) => <li key={file.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3"><span className="min-w-0 text-sm"><strong className="block">{file.docType}</strong><span className="break-all text-xs text-muted-foreground">{file.fileName}</span></span>{file.url ? <Button size="icon" variant="outline" asChild><a href={file.url} target="_blank" rel="noreferrer" aria-label={`Open ${file.docType}`}><ExternalLink /></a></Button> : <span className="text-xs text-muted-foreground">Unavailable</span>}</li>)}</ul>
        {files.data?.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No documents uploaded.</p>}
      </section>
    </DialogContent></Dialog>
  </>;
}