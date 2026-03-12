import { useParams, Link } from "react-router-dom";
import { useBook } from "@/hooks/useBooks";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { ArrowLeft, Loader2 } from "lucide-react";

const BookPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: book, isLoading, error } = useBook(slug);
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-display text-2xl font-medium text-foreground">
          {t("bookNotFound")}
        </h1>
        <Link
          to="/biblioteca"
          className="mt-4 text-primary hover:text-primary/80 transition-colors font-body"
        >
          {t("backToLibrary")}
        </Link>
      </div>
    );
  }

  return (
    <main className="px-6 py-12 sm:py-16">
      <article className="mx-auto max-w-[65ch]">
        <div className="flex items-center justify-between mb-12">
          <Link
            to="/biblioteca"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToLibrary")}
          </Link>
          <LanguageSelector />
        </div>

        <header className="mb-12 text-center">
          {book.cover_url && (
            <img
              src={book.cover_url}
              alt={`${t("coverAlt")} ${book.title}`}
              className="mx-auto w-48 rounded-md shadow-lg mb-8"
              style={{
                outline: "1px solid rgba(0,0,0,0.08)",
                outlineOffset: "-1px",
              }}
            />
          )}
          <h1
            className="font-display text-3xl sm:text-4xl font-medium text-foreground"
            style={{ textWrap: "balance", letterSpacing: "-0.02em" }}
          >
            {book.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground font-body">
            {book.author}
          </p>
          {book.categories && (
            <p className="mt-2 text-sm text-muted-foreground font-body">
              {book.categories.name}
            </p>
          )}
          {book.description && (
            <p
              className="mt-4 text-sm text-muted-foreground font-body italic"
              style={{ textWrap: "balance" }}
            >
              {book.description}
            </p>
          )}
        </header>

        {book.content && (
          <div
            className="prose-book text-foreground"
            dangerouslySetInnerHTML={{ __html: book.content }}
          />
        )}
      </article>
    </main>
  );
};

export default BookPage;
