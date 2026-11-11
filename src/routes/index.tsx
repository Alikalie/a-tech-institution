import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { ATECH } from "@/lib/atech";
import { useSiteContent } from "@/hooks/useSiteContent";
import { imageSource } from "@/lib/site-settings";

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
  const { data: content } = useSiteContent();
  const { data: courses } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").eq("active", true).is("deleted_at", null).order("sort_order");
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <main>
        {content?.announcement && <div className="bg-accent px-5 py-3 text-center text-sm text-accent-foreground">{content.announcement}</div>}
        {/* Hero */}
        <section className="education-hero relative isolate overflow-hidden border-b-4 border-accent px-5 py-6 sm:py-16">
          <img src={imageSource(content?.["home_background"])} alt="Students and tutor in a computer training classroom" width={1536} height={1024} className="absolute inset-0 -z-20 h-full w-full object-cover object-right" />
          <div className="education-shade absolute inset-0 -z-10" />
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-soft">
                {ATECH.tagline}
              </p>
              <h1 className="mt-4 font-display text-3xl leading-tight font-bold text-primary-foreground sm:text-5xl">
                 {content?.hero_title || "A-TECH Computer Training"}
              </h1>
              <p className="mt-4 max-w-xl text-sm text-primary-foreground/90 sm:text-base">
                 {content?.hero_subtitle || "Apply for practical computer training, track your admission and access your A-TECH student documents."}
              </p>
              <div className="mt-5 flex flex-wrap gap-3 sm:mt-8">
                <Button asChild size="lg" className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90">
                  <Link to="/auth" search={{ mode: "register" }}>
                    Apply Now
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/courses">Browse courses</Link>
                </Button>
              </div>
              <dl className="mt-5 grid max-w-md grid-cols-3 gap-4 text-primary-foreground sm:mt-10">
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

          </div>
        </section>

        {/* Highlights */}
        <section className="mx-auto max-w-6xl px-5 py-8">
          <h2 className="gold-rule pb-2 text-xl">Admission in 5 steps</h2>
          <ol className="my-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{steps.map(([title, detail], i) => <li key={title} className="min-w-0 text-sm"><span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground">{i + 1}</span><h3 className="font-semibold">{title}</h3><p className="mt-2 text-muted-foreground">{detail}</p></li>)}</ol>
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
            <Link to="/courses" className="text-sm font-semibold text-primary hover:underline">
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
            <Button asChild size="lg" className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90">
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
