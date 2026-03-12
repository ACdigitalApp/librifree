
-- Indexes for large catalog performance (10k+ books)
CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_language ON public.books(language);
CREATE INDEX IF NOT EXISTS idx_books_views_desc ON public.books(views DESC);
CREATE INDEX IF NOT EXISTS idx_books_created_at_desc ON public.books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_slug ON public.books(slug);
CREATE INDEX IF NOT EXISTS idx_books_author ON public.books(author);
CREATE INDEX IF NOT EXISTS idx_books_title_author_trgm ON public.books USING gin (title gin_trgm_ops);

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a function to get categories with book count efficiently
CREATE OR REPLACE FUNCTION public.get_categories_with_count()
RETURNS TABLE(id uuid, name text, slug text, created_at timestamptz, count bigint)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT c.id, c.name, c.slug, c.created_at, COUNT(b.id) as count
  FROM categories c
  LEFT JOIN books b ON b.category_id = c.id
  GROUP BY c.id, c.name, c.slug, c.created_at
  HAVING COUNT(b.id) > 0
  ORDER BY c.name;
$$;
