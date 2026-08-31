import logo from "@/assets/atech-logo.jpg.asset.json";
import { ATECH } from "@/lib/atech";

export function BrandLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src={logo.url}
      alt="A-TECH Computer Training logo"
      width={size}
      height={size}
      className="rounded-sm bg-white object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export function BrandBar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="brand-bar px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandLogo size={38} />
          <div className="leading-tight">
            <div className="font-display text-base font-bold tracking-wide text-primary-foreground">
              A-TECH PORTAL
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-gold-soft">
              {ATECH.tagline}
            </div>
          </div>
        </div>
        {right}
      </div>
    </header>
  );
}
