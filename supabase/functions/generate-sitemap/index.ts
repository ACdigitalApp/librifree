import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://librifree.lovable.app";
const MAX_URLS_PER_SITEMAP = 1000;

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildUrlEntry(loc: string, lastmod?: string, priority = "0.8", changefreq = "weekly"): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod.split("T")[0]}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function wrapUrlset(entries: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;
}

function wrapSitemapIndex(sitemaps: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap><loc>${escapeXml(s)}</loc></sitemap>`).join("\n")}
</sitemapindex>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "index";
    const pageParam = parseInt(url.searchParams.get("page") || "1");

    // Fetch all books (slug, author, updated_at)
    const { data: books, error } = await supabase
      .from("books")
      .select("slug, author, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    const allBooks = books || [];

    // Unique authors
    const authorsSet = new Set<string>();
    for (const b of allBooks) {
      if (b.author) authorsSet.add(b.author);
    }
    const authors = [...authorsSet];

    const xmlHeaders = { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" };

    if (type === "index") {
      const sitemaps: string[] = [];
      const bookPages = Math.ceil(allBooks.length / MAX_URLS_PER_SITEMAP);
      for (let i = 1; i <= bookPages; i++) {
        sitemaps.push(`${SITE_URL}/api/sitemap?type=books&page=${i}`);
        sitemaps.push(`${SITE_URL}/api/sitemap?type=summaries&page=${i}`);
        sitemaps.push(`${SITE_URL}/api/sitemap?type=analysis&page=${i}`);
      }
      const authorPages = Math.ceil(authors.length / MAX_URLS_PER_SITEMAP);
      for (let i = 1; i <= authorPages; i++) {
        sitemaps.push(`${SITE_URL}/api/sitemap?type=authors&page=${i}`);
      }
      return new Response(wrapSitemapIndex(sitemaps), { headers: xmlHeaders });
    }

    const offset = (pageParam - 1) * MAX_URLS_PER_SITEMAP;

    if (type === "books") {
      const slice = allBooks.slice(offset, offset + MAX_URLS_PER_SITEMAP);
      const entries = slice.map((b) =>
        buildUrlEntry(`${SITE_URL}/libri/${b.slug}`, b.updated_at, "0.9")
      );
      return new Response(wrapUrlset(entries), { headers: xmlHeaders });
    }

    if (type === "summaries") {
      const slice = allBooks.slice(offset, offset + MAX_URLS_PER_SITEMAP);
      const entries = slice.map((b) =>
        buildUrlEntry(`${SITE_URL}/riassunto/${b.slug}`, b.updated_at, "0.8")
      );
      return new Response(wrapUrlset(entries), { headers: xmlHeaders });
    }

    if (type === "analysis") {
      const slice = allBooks.slice(offset, offset + MAX_URLS_PER_SITEMAP);
      const entries = slice.flatMap((b) => [
        buildUrlEntry(`${SITE_URL}/citazioni/${b.slug}`, b.updated_at, "0.7"),
        buildUrlEntry(`${SITE_URL}/personaggi/${b.slug}`, b.updated_at, "0.7"),
        buildUrlEntry(`${SITE_URL}/analisi/${b.slug}`, b.updated_at, "0.7"),
        buildUrlEntry(`${SITE_URL}/capitoli/${b.slug}`, b.updated_at, "0.7"),
      ]);
      return new Response(wrapUrlset(entries), { headers: xmlHeaders });
    }

    if (type === "authors") {
      const slugify = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const slice = authors.slice(offset, offset + MAX_URLS_PER_SITEMAP);
      const entries = slice.map((a) =>
        buildUrlEntry(`${SITE_URL}/autore/${slugify(a)}`, undefined, "0.7")
      );
      return new Response(wrapUrlset(entries), { headers: xmlHeaders });
    }

    return new Response(`<?xml version="1.0"?><error>Unknown type</error>`, { status: 400, headers: xmlHeaders });
  } catch (e) {
    console.error("Sitemap error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
