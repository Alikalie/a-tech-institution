import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses & Programmes | A-TECH Computer Training" },
      {
        name: "description",
        content:
          "Browse A-TECH courses: computer fundamentals, office productivity, graphic design, networking, data analysis, web design and video editing.",
      },
      { property: "og:title", content: "A-TECH Courses & Programmes" },
      {
        property: "og:description",
        content: "Every A-TECH programme with duration and how to apply online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
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
      <main className="mx-auto max-w-5xl px-5 py-14">
        <h1 className="text-4xl font-bold">Courses & Programmes</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Programmes are published by the A-TECH administration and appear here as soon as they are
          released. Select any course when you complete your application.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(courses ?? []).map((c) => (
            <article key={c.code} className="card-elevated p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                {c.code}
              </div>
              <h2 className="mt-1 text-sm font-semibold">{c.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{c.duration}</p>
            </article>
          ))}
        </div>
        <div className="mt-10">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "register" as const }}>
              Apply now
            </Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
