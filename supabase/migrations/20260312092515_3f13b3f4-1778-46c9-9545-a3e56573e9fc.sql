ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS characters text,
  ADD COLUMN IF NOT EXISTS themes text,
  ADD COLUMN IF NOT EXISTS chapters text,
  ADD COLUMN IF NOT EXISTS quotes text;