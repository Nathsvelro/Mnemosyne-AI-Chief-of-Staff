export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      conflicts: {
        Row: {
          created_at: string
          description: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          resolved_at: string | null
          severity: number | null
          status: Database["public"]["Enums"]["conflict_status"]
        }
        Insert: {
          created_at?: string
          description: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          resolved_at?: string | null
          severity?: number | null
          status?: Database["public"]["Enums"]["conflict_status"]
        }
        Update: {
          created_at?: string
          description?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          resolved_at?: string | null
          severity?: number | null
          status?: Database["public"]["Enums"]["conflict_status"]
        }
        Relationships: []
      }
      decision_affected_teams: {
        Row: {
          created_at: string
          decision_id: string
          id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          decision_id: string
          id?: string
          team_id: string
        }
        Update: {
          created_at?: string
          decision_id?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_affected_teams_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_affected_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_versions: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          decision_id: string
          id: string
          text: string
          version_num: number
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          decision_id: string
          id?: string
          text: string
          version_num: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          decision_id?: string
          id?: string
          text?: string
          version_num?: number
        }
        Relationships: [
          {
            foreignKeyName: "decision_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_versions_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "decisions"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          canonical_text: string
          confidence: number | null
          created_at: string
          id: string
          owner_person_id: string | null
          status: Database["public"]["Enums"]["decision_status"]
          title: string
          updated_at: string
        }
        Insert: {
          canonical_text: string
          confidence?: number | null
          created_at?: string
          id?: string
          owner_person_id?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          title: string
          updated_at?: string
        }
        Update: {
          canonical_text?: string
          confidence?: number | null
          created_at?: string
          id?: string
          owner_person_id?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          id: string
          owner_person_id: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          owner_person_id?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          owner_person_id?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_owner_person_id_fkey"
            columns: ["owner_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_edges: {
        Row: {
          created_at: string
          edge_type: Database["public"]["Enums"]["edge_type"]
          from_entity_id: string
          from_entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          last_seen_at: string
          to_entity_id: string
          to_entity_type: Database["public"]["Enums"]["entity_type"]
          weight: number | null
        }
        Insert: {
          created_at?: string
          edge_type: Database["public"]["Enums"]["edge_type"]
          from_entity_id: string
          from_entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          last_seen_at?: string
          to_entity_id: string
          to_entity_type: Database["public"]["Enums"]["entity_type"]
          weight?: number | null
        }
        Update: {
          created_at?: string
          edge_type?: Database["public"]["Enums"]["edge_type"]
          from_entity_id?: string
          from_entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          last_seen_at?: string
          to_entity_id?: string
          to_entity_type?: Database["public"]["Enums"]["entity_type"]
          weight?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          author_person_id: string | null
          created_at: string
          id: string
          parsed_json: Json | null
          raw_text: string
          source: string
        }
        Insert: {
          author_person_id?: string | null
          created_at?: string
          id?: string
          parsed_json?: Json | null
          raw_text: string
          source: string
        }
        Update: {
          author_person_id?: string | null
          created_at?: string
          id?: string
          parsed_json?: Json | null
          raw_text?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_person_id_fkey"
            columns: ["author_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          ceo_name: string | null
          ceo_view_enabled: boolean | null
          created_at: string
          id: string
          org_name: string
          updated_at: string
        }
        Insert: {
          ceo_name?: string | null
          ceo_view_enabled?: boolean | null
          created_at?: string
          id?: string
          org_name?: string
          updated_at?: string
        }
        Update: {
          ceo_name?: string | null
          ceo_view_enabled?: boolean | null
          created_at?: string
          id?: string
          org_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      persons: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          load_score: number | null
          name: string
          role: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          load_score?: number | null
          name: string
          role?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          load_score?: number | null
          name?: string
          role?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_logs: {
        Row: {
          action_required: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          is_read: boolean | null
          reason: string
          sent_at: string
          to_person_id: string
        }
        Insert: {
          action_required?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_read?: boolean | null
          reason: string
          sent_at?: string
          to_person_id: string
        }
        Update: {
          action_required?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          is_read?: boolean | null
          reason?: string
          sent_at?: string
          to_person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routing_logs_to_person_id_fkey"
            columns: ["to_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lead_person_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lead_person_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lead_person_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_teams_lead_person"
            columns: ["lead_person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      update_event_entities: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          update_event_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          update_event_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          update_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "update_event_entities_update_event_id_fkey"
            columns: ["update_event_id"]
            isOneToOne: false
            referencedRelation: "update_events"
            referencedColumns: ["id"]
          },
        ]
      }
      update_events: {
        Row: {
          created_at: string
          id: string
          impact_score: number | null
          summary: string
          type: Database["public"]["Enums"]["update_event_type"]
          why_it_matters: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          impact_score?: number | null
          summary: string
          type: Database["public"]["Enums"]["update_event_type"]
          why_it_matters?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          impact_score?: number | null
          summary?: string
          type?: Database["public"]["Enums"]["update_event_type"]
          why_it_matters?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      conflict_status: "open" | "resolved" | "dismissed"
      decision_status: "proposed" | "confirmed" | "deprecated"
      edge_type:
        | "communicates_with"
        | "owns"
        | "depends_on"
        | "references"
        | "contradicts"
      entity_type: "person" | "team" | "topic" | "decision" | "document"
      update_event_type: "decision" | "knowledge" | "stakeholder" | "risk"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      conflict_status: ["open", "resolved", "dismissed"],
      decision_status: ["proposed", "confirmed", "deprecated"],
      edge_type: [
        "communicates_with",
        "owns",
        "depends_on",
        "references",
        "contradicts",
      ],
      entity_type: ["person", "team", "topic", "decision", "document"],
      update_event_type: ["decision", "knowledge", "stakeholder", "risk"],
    },
  },
} as const
