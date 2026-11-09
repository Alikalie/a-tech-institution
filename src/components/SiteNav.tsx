import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { ATECH } from "@/lib/atech";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";

const links = [
  { to: "/", label: "Home" },
  { to: "/admissions", label: "Admission" },
  { to: "/courses", label: "Courses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="brand-bar sticky top-0 z-40 px-5 py-3 shadow-lg">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:flex lg:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <BrandLogo size={40} />
          <span className="leading-tight">
            <span className="block font-display text-lg font-bold text-primary-foreground">
              A-TECH
            </span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-gold-soft">
              {ATECH.tagline}
            </span>
          </span>
        </Link>
        <Button size="icon" variant="ghost" className="shrink-0 text-primary-foreground lg:hidden" aria-label={open ? "Close website menu" : "Open website menu"} aria-expanded={open} aria-controls="website-menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
        <nav id="website-menu" className={`${open ? "flex" : "hidden"} col-span-2 flex-col items-stretch gap-1 text-sm lg:flex lg:flex-row lg:items-center`} onClick={() => setOpen(false)}>
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded px-3 py-2 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              activeProps={{ className: "bg-primary-foreground/15 text-primary-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <Button asChild size="sm" className="ml-2 bg-accent font-semibold text-accent-foreground hover:bg-accent/90">
            <Link to="/auth" search={{ mode: "register" }}>
              Apply Now
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <Link to="/auth" search={{ mode: "login" }}>
              Sign In
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { data: content } = useSiteContent();
  return (
    <footer className="brand-bar mt-20 px-5 py-12 text-primary-foreground/80">
      <div className="mx-auto grid max-w-6xl gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <BrandLogo size={36} />
            <span className="font-display text-base font-bold text-primary-foreground">
              A-TECH
            </span>
          </div>
          <p className="mt-3 text-xs">{ATECH.name}</p>
          <p className="mt-1 text-xs">{content?.contact_address || ATECH.address}</p>
          {content?.contact_phone && <a className="mt-2 block text-xs" href={`tel:${content.contact_phone}`}>{content.contact_phone}</a>}
          {content?.contact_email && <a className="block break-all text-xs" href={`mailto:${content.contact_email}`}>{content.contact_email}</a>}
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gold-soft">Explore</div>
          <Link to="/" className="block hover:text-primary-foreground">Home</Link>
          <Link to="/admissions" className="block hover:text-primary-foreground">Admission</Link>
          <Link to="/courses" className="block hover:text-primary-foreground">Courses</Link>
          <Link to="/about" className="block hover:text-primary-foreground">About A-TECH</Link>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gold-soft">Portal</div>
          <Link to="/auth" search={{ mode: "register" }} className="block hover:text-primary-foreground">
            Apply Now
          </Link>
          <Link to="/auth" search={{ mode: "login" }} className="block hover:text-primary-foreground">
            Sign In
          </Link>
          <Link to="/contact" className="block hover:text-primary-foreground">Support</Link>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gold-soft">Admissions</div>
          <p className="text-xs">
            Create an account, receive your payment verification code from the A-TECH office, then
            apply online and download your application form.
          </p>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-xs">
        {content?.footer_text || `© ${new Date().getFullYear()} ${ATECH.name}. All rights reserved.`}
      </p>
    </footer>
  );
}
