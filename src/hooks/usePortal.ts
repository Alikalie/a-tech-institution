import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PortalProfile = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  verified: boolean;
  student_id: string | null;
  created_at: string;
};

export type PortalSession = {
  userId: string;
  profile: PortalProfile | null;
  roles: string[];
  payment: {
    id: string;
    reference: string;
    status: string;
    code: string | null;
  } | null;
};

export function portalQueryKey() {
  return ["portal-session"];
}

async function fetchPortal(): Promise<PortalSession | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: profile }, { data: roles }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase
      .from("payments")
      .select("id, reference, status, code")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  return {
    userId: user.id,
    profile: (profile as PortalProfile) ?? null,
    roles: (roles ?? []).map((r) => r.role as string),
    payment: payments?.[0] ?? null,
  };
}

export function usePortal() {
  const query = useQuery({ queryKey: portalQueryKey(), queryFn: fetchPortal });
  const queryClient = useQueryClient();
  return {
    ...query,
    refresh: () => queryClient.invalidateQueries(),
  };
}

export function primaryRole(roles: string[]) {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("tutor")) return "tutor";
  if (roles.includes("student")) return "student";
  return "applicant";
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
}
