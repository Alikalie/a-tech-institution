import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { usePortal, primaryRole } from "@/hooks/usePortal";
import { ATECH } from "@/lib/atech";

export const Route = createFileRoute("/_authenticated/portal")({
  component: PortalLayout,
});

type NavItem = { to: string; label: string };

function navFor(role: string, verified: boolean): NavItem[] {
  const base: NavItem[] = [{ to: "/portal", label: "Dashboard" }];
  if (role === "admin") {
    return [...base, { to: "/portal/admin", label: "Administration" }, { to: "/portal/tutor", label: "Grades & results" }, { to: "/portal/notifications", label: "Notifications" }, { to: "/portal/profile", label: "My profile" }];
  }
  if (role === "tutor") {
    return [...base, { to: "/portal/tutor", label: "Students & grades" }, { to: "/portal/schedule", label: "Schedule" }, { to: "/portal/notifications", label: "Notifications" }, { to: "/portal/profile", label: "My profile" }];
  }
  if (role === "student") {
    return [
      ...base,
      { to: "/portal/grades", label: "Grades & results" },
      { to: "/portal/schedule", label: "Timetable" },
      { to: "/portal/applications", label: "My documents" },
      { to: "/portal/notifications", label: "Notifications" },
      { to: "/portal/profile", label: "My profile" },
    ];
  }
  return [
    ...base,
    verified
      ? { to: "/portal/apply", label: "Apply for a course" }
      : { to: "/portal/verify", label: "Verify payment code" },
    { to: "/portal/applications", label: "My applications" },
    { to: "/portal/notifications", label: "Notifications" },
    { to: "/portal/profile", label: "My profile" },
  ];
}

function PortalLayout() {
  const { data } = usePortal();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = primaryRole(data?.roles ?? []);
  const items = navFor(role, Boolean(data?.profile?.verified));

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="brand-bar px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link to="/portal" className="flex items-center gap-3">
            <BrandLogo size={36} />
            <span className="leading-tight">
              <span className="block font-display text-base font-bold text-primary-foreground">
                A-TECH PORTAL
              </span>
              <span className="block text-[10px] uppercase tracking-[0.15em] text-gold-soft">
                {role} account
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-primary-foreground/80 sm:block">
              {data?.profile?.full_name || data?.profile?.email}
            </span>
            <Button size="sm" variant="secondary" onClick={signOut}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row">
        <nav className="flex flex-wrap gap-1 md:w-56 md:shrink-0 md:flex-col">
          {items.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              activeOptions={{ exact: i.to === "/portal" }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
      <footer className="px-6 py-8 text-center text-xs text-muted-foreground">
        {ATECH.name} — {ATECH.address}
      </footer>
    </div>
  );
}
