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
    const { transcript, meeting_title, attendees } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'transcript' string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract meeting summary using Lovable AI
    const summaryPrompt = `Analyze this meeting transcript and extract the following:

Meeting: ${meeting_title || "Untitled Meeting"}
Attendees: ${attendees?.join(", ") || "Unknown"}

Transcript:
${transcript}

Extract and respond in JSON format:
{
  "summary": "Brief 2-3 sentence summary of the meeting",
  "decisions": [
    {
      "title": "Decision title",
      "canonical_text": "The actual decision statement",
      "owner": "Person responsible (if mentioned)",
      "affected_teams": ["Team names"],
      "confidence": 0.0-1.0
    }
  ],
  "action_items": [
    {
      "task": "What needs to be done",
      "assignee": "Who is responsible",
      "deadline": "When (if mentioned)"
    }
  ],
  "topics_discussed": ["Topic 1", "Topic 2"],
  "conflicts_identified": [
    {
      "description": "Description of the conflict",
      "parties": ["Person/Team 1", "Person/Team 2"],
      "severity": "low|medium|high"
    }
  ],
  "follow_ups": ["Follow-up items"],
  "key_stakeholders": ["Names of key people mentioned"]
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
          {
            role: "system",
            content: "You are an expert meeting analyst for organizational intelligence. Extract structured data from meeting transcripts with high precision. Always respond with valid JSON.",
          },
          { role: "user", content: summaryPrompt },
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
      const errorText = await response.text();
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const aiData = await response.json();
    const extractedContent = aiData.choices?.[0]?.message?.content;

    let meetingSummary;
    try {
      meetingSummary = JSON.parse(extractedContent || "{}");
    } catch {
      throw new Error("Failed to parse AI response");
    }

    // Store the meeting as a message for reference
    const { data: message } = await supabase
      .from("messages")
      .insert({
        raw_text: transcript,
        source: "meeting",
        parsed_json: meetingSummary,
      })
      .select()
      .single();

    // Auto-create proposed decisions from the meeting
    const createdDecisions: any[] = [];
    if (meetingSummary.decisions?.length > 0) {
      for (const decision of meetingSummary.decisions) {
        if (decision.confidence >= 0.7) {
          const { data: newDecision, error } = await supabase
            .from("decisions")
            .insert({
              title: decision.title,
              canonical_text: decision.canonical_text,
              status: "proposed",
              confidence: decision.confidence,
            })
            .select()
            .single();

          if (!error && newDecision) {
            // Create initial version
            await supabase.from("decision_versions").insert({
              decision_id: newDecision.id,
              version_num: 1,
              text: decision.canonical_text,
              change_reason: `Extracted from meeting: ${meeting_title || "Untitled"}`,
            });

            createdDecisions.push(newDecision);
          }
        }
      }
    }

    // Log an update event for the meeting
    const { data: updateEvent } = await supabase
      .from("update_events")
      .insert({
        type: "knowledge",
        summary: `Meeting summary: ${meeting_title || "Untitled Meeting"}`,
        why_it_matters: meetingSummary.summary,
        impact_score: 0.6,
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        message_id: message?.id,
        summary: meetingSummary,
        created_decisions: createdDecisions,
        update_event_id: updateEvent?.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Meeting summary error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
