import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiResponse {
  answer: string;
  ui_suggestions: UiSuggestion[];
  created_entities: CreatedEntity[];
}

interface UiSuggestion {
  type: "toast" | "alert";
  message: string;
  deepLink?: string;
  severity?: string;
}

interface CreatedEntity {
  type: string;
  decision_id?: string;
  update_id?: string;
  conflict_id?: string;
  version_num?: number;
  deepLink?: string;
}

interface MeetingSummaryResponse {
  message_id: string;
  summary: {
    summary: string;
    decisions: Array<{
      title: string;
      canonical_text: string;
      owner: string;
      confidence: number;
    }>;
    action_items: Array<{
      task: string;
      assignee: string;
      deadline?: string;
    }>;
    topics_discussed: string[];
    conflicts_identified: Array<{
      description: string;
      parties: string[];
      severity: string;
    }>;
  };
  created_decisions: any[];
  update_event_id: string;
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const askChiefOfStaff = useCallback(async (message: string, userId?: string, orgId?: string): Promise<AiResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke("ai-ask", {
        body: {
          message,
          userId: userId || "user_001",
          orgId: orgId || "org_001",
        },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const response = data as AiResponse;
      setLastResponse(response);

      // Handle UI suggestions
      for (const suggestion of response.ui_suggestions) {
        if (suggestion.type === "toast") {
          toast.success(suggestion.message, {
            action: suggestion.deepLink
              ? {
                  label: "View",
                  onClick: () => window.location.href = suggestion.deepLink!,
                }
              : undefined,
          });
        } else if (suggestion.type === "alert") {
          toast.warning(suggestion.message, {
            action: suggestion.deepLink
              ? {
                  label: "Review",
                  onClick: () => window.location.href = suggestion.deepLink!,
                }
              : undefined,
          });
        }
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get AI response";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ingestMessage = useCallback(async (rawText: string, source?: string, authorPersonId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke("ai-ingest", {
        body: {
          raw_text: rawText,
          source: source || "api",
          author_person_id: authorPersonId,
        },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success("Message ingested successfully");
      return data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to ingest message";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const summarizeMeeting = useCallback(async (
    transcript: string,
    meetingTitle?: string,
    attendees?: string[]
  ): Promise<MeetingSummaryResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke("ai-meeting-summary", {
        body: {
          transcript,
          meeting_title: meetingTitle,
          attendees,
        },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const response = data as MeetingSummaryResponse;

      // Show success notifications
      if (response.created_decisions?.length > 0) {
        toast.success(`Created ${response.created_decisions.length} proposed decision(s) from meeting`);
      } else {
        toast.success("Meeting summary generated");
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to summarize meeting";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    lastResponse,
    error,
    askChiefOfStaff,
    ingestMessage,
    summarizeMeeting,
  };
}
