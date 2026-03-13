import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTotalBookCount() {
  return useQuery({
    queryKey: ["total-book-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("books")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30 * 60 * 1000,
  });
}
