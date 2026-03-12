import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBook } from "@/hooks/useBooks";
import { incrementBookViews } from "@/lib/api";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Loader2, Moon, Sun, Minus, Plus, List, Users, Quote, BookMarked, Layers, Clock, GraduationCap } from "lucide-react";
import { AffiliateBookLink, AdBanner, RecommendedBooks } from "@/components/Monetization";
import { useRecommendedBooks } from "@/hooks/useRecommendedBooks";
import { Helmet } from "react-helmet-async";

type FontSize = "sm" | "md" | "lg" | "xl";

function slugifyAuthor(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BookPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: book, isLoading, error } = useBook(slug);
  const { t } = useLanguage();
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>("md");
  const [showToc, setShowToc] = useState(false);

  // Track views
  useEffect(() => {
    if (slug) incrementBookViews(slug);
  }, [slug]);

  const toc = useMemo(() => {
    if (!book?.content) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(book.content, "text/html");
    const headings = doc.querySelectorAll("h2, h3");
    return Array.from(headings).map((h, i) => ({
      id: `heading-${i}`,
      text: h.textContent || "",
      level: h.tagName === "H2" ? 2 : 3,
    }));
  }, [book?.content]);

  const processedContent = useMemo(() => {
    if (!book?.content) return "";
    let index = 0;
    return book.content.replace(/<(h[23])>/g, (_match, tag) => {
      return `<${tag} id="heading-${index++}">`;
    });
  }, [book?.content]);

  const fontSizes: FontSize[] = ["sm", "md", "lg", "xl"];
  const currentFontIndex = fontSizes.indexOf(fontSize);

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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author },
    description: book.description || "",
    url: `https://librifree.lovable.app/libri/${book.slug}`,
    image: book.cover_url || "",
    inLanguage: book.language || "it",
  };

  const seoLinks = [
    { to: `/riassunto/${book.slug}`, label: t("readSummary"), icon: BookMarked },
    { to: `/personaggi/${book.slug}`, label: t("characters"), icon: Users },
    { to: `/citazioni/${book.slug}`, label: t("quotes"), icon: Quote },
    { to: `/analisi/${book.slug}`, label: t("analysis"), icon: Layers },
    { to: `/capitoli/${book.slug}`, label: t("chapters"), icon: List },
    { to: `/temi/${book.slug}`, label: t("themes"), icon: Layers },
    { to: `/contesto-storico/${book.slug}`, label: t("historicalContext"), icon: Clock },
    { to: `/riassunto-scuola/${book.slug}`, label: t("schoolSummary"), icon: GraduationCap },
    { to: `/analisi-scolastica/${book.slug}`, label: t("schoolAnalysis"), icon: GraduationCap },
    { to: `/personaggi-spiegati/${book.slug}`, label: t("charactersExplained"), icon: Users },
  ];

  return (
    <>
      <Helmet>
        <title>{`${book.title} – ${book.author} | Librifree`}</title>
        <meta name="description" content={book.description || `Leggi ${book.title} di ${book.author} gratuitamente su Librifree.`} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className={`min-h-svh transition-colors ${darkMode ? "reader-dark bg-[hsl(0,0%,8%)] text-[hsl(0,0%,85%)]" : "bg-background text-foreground"}`}>
        <nav className={`sticky top-0 z-10 backdrop-blur-md border-b ${darkMode ? "bg-[hsl(0,0%,8%)]/80 border-[hsl(0,0%,20%)]" : "bg-background/80 border-border"}`}>
          <div className="flex items-center justify-between px-6 py-3 max-w-[65ch] mx-auto">
            <Link to="/biblioteca" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t("backToLibrary")}</span>
            </Link>
            <div className="flex items-center gap-1">
              {toc.length > 0 && (
                <button onClick={() => setShowToc(!showToc)} className={`p-2 rounded-full transition-colors ${showToc ? "bg-foreground/10" : "hover:bg-foreground/5"}`}>
                  <List className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => currentFontIndex > 0 && setFontSize(fontSizes[currentFontIndex - 1])} disabled={currentFontIndex === 0} className="p-2 rounded-full hover:bg-foreground/5 disabled:opacity-30 transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs w-5 text-center font-medium uppercase">{fontSize}</span>
              <button onClick={() => currentFontIndex < fontSizes.length - 1 && setFontSize(fontSizes[currentFontIndex + 1])} disabled={currentFontIndex === fontSizes.length - 1} className="p-2 rounded-full hover:bg-foreground/5 disabled:opacity-30 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-foreground/5 transition-colors">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <LanguageSelector />
            </div>
          </div>
        </nav>

        {showToc && toc.length > 0 && (
          <div className={`fixed right-0 top-[53px] bottom-0 w-72 z-20 overflow-y-auto border-l p-4 ${darkMode ? "bg-[hsl(0,0%,10%)] border-[hsl(0,0%,20%)]" : "bg-background border-border"}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("tableOfContents")}</p>
            <ul className="space-y-1">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} onClick={() => setShowToc(false)} className={`block text-sm py-1 transition-colors hover:text-foreground ${item.level === 3 ? "pl-4 text-muted-foreground" : "font-medium text-foreground/80"}`}>
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <article className={`px-6 py-10 sm:py-16 max-w-[65ch] mx-auto reader-${fontSize}`}>
          <header className="mb-12 text-center">
            {book.cover_url && (
              <img src={book.cover_url} alt={`${t("coverAlt")} ${book.title}`} className="mx-auto w-40 sm:w-48 rounded-lg shadow-xl mb-8" />
            )}
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ textWrap: "balance" } as React.CSSProperties}>
              {book.title}
            </h1>
            <Link to={`/author/${slugifyAuthor(book.author)}`} className="mt-2 text-base text-muted-foreground hover:text-foreground transition-colors inline-block">
              {book.author}
            </Link>
            {book.categories && (
              <span className={`block mt-3 text-xs px-3 py-1 rounded-full ${darkMode ? "bg-[hsl(0,0%,15%)]" : "bg-secondary"} text-muted-foreground inline-block`}>
                {book.categories.name}
              </span>
            )}
            {book.description && (
              <p className="mt-4 text-sm text-muted-foreground italic max-w-lg mx-auto" style={{ textWrap: "balance" } as React.CSSProperties}>
                {book.description}
              </p>
            )}

            {/* Primary CTA: Summary */}
            <div className="mt-6">
              <Link
                to={`/riassunto/${book.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-primary/90 shadow-md"
              >
                <BookMarked className="w-4 h-4" />
                Leggi il Riassunto
              </Link>
            </div>

            {/* SEO page links */}
            <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
              {seoLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </Link>
              ))}
              {book.file_url && (
                <a
                  href={book.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-border"
                >
                  {t("download")}
                </a>
              )}
            </div>
          </header>

          {processedContent && (
            <div className="prose-book" dangerouslySetInnerHTML={{ __html: processedContent }} />
          )}

          {/* Monetization */}
          <div className="mt-12 space-y-6">
            <AdBanner slot="book-mid" />
            <AffiliateBookLink title={book.title} author={book.author} />
            <BookRecommendations categoryId={book.category_id} slug={book.slug} />
          </div>
        </article>
      </div>
    </>
  );
};

function BookRecommendations({ categoryId, slug }: { categoryId: string | null; slug: string }) {
  const { data: recommended } = useRecommendedBooks(categoryId, slug);
  if (!recommended?.length) return null;
  return <RecommendedBooks books={recommended} />;
}

export default BookPage;
