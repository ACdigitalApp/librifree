import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://librifree.lovable.app";
const MAX_URLS = 1000;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function urlEntry(loc: string, lastmod?: string, priority = "0.8", changefreq = "weekly"): string {
  return `  <url>
    <loc>${esc(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.split("T")[0]}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function urlset(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;
}

function sitemapIndex(sitemaps: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.map((s) => `  <sitemap><loc>${esc(s)}</loc></sitemap>`).join("\n")}\n</sitemapindex>`;
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "index";
    const page = parseInt(url.searchParams.get("page") || "1");
    const xmlH = { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" };

    // Fetch all books
    const { data: books } = await supabase.from("books").select("slug, author, updated_at").order("created_at", { ascending: false });
    const allBooks = books || [];

    // Unique authors
    const authorsSet = new Set<string>();
    for (const b of allBooks) if (b.author) authorsSet.add(b.author);
    const authors = [...authorsSet];

    // Categories
    const { data: categories } = await supabase.from("categories").select("slug");
    const allCats = categories || [];

    // Tags
    const { data: tags } = await supabase.from("tags").select("slug");
    const allTags = tags || [];

    const baseUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-sitemap`;

    if (type === "index") {
      const sm: string[] = [];
      const bookPages = Math.ceil(allBooks.length / MAX_URLS);

      // Per-type sitemaps
      const types = ["books", "summaries", "quotes", "characters", "analysis", "chapters", "themes", "historical-context"];
      for (const t of types) {
        for (let i = 1; i <= bookPages; i++) sm.push(`${baseUrl}?type=${t}&page=${i}`);
      }

      // Authors
      const authorPages = Math.ceil(authors.length / MAX_URLS);
      for (let i = 1; i <= authorPages; i++) sm.push(`${baseUrl}?type=authors&page=${i}`);

      // Categories
      if (allCats.length > 0) sm.push(`${baseUrl}?type=categories&page=1`);

      // Tags
      if (allTags.length > 0) sm.push(`${baseUrl}?type=tags&page=1`);

      // Alphabetical indexes
      sm.push(`${baseUrl}?type=alphabetical&page=1`);

      return new Response(sitemapIndex(sm), { headers: xmlH });
    }

    const offset = (page - 1) * MAX_URLS;
    const slice = allBooks.slice(offset, offset + MAX_URLS);

    // Book content page types
    const prefixMap: Record<string, string> = {
      books: "libri",
      summaries: "riassunto",
      quotes: "citazioni",
      characters: "personaggi",
      analysis: "analisi",
      chapters: "capitoli",
      themes: "temi",
      "historical-context": "contesto-storico",
    };

    const priorityMap: Record<string, string> = {
      books: "0.9", summaries: "0.8", quotes: "0.7", characters: "0.7",
      analysis: "0.7", chapters: "0.7", themes: "0.7", "historical-context": "0.6",
    };

    if (prefixMap[type]) {
      const entries = slice.map((b) =>
        urlEntry(`${SITE_URL}/${prefixMap[type]}/${b.slug}`, b.updated_at, priorityMap[type] || "0.7")
      );
      return new Response(urlset(entries), { headers: xmlH });
    }

    if (type === "authors") {
      const aSlice = authors.slice(offset, offset + MAX_URLS);
      const entries = aSlice.map((a) => urlEntry(`${SITE_URL}/autore/${slugify(a)}`, undefined, "0.7"));
      return new Response(urlset(entries), { headers: xmlH });
    }

    if (type === "categories") {
      const entries = allCats.map((c: any) => urlEntry(`${SITE_URL}/categoria/${c.slug}`, undefined, "0.6"));
      return new Response(urlset(entries), { headers: xmlH });
    }

    if (type === "tags") {
      const entries = allTags.map((t: any) => urlEntry(`${SITE_URL}/tag/${t.slug}`, undefined, "0.6"));
      return new Response(urlset(entries), { headers: xmlH });
    }

    if (type === "alphabetical") {
      const entries = [
        ...ALPHABET.map((l) => urlEntry(`${SITE_URL}/libri-${l}`, undefined, "0.5", "monthly")),
        ...ALPHABET.map((l) => urlEntry(`${SITE_URL}/autori-${l}`, undefined, "0.5", "monthly")),
      ];
      return new Response(urlset(entries), { headers: xmlH });
    }

    return new Response(`<?xml version="1.0"?><error>Unknown type: ${type}</error>`, { status: 400, headers: xmlH });
  } catch (e) {
    console.error("Sitemap error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
