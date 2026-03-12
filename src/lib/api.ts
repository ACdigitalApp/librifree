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
  sortBy = "title",
}: {
  page?: number;
  search?: string;
  categorySlug?: string;
  language?: string;
  sortBy?: "title" | "views" | "created_at";
} = {}) {
  let query = supabase
    .from("books")
    .select("*, categories(*)", { count: "exact" });

  if (search) {
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
  }

  if (categorySlug) {
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

  const ascending = sortBy === "title";
  query = query
    .order(sortBy, { ascending })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    books: (data as BookWithCategory[]) ?? [],
    totalCount: count ?? 0,
    pageSize: PAGE_SIZE,
    hasMore: (count ?? 0) > (page + 1) * PAGE_SIZE,
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

export async function fetchRecentBooks(limit = 12) {
  const { data, error } = await supabase
    .from("books")
    .select("*, categories(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as BookWithCategory[]) ?? [];
}

export async function fetchPopularBooks(limit = 12) {
  const { data, error } = await supabase
    .from("books")
    .select("*, categories(*)")
    .order("views", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as BookWithCategory[]) ?? [];
}

export async function fetchCategoriesWithCount() {
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (catError) throw catError;

  const results: (Category & { count: number })[] = [];
  for (const cat of categories ?? []) {
    const { count } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("category_id", cat.id);
    results.push({ ...cat, count: count ?? 0 });
  }
  return results.filter((c) => c.count > 0);
}

export async function incrementBookViews(slug: string) {
  await supabase.rpc("increment_book_views", { book_slug: slug });
}

// Admin functions
export async function fetchAdminStats() {
  const { count: totalBooks } = await supabase
    .from("books")
    .select("id", { count: "exact", head: true });

  const { data: topBooks } = await supabase
    .from("books")
    .select("title, author, views, slug")
    .order("views", { ascending: false })
    .limit(10);

  const { data: totalViewsData } = await supabase
    .from("books")
    .select("views");

  const totalViews = (totalViewsData ?? []).reduce((sum, b) => sum + (b.views ?? 0), 0);

  return {
    totalBooks: totalBooks ?? 0,
    totalViews,
    topBooks: topBooks ?? [],
  };
}

export async function fetchAdminBooks({
  page = 0,
  search = "",
  sortBy = "views",
  pageSize = 20,
}: {
  page?: number;
  search?: string;
  sortBy?: string;
  pageSize?: number;
} = {}) {
  let query = supabase
    .from("books")
    .select("*, categories(*)", { count: "exact" });

  if (search) {
    query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`);
  }

  const ascending = sortBy === "title";
  query = query
    .order(sortBy, { ascending })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    books: (data as BookWithCategory[]) ?? [],
    totalCount: count ?? 0,
    pageSize,
    hasMore: (count ?? 0) > (page + 1) * pageSize,
  };
}

export async function deleteBook(id: string) {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

export async function updateBook(id: string, updates: Partial<Book>) {
  const { error } = await supabase.from("books").update(updates).eq("id", id);
  if (error) throw error;
}

export async function checkIsAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}
