import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BookWithCategory } from "@/lib/api";

/** Returns a deterministic "book of the day" based on date seed */
export function useBookOfTheDay() {
  return useQuery({
    queryKey: ["book-of-the-day"],
    queryFn: async () => {
      // Get total count
      const { count } = await supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .not("cover_url", "is", null)
        .neq("cover_url", "no-cover");

      if (!count || count === 0) return null;

      // Deterministic seed from today's date
      const today = new Date();
      const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      const offset = seed % count;

      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, slug, cover_url, description, language, views, category_id, created_at, categories(*)")
        .not("cover_url", "is", null)
        .neq("cover_url", "no-cover")
        .order("created_at")
        .range(offset, offset)
        .single();

      if (error) return null;
      return data as BookWithCategory;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
