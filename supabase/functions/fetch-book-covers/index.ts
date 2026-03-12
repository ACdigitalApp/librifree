import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get all books without covers
  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, author")
    .or("cover_url.is.null,cover_url.eq.")
    .order("title");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: { id: string; title: string; status: string; cover_url?: string }[] = [];

  for (const book of books || []) {
    try {
      // Search Open Library for the book
      const searchQuery = encodeURIComponent(`${book.title} ${book.author}`);
      const searchRes = await fetch(
        `https://openlibrary.org/search.json?q=${searchQuery}&limit=3&fields=key,cover_i,title,author_name`
      );
      const searchData = await searchRes.json();

      let coverId: number | null = null;

      if (searchData.docs && searchData.docs.length > 0) {
        // Find the first result with a cover
        for (const doc of searchData.docs) {
          if (doc.cover_i) {
            coverId = doc.cover_i;
            break;
          }
        }
      }

      if (coverId) {
        const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;

        // Update the book record
        const { error: updateError } = await supabase
          .from("books")
          .update({ cover_url: coverUrl })
          .eq("id", book.id);

        if (updateError) {
          results.push({ id: book.id, title: book.title, status: "error", cover_url: undefined });
        } else {
          results.push({ id: book.id, title: book.title, status: "found", cover_url: coverUrl });
        }
      } else {
        results.push({ id: book.id, title: book.title, status: "not_found" });
      }

      // Small delay to be polite to Open Library API
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      results.push({ id: book.id, title: book.title, status: "error" });
    }
  }

  const found = results.filter((r) => r.status === "found").length;
  const notFound = results.filter((r) => r.status === "not_found").length;

  return new Response(
    JSON.stringify({ total: results.length, found, notFound, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
