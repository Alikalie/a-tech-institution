import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions & How to Apply | A-TECH" },
      {
        name: "description",
        content:
          "A-TECH admission requirements and the seven-step application process: create an account, pay the fee, verify your payment code, apply and receive your decision.",
      },
      { property: "og:title", content: "A-TECH Admissions" },
      {
        property: "og:description",
        content: "Requirements, the step-by-step application process and answers to common questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdmissionsPage,
});

const steps = [
  ["Create Account", "Register with your name, email and phone number."],
  ["Pay Application Fee", "Pay at the A-TECH office quoting your payment reference."],
  ["Verify Payment", "Enter the 6-digit code issued once your payment is confirmed."],
  ["Complete Application", "Fill in personal, contact, guardian and programme details."],
  ["Submit", "Preview, submit and download your application form as PDF or Word."],
  ["Await Decision", "Track your status: submitted, under review, decision."],
  ["Receive Acceptance", "Get your acceptance letter and A-TECH Student ID."],
];

const requirements = [
  "Basic literacy and numeracy for entry-level certificate courses.",
  "A valid national ID, passport or birth certificate.",
  "One recent passport photograph.",
  "Previous education record where available.",
  "Payment of the non-refundable application fee.",
];

const faqs = [
  ["Can I apply before paying?", "No. The application form unlocks only after your payment code is verified."],
  ["Where do I get my payment code?", "A-TECH issues it once the office confirms your payment; it arrives in your portal notifications."],
  ["Can I download my application?", "Yes — as a PDF or a Word document, at any time after submitting."],
  ["How do I get a Student ID?", "It is generated automatically by the system when the administrator accepts your application."],
];

function AdmissionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-5xl px-5 py-14">
        <h1 className="text-4xl font-bold">Admissions</h1>

        <h2 className="gold-rule mt-10 pb-2 text-2xl">How to apply</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {steps.map(([title, detail], i) => (
            <li key={title} className="card-elevated flex gap-3 p-4">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {i + 1}
              </span>
              <span>
                <span className="text-sm font-semibold">{title}</span>
                <span className="block text-sm text-muted-foreground">{detail}</span>
              </span>
            </li>
          ))}
        </ol>

        <h2 className="gold-rule mt-12 pb-2 text-2xl">Admission requirements</h2>
        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
          {requirements.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>

        <h2 className="gold-rule mt-12 pb-2 text-2xl">FAQs</h2>
        <div className="mt-5 space-y-4">
          {faqs.map(([q, a]) => (
            <div key={q} className="card-elevated p-4">
              <h3 className="text-sm font-semibold">{q}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "register" as const }}>
              Create an A-TECH account
            </Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
