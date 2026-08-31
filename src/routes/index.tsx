import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandHeader";
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
      <header className="brand-bar px-5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size={40} />
            <div className="leading-tight">
              <div className="font-display text-lg font-bold text-primary-foreground">A-TECH</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-gold-soft">
                {ATECH.tagline}
              </div>
            </div>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <section className="grid gap-8 py-14 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Course Application Portal
            </p>
            <h1 className="mt-3 text-4xl leading-tight font-bold md:text-5xl">
              Train. Apply. Graduate with A-TECH.
            </h1>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Create your A-TECH account, verify it with the payment code issued by our office, then
              apply for any of our computer training courses. Your application form is available to
              download as a PDF or Word document the moment you submit it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ mode: "register" }}>
                  Create an A-TECH account
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">I already have an account</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{ATECH.address}</p>
          </div>
          <div className="card-elevated p-6">
            <h2 className="text-lg">How it works</h2>
            <ol className="mt-4 space-y-4 text-sm">
              {[
                ["Create your account", "You receive a unique payment reference."],
                ["Pay at A-TECH", "Quote your reference at our office or by mobile money."],
                ["Enter your payment code", "Admin confirms payment and issues a 6-digit code."],
                ["Apply & download", "Submit your course application and print the form."],
                ["Get accepted", "Receive your A-TECH Student ID and acceptance letter."],
              ].map(([title, detail], i) => (
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
        </section>

        <section>
          <h2 className="gold-rule pb-2 text-2xl">Courses on offer</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(courses ?? []).map((c) => (
              <article key={c.code} className="card-elevated p-4">
                <h3 className="text-sm font-semibold">{c.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{c.duration}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="brand-bar px-5 py-6 text-center text-xs text-primary-foreground/80">
        {ATECH.name} — {ATECH.address}
      </footer>
    </div>
  );
}
