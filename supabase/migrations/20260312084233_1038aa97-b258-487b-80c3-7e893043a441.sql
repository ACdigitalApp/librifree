-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT
  USING (true);

-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'it',
  cover_url TEXT,
  content TEXT,
  file_url TEXT,
  category_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Books are publicly readable"
  ON public.books FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX idx_books_slug ON public.books(slug);
CREATE INDEX idx_books_category ON public.books(category_id);
CREATE INDEX idx_books_language ON public.books(language);
CREATE INDEX idx_books_title_trgm ON public.books USING GIN (title gin_trgm_ops);
CREATE INDEX idx_books_author_trgm ON public.books USING GIN (author gin_trgm_ops);

-- Full text search
ALTER TABLE public.books ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('italian', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('italian', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('italian', coalesce(description, '')), 'C')
  ) STORED;

CREATE INDEX idx_books_search ON public.books USING GIN(search_vector);

-- Timestamp update function and trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for book covers
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

CREATE POLICY "Book covers are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-covers');

-- Storage bucket for book files (PDFs)
INSERT INTO storage.buckets (id, name, public) VALUES ('book-files', 'book-files', true);

CREATE POLICY "Book files are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'book-files');