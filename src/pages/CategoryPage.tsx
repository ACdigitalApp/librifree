import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useBooks } from "@/hooks/useBooks";
import { AdBanner } from "@/components/Monetization";
import SEOHead from "@/components/SEOHead";

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const categoryName = (slug || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useBooks({
    categorySlug: slug || "",
  });

  const allBooks = data?.pages.flatMap((p) => p.books) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const catPath = `/categoria/${slug}`;
  const seoTitle = `${categoryName} – Libri Gratuiti Online | Librifree`;
  const seoDesc = `Esplora ${totalCount} libri di ${categoryName} disponibili gratuitamente su Librifree. Leggi le opere complete con riassunti e analisi letterarie.`;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Biblioteca", url: "/biblioteca" },
    { name: categoryName, url: catPath },
  ];

  const collectionSD = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: categoryName,
    description: seoDesc,
    url: `https://librifree.it${catPath}`,
  };

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        path={catPath}
        structuredData={collectionSD}
        breadcrumbs={breadcrumbs}
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
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
            <ol className="flex items-center gap-1">
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li>/</li>
              <li><Link to="/biblioteca" className="hover:text-foreground transition-colors">Biblioteca</Link></li>
              <li>/</li>
              <li className="text-foreground font-medium">{categoryName}</li>
            </ol>
          </nav>

          <header className="mb-10">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{categoryName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {totalCount} {totalCount === 1 ? t("bookSingular") : t("bookPlural")}
            </p>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              Esplora la nostra collezione di libri di {categoryName.toLowerCase()}, disponibili gratuitamente per la lettura online. Ogni libro include riassunto, analisi letteraria, citazioni e approfondimenti sui personaggi.
            </p>
          </header>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : allBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-20">{t("noResults")}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {allBooks.map((book) => (
                  <Link key={book.id} to={`/libri/${book.slug}`} className="group">
                    <div className="overflow-hidden rounded-lg bg-secondary aspect-[2/3]">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={`Copertina di ${book.title} di ${book.author}`}
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

              <div className="mt-10">
                <AdBanner slot="category-bottom" />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryPage;
