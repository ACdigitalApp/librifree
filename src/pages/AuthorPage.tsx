import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { useBooks } from "@/hooks/useBooks";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

function slugifyAuthor(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const AuthorPage = () => {
  const { name } = useParams<{ name: string }>();
  const { t } = useLanguage();

  // Decode the author name from slug
  const authorName = (name || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const { data, isLoading } = useBooks({ search: authorName });
  const books = data?.pages.flatMap((p) => p.books).filter(
    (b) => slugifyAuthor(b.author) === name
  ) ?? [];

  const seoTitle = `${authorName} – Libri e Opere | Librifree`;
  const seoDesc = `Scopri tutti i libri di ${authorName} disponibili gratuitamente su Librifree.`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: authorName,
    url: `https://librifree.lovable.app/author/${name}`,
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
              {books.length} {books.length === 1 ? t("bookSingular") : t("bookPlural")}
            </p>
          </header>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : books.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-20">{t("noResults")}</p>
          ) : (
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
          )}
        </div>
      </div>
    </>
  );
};

export default AuthorPage;
