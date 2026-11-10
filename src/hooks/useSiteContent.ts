import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
type SiteContent = Record<string, string> & { hero_title?: string; hero_subtitle?: string; announcement?: string; about_text?: string; contact_address?: string; contact_phone?: string; contact_email?: string; office_hours?: string; footer_text?: string; signatory_name?: string };

export function useSiteContent() {
  return useQuery({
    queryKey: ["site-content"],
    staleTime: 0,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("key,value");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.key, row.value])) as SiteContent;
    },
  });
}