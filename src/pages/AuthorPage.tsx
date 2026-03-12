import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Loader2, BookOpen, Users, Quote, Layers, List, BookMarked, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AdBanner, AffiliateBookLink, RecommendedBooks } from "@/components/Monetization";
import { useRecommendedBooks } from "@/hooks/useRecommendedBooks";
import type { BookWithCategory } from "@/lib/api";

function slugifyAuthor(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function useAuthorBooks(authorSlug: string | undefined) {
  return useQuery({
    queryKey: ["author-books", authorSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_books_by_author", { author_slug: authorSlug! });
      if (error) throw error;
      return (data ?? []) as BookWithCategory[];
    },
    enabled: !!authorSlug,
  });
}

const AuthorPage = () => {
  const { name } = useParams<{ name: string }>();
  const { t } = useLanguage();
  const { data: books = [], isLoading } = useAuthorBooks(name);

  const authorName = books.length > 0
    ? books[0].author
    : (name || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const seoTitle = `${authorName} – Libri e Opere | Librifree`;
  const seoDesc = `Scopri tutti i libri di ${authorName} disponibili gratuitamente su Librifree. Leggi le opere complete, i riassunti e le analisi letterarie.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: authorName,
    url: `https://librifree.lovable.app/autore/${name}`,
    mainEntityOfPage: { "@type": "WebPage" },
  };

  const seoLinks = (slug: string) => [
    { to: `/libri/${slug}`, label: t("readFullBook"), icon: BookOpen },
    { to: `/riassunto/${slug}`, label: t("readSummary"), icon: BookMarked },
    { to: `/personaggi/${slug}`, label: t("characters"), icon: Users },
    { to: `/citazioni/${slug}`, label: t("quotes"), icon: Quote },
    { to: `/analisi/${slug}`, label: t("analysis"), icon: Layers },
    { to: `/capitoli/${slug}`, label: t("chapters"), icon: List },
    { to: `/temi/${slug}`, label: t("themes") || "Temi", icon: Layers },
    { to: `/contesto-storico/${slug}`, label: "Contesto storico", icon: Clock },
  ];

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={`https://librifree.lovable.app/autore/${name}`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

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
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {authorName}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {books.length} {books.length === 1 ? t("bookSingular") : t("bookPlural")} disponibili su Librifree
            </p>
          </header>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : books.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-20">{t("noResults")}</p>
          ) : (
            <div className="space-y-10">
              {/* Book grid */}
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {books.map((book) => (
                  <Link key={book.id} to={`/libri/${book.slug}`} className="group">
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
                          <span className="text-muted-foreground text-xs text-center">{book.title}</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2.5 text-sm font-medium text-foreground truncate">{book.title}</p>
                  </Link>
                ))}
              </div>

              {/* Cross-links for each book */}
              <section>
                <h2 className="text-lg font-semibold tracking-tight mb-4">Esplora le opere</h2>
                <div className="space-y-4">
                  {books.slice(0, 10).map((book) => (
                    <div key={book.id} className="rounded-xl border border-border p-4">
                      <h3 className="text-sm font-semibold mb-2">{book.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {seoLinks(book.slug).map(({ to, label, icon: Icon }) => (
                          <Link
                            key={to}
                            to={to}
                            className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-border"
                          >
                            <Icon className="w-3 h-3" />
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <AdBanner slot="author-bottom" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AuthorPage;
