import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Normalize a title for fuzzy comparison */
function normalizeTitle(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Check if the Google Books result title is a reasonable match */
function isTitleMatch(bookTitle: string, apiTitle: string): boolean {
  const a = normalizeTitle(bookTitle);
  const b = normalizeTitle(apiTitle);
  if (!a || !b) return false;
  // One contains the other, or they share a long common prefix
  if (a.includes(b) || b.includes(a)) return true;
  // Check overlap: at least 60% of the shorter string matches
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter.substring(i, i + 3))) matches++;
  }
  return matches / shorter.length > 0.5;
}

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
      .select("id, title, author, slug", { count: "exact" })
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
    let rejected = 0;
    const results: string[] = [];

    for (const book of books || []) {
      try {
        const q = encodeURIComponent(`${book.title} ${book.author}`);
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=3&fields=items(volumeInfo(title,imageLinks))`,
          { signal: AbortSignal.timeout(3000) }
        );
        
        if (res.ok) {
          const data = await res.json();
          let matched = false;

          // Check up to 3 results for a title match
          for (const item of data.items || []) {
            const apiTitle = item.volumeInfo?.title || "";
            const img = item.volumeInfo?.imageLinks;
            const url = img ? (img.thumbnail || img.smallThumbnail || "").replace("http://", "https://") : "";

            if (url && isTitleMatch(book.title, apiTitle)) {
              await supabase.from("books").update({ cover_url: url }).eq("id", book.id);
              found++;
              results.push(`✅ ${book.title} (matched: "${apiTitle}")`);
              matched = true;
              break;
            }
          }

          if (!matched) {
            await supabase.from("books").update({ cover_url: "no-cover" }).eq("id", book.id);
            rejected++;
            const apiTitles = (data.items || []).map((i: any) => i.volumeInfo?.title).filter(Boolean).join(", ");
            results.push(`🚫 ${book.title} (no title match; API returned: ${apiTitles || "nothing"})`);
          }
        } else {
          results.push(`⚠️ ${book.title} (API ${res.status})`);
        }
      } catch (e) {
        results.push(`⚠️ ${book.title} (timeout)`);
      }
    }

    console.log(`Done: found=${found}, notFound=${notFound}, rejected=${rejected}`);

    return new Response(
      JSON.stringify({ found, notFound, rejected, processed: results.length, remaining: (count || 0) - batchSize, results }),
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
