import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchBooks,
  fetchBookBySlug,
  fetchCategories,
  fetchRecentBooks,
  fetchPopularBooks,
  fetchCategoriesWithCount,
  fetchAdminStats,
  fetchAdminBooks,
  checkIsAdmin,
} from "@/lib/api";

export function useBooks({
  search = "",
  categorySlug = "",
  language = "",
  sortBy = "author" as "title" | "title_desc" | "author" | "author_desc" | "views" | "created_at",
  pageSize,
}: {
  search?: string;
  categorySlug?: string;
  language?: string;
  sortBy?: "title" | "title_desc" | "author" | "author_desc" | "views" | "created_at";
  pageSize?: number;
} = {}) {
  return useInfiniteQuery({
    queryKey: ["books", search, categorySlug, language, sortBy, pageSize],
    queryFn: ({ pageParam = 0 }) =>
      fetchBooks({ page: pageParam, search, categorySlug, language, sortBy, pageSize }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    initialPageParam: 0,
  });
}

export function useBook(slug: string | undefined) {
  return useQuery({
    queryKey: ["book", slug],
    queryFn: () => fetchBookBySlug(slug!),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}

export function useRecentBooks(limit = 12) {
  return useQuery({
    queryKey: ["recent-books", limit],
    queryFn: () => fetchRecentBooks(limit),
  });
}

export function usePopularBooks(limit = 12) {
  return useQuery({
    queryKey: ["popular-books", limit],
    queryFn: () => fetchPopularBooks(limit),
  });
}

export function useCategoriesWithCount() {
  return useQuery({
    queryKey: ["categories-with-count"],
    queryFn: fetchCategoriesWithCount,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
  });
}

export function useAdminBooks(opts: { page?: number; search?: string; sortBy?: string; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["admin-books", opts],
    queryFn: () => fetchAdminBooks(opts),
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: checkIsAdmin,
  });
}
