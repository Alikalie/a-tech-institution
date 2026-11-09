import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSiteContent() {
  return useQuery({
    queryKey: ["site-content"],
    staleTime: 0,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("key,value");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((row) => [row.key, row.value])) as Record<string, string>;
    },
  });
}