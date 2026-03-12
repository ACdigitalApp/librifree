import { useParams, Link } from "react-router-dom";
import { getBookBySlug } from "@/data/books";
import { ArrowLeft } from "lucide-react";

const BookPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const book = slug ? getBookBySlug(slug) : undefined;

  if (!book) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-display text-2xl font-medium text-foreground">Libro non trovato</h1>
        <Link to="/biblioteca" className="mt-4 text-primary hover:text-primary/80 transition-colors font-body">
          Torna alla Biblioteca
        </Link>
      </div>
    );
  }

  return (
    <main className="px-6 py-12 sm:py-16">
      <article className="mx-auto max-w-[65ch]">
        <Link to="/biblioteca" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 font-body">
          <ArrowLeft className="w-4 h-4" />
          Torna alla Biblioteca
        </Link>

        <header className="mb-12 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-foreground" style={{ textWrap: "balance", letterSpacing: "-0.02em" }}>
            {book.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground font-body">{book.author}</p>
          {book.description && (
            <p className="mt-4 text-sm text-muted-foreground font-body italic" style={{ textWrap: "balance" }}>{book.description}</p>
          )}
        </header>

        <div
          className="prose-book text-foreground"
          dangerouslySetInnerHTML={{ __html: book.content }}
        />
      </article>
    </main>
  );
};

export default BookPage;
