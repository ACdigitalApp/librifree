import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { slugifyAuthor } from "@/lib/seo";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function AlphabetNav({ prefix, current }: { prefix: string; current: string }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-8">
      {ALPHABET.map((letter) => (
        <Link
          key={letter}
          to={`/${prefix}-${letter}`}
          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            current === letter
              ? "bg-foreground text-background"
              : "bg-secondary text-foreground hover:bg-border"
          }`}
        >
          {letter.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}

export const BooksAlphabeticalPage = () => {
  const { letter } = useParams<{ letter: string }>();
  const { t } = useLanguage();
  const l = letter?.toLowerCase() || "a";

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books-by-letter", l],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_books_by_letter", { first_letter: l });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pagePath = `/libri-${l}`;
  const seoTitle = `Libri che iniziano per ${l.toUpperCase()} | Librifree`;
  const seoDesc = `Elenco alfabetico dei libri che iniziano con la lettera ${l.toUpperCase()} disponibili gratuitamente su Librifree.`;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        path={pagePath}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Biblioteca", url: "/biblioteca" },
          { name: `Libri ${l.toUpperCase()}`, url: pagePath },
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

        <div className="px-6 sm:px-8 py-10 max-w-[1280px] mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight mb-6">
            Libri — {l.toUpperCase()}
          </h1>

          <AlphabetNav prefix="libri" current={l} />

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : books.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-20">{t("noResults")}</p>
          ) : (
            <div className="space-y-1">
              {books.map((book: any) => (
                <Link
                  key={book.id}
                  to={`/libri/${book.slug}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {book.cover_url && (
                      <img src={book.cover_url} alt={`Copertina di ${book.title}`} className="w-8 h-12 object-cover rounded flex-shrink-0" loading="lazy" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground">{book.author}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{book.views} views</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const AuthorsAlphabeticalPage = () => {
  const { letter } = useParams<{ letter: string }>();
  const { t } = useLanguage();
  const l = letter?.toLowerCase() || "a";

  const { data: authors = [], isLoading } = useQuery({
    queryKey: ["authors-by-letter", l],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_authors_by_letter", { first_letter: l });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pagePath = `/autori-${l}`;
  const seoTitle = `Autori che iniziano per ${l.toUpperCase()} | Librifree`;
  const seoDesc = `Elenco alfabetico degli autori che iniziano con la lettera ${l.toUpperCase()} disponibili gratuitamente su Librifree.`;

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        path={pagePath}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Biblioteca", url: "/biblioteca" },
          { name: `Autori ${l.toUpperCase()}`, url: pagePath },
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

        <div className="px-6 sm:px-8 py-10 max-w-[1280px] mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight mb-6">
            Autori — {l.toUpperCase()}
          </h1>

          <AlphabetNav prefix="autori" current={l} />

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : authors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-20">{t("noResults")}</p>
          ) : (
            <div className="space-y-1">
              {authors.map((a: any) => (
                <Link
                  key={a.author}
                  to={`/autore/${slugifyAuthor(a.author)}`}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <span className="text-sm font-medium">{a.author}</span>
                  <span className="text-xs text-muted-foreground">{a.book_count} {Number(a.book_count) === 1 ? "libro" : "libri"}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
