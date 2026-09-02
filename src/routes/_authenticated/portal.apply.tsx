import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePortal } from "@/hooks/usePortal";

export const Route = createFileRoute("/_authenticated/portal/apply")({
  component: ApplyPage,
});

const initial = {
  full_name: "",
  dob: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  guardian_name: "",
  guardian_phone: "",
  previous_education: "",
  course_code: "",
};

function ApplyPage() {
  const { data: portal, refresh } = usePortal();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...initial });
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const set = (k: keyof typeof initial) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!portal?.profile?.verified) {
    return (
      <div className="card-elevated max-w-lg p-6">
        <h1 className="text-xl font-bold">Application locked</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your A-TECH account must be verified with a payment code before the application form
          opens.
        </p>
        <Button asChild className="mt-4">
          <Link to="/portal/verify">Verify payment code</Link>
        </Button>
      </div>
    );
  }

  async function submit() {
    setBusy(true);
    try {
      if (!form.full_name.trim()) throw new Error("Enter your full name.");
      if (!form.course_code) throw new Error("Select a programme.");
      const reference = `ATECH-${new Date().getFullYear()}-${String(
        Math.floor(100000 + Math.random() * 900000),
      )}`;
      const { error } = await supabase.from("applications").insert({
        reference,
        user_id: portal!.userId,
        course_code: form.course_code,
        full_name: form.full_name.trim(),
        dob: form.dob || null,
        gender: form.gender || null,
        phone: form.phone || null,
        email: form.email || portal!.profile?.email || null,
        address: form.address || null,
        guardian_name: form.guardian_name || null,
        guardian_phone: form.guardian_phone || null,
        previous_education: form.previous_education || null,
        status: "submitted",
      });
      if (error) throw new Error(error.message);
      toast.success("Application submitted. You can now download your form.");
      refresh();
      navigate({ to: "/portal/applications" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  }

  const courseName = courses?.find((c) => c.code === form.course_code)?.name ?? "—";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Course application form</h1>
        <p className="text-sm text-muted-foreground">
          Complete every section, preview your details, then submit.
        </p>
      </div>

      {preview ? (
        <div className="card-elevated space-y-3 p-6">
          <h2 className="gold-rule pb-2 text-lg font-semibold">Preview your application</h2>
          {[
            ["Programme", courseName],
            ["Full name", form.full_name],
            ["Date of birth", form.dob],
            ["Gender", form.gender],
            ["Phone", form.phone],
            ["Email", form.email || portal.profile?.email || ""],
            ["Address", form.address],
            ["Guardian / next of kin", form.guardian_name],
            ["Guardian phone", form.guardian_phone],
            ["Previous education", form.previous_education],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[180px_1fr] gap-3 border-b py-1.5 text-sm">
              <span className="font-semibold text-muted-foreground">{k}</span>
              <span>{v || "—"}</span>
            </div>
          ))}
          <div className="flex gap-2 pt-3">
            <Button onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Submit application"}
            </Button>
            <Button variant="outline" onClick={() => setPreview(false)}>
              Back to edit
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            setPreview(true);
          }}
        >
          <Section title="Programme selection">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="course">Programme</Label>
              <select
                id="course"
                required
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.course_code}
                onChange={set("course_code")}
              >
                <option value="">Select a programme…</option>
                {(courses ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} — {c.duration}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          <Section title="Personal information">
            <F label="Full name" value={form.full_name} onChange={set("full_name")} required />
            <F label="Date of birth" type="date" value={form.dob} onChange={set("dob")} />
            <div className="space-y-1.5">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.gender}
                onChange={set("gender")}
              >
                <option value="">Select…</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
          </Section>

          <Section title="Contact information">
            <F label="Phone" value={form.phone} onChange={set("phone")} />
            <F label="Email" type="email" value={form.email} onChange={set("email")} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={form.address} onChange={set("address")} rows={2} />
            </div>
          </Section>

          <Section title="Next of kin / guardian">
            <F label="Guardian name" value={form.guardian_name} onChange={set("guardian_name")} />
            <F label="Guardian phone" value={form.guardian_phone} onChange={set("guardian_phone")} />
          </Section>

          <Section title="Other application information">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="prev">Previous education</Label>
              <Textarea
                id="prev"
                value={form.previous_education}
                onChange={set("previous_education")}
                rows={3}
              />
            </div>
          </Section>

          <Button type="submit">Preview application</Button>
        </form>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card-elevated p-5">
      <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-accent">
        {title}
      </legend>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function F({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  );
}
