import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useBook } from "@/hooks/useBooks";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Loader2, Sparkles, BookOpen } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { AffiliateBookLink, AdBanner, RecommendedBooks } from "@/components/Monetization";
import { useRecommendedBooks } from "@/hooks/useRecommendedBooks";

type ContentType = "characters" | "quotes" | "analysis" | "chapters" | "themes" | "historical_context";

interface SEOContentPageProps {
  type: ContentType;
  titleKey: string;
  seoPrefix: string;
  urlPrefix: string;
}

const SEOContentPage = ({ type, titleKey, seoPrefix, urlPrefix }: SEOContentPageProps) => {
  const { slug } = useParams<{ slug: string }>();
  const { data: book, isLoading, error, refetch } = useBook(slug);
  const { t } = useLanguage();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!slug) return;
    setGenerating(true);
    try {
      await supabase.functions.invoke("generate-book-content", {
        body: { slug, type, force: true },
      });
      await refetch();
    } catch (e) {
      console.error("Error generating content:", e);
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-semibold text-xl text-foreground">{t("bookNotFound")}</h1>
        <Link to="/biblioteca" className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t("backToLibrary")}
        </Link>
      </div>
    );
  }

  const content = (book as any)[type] as string | null;
  const pageTitle = `${t(titleKey as any)} ${book.title}`;
  const seoTitle = `${pageTitle} – ${book.author} | Librifree`;
  const seoDesc = `${seoPrefix} "${book.title}" ${t("by")} ${book.author}. Librifree.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: pageTitle,
    author: { "@type": "Person", name: book.author },
    about: { "@type": "Book", name: book.title },
    url: `https://librifree.lovable.app/${urlPrefix}/${book.slug}`,
    image: book.cover_url || "",
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="min-h-svh bg-background text-foreground">
        <nav className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-6 sm:px-8 py-3 max-w-[1280px] mx-auto">
            <Link to={`/libri/${book.slug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t("backToBook")}</span>
            </Link>
            <LanguageSelector />
          </div>
        </nav>

        <article className="px-6 sm:px-8 py-10 sm:py-16 max-w-[720px] mx-auto">
          <header className="mb-12 text-center">
            {book.cover_url && (
              <img
                src={book.cover_url}
                alt={`${t("coverAlt")} ${book.title}`}
                className="mx-auto w-32 sm:w-40 rounded-lg shadow-xl mb-8"
                loading="lazy"
              />
            )}
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1 mb-4">
              <Sparkles className="w-3 h-3" />
              {t("aiGenerated")}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ textWrap: "balance" } as React.CSSProperties}>
              {pageTitle}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">{book.author}</p>
          </header>

          {content ? (
            <div className="prose-book" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground mb-6">{t("noContentYet")}</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                {generating ? t("generating") : t("generateContent")}
              </button>
            </div>
          )}

          {/* Monetization */}
          <div className="mt-12 space-y-6">
            <AdBanner slot={`seo-${type}`} />
            <AffiliateBookLink title={book.title} author={book.author} />
            <SEORecommendations categoryId={book.category_id} slug={book.slug} />
          </div>

          <div className="mt-10 text-center border-t border-border pt-8">
            <Link
              to={`/libri/${book.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-border"
            >
              <BookOpen className="w-4 h-4" />
              {t("readFullBook")}
            </Link>
          </div>
        </article>
      </div>
    </>
  );
};

function SEORecommendations({ categoryId, slug }: { categoryId: string | null; slug: string }) {
  const { data: recommended } = useRecommendedBooks(categoryId, slug);
  if (!recommended?.length) return null;
  return <RecommendedBooks books={recommended} />;
}

export const CharactersPage = () => (
  <SEOContentPage type="characters" titleKey="charactersOf" seoPrefix="Personaggi di" urlPrefix="personaggi" />
);

export const QuotesPage = () => (
  <SEOContentPage type="quotes" titleKey="quotesFrom" seoPrefix="Citazioni da" urlPrefix="citazioni" />
);

export const AnalysisPage = () => (
  <SEOContentPage type="analysis" titleKey="analysisOf" seoPrefix="Analisi letteraria di" urlPrefix="analisi" />
);

export const ChaptersPage = () => (
  <SEOContentPage type="chapters" titleKey="chaptersOf" seoPrefix="Guida ai capitoli di" urlPrefix="capitoli" />
);

export const ThemesPage = () => (
  <SEOContentPage type="themes" titleKey="themesOf" seoPrefix="Temi e motivi di" urlPrefix="temi" />
);

export const HistoricalContextPage = () => (
  <SEOContentPage type="historical_context" titleKey="historicalContextOf" seoPrefix="Contesto storico di" urlPrefix="contesto-storico" />
);

export default SEOContentPage;
