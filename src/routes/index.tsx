import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { ATECH } from "@/lib/atech";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A-TECH Course Application Portal | Apply Online" },
      {
        name: "description",
        content:
          "Apply for computer training courses at A-TECH. Create an account, verify your payment code, submit your application and download your form as a PDF.",
      },
      { property: "og:title", content: "A-TECH Course Application Portal" },
      {
        property: "og:description",
        content:
          "Create an A-TECH account, verify with your payment code and apply for computer training courses online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const steps = [
  ["Create your account", "Register with your details and receive an A-TECH payment reference."],
  ["Pay the application fee", "Pay at the A-TECH office or by mobile money quoting your reference."],
  ["Get your verification code", "An administrator generates a 6-digit code for your account."],
  ["Verify & apply", "Enter the code to unlock the portal and complete your application."],
  ["Download & get admitted", "Print your form, then receive your Student ID and acceptance letter."],
];

function Landing() {
  const { data: courses } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("sort_order");
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main>
        {/* Hero */}
        <section className="brand-bar relative overflow-hidden px-5 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.15fr_1fr] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-soft">
                {ATECH.tagline}
              </p>
              <h1 className="mt-4 font-display text-4xl leading-tight font-bold text-primary-foreground md:text-6xl">
                Train. Apply. Graduate with A-TECH.
              </h1>
              <p className="mt-5 max-w-xl text-primary-foreground/80">
                The official A-TECH course application and student management portal. Apply online,
                track your admission, download your application form and manage your grades, results
                and timetable in one place.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary" className="font-semibold">
                  <Link to="/auth" search={{ mode: "register" }}>
                    Apply Now
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                >
                  <Link to="/courses">Browse courses</Link>
                </Button>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-primary-foreground">
                {[
                  [String(courses?.length ?? 0).padStart(2, "0"), "Programmes"],
                  ["100%", "Online applications"],
                  ["24/7", "Portal access"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <dt className="font-display text-2xl font-bold text-gold-soft">{value}</dt>
                    <dd className="text-[11px] uppercase tracking-wider text-primary-foreground/70">
                      {label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card-elevated bg-card p-6">
              <h2 className="gold-rule pb-2 text-lg">Admission in 5 steps</h2>
              <ol className="mt-5 space-y-4 text-sm">
                {steps.map(([title, detail], i) => (
                  <li key={title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                      {i + 1}
                    </span>
                    <span>
                      <span className="font-semibold text-foreground">{title}</span>
                      <span className="block text-muted-foreground">{detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              [
                "Verified applications",
                "Every applicant is verified with a payment code generated by the A-TECH administration before applying.",
              ],
              [
                "Printable documents",
                "Download your application form as PDF or Word, plus your official acceptance letter.",
              ],
              [
                "Student & tutor portals",
                "Track grades, results, timetables and announcements with your A-TECH Student ID.",
              ],
            ].map(([title, body]) => (
              <article key={title} className="card-elevated p-6">
                <h3 className="font-display text-base font-bold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Courses */}
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="gold-rule pb-2 text-2xl">Courses on offer</h2>
            <Link to="/courses" className="text-sm font-semibold text-accent hover:underline">
              View all programmes →
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(courses ?? []).slice(0, 9).map((c) => (
              <article key={c.code} className="card-elevated p-4 transition-shadow hover:shadow-lg">
                <h3 className="text-sm font-semibold">{c.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.duration}</p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5">
          <div className="card-elevated flex flex-wrap items-center justify-between gap-6 border-accent/40 p-8">
            <div>
              <h2 className="font-display text-2xl font-bold">Ready to join A-TECH?</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Create your A-TECH account today, get your payment verification code from the office
                and submit your course application online.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "register" }}>
                Apply Now
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
