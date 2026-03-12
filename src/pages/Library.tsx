import { Link } from "react-router-dom";
import { books } from "@/data/books";
import { ArrowLeft } from "lucide-react";

const Library = () => {
  return (
    <div className="min-h-svh px-6 sm:px-8 py-12">
      <div className="mx-auto max-w-[1280px]">
        <header className="mb-12">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Link>
          <h1 className="font-display font-medium text-3xl md:text-4xl text-foreground" style={{ letterSpacing: "-0.02em" }}>
            Biblioteca
          </h1>
          <p className="mt-2 text-muted-foreground font-body">
            Scegli un libro e inizia a leggere.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {books.map((book) => (
            <Link key={book.slug} to={`/libro/${book.slug}`} className="group space-y-3">
              <div className="overflow-hidden rounded-md">
                <img
                  src={book.cover}
                  alt={`Copertina di ${book.title}`}
                  className="aspect-[2/3] w-full object-cover transition-transform duration-[250ms] group-hover:scale-105"
                  style={{ outline: "1px solid rgba(0,0,0,0.08)", outlineOffset: "-1px" }}
                  loading="lazy"
                />
              </div>
              <div className="text-sm font-body">
                <p className="font-semibold text-foreground truncate">{book.title}</p>
                <p className="text-muted-foreground">{book.author}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Library;
