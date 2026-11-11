import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { manageRecords } from "@/lib/portal.functions";
import { editableTables, recordKey } from "@/lib/admin-rules";
export function RecordsManager() {
  const [table, setTable] = useState<(typeof editableTables)[number]>("applications");
  const [selected, setSelected] = useState<string | undefined>();
  const [draft, setDraft] = useState("{}");
  const [search, setSearch] = useState("");
  const fn = useServerFn(manageRecords);
  const qc = useQueryClient();
  const rows = useQuery({ queryKey: ["managed-records", table], queryFn: async () => JSON.parse(await fn({ data: { table, action: "list" } })) as Record<string, unknown>[] });
  const mutation = useMutation({ mutationFn: (action: "insert" | "update" | "delete") => {
    const record: unknown = action === "delete" ? {} : JSON.parse(draft);
    if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("Enter one record object.");
    return fn({ data: { table, action, ...(selected ? { id: selected } : {}), record: JSON.stringify(record) } });
  }, onSuccess: () => { toast.success("Record saved"); setSelected(undefined); setDraft("{}"); qc.invalidateQueries(); }, onError: (e: Error) => toast.error(e.message) });
  return <section className="min-w-0 space-y-4"><h2 className="gold-rule pb-2 text-xl">Data management</h2>
    <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Record type<select className="mt-1 h-10 w-full rounded border bg-background px-3" value={table} onChange={(e) => { setTable(e.target.value as typeof table); setSelected(undefined); setDraft("{}"); }}>{editableTables.map((t) => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}</select></label><label className="text-sm">Search<input className="mt-1 h-10 w-full rounded border bg-background px-3" value={search} onChange={(e) => setSearch(e.target.value)} /></label></div>
    {rows.error && <p role="alert" className="text-sm text-destructive">{rows.error.message}</p>}
    <div className="max-h-72 overflow-auto border"><table className="w-full table-fixed text-sm"><tbody>{(rows.data ?? []).filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase())).map((r) => <tr className="border-b" key={String(r[recordKey(table)])}><td className="truncate p-3">{String(r["full_name"] || r["name"] || r["title"] || r["reference"] || r["label"] || r["assessment"] || r[recordKey(table)])}</td><td className="w-20 p-2"><Button variant="outline" size="sm" onClick={() => { setSelected(String(r[recordKey(table)])); setDraft(JSON.stringify(r, null, 2)); }}>Edit</Button></td></tr>)}</tbody></table></div>
    <label className="block text-sm">{selected ? "Edit record" : "New record"}<Textarea aria-label="Record values" className="mt-2 font-mono text-xs" rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} /></label>
    <div className="flex flex-wrap gap-2"><Button disabled={mutation.isPending} onClick={() => mutation.mutate(selected ? "update" : "insert")}>{selected ? "Update record" : "Create record"}</Button><Button variant="outline" onClick={() => { setSelected(undefined); setDraft("{}"); }}>New record</Button>{selected && <Button variant="destructive" disabled={mutation.isPending} onClick={() => confirm("Permanently delete this record? Linked records may prevent deletion.") && mutation.mutate("delete")}>Delete record</Button>}</div>
  </section>;
}