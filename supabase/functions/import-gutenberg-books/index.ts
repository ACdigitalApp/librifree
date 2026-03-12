import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Category mapping based on Gutenberg subjects
const CATEGORY_MAP: Record<string, string> = {
  "italian": "letteratura-italiana",
  "italy": "letteratura-italiana",
  "english": "letteratura-inglese",
  "fiction": "romanzi",
  "adventure": "avventura",
  "philosophy": "filosofia",
  "french": "letteratura-francese",
  "france": "letteratura-francese",
  "russian": "letteratura-russa",
  "russia": "letteratura-russa",
  "american": "letteratura-americana",
  "united states": "letteratura-americana",
  "science fiction": "fantascienza",
  "horror": "horror",
  "drama": "teatro",
  "poetry": "poesia",
  "classic": "classici",
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

function detectCategory(subjects: string[]): string {
  const joined = subjects.join(" ").toLowerCase();
  for (const [keyword, catSlug] of Object.entries(CATEGORY_MAP)) {
    if (joined.includes(keyword)) return catSlug;
  }
  return "classici";
}

function detectLanguage(languages: string[]): string {
  if (languages.includes("it")) return "it";
  if (languages.includes("en")) return "en";
  if (languages.includes("fr")) return "fr";
  if (languages.includes("de")) return "de";
  return languages[0] || "en";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { page = 1, search = "", language = "", limit = 32 } = await req.json().catch(() => ({}));

    // Fetch categories to map slugs to IDs
    const { data: categories } = await supabase.from("categories").select("id, slug");
    const catMap = new Map((categories || []).map((c: any) => [c.slug, c.id]));

    // Search Gutenberg API
    let gutenbergUrl = `https://gutendex.com/books/?page=${page}`;
    if (search) gutenbergUrl += `&search=${encodeURIComponent(search)}`;
    if (language) gutenbergUrl += `&languages=${language}`;

    console.log("Fetching:", gutenbergUrl);
    const res = await fetch(gutenbergUrl);
    if (!res.ok) throw new Error(`Gutenberg API error: ${res.status}`);
    const gutenbergData = await res.json();

    const imported: any[] = [];
    const skipped: any[] = [];

    for (const book of (gutenbergData.results || []).slice(0, limit)) {
      const title = book.title;
      const author = book.authors?.[0]?.name || "Unknown";
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

      // Find cover
      const coverUrl = book.formats?.["image/jpeg"] || null;

      // Detect category
      const subjects = book.subjects || [];
      const catSlug = detectCategory(subjects);
      const categoryId = catMap.get(catSlug) || catMap.get("classici") || null;

      // Detect language
      const lang = detectLanguage(book.languages || []);

      // Get text URL
      const textUrl =
        book.formats?.["text/html"] ||
        book.formats?.["text/plain; charset=utf-8"] ||
        book.formats?.["text/plain"] ||
        null;

      // Description from first subject
      const description = subjects.slice(0, 3).join(". ") || null;

      const { error } = await supabase.from("books").insert({
        title,
        author,
        slug,
        cover_url: coverUrl,
        category_id: categoryId,
        language: lang,
        description,
        source: `gutenberg:${book.id}`,
        file_url: textUrl,
      });

      if (error) {
        skipped.push({ title, reason: error.message });
      } else {
        imported.push({ title, slug });
      }
    }

    return new Response(
      JSON.stringify({
        imported: imported.length,
        skipped: skipped.length,
        nextPage: gutenbergData.next ? page + 1 : null,
        total: gutenbergData.count,
        details: { imported, skipped },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Import error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
