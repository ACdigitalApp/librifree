import { useState, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useBooks, useCategories } from "@/hooks/useBooks";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Search, Loader2, BookMarked } from "lucide-react";
import { AdBanner } from "@/components/Monetization";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Library = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("categoria") || "";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState(initialCategory);
  const [sortBy, setSortBy] = useState<"author" | "author_desc" | "title" | "title_desc" | "views" | "created_at">("author");
  const [pageSize, setPageSize] = useState(25);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  const { data: categories } = useCategories();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useBooks({ search: debouncedSearch, categorySlug, sortBy, pageSize });

  const allBooks = data?.pages.flatMap((p) => p.books) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return (
    <div className="min-h-svh">
      {/* Header */}
      <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 sm:px-8 py-3 max-w-[1280px] mx-auto">
          <Link to="/" className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity">
            Librifree
          </Link>
          <LanguageSelector />
        </div>
      </nav>

      <div className="px-6 sm:px-8 py-10 max-w-[1280px] mx-auto">
        {/* Title */}
        <div className="mb-8">
          <h1 className="font-semibold text-2xl md:text-3xl tracking-tight text-foreground">
            {t("library")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("librarySubtitle")}
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-10 text-sm rounded-full border-border bg-secondary"
            />
          </div>
          <Select value={categorySlug} onValueChange={(v) => setCategorySlug(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 text-sm rounded-full border-border bg-secondary">
              <SelectValue placeholder={t("allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-full sm:w-[200px] h-10 text-sm rounded-full border-border bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="author">Autore A-Z</SelectItem>
              <SelectItem value="author_desc">Autore Z-A</SelectItem>
              <SelectItem value="title">Titolo A-Z</SelectItem>
              <SelectItem value="title_desc">Titolo Z-A</SelectItem>
              <SelectItem value="views">Più visti</SelectItem>
              <SelectItem value="created_at">Più recenti</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Count + Page Size */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs text-muted-foreground">
              {totalCount} {totalCount === 1 ? t("bookSingular") : t("bookPlural")}
            </p>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(v === "all" ? 9999 : Number(v))}>
              <SelectTrigger className="w-[100px] h-8 text-xs rounded-full border-border bg-secondary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">Tutti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {allBooks.map((book) => (
              <div key={book.id} className="group">
                <Link to={`/libri/${book.slug}`}>
                  <div className="overflow-hidden rounded-lg bg-secondary aspect-[2/3]">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={`${t("coverAlt")} ${book.title}`}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <span className="text-muted-foreground text-xs text-center">
                          {book.title}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5">
                    <p className="text-sm font-medium text-foreground truncate leading-tight">
                      {book.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {book.author}
                    </p>
                  </div>
                </Link>
                <Link
                  to={`/riassunto/${book.slug}`}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/90"
                >
                  <BookMarked className="w-3 h-3" />
                  Visualizza Riassunto
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Ad banner after grid */}
        {!isLoading && allBooks.length > 0 && (
          <div className="mt-10">
            <AdBanner slot="library-bottom" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && allBooks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground">{t("noResults")}</p>
          </div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-border disabled:opacity-50"
            >
              {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("loadMore")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
