import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATECH } from "@/lib/atech";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search['mode'] === "register" ? ("register" as const) : ("login" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create your A-TECH account" },
      {
        name: "description",
        content:
          "Log in to the A-TECH portal or create an A-TECH account to apply for a course, track your application and access your student dashboard.",
      },
      { property: "og:title", content: "A-TECH Account Login" },
      {
        property: "og:description",
        content: "Access the A-TECH applicant, student, tutor and administrator portals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const isRegister = mode === "register";
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    dob: "",
    nationality: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isRegister) {
        if (form.password.length < 8) throw new Error("Password must be at least 8 characters.");
        if (form.password !== form.confirm) throw new Error("Passwords do not match.");
        const fullName = [form.firstName, form.middleName, form.lastName]
          .map((s) => s.trim())
          .filter(Boolean)
          .join(" ");
        if (!fullName) throw new Error("Enter your name.");
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              phone: form.phone.trim(),
              dob: form.dob,
              nationality: form.nationality.trim(),
            },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then sign in.");
        navigate({ to: "/auth", search: { mode: "login" } });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        navigate({ to: "/portal" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="brand-bar px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <BrandLogo size={38} />
            <span className="font-display text-lg font-bold text-primary-foreground">A-TECH</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-5 py-12">
        <h1 className="text-2xl font-bold">
          {isRegister ? "Create your A-TECH account" : "Sign in to A-TECH"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRegister
            ? "Your account gives you a unique A-TECH payment reference. Pay the application fee, then verify with the code issued to you."
            : "Applicants, students, tutors and administrators all sign in here."}
        </p>

        <form onSubmit={submit} className="card-elevated mt-6 space-y-4 p-6">
          {isRegister && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First name" value={form.firstName} onChange={set("firstName")} required />
                <Field label="Middle name" value={form.middleName} onChange={set("middleName")} />
              </div>
              <Field label="Last name" value={form.lastName} onChange={set("lastName")} required />
              <Field label="Phone number" value={form.phone} onChange={set("phone")} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Date of birth" type="date" value={form.dob} onChange={set("dob")} />
                <Field label="Nationality" value={form.nationality} onChange={set("nationality")} />
              </div>
            </>
          )}
          <Field label="Email" type="email" value={form.email} onChange={set("email")} required />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={set("password")}
            required
          />
          {isRegister && (
            <Field
              label="Confirm password"
              type="password"
              value={form.confirm}
              onChange={set("confirm")}
              required
            />
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account? " : "New to A-TECH? "}
            <Link
              to="/auth"
              search={{ mode: isRegister ? ("login" as const) : ("register" as const) }}
              className="font-semibold text-primary underline"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">{ATECH.address}</p>
      </main>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  );
}
