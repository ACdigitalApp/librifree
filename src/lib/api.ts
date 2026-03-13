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
  sortBy = "author",
  pageSize = PAGE_SIZE,
  bookCode,
}: {
  page?: number;
  search?: string;
  categorySlug?: string;
  language?: string;
  sortBy?: "title" | "title_desc" | "author" | "author_desc" | "views" | "created_at";
  pageSize?: number;
  bookCode?: number;
} = {}) {
  let query = supabase
    .from("books")
    .select("id, title, author, slug, cover_url, language, views, category_id, created_at, book_code, categories(*)", { count: "exact" });

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

  const column = sortBy.replace("_desc", "") as string;
  const ascending = sortBy === "title" || sortBy === "author";
  query = query
    .order(column, { ascending })
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
    .select("id, title, author, slug, cover_url, language, views, category_id, created_at, categories(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as BookWithCategory[]) ?? [];
}

export async function fetchPopularBooks(limit = 12) {
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author, slug, cover_url, language, views, category_id, created_at, categories(*)")
    .order("views", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as BookWithCategory[]) ?? [];
}

export async function fetchCategoriesWithCount() {
  const { data, error } = await supabase.rpc("get_categories_with_count");
  if (error) throw error;
  return (data ?? []) as Array<Category & { count: number }>;
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

  const column = sortBy.replace("_desc", "") as string;
  const ascending = sortBy === "title" || sortBy === "author";
  query = query
    .order(column, { ascending })
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
