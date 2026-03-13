
-- Add book_code column (nullable first to populate)
ALTER TABLE public.books ADD COLUMN book_code integer;

-- Populate existing books sequentially by created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.books
)
UPDATE public.books SET book_code = numbered.rn FROM numbered WHERE books.id = numbered.id;

-- Now make it NOT NULL and UNIQUE
ALTER TABLE public.books ALTER COLUMN book_code SET NOT NULL;
ALTER TABLE public.books ADD CONSTRAINT books_book_code_unique UNIQUE (book_code);

-- Create a sequence starting after the max existing code
DO $$
DECLARE max_code integer;
BEGIN
  SELECT COALESCE(MAX(book_code), 0) INTO max_code FROM public.books;
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.books_book_code_seq START WITH %s', max_code + 1);
  EXECUTE 'ALTER TABLE public.books ALTER COLUMN book_code SET DEFAULT nextval(''public.books_book_code_seq'')';
END $$;
