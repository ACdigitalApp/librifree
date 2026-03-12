import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.48/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { letter = "a" } = await req.json().catch(() => ({}));
    const l = (letter as string).toLowerCase();

    // Fetch the Liber Liber page for this letter
    const url = `https://liberliber.it/opere/libri/opere-${l}/`;
    console.log("Fetching:", url);

    const res = await fetch(url, {
      headers: { "User-Agent": "Librifree/1.0 (book indexer)" },
    });
    if (!res.ok) throw new Error(`Liber Liber fetch error: ${res.status}`);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse HTML");

    // Find all book links in the content
    // Pattern: <li><em><a href="...">Title</a></em>, di <a href="...">Author</a></li>
    const contentDiv = doc.querySelector(".entry-content") || doc.querySelector("#content") || doc.querySelector("article");
    if (!contentDiv) throw new Error("Content container not found");

    const listItems = contentDiv.querySelectorAll("li");
    const imported: any[] = [];
    const skipped: any[] = [];

    // Fetch categories for mapping
    const { data: categories } = await supabase.from("categories").select("id, slug");
    const italianCatId = (categories || []).find((c: any) => c.slug === "letteratura-italiana")?.id || null;

    for (const li of listItems) {
      try {
        // Extract title from first <a> or <em>
        const titleLink = li.querySelector("a");
        if (!titleLink) continue;

        const title = (titleLink.textContent || "").trim();
        if (!title || title.length < 2) continue;

        // Extract the book URL from liberliber
        const bookUrl = titleLink.getAttribute("href") || "";
        if (!bookUrl.includes("liberliber.it")) continue;

        // Try to extract author - look for text after "di" 
        const fullText = li.textContent || "";
        const diMatch = fullText.match(/,\s*di\s+(.+?)(?:\s*$|\s*\n)/i);
        let author = "Autore sconosciuto";
        
        // Try getting author from second link
        const links = li.querySelectorAll("a");
        if (links.length >= 2) {
          author = (links[1].textContent || "").trim();
        } else if (diMatch) {
          author = diMatch[1].trim();
        }

        if (!author || author.length < 2) continue;

        const slug = slugify(`${title}-${author}`);

        // Check if already exists
        const { data: existing } = await supabase
          .from("books")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        if (existing) {
          skipped.push({ title, reason: "already_exists" });
          continue;
        }

        // Extract description from remaining text
        const descMatch = fullText.replace(title, "").replace(author, "");
        const description = descMatch.replace(/,\s*di\s*/i, "").replace(/[\n\r]+/g, " ").trim().substring(0, 500) || null;

        const { error } = await supabase.from("books").insert({
          title,
          author,
          slug,
          description: description || `Opera di ${author} disponibile su Liber Liber.`,
          language: "it",
          category_id: italianCatId,
          source: `liberliber:${bookUrl}`,
          file_url: bookUrl,
        });

        if (error) {
          skipped.push({ title, reason: error.message });
        } else {
          imported.push({ title, author, slug });
        }
      } catch (innerErr) {
        // Skip individual book errors
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        imported: imported.length,
        skipped: skipped.length,
        letter: l,
        details: { imported: imported.slice(0, 20), skipped: skipped.slice(0, 20) },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("LiberLiber import error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
