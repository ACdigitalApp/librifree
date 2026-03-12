import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRecommendedBooks(categoryId: string | null, currentSlug: string, limit = 4) {
  return useQuery({
    queryKey: ["recommended-books", categoryId, currentSlug],
    queryFn: async () => {
      let query = supabase
        .from("books")
        .select("slug, title, author, cover_url")
        .neq("slug", currentSlug)
        .order("views", { ascending: false })
        .limit(limit);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data } = await query;
      return data ?? [];
    },
    enabled: !!currentSlug,
  });
}
