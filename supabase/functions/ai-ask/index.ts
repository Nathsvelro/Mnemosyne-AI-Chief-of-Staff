import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool schemas for function calling
const tools = [
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "Search decisions, topics, messages, and nodes; return relevant context snippets + ids.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
          limit: { type: "integer", description: "Max results to return", default: 10 },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_decision",
      description: "Create a new canonical decision and auto-generate affected stakeholders.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Decision title" },
          canonical_text: { type: "string", description: "The canonical decision statement" },
          owner_person_id: { type: "string", description: "UUID of the decision owner" },
          affected_team_ids: { type: "array", items: { type: "string" }, description: "Team IDs affected" },
        },
        required: ["title", "canonical_text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "revise_decision",
      description: "Create a new decision version with change_reason; keeps history.",
      parameters: {
        type: "object",
        properties: {
          decision_id: { type: "string", description: "UUID of the decision to revise" },
          new_text: { type: "string", description: "The new canonical text" },
          change_reason: { type: "string", description: "Why this change was made" },
          changed_by_person_id: { type: "string", description: "UUID of person making the change" },
        },
        required: ["decision_id", "new_text", "change_reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_update",
      description: "Create an UpdateEvent tied to impacted entities.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["decision", "knowledge", "stakeholder", "risk"], description: "Event type" },
          summary: { type: "string", description: "Summary of the update" },
          why_it_matters: { type: "string", description: "Impact explanation" },
          impact_score: { type: "number", minimum: 0, maximum: 1, description: "Impact score 0-1" },
        },
        required: ["type", "summary"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "flag_conflict",
      description: "Create a Conflict record when contradictory truth is detected; triggers review queue.",
      parameters: {
        type: "object",
        properties: {
          entity_type: { type: "string", enum: ["person", "team", "topic", "decision", "document"], description: "Type of entity" },
          entity_id: { type: "string", description: "UUID of the entity" },
          description: { type: "string", description: "Description of the conflict" },
          severity: { type: "integer", minimum: 1, maximum: 10, description: "Severity 1-10" },
        },
        required: ["entity_type", "entity_id", "description", "severity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compute_routing_targets",
      description: "Given an entity, return people to notify with reasons.",
      parameters: {
        type: "object",
        properties: {
          entity_type: { type: "string", enum: ["decision", "topic"], description: "Type of entity" },
          entity_id: { type: "string", description: "UUID of the entity" },
          max_targets: { type: "integer", default: 15, description: "Max people to notify" },
        },
        required: ["entity_type", "entity_id"],
      },
    },
  },
];

// Tool execution functions
async function executeSearchKnowledge(supabase: any, args: { query: string; limit?: number }) {
  const limit = Math.min(args.limit || 10, 25);
  const query = args.query.toLowerCase();

  // Search across decisions, topics, and persons
  const [decisionsRes, topicsRes, personsRes] = await Promise.all([
    supabase
      .from("decisions")
      .select("id, title, canonical_text, status, confidence")
      .or(`title.ilike.%${query}%,canonical_text.ilike.%${query}%`)
      .limit(limit),
    supabase
      .from("topics")
      .select("id, name, description")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit),
    supabase
      .from("persons")
      .select("id, name, role, email")
      .or(`name.ilike.%${query}%,role.ilike.%${query}%`)
      .limit(limit),
  ]);

  const results: any[] = [];

  if (decisionsRes.data) {
    for (const d of decisionsRes.data) {
      results.push({
        id: d.id,
        entityType: "Decision",
        title: d.title,
        snippet: d.canonical_text?.substring(0, 200) || "",
        confidence: d.confidence || 0.5,
        deepLink: `/decisions?selected=${d.id}`,
      });
    }
  }

  if (topicsRes.data) {
    for (const t of topicsRes.data) {
      results.push({
        id: t.id,
        entityType: "Topic",
        title: t.name,
        snippet: t.description?.substring(0, 200) || "",
        confidence: 0.7,
        deepLink: `/graph?focus=topic:${t.id}`,
      });
    }
  }

  if (personsRes.data) {
    for (const p of personsRes.data) {
      results.push({
        id: p.id,
        entityType: "Person",
        title: p.name,
        snippet: `${p.role || ""} - ${p.email || ""}`,
        confidence: 0.8,
        deepLink: `/graph?focus=person:${p.id}`,
      });
    }
  }

  return { results: results.slice(0, limit) };
}

async function executeCreateDecision(supabase: any, args: {
  title: string;
  canonical_text: string;
  owner_person_id?: string;
  affected_team_ids?: string[];
}) {
  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from("decisions")
    .insert({
      title: args.title,
      canonical_text: args.canonical_text,
      status: "proposed",
      owner_person_id: args.owner_person_id || null,
      confidence: 0.7,
    })
    .select()
    .single();

  if (decisionError) throw new Error(`Failed to create decision: ${decisionError.message}`);

  // Create initial version
  await supabase.from("decision_versions").insert({
    decision_id: decision.id,
    version_num: 1,
    text: args.canonical_text,
    change_reason: "Initial creation",
    changed_by: args.owner_person_id || null,
  });

  // Link affected teams
  if (args.affected_team_ids?.length) {
    for (const teamId of args.affected_team_ids) {
      await supabase.from("decision_affected_teams").insert({
        decision_id: decision.id,
        team_id: teamId,
      });
    }
  }

  return {
    decision_id: decision.id,
    version_num: 1,
    deepLink: `/decisions?selected=${decision.id}`,
  };
}

async function executeReviseDecision(supabase: any, args: {
  decision_id: string;
  new_text: string;
  change_reason: string;
  changed_by_person_id?: string;
}) {
  // Get current max version
  const { data: versions } = await supabase
    .from("decision_versions")
    .select("version_num")
    .eq("decision_id", args.decision_id)
    .order("version_num", { ascending: false })
    .limit(1);

  const nextVersion = (versions?.[0]?.version_num || 0) + 1;

  // Create new version
  await supabase.from("decision_versions").insert({
    decision_id: args.decision_id,
    version_num: nextVersion,
    text: args.new_text,
    change_reason: args.change_reason,
    changed_by: args.changed_by_person_id || null,
  });

  // Update canonical text
  await supabase
    .from("decisions")
    .update({ canonical_text: args.new_text, updated_at: new Date().toISOString() })
    .eq("id", args.decision_id);

  return {
    decision_id: args.decision_id,
    new_version_num: nextVersion,
    diff_summary: `Updated to v${nextVersion}: ${args.change_reason}`,
  };
}

async function executeLogUpdate(supabase: any, args: {
  type: string;
  summary: string;
  why_it_matters?: string;
  impact_score?: number;
}) {
  const { data: updateEvent, error } = await supabase
    .from("update_events")
    .insert({
      type: args.type,
      summary: args.summary,
      why_it_matters: args.why_it_matters || null,
      impact_score: args.impact_score || 0.5,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to log update: ${error.message}`);

  return {
    update_id: updateEvent.id,
    deepLink: `/updates?selected=${updateEvent.id}`,
  };
}

async function executeFlagConflict(supabase: any, args: {
  entity_type: string;
  entity_id: string;
  description: string;
  severity: number;
}) {
  const { data: conflict, error } = await supabase
    .from("conflicts")
    .insert({
      entity_type: args.entity_type,
      entity_id: args.entity_id,
      description: args.description,
      severity: args.severity,
      status: "open",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to flag conflict: ${error.message}`);

  return {
    conflict_id: conflict.id,
    status: "open",
  };
}

async function executeComputeRoutingTargets(supabase: any, args: {
  entity_type: string;
  entity_id: string;
  max_targets?: number;
}) {
  const maxTargets = args.max_targets || 15;

  // Get relevant persons based on entity relationships
  let targets: any[] = [];

  if (args.entity_type === "decision") {
    // Get decision owner and affected team members
    const { data: decision } = await supabase
      .from("decisions")
      .select(`
        owner_person_id,
        decision_affected_teams(team_id)
      `)
      .eq("id", args.entity_id)
      .single();

    if (decision) {
      // Get team members from affected teams
      const teamIds = decision.decision_affected_teams?.map((t: any) => t.team_id) || [];
      if (teamIds.length > 0) {
        const { data: teamMembers } = await supabase
          .from("persons")
          .select("id, name, role")
          .in("team_id", teamIds)
          .limit(maxTargets);

        if (teamMembers) {
          targets = teamMembers.map((p: any) => ({
            person_id: p.id,
            reason: `Member of affected team`,
            priority: "FYI",
          }));
        }
      }

      // Add owner as Action priority
      if (decision.owner_person_id) {
        targets.unshift({
          person_id: decision.owner_person_id,
          reason: "Decision owner",
          priority: "Action",
        });
      }
    }
  }

  return { targets: targets.slice(0, maxTargets) };
}

// Execute a tool call
async function executeTool(supabase: any, toolName: string, args: any) {
  switch (toolName) {
    case "search_knowledge":
      return await executeSearchKnowledge(supabase, args);
    case "create_decision":
      return await executeCreateDecision(supabase, args);
    case "revise_decision":
      return await executeReviseDecision(supabase, args);
    case "log_update":
      return await executeLogUpdate(supabase, args);
    case "flag_conflict":
      return await executeFlagConflict(supabase, args);
    case "compute_routing_targets":
      return await executeComputeRoutingTargets(supabase, args);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, orgId } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'message' string" }),
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

    // Initial context retrieval
    const initialContext = await executeSearchKnowledge(supabase, { query: message, limit: 5 });
    const contextBlock = initialContext.results
      .map((r: any, i: number) =>
        `#${i + 1} [${r.entityType}] ${r.title}\nSnippet: ${r.snippet}\nDeepLink: ${r.deepLink}`
      )
      .join("\n\n");

    const systemPrompt = `You are Mnemosyne, the Superhuman AI Chief of Staff for organizational intelligence.

Your core behaviors:
- Prioritize targeted routing; reduce information overload
- Maintain a single canonical decision statement; version all changes
- Always explain WHY something is routed or flagged
- Detect contradictions and flag conflicts when confidence is low
- Never expose secrets or private data; respect role permissions

You have access to the organization's knowledge graph and can:
- Search decisions, topics, people, and documents
- Create and revise versioned decisions
- Log strategic updates with impact scores
- Flag conflicts when contradictions are detected
- Compute routing targets for notifications

Current context:
- Organization: ${orgId || "org_001"}
- User: ${userId || "user_001"}

Retrieved context from knowledge base:
${contextBlock || "No relevant context found."}

Keep responses concise and actionable. When creating or modifying organizational data, always use the appropriate tools.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    const createdEntities: any[] = [];
    const uiSuggestions: any[] = [];
    let finalAnswer = "";
    let iterations = 0;
    const maxIterations = 5;

    // Tool-calling loop
    while (iterations < maxIterations) {
      iterations++;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          tools,
          tool_choice: "auto",
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
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];

      if (!choice) {
        throw new Error("No response from AI");
      }

      // Check for tool calls
      const toolCalls = choice.message?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        // Add assistant message with tool calls
        messages.push(choice.message);

        // Execute each tool call
        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

          console.log(`Executing tool: ${toolName}`, toolArgs);

          try {
            const result = await executeTool(supabase, toolName, toolArgs);

            // Track created entities and generate UI suggestions
            if (toolName === "create_decision" && result.decision_id) {
              createdEntities.push({ type: "Decision", ...result });
              uiSuggestions.push({
                type: "toast",
                message: `Decision created (v${result.version_num})`,
                deepLink: result.deepLink,
              });
            } else if (toolName === "revise_decision" && result.decision_id) {
              createdEntities.push({ type: "DecisionVersion", ...result });
              uiSuggestions.push({
                type: "toast",
                message: `Decision updated to v${result.new_version_num}`,
                deepLink: `/decisions?selected=${result.decision_id}`,
              });
            } else if (toolName === "log_update" && result.update_id) {
              createdEntities.push({ type: "UpdateEvent", ...result });
              uiSuggestions.push({
                type: "toast",
                message: "Update logged",
                deepLink: result.deepLink,
              });
            } else if (toolName === "flag_conflict" && result.conflict_id) {
              createdEntities.push({ type: "Conflict", ...result });
              uiSuggestions.push({
                type: "alert",
                severity: "high",
                message: "Conflict flagged for review",
                deepLink: `/updates?focus=conflict:${result.conflict_id}`,
              });
            }

            // Add tool result to messages
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          } catch (toolError: any) {
            console.error(`Tool execution error: ${toolName}`, toolError);
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: toolError.message }),
            });
          }
        }

        // Continue the loop to get the final response
        continue;
      }

      // No tool calls - we have the final answer
      finalAnswer = choice.message?.content || "";
      break;
    }

    return new Response(
      JSON.stringify({
        answer: finalAnswer,
        ui_suggestions: uiSuggestions,
        created_entities: createdEntities,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI ask error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
