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
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { slug, force } = await req.json();

    // If slug provided, generate for one book. Otherwise batch process books without summaries.
    let books: any[] = [];

    if (slug) {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, description, language, slug")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      if (!force && data.summary) {
        return new Response(JSON.stringify({ status: "already_exists" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      books = [data];
    } else {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, description, language, slug")
        .is("summary", null)
        .limit(10);
      if (error) throw error;
      books = data || [];
    }

    const results: any[] = [];

    for (const book of books) {
      try {
        const lang = book.language === "en" ? "English" : "Italian";
        const prompt = `You are a literary expert. Write a comprehensive summary for the book "${book.title}" by ${book.author}.

Write in ${lang}. Structure your response as valid HTML with these sections:
<h2>Introduzione</h2> (or <h2>Introduction</h2> for English)
<p>Brief introduction to the book and its significance</p>

<h2>Riassunto</h2> (or <h2>Summary</h2>)
<p>A detailed plot summary in 3-4 paragraphs</p>

<h2>Temi Principali</h2> (or <h2>Main Themes</h2>)
<ul><li>Theme 1 with explanation</li>...</ul>

<h2>Personaggi Principali</h2> (or <h2>Main Characters</h2>)
<ul><li><strong>Character Name</strong>: Description</li>...</ul>

<h2>Contesto Storico</h2> (or <h2>Historical Context</h2>)
<p>Historical context of the work</p>

Do NOT include the book title or author in the output. Only the sections above. Use proper HTML tags.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a literary expert. Output only valid HTML content, no markdown." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${book.title}:`, aiResponse.status, errText);
          results.push({ slug: book.slug, status: "ai_error", code: aiResponse.status });
          continue;
        }

        const aiData = await aiResponse.json();
        let summary = aiData.choices?.[0]?.message?.content || "";
        
        // Clean markdown code fences if present
        summary = summary.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

        // Generate SEO fields
        const seoTitle = `${book.title} di ${book.author} – Riassunto | Librifree`;
        const seoDesc = `Riassunto completo di "${book.title}" di ${book.author}. Temi principali, personaggi e contesto storico.`;

        await supabase
          .from("books")
          .update({
            summary,
            seo_title: seoTitle,
            seo_description: seoDesc,
          })
          .eq("id", book.id);

        results.push({ slug: book.slug, status: "generated" });

        // Rate limiting between requests
        if (books.length > 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      } catch (e) {
        console.error(`Error for ${book.title}:`, e);
        results.push({ slug: book.slug, status: "error" });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
