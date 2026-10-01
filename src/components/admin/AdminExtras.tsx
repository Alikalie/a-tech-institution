import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { downloadIdCard, type IdCard } from "@/lib/idcard";

const NAVY = "hsl(var(--primary))";
const COLORS = ["#1F3864", "#C9A227", "#2E6FB7", "#7A8CA8", "#E0B84A", "#3C5A8C"];

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-elevated min-w-0 p-4">
      <h2 className="gold-rule pb-2 text-lg">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

/* ----------------------------- Charts ----------------------------- */
export function AdminCharts() {
  const { data } = useQuery({
    queryKey: ["admin-charts"],
    queryFn: async () => {
      const [apps, pays, courses] = await Promise.all([
        supabase.from("applications").select("submitted_at, course_code, status"),
        supabase.from("payments").select("status"),
        supabase.from("courses").select("code, name"),
      ]);
      return { apps: apps.data ?? [], pays: pays.data ?? [], courses: courses.data ?? [] };
    },
  });
  const apps = data?.apps ?? [];
  const months: { month: string; applications: number; accepted: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const inMonth = apps.filter((a) => {
      const s = new Date(a.submitted_at);
      return `${s.getFullYear()}-${s.getMonth()}` === key;
    });
    months.push({
      month: d.toLocaleDateString("en-GB", { month: "short" }),
      applications: inMonth.length,
      accepted: inMonth.filter((a) => a.status === "accepted").length,
    });
  }
  const byCourse = (data?.courses ?? [])
    .map((c) => ({ name: c.code, full: c.name, value: apps.filter((a) => a.course_code === c.code).length }))
    .filter((c) => c.value > 0);
  const paid = (data?.pays ?? []).filter((p) => p.status === "paid").length;
  const pending = (data?.pays ?? []).length - paid;
  const statusData = ["submitted", "accepted", "rejected"].map((s) => ({
    name: s, value: apps.filter((a) => a.status === s).length,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Box title="Applications by month">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={months}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="applications" fill={COLORS[0]} />
              <Bar dataKey="accepted" fill={COLORS[1]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Box>
      <Box title="Applications by course">
        <div className="h-64">
          {byCourse.length ? (
            <ResponsiveContainer>
              <BarChart data={byCourse} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" width={60} fontSize={11} />
                <Tooltip formatter={(v, _n, p) => [v, (p.payload as { full: string }).full]} />
                <Bar dataKey="value" fill={COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          )}
        </div>
      </Box>
      <Box title="Accepted students vs other decisions">
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={80} label>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Box>
      <Box title="Payments: paid vs pending">
        <div className="h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={[{ name: "Paid", value: paid }, { name: "Pending", value: pending }]} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} label>
                <Cell fill={COLORS[0]} />
                <Cell fill={COLORS[1]} />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Box>
    </div>
  );
}
void NAVY;

/* ----------------------------- ID cards ----------------------------- */
export function IdCardsPanel() {
  const inv = useInvalidate();
  const { data } = useQuery({
    queryKey: ["admin-idcards"],
    queryFn: async () => {
      const [students, cards] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, student_id").not("student_id", "is", null),
        supabase.from("id_cards").select("*"),
      ]);
      return { students: students.data ?? [], cards: (cards.data ?? []) as IdCard[] };
    },
  });
  const generate = useMutation({
    mutationFn: async (s: { id: string; full_name: string; student_id: string | null }) => {
      const { data: app } = await supabase
        .from("applications").select("id, dob, course_code, full_name")
        .eq("user_id", s.id).order("submitted_at", { ascending: false }).limit(1).maybeSingle();
      let programme = "";
      if (app?.course_code) {
        const { data: c } = await supabase.from("courses").select("name").eq("code", app.course_code).maybeSingle();
        programme = c?.name ?? app.course_code;
      }
      const { data: photo } = await supabase.from("application_documents").select("storage_path")
        .eq("user_id", s.id).eq("doc_type", "Passport photograph").order("uploaded_at", { ascending: false }).limit(1).maybeSingle();
      const { data: u } = await supabase.auth.getUser();
      const valid = new Date();
      valid.setFullYear(valid.getFullYear() + 1);
      const row = {
        user_id: s.id,
        student_id: s.student_id!,
        full_name: s.full_name || app?.full_name || "Student",
        programme,
        dob: app?.dob ?? null,
        photo_path: photo?.storage_path ?? null,
        valid_until: valid.toISOString().slice(0, 10),
        issued_by: u.user?.id ?? null,
        issued_at: new Date().toISOString(),
      };
      const { data: saved, error } = await supabase.from("id_cards").upsert(row, { onConflict: "user_id" }).select().single();
      if (error) throw error;
      await supabase.from("notifications").insert({ user_id: s.id, title: "ID card ready", message: "Your A-TECH student ID card is ready. Download it from My documents." });
      return saved as IdCard;
    },
    onSuccess: (c) => { toast.success(`ID card generated for ${c.full_name}`); inv("admin-idcards"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("id_cards").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("ID card revoked"); inv("admin-idcards"); },
  });
  const cardFor = (uid: string) => data?.cards.find((c) => c.user_id === uid);
  return (
    <Box title="Student ID cards">
      <p className="mb-3 text-sm text-muted-foreground">Only students with an A-TECH Student ID appear here. Cards include the passport photo and a QR code.</p>
      <ul className="space-y-2 text-sm">
        {(data?.students ?? []).map((s) => {
          const card = cardFor(s.id);
          return (
            <li key={s.id} className="flex flex-col gap-2 border-b pb-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0">
                <span className="font-medium">{s.full_name || s.email}</span>{" "}
                <span className="font-mono text-xs text-accent">{s.student_id}</span>
                {card ? <span className="block text-xs text-muted-foreground">Valid until {card.valid_until}</span> : null}
              </span>
              <span className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={generate.isPending} onClick={() => generate.mutate(s)}>
                  {card ? "Regenerate" : "Generate ID card"}
                </Button>
                {card ? (
                  <>
                    <Button size="sm" onClick={() => downloadIdCard(card)}>Download / Print</Button>
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(card.id)}>Revoke</Button>
                  </>
                ) : null}
              </span>
            </li>
          );
        })}
        {!data?.students.length ? <li className="text-muted-foreground">No students with Student IDs yet.</li> : null}
      </ul>
    </Box>
  );
}

/* ----------------------------- Generic CRUD table ----------------------------- */
type FieldDef = { key: string; label: string; type?: "text" | "number" | "bool" | "textarea" | "select"; options?: string[] };

function CrudTable<T extends Record<string, unknown> & { id: string }>({
  title, table, fields, orderBy = "sort_order", defaults, help,
}: {
  title: string;
  table: "nav_links" | "programmes" | "form_fields";
  fields: FieldDef[];
  orderBy?: string;
  defaults: Record<string, unknown>;
  help?: string;
}) {
  const inv = useInvalidate();
  const key = `crud-${table}`;
  const { data } = useQuery({
    queryKey: [key],
    queryFn: async () => ((await supabase.from(table).select("*").order(orderBy)).data ?? []) as unknown as T[],
  });
  const [draft, setDraft] = useState<Record<string, unknown>>(defaults);
  const [editing, setEditing] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...draft };
      delete payload.id; delete payload.created_at;
      const q = editing
        ? supabase.from(table).update(payload as never).eq("id", editing)
        : supabase.from(table).insert(payload as never);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); setDraft(defaults); setEditing(null); inv(key, "site-nav", "public-programmes", "form-fields"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from(table).delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); inv(key, "site-nav", "public-programmes", "form-fields"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Box title={title}>
      {help ? <p className="mb-3 text-sm text-muted-foreground">{help}</p> : null}
      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
        {fields.map((f) => (
          <label key={f.key} className={`text-xs ${f.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : ""}`}>
            <span className="mb-1 block font-medium text-muted-foreground">{f.label}</span>
            {f.type === "bool" ? (
              <input type="checkbox" className="h-4 w-4" checked={Boolean(draft[f.key])} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.checked })} />
            ) : f.type === "textarea" ? (
              <Textarea value={String(draft[f.key] ?? "")} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} />
            ) : f.type === "select" ? (
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={String(draft[f.key] ?? "")} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}>
                {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <Input type={f.type === "number" ? "number" : "text"} value={String(draft[f.key] ?? "")}
                onChange={(e) => setDraft({ ...draft, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })} />
            )}
          </label>
        ))}
        <div className="flex items-end gap-2">
          <Button type="submit" size="sm" disabled={save.isPending}>{editing ? "Update" : "Add"}</Button>
          {editing ? <Button type="button" size="sm" variant="ghost" onClick={() => { setEditing(null); setDraft(defaults); }}>Cancel</Button> : null}
        </div>
      </form>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-muted-foreground">
              {fields.filter((f) => f.type !== "textarea").map((f) => <th key={f.key} className="py-2 pr-2">{f.label}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id} className="border-b">
                {fields.filter((f) => f.type !== "textarea").map((f) => (
                  <td key={f.key} className="py-2 pr-2">{f.type === "bool" ? (r[f.key] ? "Yes" : "No") : String(r[f.key] ?? "")}</td>
                ))}
                <td className="whitespace-nowrap py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(r.id); setDraft(r); }}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirm("Delete this item?") && del.mutate(r.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Box>
  );
}

export function NavLinksPanel() {
  return (
    <CrudTable
      title="Landing page navigation"
      table="nav_links"
      help="Links shown in the website header (and footer). Mark one as call-to-action to show it as a highlighted button."
      defaults={{ label: "", url: "/", sort_order: 10, is_cta: false, visible: true, location: "header" }}
      fields={[
        { key: "label", label: "Label" },
        { key: "url", label: "Link (e.g. /courses or https://…)" },
        { key: "sort_order", label: "Order", type: "number" },
        { key: "location", label: "Location", type: "select", options: ["header", "footer", "both"] },
        { key: "is_cta", label: "Call to action", type: "bool" },
        { key: "visible", label: "Visible", type: "bool" },
      ]}
    />
  );
}

export function ProgrammesPanel() {
  return (
    <CrudTable
      title="Programmes"
      table="programmes"
      help="Group courses into programmes. Assign a programme to each course in the Courses section."
      defaults={{ name: "", description: "", sort_order: 0 }}
      fields={[
        { key: "name", label: "Programme name" },
        { key: "sort_order", label: "Order", type: "number" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}

export function FormFieldsPanel() {
  return (
    <CrudTable
      title="Registration form fields"
      table="form_fields"
      help="Extra fields added here appear on the application form under their section. For dropdowns, list options separated by commas."
      defaults={{ field_key: "", label: "", section: "Additional information", field_type: "text", options: "", required: false, active: true, sort_order: 0 }}
      fields={[
        { key: "label", label: "Label" },
        { key: "field_key", label: "Unique key (e.g. church_name)" },
        { key: "section", label: "Section" },
        { key: "field_type", label: "Type", type: "select", options: ["text", "textarea", "number", "date", "select", "checkbox"] },
        { key: "options", label: "Options (comma separated)" },
        { key: "sort_order", label: "Order", type: "number" },
        { key: "required", label: "Required", type: "bool" },
        { key: "active", label: "Active", type: "bool" },
      ]}
    />
  );
}

/* ----------------------------- Site content ----------------------------- */
const CONTENT_KEYS: [string, string][] = [
  ["hero_title", "Home page headline"],
  ["hero_subtitle", "Home page introduction"],
  ["announcement", "Announcement banner (leave empty to hide)"],
  ["about_text", "About A-TECH text"],
  ["contact_phone", "Contact phone"],
  ["contact_email", "Contact email"],
  ["footer_text", "Footer text"],
];

export function SiteContentPanel() {
  const inv = useInvalidate();
  const { data } = useQuery({
    queryKey: ["site-content"],
    queryFn: async () => Object.fromEntries(((await supabase.from("site_content").select("*")).data ?? []).map((r) => [r.key, r.value])) as Record<string, string>,
  });
  const [vals, setVals] = useState<Record<string, string>>({});
  const merged = { ...(data ?? {}), ...vals };
  const save = useMutation({
    mutationFn: async () => {
      const rows = Object.entries(vals).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }));
      if (!rows.length) return;
      const { error } = await supabase.from("site_content").upsert(rows);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Website content updated"); setVals({}); inv("site-content"); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Box title="Website pages content">
      <div className="space-y-3">
        {CONTENT_KEYS.map(([k, label]) => (
          <label key={k} className="block text-xs">
            <span className="mb-1 block font-medium text-muted-foreground">{label}</span>
            <Textarea rows={k.includes("subtitle") || k.includes("about") ? 3 : 1} value={merged[k] ?? ""} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
          </label>
        ))}
        <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>Save content</Button>
      </div>
    </Box>
  );
}
