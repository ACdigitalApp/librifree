import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Book = Tables<"books">;
export type Category = Tables<"categories">;

export type BookWithCategory = Book & {
  categories: Category | null;
};

const PAGE_SIZE = 12;

export async function fetchBooks({
  page = 0,
  search = "",
  categorySlug = "",
  language = "",
}: {
  page?: number;
  search?: string;
  categorySlug?: string;
  language?: string;
} = {}) {
  let query = supabase
    .from("books")
    .select("*, categories(*)", { count: "exact" });

  if (search) {
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
  }

  if (categorySlug) {
    // Need to filter by category slug via a subquery
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  if (language) {
    query = query.eq("language", language);
  }

  query = query
    .order("title", { ascending: true })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    books: (data as BookWithCategory[]) ?? [],
    totalCount: count ?? 0,
    pageSize: PAGE_SIZE,
    hasMore: ((count ?? 0) > (page + 1) * PAGE_SIZE),
  };
}

export async function fetchBookBySlug(slug: string) {
  const { data, error } = await supabase
    .from("books")
    .select("*, categories(*)")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data as BookWithCategory;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as Category[];
}
