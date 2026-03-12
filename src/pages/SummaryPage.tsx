import { useParams, Link } from "react-router-dom";
import { useBook } from "@/hooks/useBooks";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Loader2, BookOpen, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { AffiliateBookLink, AdBanner, RecommendedBooks } from "@/components/Monetization";
import { useRecommendedBooks } from "@/hooks/useRecommendedBooks";

const SummaryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: book, isLoading, error, refetch } = useBook(slug);
  const { t } = useLanguage();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!slug) return;
    setGenerating(true);
    try {
      await supabase.functions.invoke("generate-summary", {
        body: { slug, force: true },
      });
      await refetch();
    } catch (e) {
      console.error("Error generating summary:", e);
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

  const seoTitle = (book as any).seo_title || `${t("summaryOf")} ${book.title} – Librifree`;
  const seoDesc = (book as any).seo_description || `${t("summaryOf")} "${book.title}" ${t("by")} ${book.author}.`;
  const summary = (book as any).summary as string | null;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${t("summaryOf")} ${book.title}`,
    author: { "@type": "Person", name: book.author },
    about: { "@type": "Book", name: book.title },
    url: `https://librifree.lovable.app/riassunto/${book.slug}`,
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
              />
            )}
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1 mb-4">
              <Sparkles className="w-3 h-3" />
              {t("aiSummary")}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ textWrap: "balance" as any }}>
              {t("summaryOf")} {book.title}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">{book.author}</p>
          </header>

          {summary ? (
            <div className="prose-book" dangerouslySetInnerHTML={{ __html: summary }} />
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground mb-6">{t("noSummaryYet")}</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                {generating ? t("generating") : t("generateSummary")}
              </button>
            </div>
          )}

          {/* Monetization */}
          <div className="mt-12 space-y-6">
            <AdBanner slot="summary-mid" />
            <AffiliateBookLink title={book.title} author={book.author} />
            <SummaryRecommendations categoryId={book.category_id} slug={book.slug} />
          </div>

          {/* Link to read the full book */}
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

function SummaryRecommendations({ categoryId, slug }: { categoryId: string | null; slug: string }) {
  const { data: recommended } = useRecommendedBooks(categoryId, slug);
  if (!recommended?.length) return null;
  return <RecommendedBooks books={recommended} />;
}

export default SummaryPage;
