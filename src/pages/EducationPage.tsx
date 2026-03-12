import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useBook } from "@/hooks/useBooks";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Loader2, Sparkles, GraduationCap, BookOpen, Users, Layers, BookMarked } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { AffiliateBookLink, AdBanner, RecommendedBooks } from "@/components/Monetization";
import { useRecommendedBooks } from "@/hooks/useRecommendedBooks";

type EduType = "summary_school" | "analysis_school" | "characters_explained";

interface EducationPageProps {
  type: EduType;
  titleKey: string;
  seoPrefix: string;
  urlPrefix: string;
  contentField: string;
}

const fieldMap: Record<EduType, string> = {
  summary_school: "summary",
  analysis_school: "themes",
  characters_explained: "characters",
};

const EducationPage = ({ type, titleKey, seoPrefix, urlPrefix, contentField }: EducationPageProps) => {
  const { slug } = useParams<{ slug: string }>();
  const { data: book, isLoading, error, refetch } = useBook(slug);
  const { t } = useLanguage();
  const [generating, setGenerating] = useState(false);

  const generateType = fieldMap[type];

  const handleGenerate = async () => {
    if (!slug) return;
    setGenerating(true);
    try {
      await supabase.functions.invoke("generate-book-content", {
        body: { slug, type: generateType, force: true },
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

  const content = (book as any)[contentField] as string | null;
  const pageTitle = `${t(titleKey as any)} ${book.title}`;
  const seoTitle = `${pageTitle} – ${book.author} | Librifree`;
  const seoDesc = `${seoPrefix} "${book.title}" ${t("by")} ${book.author}. ${t("eduOptimized")} Librifree.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: pageTitle,
    description: seoDesc,
    about: { "@type": "Book", name: book.title, author: { "@type": "Person", name: book.author } },
    url: `https://librifree.lovable.app/${urlPrefix}/${book.slug}`,
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
              <GraduationCap className="w-3 h-3" />
              {t("eduSection")}
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

          {/* Cross-links */}
          <div className="mt-10 border-t border-border pt-8">
            <h2 className="text-sm font-semibold mb-3">{t("exploreMore")}</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { to: `/libri/${book.slug}`, label: t("readFullBook"), icon: BookOpen },
                { to: `/riassunto/${book.slug}`, label: t("readSummary"), icon: BookMarked },
                { to: `/personaggi/${book.slug}`, label: t("characters"), icon: Users },
                { to: `/analisi/${book.slug}`, label: t("analysis"), icon: Layers },
                { to: `/riassunto-scuola/${book.slug}`, label: t("schoolSummary"), icon: GraduationCap },
                { to: `/analisi-scolastica/${book.slug}`, label: t("schoolAnalysis"), icon: GraduationCap },
                { to: `/personaggi-spiegati/${book.slug}`, label: t("charactersExplained"), icon: Users },
              ]
                .filter(({ to }) => !to.includes(`/${urlPrefix}/`))
                .map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </Link>
                ))}
            </div>
          </div>

          {/* Monetization */}
          <div className="mt-8 space-y-6">
            <AdBanner slot={`edu-${type}`} />
            <AffiliateBookLink title={book.title} author={book.author} />
            <EduRecommendations categoryId={book.category_id} slug={book.slug} />
          </div>
        </article>
      </div>
    </>
  );
};

function EduRecommendations({ categoryId, slug }: { categoryId: string | null; slug: string }) {
  const { data: recommended } = useRecommendedBooks(categoryId, slug);
  if (!recommended?.length) return null;
  return <RecommendedBooks books={recommended} />;
}

export const SchoolSummaryPage = () => (
  <EducationPage type="summary_school" titleKey="schoolSummaryOf" seoPrefix="Riassunto per la scuola di" urlPrefix="riassunto-scuola" contentField="summary" />
);

export const SchoolAnalysisPage = () => (
  <EducationPage type="analysis_school" titleKey="schoolAnalysisOf" seoPrefix="Analisi scolastica di" urlPrefix="analisi-scolastica" contentField="themes" />
);

export const CharactersExplainedPage = () => (
  <EducationPage type="characters_explained" titleKey="charactersExplainedOf" seoPrefix="Personaggi spiegati di" urlPrefix="personaggi-spiegati" contentField="characters" />
);

export default EducationPage;
