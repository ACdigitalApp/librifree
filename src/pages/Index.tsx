import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { useRecentBooks, usePopularBooks, useCategoriesWithCount } from "@/hooks/useBooks";
import { useBookOfTheDay } from "@/hooks/useBookOfTheDay";
import { useTotalBookCount } from "@/hooks/useTotalBookCount";
import { ArrowRight, Loader2, BookOpen } from "lucide-react";
import type { BookWithCategory } from "@/lib/api";
import SEOHead from "@/components/SEOHead";
import { SITE_URL } from "@/lib/seo";
import Footer from "@/components/Footer";
import BookCoverPlaceholder from "@/components/BookCoverPlaceholder";

function isPlaceholderCover(url: string | null) {
  if (!url || url === "no-cover") return true;
  // Gutenberg placeholder covers are small solid-color images
  if (url.includes("gutenberg.org") && url.includes("/pg")) return true;
  return false;
}

function BookCard({ book }: { book: BookWithCategory }) {
  return (
    <Link to={`/libri/${book.slug}`} className="group flex-shrink-0 w-[140px] sm:w-[160px]">
      <div className="overflow-hidden rounded-lg bg-secondary aspect-[2/3]">
        {!isPlaceholderCover(book.cover_url) ? (
          <img
            src={book.cover_url!}
            alt={`Copertina di ${book.title} di ${book.author}`}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <BookCoverPlaceholder title={book.title} author={book.author} />
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground leading-tight line-clamp-2">{book.title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 truncate">{book.author}</p>
    </Link>
  );
}

function BookRow({ title, books, isLoading }: { title: string; books: BookWithCategory[]; isLoading: boolean }) {
  const { t } = useLanguage();
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">{title}</h2>
        <Link
          to="/biblioteca"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          {t("viewAll")} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}

function BookOfTheDay() {
  const { data: book, isLoading } = useBookOfTheDay();
  if (isLoading || !book) return null;

  return (
    <section className="mb-12">
      <h2 className="text-lg font-semibold text-foreground tracking-tight mb-5">
        📖 Libro del Giorno
      </h2>
      <Link
        to={`/libri/${book.slug}`}
        className="flex gap-5 items-center rounded-xl border border-border bg-secondary/50 p-4 hover:bg-secondary transition-colors"
      >
        <div className="w-20 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden aspect-[2/3]">
          {!isPlaceholderCover(book.cover_url) ? (
            <img src={book.cover_url!} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <BookCoverPlaceholder title={book.title} author={book.author} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-base leading-tight line-clamp-2">{book.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{book.author}</p>
          {book.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{book.description}</p>
          )}
          <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <BookOpen className="w-3.5 h-3.5" /> Leggi ora
          </span>
        </div>
      </Link>
    </section>
  );
}

const Index = () => {
  const { t } = useLanguage();
  const { data: popular, isLoading: loadingPopular } = usePopularBooks(12);
  const { data: recent, isLoading: loadingRecent } = useRecentBooks(12);
  const { data: categories, isLoading: loadingCats } = useCategoriesWithCount();
  const { data: totalCount } = useTotalBookCount();

  const filteredCategories = categories?.filter((cat) => cat.count >= 10);

  const heroSubtitle = totalCount
    ? `Leggi gratuitamente ${totalCount.toLocaleString("it-IT")} libri classici online.`
    : t("heroSubtitle");

  const websiteSD = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Librifree",
    url: SITE_URL,
    description: "Biblioteca digitale gratuita con migliaia di libri classici online.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/biblioteca?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const orgSD = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Librifree",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
  };

  return (
    <>
      <SEOHead
        title="Librifree – Biblioteca Digitale Gratuita di Libri Classici"
        description="Leggi gratuitamente migliaia di libri classici online. Letteratura italiana, inglese, francese, russa e americana. Riassunti, analisi e approfondimenti."
        path="/"
        structuredData={[websiteSD, orgSD]}
      />

      <div className="min-h-svh flex flex-col bg-background">
        {/* Header */}
        <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-6 sm:px-8 py-3 max-w-[1280px] mx-auto">
            <Link to="/" className="text-sm font-semibold tracking-tight hover:opacity-70 transition-opacity">
              Librifree
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/biblioteca" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {t("library")}
              </Link>
              <Link to="/chi-siamo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Chi siamo
              </Link>
              <LanguageSelector />
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-16 sm:py-24 text-center px-6">
          <h1
            className="font-semibold text-3xl sm:text-4xl md:text-5xl text-foreground tracking-tight max-w-2xl mx-auto"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            {t("heroTitle")}
          </h1>
          <p className="mt-4 max-w-lg mx-auto text-base text-muted-foreground">
            {heroSubtitle}
          </p>
          <Link
            to="/biblioteca"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            {t("enterLibrary")}
          </Link>
        </section>

        {/* SEO text block */}
        <section className="px-6 sm:px-8 max-w-[1280px] mx-auto mb-12">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
            Librifree è una biblioteca digitale gratuita che offre accesso a migliaia di libri classici della letteratura mondiale.
            Troverai opere di letteratura italiana, inglese, francese, russa e americana, complete di riassunti, analisi letterarie,
            citazioni e approfondimenti sui personaggi. Ideale per studenti, insegnanti e appassionati di lettura.
          </p>
        </section>

        {/* Content */}
        <div className="flex-1 px-6 sm:px-8 max-w-[1280px] mx-auto pb-20">
          {/* Book of the Day */}
          <BookOfTheDay />

          <BookRow title={t("popularBooks")} books={popular ?? []} isLoading={loadingPopular} />
          <BookRow title={t("recentBooks")} books={recent ?? []} isLoading={loadingRecent} />

          {/* Categories */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-foreground tracking-tight mb-5">
              {t("mainCategories")}
            </h2>
            {loadingCats ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredCategories?.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categoria/${cat.slug}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5 hover:bg-secondary transition-colors"
                  >
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">{cat.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Alphabetical navigation */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-foreground tracking-tight mb-5">
              Indice Alfabetico
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/libri-a" className="rounded-xl border border-border bg-background px-4 py-3.5 hover:bg-secondary transition-colors text-sm font-medium text-foreground">
                Libri dalla A alla Z
              </Link>
              <Link to="/autori-a" className="rounded-xl border border-border bg-background px-4 py-3.5 hover:bg-secondary transition-colors text-sm font-medium text-foreground">
                Autori dalla A alla Z
              </Link>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Index;
