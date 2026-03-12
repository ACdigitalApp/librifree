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

  try {
    const { batch_size = 50, offset = 0 } = await req.json().catch(() => ({}));

    // Get books without covers in batches
    const { data: books, error, count } = await supabase
      .from("books")
      .select("id, title, author", { count: "exact" })
      .or("cover_url.is.null,cover_url.eq.")
      .order("views", { ascending: false })
      .range(offset, offset + batch_size - 1);

    if (error) throw error;

    const results: any[] = [];
    let found = 0;
    let notFound = 0;

    for (const book of books || []) {
      try {
        // Search Open Library
        const searchQuery = encodeURIComponent(`${book.title} ${book.author}`);
        const searchRes = await fetch(
          `https://openlibrary.org/search.json?q=${searchQuery}&limit=1&fields=cover_i`,
          { signal: AbortSignal.timeout(3000) }
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
          await supabase.from("books").update({ cover_url: coverUrl }).eq("id", book.id);
          found++;
          results.push({ title: book.title, status: "found" });
        } else {
          // Set a placeholder so we don't retry this book
          await supabase.from("books").update({ cover_url: "no-cover" }).eq("id", book.id);
          notFound++;
          results.push({ title: book.title, status: "not_found" });
        }

        // Rate limit: 200ms between requests
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        results.push({ title: book.title, status: "error" });
      }
    }

    return new Response(
      JSON.stringify({
        found,
        notFound,
        processed: results.length,
        remaining: (count || 0) - offset - results.length,
        totalMissing: count,
        nextOffset: offset + batch_size,
        results: results.slice(0, 20),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Cover fetch error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
