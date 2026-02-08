import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  corsHeaders, 
  authenticateRequest, 
  unauthorizedResponse,
  validateString,
  validateUUID,
  validateNumber,
  sanitizeForLike
} from "../_shared/auth.ts";

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
  // Validate and sanitize input
  const query = validateString(args.query, "query", 1000);
  const limit = Math.min(validateNumber(args.limit ?? 10, "limit", 1, 25), 25);
  
  // Extract key terms for better search (split on spaces, filter short words)
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const searchTerms = terms.slice(0, 3); // Use first 3 meaningful terms
  
  // Build OR conditions for each term (sanitized)
  const buildFilter = (columns: string[]) => {
    const conditions: string[] = [];
    for (const term of searchTerms) {
      const sanitizedTerm = sanitizeForLike(term);
      for (const col of columns) {
        conditions.push(`${col}.ilike.%${sanitizedTerm}%`);
      }
    }
    return conditions.join(',');
  };

  // Search across decisions, topics, persons, and teams
  const [decisionsRes, topicsRes, personsRes, teamsRes] = await Promise.all([
    supabase
      .from("decisions")
      .select("id, title, canonical_text, status, confidence, owner_person_id")
      .or(buildFilter(['title', 'canonical_text']))
      .limit(limit),
    supabase
      .from("topics")
      .select("id, name, description")
      .or(buildFilter(['name', 'description']))
      .limit(limit),
    supabase
      .from("persons")
      .select("id, name, role, team_id, load_score")
      .or(buildFilter(['name', 'role']))
      .limit(limit),
    supabase
      .from("teams")
      .select("id, name, description")
      .or(buildFilter(['name', 'description']))
      .limit(limit),
  ]);

  const results: any[] = [];

  if (decisionsRes.data) {
    for (const d of decisionsRes.data) {
      results.push({
        id: d.id,
        entityType: "Decision",
        title: d.title,
        snippet: d.canonical_text?.substring(0, 250) || "",
        status: d.status,
        confidence: d.confidence || 0.5,
        owner_person_id: d.owner_person_id,
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
        snippet: t.description?.substring(0, 250) || "",
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
        snippet: `${p.role || "Unknown role"} | Load: ${p.load_score || 0}%`,
        team_id: p.team_id,
        confidence: 0.8,
        deepLink: `/graph?focus=person:${p.id}`,
      });
    }
  }

  if (teamsRes.data) {
    for (const t of teamsRes.data) {
      results.push({
        id: t.id,
        entityType: "Team",
        title: t.name,
        snippet: t.description?.substring(0, 250) || "",
        confidence: 0.75,
        deepLink: `/graph?focus=team:${t.id}`,
      });
    }
  }

  console.log(`Search for "${query}" found ${results.length} results`);
  return { results: results.slice(0, limit) };
}

async function executeCreateDecision(supabase: any, args: {
  title: string;
  canonical_text: string;
  owner_person_id?: string;
  affected_team_ids?: string[];
}) {
  // Validate inputs
  const title = validateString(args.title, "title", 500);
  const canonical_text = validateString(args.canonical_text, "canonical_text", 10000);
  
  let owner_person_id = null;
  if (args.owner_person_id) {
    owner_person_id = validateUUID(args.owner_person_id, "owner_person_id");
  }
  
  const affected_team_ids: string[] = [];
  if (args.affected_team_ids) {
    for (const id of args.affected_team_ids) {
      affected_team_ids.push(validateUUID(id, "affected_team_id"));
    }
  }

  // Create decision
  const { data: decision, error: decisionError } = await supabase
    .from("decisions")
    .insert({
      title,
      canonical_text,
      status: "proposed",
      owner_person_id,
      confidence: 0.7,
    })
    .select()
    .single();

  if (decisionError) throw new Error(`Failed to create decision: ${decisionError.message}`);

  // Create initial version
  await supabase.from("decision_versions").insert({
    decision_id: decision.id,
    version_num: 1,
    text: canonical_text,
    change_reason: "Initial creation",
    changed_by: owner_person_id,
  });

  // Link affected teams
  if (affected_team_ids.length > 0) {
    for (const teamId of affected_team_ids) {
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
  // Validate inputs
  const decision_id = validateUUID(args.decision_id, "decision_id");
  const new_text = validateString(args.new_text, "new_text", 10000);
  const change_reason = validateString(args.change_reason, "change_reason", 1000);
  
  let changed_by = null;
  if (args.changed_by_person_id) {
    changed_by = validateUUID(args.changed_by_person_id, "changed_by_person_id");
  }

  // Get current max version
  const { data: versions } = await supabase
    .from("decision_versions")
    .select("version_num")
    .eq("decision_id", decision_id)
    .order("version_num", { ascending: false })
    .limit(1);

  const nextVersion = (versions?.[0]?.version_num || 0) + 1;

  // Create new version
  await supabase.from("decision_versions").insert({
    decision_id,
    version_num: nextVersion,
    text: new_text,
    change_reason,
    changed_by,
  });

  // Update canonical text
  await supabase
    .from("decisions")
    .update({ canonical_text: new_text, updated_at: new Date().toISOString() })
    .eq("id", decision_id);

  return {
    decision_id,
    new_version_num: nextVersion,
    diff_summary: `Updated to v${nextVersion}: ${change_reason}`,
  };
}

async function executeLogUpdate(supabase: any, args: {
  type: string;
  summary: string;
  why_it_matters?: string;
  impact_score?: number;
}) {
  // Validate inputs
  const validTypes = ["decision", "knowledge", "stakeholder", "risk"];
  if (!validTypes.includes(args.type)) {
    throw new Error(`type must be one of: ${validTypes.join(", ")}`);
  }
  
  const summary = validateString(args.summary, "summary", 1000);
  const why_it_matters = args.why_it_matters ? validateString(args.why_it_matters, "why_it_matters", 2000) : null;
  const impact_score = args.impact_score !== undefined ? validateNumber(args.impact_score, "impact_score", 0, 1) : 0.5;

  const { data: updateEvent, error } = await supabase
    .from("update_events")
    .insert({
      type: args.type,
      summary,
      why_it_matters,
      impact_score,
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
  // Validate inputs
  const validEntityTypes = ["person", "team", "topic", "decision", "document"];
  if (!validEntityTypes.includes(args.entity_type)) {
    throw new Error(`entity_type must be one of: ${validEntityTypes.join(", ")}`);
  }
  
  const entity_id = validateUUID(args.entity_id, "entity_id");
  const description = validateString(args.description, "description", 2000);
  const severity = validateNumber(args.severity, "severity", 1, 10);

  const { data: conflict, error } = await supabase
    .from("conflicts")
    .insert({
      entity_type: args.entity_type,
      entity_id,
      description,
      severity: Math.round(severity),
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
  // Validate inputs
  const validEntityTypes = ["decision", "topic"];
  if (!validEntityTypes.includes(args.entity_type)) {
    throw new Error(`entity_type must be one of: ${validEntityTypes.join(", ")}`);
  }
  
  const entity_id = validateUUID(args.entity_id, "entity_id");
  const maxTargets = Math.min(validateNumber(args.max_targets ?? 15, "max_targets", 1, 50), 50);

  let targets: any[] = [];

  if (args.entity_type === "decision") {
    const { data: decision } = await supabase
      .from("decisions")
      .select(`
        owner_person_id,
        decision_affected_teams(team_id)
      `)
      .eq("id", entity_id)
      .single();

    if (decision) {
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
    // Authenticate the request - allow demo mode if no valid auth
    const auth = await authenticateRequest(req);
    // Demo mode: if auth fails, continue with mock user context
    const userId = auth?.userId || "demo_user";
    const userEmail = auth?.email || "demo@mnemosyne.app";

    const body = await req.json();
    const message = validateString(body.message, "message", 10000);

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
- User ID: ${userId}
- User Email: ${userEmail}

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
    const maxIterations = 8;

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
          temperature: 0.3,
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
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const aiData = await response.json();
      const choice = aiData.choices[0];

      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
        messages.push(choice.message);

        for (const toolCall of choice.message.tool_calls) {
          const toolName = toolCall.function.name;
          let args = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            args = {};
          }

          console.log(`Executing tool: ${toolName}`, args);
          
          try {
            const result = await executeTool(supabase, toolName, args);
            
            if (result && !result.error) {
              if (toolName === "create_decision") {
                createdEntities.push({ type: "decision", ...result });
              }
            }

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result),
            });
          } catch (toolError: any) {
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: toolError.message }),
            });
          }
        }
      } else {
        finalAnswer = choice.message.content || "";
        break;
      }
    }

    return new Response(
      JSON.stringify({
        answer: finalAnswer,
        createdEntities,
        uiSuggestions,
        iterations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("AI Ask error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
