import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortal } from "@/hooks/usePortal";
import { verifyPaymentCode } from "@/lib/portal.functions";

export const Route = createFileRoute("/_authenticated/portal/verify")({
  component: VerifyPage,
});

function VerifyPage() {
  const { data, refresh } = usePortal();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Verify your payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay the application fee at the A-TECH office quoting your payment reference. Once the
          office confirms it, a 6-digit code is issued to your notifications — enter it here to
          unlock the application form.
        </p>
      </div>

      <div className="card-elevated p-5 text-sm">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Your payment reference
        </div>
        <div className="mt-1 font-display text-xl font-bold">
          {data?.payment?.reference ?? "—"}
        </div>
        <div className="mt-2 text-muted-foreground">
          Payment status: <span className="font-semibold">{data?.payment?.status ?? "pending"}</span>
        </div>
      </div>

      {data?.profile?.verified ? (
        <div className="card-elevated p-5">
          <p className="text-sm font-semibold text-success">Your account is already verified.</p>
          <Button className="mt-3" onClick={() => navigate({ to: "/portal/apply" })}>
            Continue to the application form
          </Button>
        </div>
      ) : (
        <form
          className="card-elevated space-y-4 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const res = await verifyPaymentCode({ data: { code } });
              if (res.ok) {
                toast.success(res.message);
                refresh();
                navigate({ to: "/portal/apply" });
              } else {
                toast.error(res.message);
              }
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Verification failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="code">6-digit payment code</Label>
            <Input
              id="code"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
          </div>
          <Button type="submit" disabled={busy || code.length !== 6}>
            {busy ? "Checking…" : "Verify code"}
          </Button>
        </form>
      )}
    </div>
  );
}
