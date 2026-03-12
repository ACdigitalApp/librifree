import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map Italian titles to original titles for better Open Library search
const TITLE_MAP: Record<string, string> = {
  "Il cappotto": "The Overcoat Gogol",
  "Il castello": "The Castle Kafka",
  "Il corvo e altre poesie": "The Raven Poe",
  "Il giro del mondo in ottanta giorni": "Around the World in Eighty Days Verne",
  "L'importanza di chiamarsi Ernesto": "The Importance of Being Earnest Wilde",
  "Le anime morte": "Dead Souls Gogol",
  "Lo strano caso del dottor Jekyll e del signor Hyde": "Dr Jekyll and Mr Hyde Stevenson",
  "Padri e figli": "Fathers and Sons Turgenev",
  "Racconto di due città": "A Tale of Two Cities Dickens",
  "Robinson Crusoe": "Robinson Crusoe Defoe",
  "Sogno di una notte di mezza estate": "A Midsummer Night's Dream Shakespeare",
  "David Copperfield": "David Copperfield Dickens",
  "Dracula": "Dracula Stoker",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

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

  const results: any[] = [];

  for (const book of books || []) {
    try {
      // Use mapped English title if available
      const searchTerm = TITLE_MAP[book.title] || `${book.title} ${book.author}`;
      const searchQuery = encodeURIComponent(searchTerm);
      const searchRes = await fetch(
        `https://openlibrary.org/search.json?q=${searchQuery}&limit=5&fields=key,cover_i,title,author_name`
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
        results.push({ title: book.title, status: "found", cover_url: coverUrl });
      } else {
        results.push({ title: book.title, status: "not_found", searchTerm });
      }

      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      results.push({ title: book.title, status: "error" });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
