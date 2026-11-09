import { createFileRoute } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { ATECH } from "@/lib/atech";
import { useSiteContent } from "@/hooks/useSiteContent";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact A-TECH | Admissions Enquiries" },
      {
        name: "description",
        content:
          "Contact A-TECH Integrated Technology & Data Analysis at Moriba Town, Impere Junction for admissions, payments and course enquiries.",
      },
      { property: "og:title", content: "Contact A-TECH" },
      {
        property: "og:description",
        content: "Contact details and office location for A-TECH admissions enquiries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data: content } = useSiteContent();
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-14">
        <h1 className="text-4xl font-bold">Contact us</h1>
        <p className="mt-3 text-muted-foreground">
          Visit the A-TECH office for admissions, application-fee payment and course enquiries.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="card-elevated p-5">
            <h2 className="text-sm font-semibold">Office</h2>
            <p className="mt-1 text-sm text-muted-foreground">{content?.contact_address || ATECH.address}</p>
          </div>
          <div className="card-elevated p-5">
            <h2 className="text-sm font-semibold">Contact details</h2>
            {content?.contact_phone && <a className="mt-2 block text-sm text-primary" href={`tel:${content.contact_phone}`}>{content.contact_phone}</a>}
            {content?.contact_email && <a className="mt-2 block break-all text-sm text-primary" href={`mailto:${content.contact_email}`}>{content.contact_email}</a>}
            {content?.office_hours && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{content.office_hours}</p>}
          </div>
          <div className="card-elevated p-5">
            <h2 className="text-sm font-semibold">Admissions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Bring your payment reference from your A-TECH account when paying the application fee.
            </p>
          </div>
          <div className="card-elevated p-5">
            <h2 className="text-sm font-semibold">Portal support</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Trouble with a payment code or your application? Speak to the A-TECH office and quote
              your reference number.
            </p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
