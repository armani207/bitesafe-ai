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
      glucose_readings: {
        Row: {
          created_at: string
          id: string
          meal_id: string | null
          notes: string | null
          reading_type: string | null
          source: string | null
          unit: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          meal_id?: string | null
          notes?: string | null
          reading_type?: string | null
          source?: string | null
          unit?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          meal_id?: string | null
          notes?: string | null
          reading_type?: string | null
          source?: string | null
          unit?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "glucose_readings_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          foods: Json
          id: string
          image_url: string | null
          risk_explanation: string | null
          risk_level: string
          risk_score: number
          saved: boolean | null
          suggestions: Json | null
          tips: string[] | null
          total_calories: number
          total_carbs_max: number
          total_carbs_min: number
          total_fat: number
          total_fiber: number
          total_protein: number
          total_sugar: number
          user_id: string
        }
        Insert: {
          created_at?: string
          foods?: Json
          id?: string
          image_url?: string | null
          risk_explanation?: string | null
          risk_level?: string
          risk_score?: number
          saved?: boolean | null
          suggestions?: Json | null
          tips?: string[] | null
          total_calories?: number
          total_carbs_max?: number
          total_carbs_min?: number
          total_fat?: number
          total_fiber?: number
          total_protein?: number
          total_sugar?: number
          user_id: string
        }
        Update: {
          created_at?: string
          foods?: Json
          id?: string
          image_url?: string | null
          risk_explanation?: string | null
          risk_level?: string
          risk_score?: number
          saved?: boolean | null
          suggestions?: Json | null
          tips?: string[] | null
          total_calories?: number
          total_carbs_max?: number
          total_carbs_min?: number
          total_fat?: number
          total_fiber?: number
          total_protein?: number
          total_sugar?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          avatar_url: string | null
          body_fat_percentage: number | null
          conditions: Json | null
          created_at: string
          diabetes_type: string | null
          dietary_restrictions: string[] | null
          email: string | null
          gender: string | null
          goals: Json | null
          healthcare_provider: Json | null
          height: number | null
          id: string
          is_onboarded: boolean | null
          medications: string[] | null
          name: string | null
          target_glucose_max: number | null
          target_glucose_min: number | null
          updated_at: string
          user_id: string
          uses_insulin: boolean | null
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          body_fat_percentage?: number | null
          conditions?: Json | null
          created_at?: string
          diabetes_type?: string | null
          dietary_restrictions?: string[] | null
          email?: string | null
          gender?: string | null
          goals?: Json | null
          healthcare_provider?: Json | null
          height?: number | null
          id?: string
          is_onboarded?: boolean | null
          medications?: string[] | null
          name?: string | null
          target_glucose_max?: number | null
          target_glucose_min?: number | null
          updated_at?: string
          user_id: string
          uses_insulin?: boolean | null
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_url?: string | null
          body_fat_percentage?: number | null
          conditions?: Json | null
          created_at?: string
          diabetes_type?: string | null
          dietary_restrictions?: string[] | null
          email?: string | null
          gender?: string | null
          goals?: Json | null
          healthcare_provider?: Json | null
          height?: number | null
          id?: string
          is_onboarded?: boolean | null
          medications?: string[] | null
          name?: string | null
          target_glucose_max?: number | null
          target_glucose_min?: number | null
          updated_at?: string
          user_id?: string
          uses_insulin?: boolean | null
          weight?: number | null
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
    Enums: {},
  },
} as const
