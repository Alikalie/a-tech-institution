import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/hooks/usePortal";
import { formatDate } from "@/lib/atech";

export const Route = createFileRoute("/_authenticated/portal/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data: portal } = usePortal();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["my-notifications", portal?.userId],
    enabled: Boolean(portal?.userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const rows = data ?? [];

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
  }

  async function markAllRead() {
    if (!portal?.userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", portal.userId);
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {rows.some((n) => !n.read) && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {rows.map((n) => (
          <article
            key={n.id}
            className={`card-elevated p-4 ${n.read ? "opacity-70" : "border-l-4 border-l-accent"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">{n.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
              </div>
              {!n.read && (
                <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                  Mark read
                </Button>
              )}
            </div>
          </article>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
