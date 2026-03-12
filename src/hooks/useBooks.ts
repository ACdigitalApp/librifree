import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchBooks, fetchBookBySlug, fetchCategories } from "@/lib/api";

export function useBooks({
  search = "",
  categorySlug = "",
  language = "",
}: {
  search?: string;
  categorySlug?: string;
  language?: string;
} = {}) {
  return useInfiniteQuery({
    queryKey: ["books", search, categorySlug, language],
    queryFn: ({ pageParam = 0 }) =>
      fetchBooks({ page: pageParam, search, categorySlug, language }),
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
