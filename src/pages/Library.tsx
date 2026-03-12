import { useState } from "react";
import { Link } from "react-router-dom";
import { useBooks, useCategories } from "@/hooks/useBooks";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  // Debounce search
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedSearch(value), 300);
    setTimer(t);
  };

  const { data: categories } = useCategories();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useBooks({ search: debouncedSearch, categorySlug });

  const allBooks = data?.pages.flatMap((p) => p.books) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return (
    <div className="min-h-svh px-6 sm:px-8 py-12">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("home")}
            </Link>
            <LanguageSelector />
          </div>
          <h1
            className="font-display font-medium text-3xl md:text-4xl text-foreground"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t("library")}
          </h1>
          <p className="mt-2 text-muted-foreground font-body">
            {t("librarySubtitle")}
          </p>
        </header>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 font-body"
            />
          </div>
          <Select value={categorySlug} onValueChange={(v) => setCategorySlug(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full sm:w-[220px] font-body">
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
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground font-body mb-6">
            {totalCount} {totalCount === 1 ? t("bookSingular") : t("bookPlural")}
          </p>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Books Grid */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {allBooks.map((book) => (
              <Link
                key={book.id}
                to={`/libri/${book.slug}`}
                className="group space-y-3"
              >
                <div className="overflow-hidden rounded-md bg-muted">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={`${t("coverAlt")} ${book.title}`}
                      className="aspect-[2/3] w-full object-cover transition-transform duration-[250ms] group-hover:scale-105"
                      style={{
                        outline: "1px solid rgba(0,0,0,0.08)",
                        outlineOffset: "-1px",
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div className="aspect-[2/3] w-full flex items-center justify-center">
                      <span className="text-muted-foreground text-xs font-body">
                        {book.title}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-sm font-body">
                  <p className="font-semibold text-foreground truncate">
                    {book.title}
                  </p>
                  <p className="text-muted-foreground">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && allBooks.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-body">{t("noResults")}</p>
          </div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center mt-12">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 font-body"
            >
              {isFetchingNextPage && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("loadMore")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
