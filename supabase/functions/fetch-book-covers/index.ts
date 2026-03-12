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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 10;

    console.log("Starting cover fetch, batch:", batchSize);

    const { data: books, error, count } = await supabase
      .from("books")
      .select("id, title, author", { count: "exact" })
      .is("cover_url", null)
      .order("views", { ascending: false })
      .limit(batchSize);

    if (error) {
      console.error("Query error:", error.message);
      throw error;
    }

    console.log(`Found ${books?.length} books without covers (total: ${count})`);

    let found = 0;
    let notFound = 0;
    const results: string[] = [];

    for (const book of books || []) {
      try {
        const q = encodeURIComponent(`${book.title} ${book.author}`);
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1&fields=items(volumeInfo/imageLinks)`,
          { signal: AbortSignal.timeout(3000) }
        );
        
        if (res.ok) {
          const data = await res.json();
          const img = data.items?.[0]?.volumeInfo?.imageLinks;
          const url = img ? (img.thumbnail || img.smallThumbnail || "").replace("http://", "https://") : "";
          
          if (url) {
            await supabase.from("books").update({ cover_url: url }).eq("id", book.id);
            found++;
            results.push(`✅ ${book.title}`);
          } else {
            await supabase.from("books").update({ cover_url: "no-cover" }).eq("id", book.id);
            notFound++;
            results.push(`❌ ${book.title}`);
          }
        } else {
          results.push(`⚠️ ${book.title} (API ${res.status})`);
        }
      } catch (e) {
        results.push(`⚠️ ${book.title} (timeout)`);
      }
    }

    console.log(`Done: found=${found}, notFound=${notFound}`);

    return new Response(
      JSON.stringify({ found, notFound, processed: results.length, remaining: (count || 0) - batchSize, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
