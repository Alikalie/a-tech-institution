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

const REQUIRED_DOCS = [
  "Passport photograph",
  "Educational certificate",
  "National ID / Passport",
  "Payment receipt",
] as const;

const initial = {
  course_code: "",
  preferred_time: "",
  prefix: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "",
  dob: "",
  nationality: "",
  marital_status: "",
  id_number: "",
  phone: "",
  whatsapp: "",
  email: "",
  emergency_phone: "",
  country: "",
  province: "",
  district: "",
  city: "",
  street: "",
  address: "",
  kin_name: "",
  kin_relationship: "",
  kin_address: "",
  kin_email: "",
  kin_phone: "",
  father_name: "",
  mother_name: "",
  guardian_name: "",
  guardian_phone: "",
  blood_group: "",
  disability: "",
  disability_details: "",
  education_level: "",
  qualification: "",
  computer_level: "",
  has_laptop: "",
  previous_education: "",
  payment_method: "",
  guarantor_first_name: "",
  guarantor_last_name: "",
  guarantor_relationship: "",
  guarantor_phone: "",
  guarantor_whatsapp: "",
  guarantor_address: "",
};

type FormState = typeof initial;

function ApplyPage() {
  const { data: portal, refresh } = usePortal();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ ...initial });
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [declaration, setDeclaration] = useState(false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
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

  const fullName = [form.first_name, form.middle_name, form.last_name]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  async function submit() {
    setBusy(true);
    try {
      if (!fullName) throw new Error("Enter your name.");
      if (!form.course_code) throw new Error("Select a course of interest.");
      if (!declaration) throw new Error("Tick the declaration before submitting.");
      const userId = portal!.userId;
      const reference = `ATECH-${new Date().getFullYear()}-${String(
        Math.floor(100000 + Math.random() * 900000),
      )}`;

      const { data: inserted, error } = await supabase
        .from("applications")
        .insert({
          reference,
          user_id: userId,
          course_code: form.course_code,
          full_name: fullName,
          prefix: form.prefix || null,
          first_name: form.first_name || null,
          middle_name: form.middle_name || null,
          last_name: form.last_name || null,
          dob: form.dob || null,
          gender: form.gender || null,
          nationality: form.nationality || null,
          marital_status: form.marital_status || null,
          id_number: form.id_number || null,
          phone: form.phone || null,
          whatsapp: form.whatsapp || null,
          email: form.email || portal!.profile?.email || null,
          emergency_phone: form.emergency_phone || null,
          country: form.country || null,
          province: form.province || null,
          district: form.district || null,
          city: form.city || null,
          street: form.street || null,
          address: form.address || null,
          kin_name: form.kin_name || null,
          kin_relationship: form.kin_relationship || null,
          kin_address: form.kin_address || null,
          kin_email: form.kin_email || null,
          kin_phone: form.kin_phone || null,
          father_name: form.father_name || null,
          mother_name: form.mother_name || null,
          guardian_name: form.guardian_name || null,
          guardian_phone: form.guardian_phone || null,
          blood_group: form.blood_group || null,
          disability: form.disability || null,
          disability_details: form.disability_details || null,
          education_level: form.education_level || null,
          qualification: form.qualification || null,
          computer_level: form.computer_level || null,
          has_laptop: form.has_laptop ? form.has_laptop === "Yes" : null,
          preferred_time: form.preferred_time || null,
          previous_education: form.previous_education || null,
          payment_method: form.payment_method || null,
          guarantor_first_name: form.guarantor_first_name || null,
          guarantor_last_name: form.guarantor_last_name || null,
          guarantor_relationship: form.guarantor_relationship || null,
          guarantor_phone: form.guarantor_phone || null,
          guarantor_whatsapp: form.guarantor_whatsapp || null,
          guarantor_address: form.guarantor_address || null,
          declaration: true,
          status: "submitted",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      for (const docType of REQUIRED_DOCS) {
        const file = files[docType];
        if (!file) continue;
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${userId}/${reference}/${docType.replace(/\s+/g, "_")}_${Date.now()}_${safe}`;
        const up = await supabase.storage.from("application-documents").upload(path, file);
        if (up.error) throw new Error(`${docType}: ${up.error.message}`);
        await supabase.from("application_documents").insert({
          user_id: userId,
          application_id: inserted?.id ?? null,
          doc_type: docType,
          file_name: file.name,
          storage_path: path,
        });
      }

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
        <h1 className="text-2xl font-bold">A-TECH registration &amp; application form</h1>
        <p className="text-sm text-muted-foreground">
          Complete every section, attach your supporting documents, preview, then submit.
        </p>
      </div>

      {preview ? (
        <div className="card-elevated space-y-3 p-6">
          <h2 className="gold-rule pb-2 text-lg font-semibold">Preview your application</h2>
          {[
            ["Course of interest", courseName],
            ["Preferred time", form.preferred_time],
            ["Full name", `${form.prefix} ${fullName}`.trim()],
            ["Gender", form.gender],
            ["Date of birth", form.dob],
            ["Nationality", form.nationality],
            ["Marital status", form.marital_status],
            ["ID / Passport", form.id_number],
            ["Phone", form.phone],
            ["WhatsApp", form.whatsapp],
            ["Email", form.email || portal.profile?.email || ""],
            ["Emergency phone", form.emergency_phone],
            [
              "Address",
              [form.street, form.city, form.district, form.province, form.country]
                .filter(Boolean)
                .join(", ") || form.address,
            ],
            ["Next of kin", `${form.kin_name} ${form.kin_relationship && `(${form.kin_relationship})`}`.trim()],
            ["Next of kin phone", form.kin_phone],
            ["Father's name", form.father_name],
            ["Mother's name", form.mother_name],
            ["Parent / guardian phone", form.guardian_phone],
            ["Blood group", form.blood_group],
            ["Disability", form.disability],
            ["Level of education", form.education_level],
            ["Qualification", form.qualification],
            ["Computer literacy", form.computer_level],
            ["Personal laptop", form.has_laptop],
            ["Payment method", form.payment_method],
            [
              "Guarantor / sponsor",
              `${form.guarantor_first_name} ${form.guarantor_last_name}`.trim(),
            ],
            ["Guarantor phone", form.guarantor_phone],
            [
              "Documents attached",
              REQUIRED_DOCS.filter((d) => files[d]).join(", ") || "None",
            ],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[200px_1fr] gap-3 border-b py-1.5 text-sm">
              <span className="font-semibold text-muted-foreground">{k}</span>
              <span>{v || "—"}</span>
            </div>
          ))}

          <label className="flex items-start gap-2 pt-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={declaration}
              onChange={(e) => setDeclaration(e.target.checked)}
            />
            <span>
              I declare that all the information above is complete and correct, and that all
              attached documents and photographs are mine, for the A-TECH Computer Training.
            </span>
          </label>

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
          <Section title="Course selection">
            <div className="space-y-1.5">
              <Label htmlFor="course">Course of interest</Label>
              <select
                id="course"
                required
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.course_code}
                onChange={set("course_code")}
              >
                <option value="">Select a course…</option>
                {(courses ?? []).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} — {c.duration}
                  </option>
                ))}
              </select>
            </div>
            <Select
              label="Preferred time"
              value={form.preferred_time}
              onChange={set("preferred_time")}
              options={["Morning 10:00am – 12:30pm", "Afternoon 01:00pm – 02:30pm"]}
            />
          </Section>

          <Section title="Personal information">
            <Select label="Prefix" value={form.prefix} onChange={set("prefix")} options={["Mr", "Mrs", "Miss", "Ms", "Dr"]} />
            <F label="First name" value={form.first_name} onChange={set("first_name")} required />
            <F label="Middle name" value={form.middle_name} onChange={set("middle_name")} />
            <F label="Last name" value={form.last_name} onChange={set("last_name")} required />
            <Select label="Gender" value={form.gender} onChange={set("gender")} options={["Male", "Female"]} />
            <F label="Date of birth" type="date" value={form.dob} onChange={set("dob")} />
            <F label="Nationality" value={form.nationality} onChange={set("nationality")} />
            <Select
              label="Marital status"
              value={form.marital_status}
              onChange={set("marital_status")}
              options={["Single", "Married", "Divorced", "Widowed"]}
            />
            <F label="ID / Passport number" value={form.id_number} onChange={set("id_number")} />
          </Section>

          <Section title="Contact information">
            <F label="Phone" value={form.phone} onChange={set("phone")} />
            <F label="WhatsApp contact" value={form.whatsapp} onChange={set("whatsapp")} />
            <F label="Email" type="email" value={form.email} onChange={set("email")} />
            <F label="Emergency / reference phone" value={form.emergency_phone} onChange={set("emergency_phone")} />
          </Section>

          <Section title="Current address">
            <F label="Country" value={form.country} onChange={set("country")} />
            <F label="Province / region" value={form.province} onChange={set("province")} />
            <F label="District" value={form.district} onChange={set("district")} />
            <F label="City / town" value={form.city} onChange={set("city")} />
            <F label="Street" value={form.street} onChange={set("street")} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address details</Label>
              <Textarea id="address" value={form.address} onChange={set("address")} rows={2} />
            </div>
          </Section>

          <Section title="Next of kin / guardian">
            <F label="Name" value={form.kin_name} onChange={set("kin_name")} />
            <F label="Relationship" value={form.kin_relationship} onChange={set("kin_relationship")} />
            <F label="Telephone" value={form.kin_phone} onChange={set("kin_phone")} />
            <F label="Email" type="email" value={form.kin_email} onChange={set("kin_email")} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="kin-address">Address</Label>
              <Textarea id="kin-address" value={form.kin_address} onChange={set("kin_address")} rows={2} />
            </div>
          </Section>

          <Section title="Parent / guardian">
            <F label="Father's name" value={form.father_name} onChange={set("father_name")} />
            <F label="Mother's name" value={form.mother_name} onChange={set("mother_name")} />
            <F label="Parent / guardian name" value={form.guardian_name} onChange={set("guardian_name")} />
            <F label="Parent / guardian phone" value={form.guardian_phone} onChange={set("guardian_phone")} />
          </Section>

          <Section title="Medical / disability">
            <Select
              label="Blood group"
              value={form.blood_group}
              onChange={set("blood_group")}
              options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
            />
            <Select label="Disability" value={form.disability} onChange={set("disability")} options={["None", "Yes"]} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="disability-details">Disability details</Label>
              <Textarea
                id="disability-details"
                value={form.disability_details}
                onChange={set("disability_details")}
                rows={2}
              />
            </div>
          </Section>

          <Section title="Education & computer literacy">
            <Select
              label="Level of education"
              value={form.education_level}
              onChange={set("education_level")}
              options={["Primary School", "Junior Secondary School", "Senior Secondary School", "University"]}
            />
            <Select
              label="Educational qualification"
              value={form.qualification}
              onChange={set("qualification")}
              options={["NPSE", "BECE", "WASSCE", "Certificate", "Diploma", "Degree"]}
            />
            <Select
              label="Computer literacy level"
              value={form.computer_level}
              onChange={set("computer_level")}
              options={["None", "Beginner", "Intermediate", "Advance"]}
            />
            <Select
              label="Access to a personal laptop"
              value={form.has_laptop}
              onChange={set("has_laptop")}
              options={["Yes", "No"]}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="prev">Other education details</Label>
              <Textarea
                id="prev"
                value={form.previous_education}
                onChange={set("previous_education")}
                rows={2}
              />
            </div>
          </Section>

          <Section title="Payment information">
            <Select
              label="Payment method"
              value={form.payment_method}
              onChange={set("payment_method")}
              options={["Bank", "Orange Money", "Afrimoney", "Qcell Money"]}
            />
            <p className="text-xs text-muted-foreground sm:col-span-2">
              A-TECH wallets — Orange Money: +23275180378 · Afrimoney: +23277864684 · Qcell Money:
              +23234629871. Attach your payment receipt below.
            </p>
          </Section>

          <Section title="Guarantor / sponsor information">
            <F label="First name" value={form.guarantor_first_name} onChange={set("guarantor_first_name")} />
            <F label="Last name" value={form.guarantor_last_name} onChange={set("guarantor_last_name")} />
            <F
              label="Relationship with applicant"
              value={form.guarantor_relationship}
              onChange={set("guarantor_relationship")}
            />
            <F label="Contact" value={form.guarantor_phone} onChange={set("guarantor_phone")} />
            <F label="WhatsApp contact" value={form.guarantor_whatsapp} onChange={set("guarantor_whatsapp")} />
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="g-address">Address</Label>
              <Textarea
                id="g-address"
                value={form.guarantor_address}
                onChange={set("guarantor_address")}
                rows={2}
              />
            </div>
          </Section>

          <Section title="Supporting documents">
            {REQUIRED_DOCS.map((doc) => (
              <div key={doc} className="space-y-1.5">
                <Label htmlFor={doc}>{doc}</Label>
                <Input
                  id={doc}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) =>
                    setFiles((f) => ({ ...f, [doc]: e.target.files?.[0] ?? null }))
                  }
                />
              </div>
            ))}
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
  const id = label.toLowerCase().replace(/[^\w]+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly string[];
}) {
  const id = label.toLowerCase().replace(/[^\w]+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
