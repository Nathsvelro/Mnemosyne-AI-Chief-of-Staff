import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { raw_text, source, author_person_id } = await req.json();

    if (!raw_text || typeof raw_text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'raw_text' string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the raw message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        raw_text,
        source: source || "api",
        author_person_id: author_person_id || null,
      })
      .select()
      .single();

    if (messageError) {
      throw new Error(`Failed to store message: ${messageError.message}`);
    }

    // Use Lovable AI to extract entities and decisions from the message
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const extractionPrompt = `Analyze the following message and extract:
1. Any decisions being made or proposed
2. Key topics mentioned
3. People or teams referenced
4. Potential conflicts or contradictions
5. Action items or tasks

Message:
${raw_text}

Respond in JSON format with the structure:
{
  "decisions": [{ "title": "", "text": "", "confidence": 0.0-1.0 }],
  "topics": ["topic names"],
  "people_mentioned": ["names"],
  "conflicts": [{ "description": "", "severity": "low|medium|high" }],
  "action_items": [{ "task": "", "assignee": "" }]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an organizational intelligence assistant that extracts structured data from messages. Always respond with valid JSON." },
          { role: "user", content: extractionPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI extraction failed:", response.status);
      // Continue without AI extraction
      return new Response(
        JSON.stringify({
          message_id: message.id,
          extracted: null,
          note: "AI extraction unavailable",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const extractedContent = aiData.choices?.[0]?.message?.content;
    
    let extracted = null;
    try {
      extracted = JSON.parse(extractedContent || "{}");
    } catch {
      console.error("Failed to parse AI extraction response");
    }

    // Update message with parsed JSON
    if (extracted) {
      await supabase
        .from("messages")
        .update({ parsed_json: extracted })
        .eq("id", message.id);
    }

    return new Response(
      JSON.stringify({
        message_id: message.id,
        extracted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI ingest error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
