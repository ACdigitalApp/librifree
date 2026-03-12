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

  // Get body params
  const { limit = 15, offset = 0 } = await req.json().catch(() => ({}));

  // Get books without covers
  const { data: books, error } = await supabase
    .from("books")
    .select("id, title, author")
    .or("cover_url.is.null,cover_url.eq.")
    .order("title")
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: { id: string; title: string; status: string; cover_url?: string }[] = [];

  for (const book of books || []) {
    try {
      const searchQuery = encodeURIComponent(`${book.title} ${book.author}`);
      const searchRes = await fetch(
        `https://openlibrary.org/search.json?q=${searchQuery}&limit=3&fields=key,cover_i,title,author_name`
      );
      const searchData = await searchRes.json();

      let coverId: number | null = null;
      if (searchData.docs) {
        for (const doc of searchData.docs) {
          if (doc.cover_i) {
            coverId = doc.cover_i;
            break;
          }
        }
      }

      if (coverId) {
        const coverUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
        const { error: updateError } = await supabase
          .from("books")
          .update({ cover_url: coverUrl })
          .eq("id", book.id);

        results.push({
          id: book.id,
          title: book.title,
          status: updateError ? "error" : "found",
          cover_url: coverUrl,
        });
      } else {
        results.push({ id: book.id, title: book.title, status: "not_found" });
      }

      await new Promise((r) => setTimeout(r, 150));
    } catch (e) {
      results.push({ id: book.id, title: book.title, status: "error" });
    }
  }

  // Count remaining
  const { count } = await supabase
    .from("books")
    .select("id", { count: "exact", head: true })
    .or("cover_url.is.null,cover_url.eq.");

  const found = results.filter((r) => r.status === "found").length;

  return new Response(
    JSON.stringify({
      processed: results.length,
      found,
      remaining: count ?? 0,
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
