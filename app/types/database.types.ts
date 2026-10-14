export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      communities: {
        Row: {
          boundary: unknown
          created_at: string
          description: string | null
          geojson_area: Json | null
          id: string
          name: string
          parent_community_id: string | null
          slug: string
          type: string
        }
        Insert: {
          boundary?: unknown
          created_at?: string
          description?: string | null
          geojson_area?: Json | null
          id?: string
          name: string
          parent_community_id?: string | null
          slug: string
          type?: string
        }
        Update: {
          boundary?: unknown
          created_at?: string
          description?: string | null
          geojson_area?: Json | null
          id?: string
          name?: string
          parent_community_id?: string | null
          slug?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_parent_community_id_fkey"
            columns: ["parent_community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          plan_id: string | null
          profile_id: string
          role: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          plan_id?: string | null
          profile_id: string
          role?: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          plan_id?: string | null
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          nav_order: number
          parent_id: string | null
          show_in_nav: boolean
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          nav_order?: number
          parent_id?: string | null
          show_in_nav?: boolean
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          nav_order?: number
          parent_id?: string | null
          show_in_nav?: boolean
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      planting_suggestions: {
        Row: {
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          notes: string | null
          suggested_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location: unknown
          notes?: string | null
          suggested_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          notes?: string | null
          suggested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planting_suggestions_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planting_suggestions_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      point_events: {
        Row: {
          action_type: string
          created_at: string
          id: string
          points: number
          profile_id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          points: number
          profile_id: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          points?: number
          profile_id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "point_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          total_points: number
        }
        Insert: {
          auth_user_id: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          total_points?: number
        }
        Update: {
          auth_user_id?: string
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          total_points?: number
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          id: string
          profile_id: string
          redeemed_at: string
          reward_id: string
          status: string
        }
        Insert: {
          id?: string
          profile_id: string
          redeemed_at?: string
          reward_id: string
          status?: string
        }
        Update: {
          id?: string
          profile_id?: string
          redeemed_at?: string
          reward_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          points_required: number
          title: string
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          points_required: number
          title: string
          type?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          points_required?: number
          title?: string
          type?: string
        }
        Relationships: []
      }
      tree_species: {
        Row: {
          avg_co2_kg_per_year: number | null
          common_name: string
          description: string | null
          id: string
          image_url: string | null
          scientific_name: string
        }
        Insert: {
          avg_co2_kg_per_year?: number | null
          common_name: string
          description?: string | null
          id?: string
          image_url?: string | null
          scientific_name: string
        }
        Update: {
          avg_co2_kg_per_year?: number | null
          common_name?: string
          description?: string | null
          id?: string
          image_url?: string | null
          scientific_name?: string
        }
        Relationships: []
      }
      tree_updates: {
        Row: {
          author_id: string | null
          content: string | null
          created_at: string
          id: string
          photo_urls: string[]
          tree_id: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          photo_urls?: string[]
          tree_id: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          photo_urls?: string[]
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tree_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_updates_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      trees: {
        Row: {
          community_id: string | null
          created_at: string
          donation_project: string | null
          earned_activity: string | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          notes: string | null
          photo_urls: string[]
          planted_at: string
          planted_by: string | null
          quantity: number
          source: string
          species_id: string | null
          status: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          donation_project?: string | null
          earned_activity?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          notes?: string | null
          photo_urls?: string[]
          planted_at?: string
          planted_by?: string | null
          quantity?: number
          source?: string
          species_id?: string | null
          status?: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          donation_project?: string | null
          earned_activity?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          notes?: string | null
          photo_urls?: string[]
          planted_at?: string
          planted_by?: string | null
          quantity?: number
          source?: string
          species_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "trees_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_planted_by_fkey"
            columns: ["planted_by"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_planted_by_fkey"
            columns: ["planted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trees_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "tree_species"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string | null
          rank: number | null
          total_points: number | null
          trees_planted: number | null
          updates_posted: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      insert_tree: {
        Args: {
          p_community_id: string
          p_lat: number
          p_lng: number
          p_notes?: string
          p_photo_urls?: string[]
          p_planted_by: string
          p_species_id: string
          p_status?: string
        }
        Returns: {
          community_id: string | null
          created_at: string
          donation_project: string | null
          earned_activity: string | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          notes: string | null
          photo_urls: string[]
          planted_at: string
          planted_by: string | null
          quantity: number
          source: string
          species_id: string | null
          status: string
        }
        SetofOptions: {
          from: "*"
          to: "trees"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      trees_near_point: {
        Args: { p_lat: number; p_lng: number; p_metres?: number }
        Returns: {
          community_id: string | null
          created_at: string
          donation_project: string | null
          earned_activity: string | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          notes: string | null
          photo_urls: string[]
          planted_at: string
          planted_by: string | null
          quantity: number
          source: string
          species_id: string | null
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trees"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      user_role: "admin" | "user"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["admin", "user"],
    },
  },
} as const

