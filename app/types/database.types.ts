export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          auth_user_id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          total_points: number
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_points?: number
          created_at?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          parent_community_id: string | null
          geojson_area: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          parent_community_id?: string | null
          geojson_area?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          parent_community_id?: string | null
          geojson_area?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          id: string
          community_id: string
          profile_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          community_id: string
          profile_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          profile_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: []
      }
      tree_species: {
        Row: {
          id: string
          common_name: string
          scientific_name: string
          description: string | null
          avg_co2_per_year_kg: number | null
        }
        Insert: {
          id?: string
          common_name: string
          scientific_name: string
          description?: string | null
          avg_co2_per_year_kg?: number | null
        }
        Update: {
          id?: string
          common_name?: string
          scientific_name?: string
          description?: string | null
          avg_co2_per_year_kg?: number | null
        }
        Relationships: []
      }
      trees: {
        Row: {
          id: string
          planted_by: string
          community_id: string | null
          species_id: string | null
          lat: number
          lng: number
          planted_at: string
          photo_url: string | null
          notes: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          planted_by: string
          community_id?: string | null
          species_id?: string | null
          lat: number
          lng: number
          planted_at?: string
          photo_url?: string | null
          notes?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          planted_by?: string
          community_id?: string | null
          species_id?: string | null
          lat?: number
          lng?: number
          planted_at?: string
          photo_url?: string | null
          notes?: string | null
          verified?: boolean
          created_at?: string
        }
        Relationships: []
      }
      tree_updates: {
        Row: {
          id: string
          tree_id: string
          author_id: string
          content: string
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tree_id: string
          author_id: string
          content: string
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tree_id?: string
          author_id?: string
          content?: string
          photo_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      point_events: {
        Row: {
          id: string
          profile_id: string
          action_type: string
          points: number
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          action_type: string
          points: number
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          action_type?: string
          points?: number
          reference_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          id: string
          name: string
          description: string | null
          points_required: number
          active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          points_required: number
          active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          points_required?: number
          active?: boolean
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          id: string
          profile_id: string
          reward_id: string
          redeemed_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          reward_id: string
          redeemed_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          reward_id?: string
          redeemed_at?: string
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
      [_ in never]: never
    }
  }
}
