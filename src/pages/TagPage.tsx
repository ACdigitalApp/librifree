import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Loader2, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AdBanner } from "@/components/Monetization";
import SEOHead from "@/components/SEOHead";

function useTagWithBooks(tagSlug: string | undefined) {
  return useQuery({
    queryKey: ["tag-books", tagSlug],
    queryFn: async () => {
      const { data: tag, error: tagError } = await supabase
        .from("tags")
        .select("*")
        .eq("slug", tagSlug!)
        .single();
      if (tagError) throw tagError;

      const { data: bookTags, error: btError } = await supabase
        .from("book_tags")
        .select("book_id")
        .eq("tag_id", tag.id);
      if (btError) throw btError;

      const bookIds = (bookTags ?? []).map((bt: any) => bt.book_id);
      if (bookIds.length === 0) return { tag, books: [] };

      const { data: books, error: booksError } = await supabase
        .from("books")
        .select("id, title, author, slug, cover_url, views")
        .in("id", bookIds)
        .order("views", { ascending: false });
      if (booksError) throw booksError;

      return { tag, books: books ?? [] };
    },
    enabled: !!tagSlug,
  });
}

const TagPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const { data, isLoading, error } = useTagWithBooks(slug);

  const tagName = data?.tag?.name || (slug || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const tagType = data?.tag?.type || "theme";
  const typeLabels: Record<string, string> = { theme: "Tema", genre: "Genere", period: "Periodo storico" };

  const tagPath = `/tag/${slug}`;
  const seoTitle = `${tagName} – Libri e Opere | Librifree`;
  const seoDesc = `Esplora i libri legati al ${typeLabels[tagType]?.toLowerCase() || "tema"} "${tagName}" su Librifree. Lettura gratuita online.`;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        path={tagPath}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Biblioteca", url: "/biblioteca" },
          { name: tagName, url: tagPath },
        ]}
      />

      <div className="min-h-svh bg-background text-foreground">
        <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-6 sm:px-8 py-3 max-w-[1280px] mx-auto">
            <Link to="/biblioteca" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t("backToLibrary")}</span>
            </Link>
            <LanguageSelector />
          </div>
        </nav>

        <div className="px-6 sm:px-8 py-10 sm:py-16 max-w-[1280px] mx-auto">
          <header className="mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1 mb-3">
              <Tag className="w-3 h-3" />
              {typeLabels[tagType] || "Tag"}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{tagName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {data?.books.length ?? 0} {(data?.books.length ?? 0) === 1 ? t("bookSingular") : t("bookPlural")}
            </p>
          </header>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground text-center py-20">Tag non trovato</p>
          ) : (data?.books.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-20">{t("noResults")}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {data!.books.map((book: any) => (
                  <Link key={book.id} to={`/libri/${book.slug}`} className="group">
                    <div className="overflow-hidden rounded-lg bg-secondary aspect-[2/3]">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={`Copertina di ${book.title}`}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4">
                          <span className="text-muted-foreground text-xs text-center">{book.title}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2.5 text-sm font-medium text-foreground truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{book.author}</p>
                  </Link>
                ))}
              </div>
              <div className="mt-10">
                <AdBanner slot="tag-bottom" />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default TagPage;
