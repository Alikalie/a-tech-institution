import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { ATECH } from "@/lib/atech";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About A-TECH | Integrated Technology & Data Analysis" },
      {
        name: "description",
        content:
          "A-TECH Integrated Technology & Data Analysis delivers practical computer, technology and data skills training in Moriba Town, Impere Junction.",
      },
      { property: "og:title", content: "About A-TECH" },
      {
        property: "og:description",
        content: "Practical technology and data training with experienced tutors at A-TECH.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const values = [
  ["Practical Training", "Hands-on lab work from the very first class, not theory alone."],
  ["Experienced Tutors", "Instructors who work in technology and teach what they practise."],
  ["Technology Focused", "Computers, office productivity, design, networking and media."],
  ["Data-Driven Learning", "Data analysis skills that employers actively look for."],
  ["Flexible Programmes", "Short certificates through to longer professional courses."],
  ["Career Development", "Portfolio work, certification and job-readiness coaching."],
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 py-14">
        <h1 className="text-4xl font-bold">About {ATECH.name}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          A-TECH is a computer training institute focused on integrated technology and data
          analysis. We prepare learners for real work: operating modern systems, producing
          professional documents and designs, managing networks, and turning data into decisions.
          Our campus is located at {ATECH.address}.
        </p>

        <h2 className="gold-rule mt-12 pb-2 text-2xl">Why choose A-TECH?</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {values.map(([title, detail]) => (
            <article key={title} className="card-elevated p-5">
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
