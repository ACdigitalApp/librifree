import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 5;
    const coverInstructions = body.cover_instructions || "";

    // Find books with 'no-cover' marker (Google Books didn't find them)
    const { data: books, error, count } = await supabase
      .from("books")
      .select("id, title, author, slug", { count: "exact" })
      .eq("cover_url", "no-cover")
      .order("views", { ascending: false })
      .limit(batchSize);

    if (error) throw error;

    console.log(`Found ${books?.length} books needing AI covers (total: ${count})`);

    let generated = 0;
    let failed = 0;
    const results: string[] = [];

    for (const book of books || []) {
      try {
        console.log(`Generating cover for: ${book.title}`);

        const prompt = `Create a beautiful, elegant book cover for "${book.title}" by ${book.author}. 
The cover should be artistic and literary, with a classic book design aesthetic. 
Include the title "${book.title}" prominently and the author name "${book.author}" below it.
Use rich colors, elegant typography, and imagery that evokes the book's themes.
The style should be reminiscent of high-quality Italian literary publishing.
${coverInstructions ? `\nAdditional instructions: ${coverInstructions}` : ""}
On a clean background suitable for a book cover.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${book.title}:`, aiResponse.status, errText);
          
          if (aiResponse.status === 429) {
            results.push(`⏳ ${book.title} (rate limited - stopping)`);
            failed++;
            break; // Stop processing on rate limit
          }
          if (aiResponse.status === 402) {
            results.push(`💳 ${book.title} (credits exhausted - stopping)`);
            failed++;
            break;
          }
          
          results.push(`❌ ${book.title} (AI error ${aiResponse.status})`);
          failed++;
          continue;
        }

        const aiData = await aiResponse.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) {
          console.error(`No image generated for ${book.title}`);
          results.push(`❌ ${book.title} (no image returned)`);
          failed++;
          continue;
        }

        // Extract base64 data
        const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
        if (!base64Match) {
          results.push(`❌ ${book.title} (invalid image format)`);
          failed++;
          continue;
        }

        const imageFormat = base64Match[1];
        const base64Data = base64Match[2];
        const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        // Upload to storage
        const fileName = `ai-${book.slug}.${imageFormat === "jpeg" || imageFormat === "jpg" ? "jpg" : "png"}`;
        const { error: uploadError } = await supabase.storage
          .from("book-covers")
          .upload(fileName, imageBytes, {
            contentType: `image/${imageFormat}`,
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${book.title}:`, uploadError.message);
          results.push(`❌ ${book.title} (upload failed)`);
          failed++;
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("book-covers").getPublicUrl(fileName);

        // Update book record
        await supabase
          .from("books")
          .update({ cover_url: urlData.publicUrl })
          .eq("id", book.id);

        generated++;
        results.push(`✅ ${book.title}`);
        console.log(`Cover generated for: ${book.title}`);

        // Small delay to avoid rate limits
        await new Promise((r) => setTimeout(r, 2000));
      } catch (e) {
        console.error(`Error for ${book.title}:`, e);
        results.push(`❌ ${book.title} (${e instanceof Error ? e.message : "error"})`);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ generated, failed, remaining: (count || 0) - batchSize, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
