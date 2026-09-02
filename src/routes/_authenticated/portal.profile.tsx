import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortal, primaryRole } from "@/hooks/usePortal";
import { formatDate } from "@/lib/atech";

export const Route = createFileRoute("/_authenticated/portal/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data, refresh } = usePortal();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFullName(data?.profile?.full_name ?? "");
    setPhone(data?.profile?.phone ?? "");
  }, [data?.profile?.full_name, data?.profile?.phone]);

  return (
    <div className="max-w-xl space-y-5">
      <h1 className="text-2xl font-bold">My profile</h1>

      <div className="card-elevated grid gap-2 p-5 text-sm">
        <Row k="Account role" v={primaryRole(data?.roles ?? [])} />
        <Row k="Email" v={data?.profile?.email ?? "—"} />
        <Row k="Student ID" v={data?.profile?.student_id ?? "Not yet issued"} />
        <Row k="Payment reference" v={data?.payment?.reference ?? "—"} />
        <Row k="Verified" v={data?.profile?.verified ? "Yes" : "No"} />
        <Row k="Member since" v={formatDate(data?.profile?.created_at)} />
      </div>

      <form
        className="card-elevated space-y-4 p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const { error } = await supabase
            .from("profiles")
            .update({ full_name: fullName.trim(), phone: phone.trim() })
            .eq("id", data!.userId);
          setBusy(false);
          if (error) toast.error(error.message);
          else {
            toast.success("Profile updated.");
            refresh();
          }
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="fn">Full name</Label>
          <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ph">Phone number</Label>
          <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-3 border-b py-1.5 last:border-0">
      <span className="font-semibold text-muted-foreground">{k}</span>
      <span className="capitalize">{v}</span>
    </div>
  );
}
