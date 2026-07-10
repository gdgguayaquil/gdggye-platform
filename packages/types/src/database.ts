export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string;
          ends_at: string | null;
          event_id: string;
          id: string;
          is_active: boolean;
          name: string;
          points: number;
          qr_rotation_seconds: number;
          sponsor_id: string;
          starts_at: string | null;
        };
        Insert: {
          created_at?: string;
          ends_at?: string | null;
          event_id: string;
          id?: string;
          is_active?: boolean;
          name: string;
          points?: number;
          qr_rotation_seconds?: number;
          sponsor_id: string;
          starts_at?: string | null;
        };
        Update: {
          created_at?: string;
          ends_at?: string | null;
          event_id?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          points?: number;
          qr_rotation_seconds?: number;
          sponsor_id?: string;
          starts_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "activities_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activities_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
        ];
      };
      agenda_slot_speakers: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          slot_id: string;
          speaker_id: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          slot_id: string;
          speaker_id: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          slot_id?: string;
          speaker_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agenda_slot_speakers_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "agenda_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agenda_slot_speakers_speaker_id_fkey";
            columns: ["speaker_id"];
            isOneToOne: false;
            referencedRelation: "speakers";
            referencedColumns: ["id"];
          },
        ];
      };
      agenda_slots: {
        Row: {
          created_at: string;
          display_order: number;
          duration_minutes: number;
          event_id: string;
          id: string;
          room: string;
          start_at: string;
          title_en: string;
          title_es: string;
          track: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          duration_minutes?: number;
          event_id: string;
          id?: string;
          room?: string;
          start_at: string;
          title_en: string;
          title_es: string;
          track?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          duration_minutes?: number;
          event_id?: string;
          id?: string;
          room?: string;
          start_at?: string;
          title_en?: string;
          title_es?: string;
          track?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agenda_slots_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      consent_records: {
        Row: {
          accepted_at: string;
          consent_type: string;
          id: string;
          user_id: string;
          version: string;
        };
        Insert: {
          accepted_at?: string;
          consent_type: string;
          id?: string;
          user_id: string;
          version?: string;
        };
        Update: {
          accepted_at?: string;
          consent_type?: string;
          id?: string;
          user_id?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consent_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      event_content: {
        Row: {
          event_id: string;
          faq: Json;
          gallery: Json;
          hero: Json;
          updated_at: string;
        };
        Insert: {
          event_id: string;
          faq?: Json;
          gallery?: Json;
          hero?: Json;
          updated_at?: string;
        };
        Update: {
          event_id?: string;
          faq?: Json;
          gallery?: Json;
          hero?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_content_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: true;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_speakers: {
        Row: {
          created_at: string;
          display_order: number;
          event_id: string;
          id: string;
          is_active: boolean;
          is_headliner: boolean;
          speaker_id: string;
          track: string | null;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          event_id: string;
          id?: string;
          is_active?: boolean;
          is_headliner?: boolean;
          speaker_id: string;
          track?: string | null;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          event_id?: string;
          id?: string;
          is_active?: boolean;
          is_headliner?: boolean;
          speaker_id?: string;
          track?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_speakers_speaker_id_fkey";
            columns: ["speaker_id"];
            isOneToOne: false;
            referencedRelation: "speakers";
            referencedColumns: ["id"];
          },
        ];
      };
      event_sponsors: {
        Row: {
          booth_label: string | null;
          created_at: string;
          event_id: string;
          id: string;
          is_active: boolean;
          sponsor_id: string;
          tier: string | null;
        };
        Insert: {
          booth_label?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          is_active?: boolean;
          sponsor_id: string;
          tier?: string | null;
        };
        Update: {
          booth_label?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          is_active?: boolean;
          sponsor_id?: string;
          tier?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_sponsors_sponsor_id_fkey";
            columns: ["sponsor_id"];
            isOneToOne: false;
            referencedRelation: "sponsors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sponsors_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          end_at: string;
          expected_attendance: string | null;
          id: string;
          language_mode: Database["public"]["Enums"]["language_mode"];
          leaderboard_enabled: boolean;
          name: string;
          pre_checkin_deadline: string | null;
          slug: string;
          start_at: string;
          status: Database["public"]["Enums"]["event_status"];
          summary_en: string | null;
          summary_es: string | null;
          theme_key: string;
          ticket_url: string | null;
          timezone: string;
          type: Database["public"]["Enums"]["event_type"];
          updated_at: string;
          venue_address: string | null;
          venue_map_url: string | null;
          venue_name: string | null;
          year: number;
        };
        Insert: {
          created_at?: string;
          end_at: string;
          expected_attendance?: string | null;
          id?: string;
          language_mode?: Database["public"]["Enums"]["language_mode"];
          leaderboard_enabled?: boolean;
          name: string;
          pre_checkin_deadline?: string | null;
          slug: string;
          start_at: string;
          status?: Database["public"]["Enums"]["event_status"];
          summary_en?: string | null;
          summary_es?: string | null;
          theme_key?: string;
          ticket_url?: string | null;
          timezone?: string;
          type: Database["public"]["Enums"]["event_type"];
          updated_at?: string;
          venue_address?: string | null;
          venue_map_url?: string | null;
          venue_name?: string | null;
          year: number;
        };
        Update: {
          created_at?: string;
          end_at?: string;
          expected_attendance?: string | null;
          id?: string;
          language_mode?: Database["public"]["Enums"]["language_mode"];
          leaderboard_enabled?: boolean;
          name?: string;
          pre_checkin_deadline?: string | null;
          slug?: string;
          start_at?: string;
          status?: Database["public"]["Enums"]["event_status"];
          summary_en?: string | null;
          summary_es?: string | null;
          theme_key?: string;
          ticket_url?: string | null;
          timezone?: string;
          type?: Database["public"]["Enums"]["event_type"];
          updated_at?: string;
          venue_address?: string | null;
          venue_map_url?: string | null;
          venue_name?: string | null;
          year?: number;
        };
        Relationships: [];
      };
      point_transactions: {
        Row: {
          actor_user_id: string | null;
          created_at: string;
          event_id: string;
          id: string;
          note: string | null;
          points: number;
          source_id: string | null;
          source_type: Database["public"]["Enums"]["point_source"];
          user_id: string;
        };
        Insert: {
          actor_user_id?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          note?: string | null;
          points: number;
          source_id?: string | null;
          source_type: Database["public"]["Enums"]["point_source"];
          user_id: string;
        };
        Update: {
          actor_user_id?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          note?: string | null;
          points?: number;
          source_id?: string | null;
          source_type?: Database["public"]["Enums"]["point_source"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "point_transactions_actor_user_id_fkey";
            columns: ["actor_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "point_transactions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      pre_checkin_submissions: {
        Row: {
          badge_name: string;
          created_at: string;
          dietary: string | null;
          event_id: string;
          id: string;
          notes: string | null;
          photo_consent: boolean;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewer_user_id: string | null;
          status: Database["public"]["Enums"]["pre_checkin_status"];
          submitted_at: string;
          tshirt_size: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          badge_name: string;
          created_at?: string;
          dietary?: string | null;
          event_id: string;
          id?: string;
          notes?: string | null;
          photo_consent: boolean;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewer_user_id?: string | null;
          status?: Database["public"]["Enums"]["pre_checkin_status"];
          submitted_at?: string;
          tshirt_size?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          badge_name?: string;
          created_at?: string;
          dietary?: string | null;
          event_id?: string;
          id?: string;
          notes?: string | null;
          photo_consent?: boolean;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewer_user_id?: string | null;
          status?: Database["public"]["Enums"]["pre_checkin_status"];
          submitted_at?: string;
          tshirt_size?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pre_checkin_submissions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pre_checkin_submissions_reviewer_user_id_fkey";
            columns: ["reviewer_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pre_checkin_submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      registrations: {
        Row: {
          approved_at: string | null;
          created_at: string;
          event_id: string;
          event_rank: number | null;
          id: string;
          pre_checkin_status: Database["public"]["Enums"]["precheckin_status"];
          total_points: number;
          user_id: string;
        };
        Insert: {
          approved_at?: string | null;
          created_at?: string;
          event_id: string;
          event_rank?: number | null;
          id?: string;
          pre_checkin_status?: Database["public"]["Enums"]["precheckin_status"];
          total_points?: number;
          user_id: string;
        };
        Update: {
          approved_at?: string | null;
          created_at?: string;
          event_id?: string;
          event_rank?: number | null;
          id?: string;
          pre_checkin_status?: Database["public"]["Enums"]["precheckin_status"];
          total_points?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      scan_logs: {
        Row: {
          event_id: string;
          id: string;
          points_granted: number;
          reject_reason: string | null;
          result: Database["public"]["Enums"]["scan_result"];
          scanned_at: string;
          scanner_user_id: string;
          target_id: string;
          target_type: Database["public"]["Enums"]["scan_target_type"];
        };
        Insert: {
          event_id: string;
          id?: string;
          points_granted?: number;
          reject_reason?: string | null;
          result: Database["public"]["Enums"]["scan_result"];
          scanned_at?: string;
          scanner_user_id: string;
          target_id: string;
          target_type: Database["public"]["Enums"]["scan_target_type"];
        };
        Update: {
          event_id?: string;
          id?: string;
          points_granted?: number;
          reject_reason?: string | null;
          result?: Database["public"]["Enums"]["scan_result"];
          scanned_at?: string;
          scanner_user_id?: string;
          target_id?: string;
          target_type?: Database["public"]["Enums"]["scan_target_type"];
        };
        Relationships: [
          {
            foreignKeyName: "scan_logs_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "scan_logs_scanner_user_id_fkey";
            columns: ["scanner_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      speakers: {
        Row: {
          bio_en: string | null;
          bio_es: string | null;
          city: string | null;
          created_at: string;
          github_url: string | null;
          id: string;
          linkedin_url: string | null;
          name: string;
          photo_url: string | null;
          role_en: string | null;
          role_es: string | null;
          slug: string;
          updated_at: string;
          website_url: string | null;
          x_url: string | null;
        };
        Insert: {
          bio_en?: string | null;
          bio_es?: string | null;
          city?: string | null;
          created_at?: string;
          github_url?: string | null;
          id?: string;
          linkedin_url?: string | null;
          name: string;
          photo_url?: string | null;
          role_en?: string | null;
          role_es?: string | null;
          slug: string;
          updated_at?: string;
          website_url?: string | null;
          x_url?: string | null;
        };
        Update: {
          bio_en?: string | null;
          bio_es?: string | null;
          city?: string | null;
          created_at?: string;
          github_url?: string | null;
          id?: string;
          linkedin_url?: string | null;
          name?: string;
          photo_url?: string | null;
          role_en?: string | null;
          role_es?: string | null;
          slug?: string;
          updated_at?: string;
          website_url?: string | null;
          x_url?: string | null;
        };
        Relationships: [];
      };
      sponsors: {
        Row: {
          created_at: string;
          default_tier: string | null;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          created_at?: string;
          default_tier?: string | null;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          created_at?: string;
          default_tier?: string | null;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          accepted_privacy_at: string | null;
          accepted_sponsor_consent_at: string | null;
          accepted_terms_at: string | null;
          city: string | null;
          company: string | null;
          created_at: string;
          email: string;
          full_name: string;
          google_id: string | null;
          id: string;
          phone: string | null;
          photo_url: string | null;
          role: string | null;
          social_links: Json;
          system_role: Database["public"]["Enums"]["system_role"];
          updated_at: string;
        };
        Insert: {
          accepted_privacy_at?: string | null;
          accepted_sponsor_consent_at?: string | null;
          accepted_terms_at?: string | null;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          email: string;
          full_name?: string;
          google_id?: string | null;
          id: string;
          phone?: string | null;
          photo_url?: string | null;
          role?: string | null;
          social_links?: Json;
          system_role?: Database["public"]["Enums"]["system_role"];
          updated_at?: string;
        };
        Update: {
          accepted_privacy_at?: string | null;
          accepted_sponsor_consent_at?: string | null;
          accepted_terms_at?: string | null;
          city?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          google_id?: string | null;
          id?: string;
          phone?: string | null;
          photo_url?: string | null;
          role?: string | null;
          social_links?: Json;
          system_role?: Database["public"]["Enums"]["system_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json };
      get_event_leaderboard: {
        Args: { p_event_id: string; p_limit?: number };
        Returns: {
          full_name: string;
          photo_url: string;
          rank: number;
          total_points: number;
          user_id: string;
        }[];
      };
      get_user_event_rank: {
        Args: { p_event_id: string; p_user_id: string };
        Returns: {
          rank: number;
          total_points: number;
        }[];
      };
      is_admin: { Args: never; Returns: boolean };
      is_staff: { Args: never; Returns: boolean };
    };
    Enums: {
      event_status: "draft" | "published" | "live" | "closed";
      event_type:
        | "devfest"
        | "build_with_ai"
        | "google_io"
        | "meetup"
        | "tech_talk"
        | "conference"
        | "workshop"
        | "hackathon";
      language_mode: "es" | "en" | "bilingual";
      point_source:
        | "sponsor"
        | "activity"
        | "networking"
        | "bonus"
        | "admin_adjustment";
      pre_checkin_status: "pending" | "approved" | "rejected";
      precheckin_status: "not_submitted" | "pending" | "approved" | "rejected";
      scan_result: "accepted" | "rejected";
      scan_target_type: "sponsor" | "activity" | "attendee";
      system_role: "attendee" | "organizer" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      event_status: ["draft", "published", "live", "closed"],
      event_type: [
        "devfest",
        "build_with_ai",
        "google_io",
        "meetup",
        "tech_talk",
        "conference",
        "workshop",
        "hackathon",
      ],
      language_mode: ["es", "en", "bilingual"],
      point_source: [
        "sponsor",
        "activity",
        "networking",
        "bonus",
        "admin_adjustment",
      ],
      pre_checkin_status: ["pending", "approved", "rejected"],
      precheckin_status: ["not_submitted", "pending", "approved", "rejected"],
      scan_result: ["accepted", "rejected"],
      scan_target_type: ["sponsor", "activity", "attendee"],
      system_role: ["attendee", "organizer", "admin"],
    },
  },
} as const;
