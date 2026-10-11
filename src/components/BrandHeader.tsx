import { ATECH } from "@/lib/atech";

/** A-TECH logo mark (blue "A" with gear and growth arrow) on a white badge. */
export function BrandLogo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-card p-1 shadow-sm ring-2 ring-accent"
      style={{ width: size, height: size }}
    >
      <img
        src="/atech-mark.jpg"
        alt="A-TECH logo"
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export function BrandBar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="brand-bar px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size={38} />
          <div className="min-w-0 leading-tight">
            <div className="font-display text-base font-bold tracking-wide text-primary-foreground">
              A-TECH PORTAL
            </div>
            <div className="truncate text-[10px] uppercase tracking-[0.15em] text-gold-soft">
              {ATECH.tagline}
            </div>
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
