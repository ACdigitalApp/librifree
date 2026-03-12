
-- Tags table for themes, genres, historical periods
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'theme' CHECK (type IN ('theme', 'genre', 'period')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Junction table for book-tag relationships
CREATE TABLE public.book_tags (
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_tags ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Tags are publicly readable" ON public.tags FOR SELECT TO public USING (true);
CREATE POLICY "Book tags are publicly readable" ON public.book_tags FOR SELECT TO public USING (true);

-- Admin write access
CREATE POLICY "Admins can manage tags" ON public.tags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage book_tags" ON public.book_tags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_tags_type ON public.tags(type);
CREATE INDEX idx_book_tags_book_id ON public.book_tags(book_id);
CREATE INDEX idx_book_tags_tag_id ON public.book_tags(tag_id);

-- Function to get books by author slug efficiently
CREATE OR REPLACE FUNCTION public.get_books_by_author(author_slug text)
RETURNS SETOF books
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT * FROM books 
  WHERE lower(regexp_replace(regexp_replace(
    translate(lower(author), 'àáâãäåèéêëìíîïòóôõöùúûüýÿñç', 'aaaaaaeeeeiiiioooooouuuuyync'),
    '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) = author_slug
  ORDER BY views DESC;
$$;

-- Function to get books by first letter
CREATE OR REPLACE FUNCTION public.get_books_by_letter(first_letter text)
RETURNS TABLE(id uuid, title text, author text, slug text, cover_url text, views integer)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT b.id, b.title, b.author, b.slug, b.cover_url, b.views
  FROM books b
  WHERE lower(left(b.title, 1)) = lower(first_letter)
  ORDER BY b.title;
$$;

-- Function to get unique authors by first letter
CREATE OR REPLACE FUNCTION public.get_authors_by_letter(first_letter text)
RETURNS TABLE(author text, book_count bigint)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT b.author, COUNT(*) as book_count
  FROM books b
  WHERE lower(left(
    translate(lower(b.author), 'àáâãäåèéêëìíîïòóôõöùúûüýÿñç', 'aaaaaaeeeeiiiioooooouuuuyync'),
    1)) = lower(first_letter)
  GROUP BY b.author
  ORDER BY b.author;
$$;
