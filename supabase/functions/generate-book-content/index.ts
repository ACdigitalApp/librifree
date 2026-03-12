import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ContentType = "characters" | "themes" | "quotes" | "chapters" | "analysis" | "historical_context";

const PROMPTS: Record<ContentType, (title: string, author: string, lang: string) => string> = {
  characters: (title, author, lang) =>
    `You are a literary expert. Write a detailed guide to the main characters of "${title}" by ${author}.
Write in ${lang}. Output valid HTML only (no markdown).
<h2>${lang === "Italian" ? "Personaggi Principali" : "Main Characters"}</h2>
For each character create:
<h3>Character Name</h3>
<p>Detailed description: role, personality, arc, relationships. 2-3 paragraphs per character.</p>
Cover at least 5-8 main characters. Be thorough and insightful.`,

  themes: (title, author, lang) =>
    `You are a literary expert. Write an in-depth analysis of the main themes of "${title}" by ${author}.
Write in ${lang}. Output valid HTML only.
<h2>${lang === "Italian" ? "Temi Principali" : "Main Themes"}</h2>
For each theme:
<h3>Theme Name</h3>
<p>Explanation with examples from the text. 2-3 paragraphs per theme.</p>
Cover at least 5-6 themes.`,

  quotes: (title, author, lang) =>
    `You are a literary expert. Provide 10-15 famous or significant quotes from "${title}" by ${author}.
Write in ${lang}. Output valid HTML only.
<h2>${lang === "Italian" ? "Citazioni Celebri" : "Famous Quotes"}</h2>
For each quote:
<blockquote><p>"The quote text"</p></blockquote>
<p>Context and meaning of this quote. 1-2 sentences.</p>
Include the most iconic and meaningful passages.`,

  chapters: (title, author, lang) =>
    `You are a literary expert. Write a chapter-by-chapter summary of "${title}" by ${author}.
Write in ${lang}. Output valid HTML only.
<h2>${lang === "Italian" ? "Guida ai Capitoli" : "Chapter Guide"}</h2>
For each major chapter or section:
<h3>${lang === "Italian" ? "Capitolo" : "Chapter"} [number] - [Title if applicable]</h3>
<p>Summary of key events, character developments, and themes. 2-3 paragraphs.</p>
Cover all major divisions of the work.`,

  analysis: (title, author, lang) =>
    `You are a literary critic. Write a comprehensive literary analysis of "${title}" by ${author}.
Write in ${lang}. Output valid HTML only.
Structure:
<h2>${lang === "Italian" ? "Analisi Letteraria" : "Literary Analysis"}</h2>
<p>Overview of the work's significance.</p>

<h2>${lang === "Italian" ? "Stile e Tecnica Narrativa" : "Style and Narrative Technique"}</h2>
<p>Analysis of writing style, narrative voice, structure.</p>

<h2>${lang === "Italian" ? "Simbolismo" : "Symbolism"}</h2>
<p>Key symbols and their meanings.</p>

<h2>${lang === "Italian" ? "Influenza e Eredità" : "Influence and Legacy"}</h2>
<p>Impact on literature and culture.</p>

<h2>${lang === "Italian" ? "Interpretazioni Critiche" : "Critical Interpretations"}</h2>
<p>Different scholarly perspectives.</p>

Be thorough, academic, and insightful. Each section 2-3 paragraphs.`,

  historical_context: (title, author, lang) =>
    `You are a literary historian. Write a comprehensive historical context guide for "${title}" by ${author}.
Write in ${lang}. Output valid HTML only (no markdown).
Structure:
<h2>${lang === "Italian" ? "Contesto Storico" : "Historical Context"}</h2>
<p>The historical period when the work was written and/or set.</p>

<h2>${lang === "Italian" ? "Contesto Sociale e Culturale" : "Social and Cultural Context"}</h2>
<p>Social conditions, cultural movements, and intellectual climate.</p>

<h2>${lang === "Italian" ? "L'Autore nel suo Tempo" : "The Author in Their Time"}</h2>
<p>The author's life circumstances and how they influenced the work.</p>

<h2>${lang === "Italian" ? "Riferimenti Storici nell'Opera" : "Historical References in the Work"}</h2>
<p>Specific historical events, figures, or places referenced.</p>

<h2>${lang === "Italian" ? "Impatto Storico dell'Opera" : "Historical Impact of the Work"}</h2>
<p>How the work influenced its era and subsequent history.</p>

Be thorough and scholarly. Each section 2-3 paragraphs.`,
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
    const { slug, type, force } = await req.json() as {
      slug: string;
      type: ContentType;
      force?: boolean;
    };

    if (!slug || !type || !PROMPTS[type]) {
      return new Response(JSON.stringify({ error: "Missing slug or invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, title, author, language, " + type)
      .eq("slug", slug)
      .single();

    if (bookError || !book) {
      return new Response(JSON.stringify({ error: "Book not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if content already exists
    if (!force && (book as any)[type]) {
      return new Response(JSON.stringify({ status: "already_exists", content: (book as any)[type] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = book.language === "en" ? "English" : "Italian";
    const prompt = PROMPTS[type](book.title, book.author, lang);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a literary expert. Output only valid HTML content, no markdown code fences." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error(`AI error:`, aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();

    // Save to DB
    await supabase
      .from("books")
      .update({ [type]: content })
      .eq("id", book.id);

    return new Response(JSON.stringify({ status: "generated", content }), {
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
