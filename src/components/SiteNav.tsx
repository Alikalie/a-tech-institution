import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { ATECH } from "@/lib/atech";

const links = [
  { to: "/", label: "Home" },
  { to: "/admissions", label: "Admission" },
  { to: "/courses", label: "Courses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  return (
    <header className="brand-bar sticky top-0 z-40 px-5 py-3 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
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
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded px-3 py-1.5 text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground"
              activeProps={{ className: "bg-white/15 text-primary-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          <Button asChild size="sm" variant="secondary" className="ml-2 font-semibold">
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
          <p className="mt-1 text-xs">{ATECH.address}</p>
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
        © {new Date().getFullYear()} {ATECH.name}. All rights reserved.
      </p>
    </footer>
  );
}
