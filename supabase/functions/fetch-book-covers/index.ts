import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function searchCover(title: string, author: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=3&fields=items(volumeInfo/imageLinks)`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const item of data.items || []) {
      const img = item.volumeInfo?.imageLinks;
      if (img) {
        // Prefer thumbnail, replace http with https
        const url = (img.thumbnail || img.smallThumbnail || "").replace("http://", "https://");
        if (url) return url;
      }
    }
  } catch {
    // timeout or network error
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { batch_size = 20, offset = 0 } = await req.json().catch(() => ({}));

    const { data: books, error, count } = await supabase
      .from("books")
      .select("id, title, author", { count: "exact" })
      .or("cover_url.is.null,cover_url.eq.")
      .order("views", { ascending: false })
      .range(offset, offset + batch_size - 1);

    if (error) throw error;
    
    console.log(`Processing ${books?.length || 0} books, offset=${offset}, total missing=${count}`);

    let found = 0;
    let notFound = 0;
    const results: any[] = [];

    for (const book of books || []) {
      const coverUrl = await searchCover(book.title, book.author);
      
      if (coverUrl) {
        await supabase.from("books").update({ cover_url: coverUrl }).eq("id", book.id);
        found++;
        results.push({ title: book.title, status: "found" });
      } else {
        await supabase.from("books").update({ cover_url: "no-cover" }).eq("id", book.id);
        notFound++;
        results.push({ title: book.title, status: "not_found" });
      }
    }

    console.log(`Done: ${found} found, ${notFound} not found`);

    return new Response(
      JSON.stringify({
        found,
        notFound,
        processed: results.length,
        remaining: Math.max(0, (count || 0) - batch_size),
        totalMissing: count,
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
