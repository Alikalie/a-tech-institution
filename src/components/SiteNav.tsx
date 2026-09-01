import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { ATECH } from "@/lib/atech";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/admissions", label: "Admissions" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  return (
    <header className="brand-bar px-5 py-4">
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
          <Button asChild variant="secondary" size="sm" className="ml-2">
            <Link to="/auth">Login</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="brand-bar mt-16 px-5 py-10 text-primary-foreground/80">
      <div className="mx-auto grid max-w-6xl gap-8 text-sm sm:grid-cols-3">
        <div>
          <div className="font-display text-base font-bold text-primary-foreground">
            {ATECH.name}
          </div>
          <p className="mt-2 text-xs">{ATECH.address}</p>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gold-soft">Explore</div>
          <Link to="/about" className="block hover:text-primary-foreground">About</Link>
          <Link to="/courses" className="block hover:text-primary-foreground">Courses</Link>
          <Link to="/admissions" className="block hover:text-primary-foreground">Admissions</Link>
          <Link to="/contact" className="block hover:text-primary-foreground">Contact</Link>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gold-soft">Portal</div>
          <Link to="/auth" className="block hover:text-primary-foreground">Student login</Link>
          <Link to="/auth" className="block hover:text-primary-foreground">Tutor login</Link>
          <Link to="/auth" className="block hover:text-primary-foreground">Administrator login</Link>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs">
        © {new Date().getFullYear()} {ATECH.name}. All rights reserved.
      </p>
    </footer>
  );
}
