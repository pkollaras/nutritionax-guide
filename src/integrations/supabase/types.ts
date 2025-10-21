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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          client_id: string
          created_at: string | null
          id: string
          location: string | null
          notes: string | null
          nutritionist_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          client_id: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          nutritionist_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          client_id?: string
          created_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          nutritionist_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          abdomen_1: number | null
          abdomen_2: number | null
          armpit_1: number | null
          armpit_2: number | null
          back_1: number | null
          back_2: number | null
          body_fat_percentage: number | null
          body_mass_percentage: number | null
          chest_1: number | null
          chest_2: number | null
          client_id: string
          created_at: string | null
          custom_fields: Json | null
          fat_mass: number | null
          id: string
          lean_body_mass: number | null
          measurement_date: string
          notes: string | null
          nutritionist_id: string
          thigh_1: number | null
          thigh_2: number | null
          triceps_1: number | null
          triceps_2: number | null
          updated_at: string | null
          waist_1: number | null
          waist_2: number | null
        }
        Insert: {
          abdomen_1?: number | null
          abdomen_2?: number | null
          armpit_1?: number | null
          armpit_2?: number | null
          back_1?: number | null
          back_2?: number | null
          body_fat_percentage?: number | null
          body_mass_percentage?: number | null
          chest_1?: number | null
          chest_2?: number | null
          client_id: string
          created_at?: string | null
          custom_fields?: Json | null
          fat_mass?: number | null
          id?: string
          lean_body_mass?: number | null
          measurement_date?: string
          notes?: string | null
          nutritionist_id: string
          thigh_1?: number | null
          thigh_2?: number | null
          triceps_1?: number | null
          triceps_2?: number | null
          updated_at?: string | null
          waist_1?: number | null
          waist_2?: number | null
        }
        Update: {
          abdomen_1?: number | null
          abdomen_2?: number | null
          armpit_1?: number | null
          armpit_2?: number | null
          back_1?: number | null
          back_2?: number | null
          body_fat_percentage?: number | null
          body_mass_percentage?: number | null
          chest_1?: number | null
          chest_2?: number | null
          client_id?: string
          created_at?: string | null
          custom_fields?: Json | null
          fat_mass?: number | null
          id?: string
          lean_body_mass?: number | null
          measurement_date?: string
          notes?: string | null
          nutritionist_id?: string
          thigh_1?: number | null
          thigh_2?: number | null
          triceps_1?: number | null
          triceps_2?: number | null
          updated_at?: string | null
          waist_1?: number | null
          waist_2?: number | null
        }
        Relationships: []
      }
      client_nutritionists: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          nutritionist_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          nutritionist_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          nutritionist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_nutritionists_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_nutritionists_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
        ]
      }
      default_guidelines: {
        Row: {
          content: string
          created_at: string | null
          id: string
          nutritionist_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          nutritionist_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          nutritionist_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "default_guidelines_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          created_at: string | null
          day_of_week: string
          id: string
          meals: Json
          nutritionist_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          id?: string
          meals?: Json
          nutritionist_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          id?: string
          meals?: Json
          nutritionist_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
        ]
      }
      guidelines: {
        Row: {
          content: string
          created_at: string | null
          id: string
          nutritionist_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          nutritionist_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          nutritionist_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guidelines_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
        ]
      }
      nutritionists: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          services_api_token: string | null
          services_customer_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          services_api_token?: string | null
          services_customer_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          services_api_token?: string | null
          services_customer_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          city: string
          company_address: string | null
          company_name: string | null
          contact_phone: string
          contact_phone_2: string | null
          country: string
          county: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          nutritionist_id: string
          postal_code: string
          profession: string | null
          region: string
          status: string
          tax_office: string | null
          tax_reference_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          city: string
          company_address?: string | null
          company_name?: string | null
          contact_phone: string
          contact_phone_2?: string | null
          country?: string
          county?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          nutritionist_id: string
          postal_code: string
          profession?: string | null
          region: string
          status?: string
          tax_office?: string | null
          tax_reference_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          company_address?: string | null
          company_name?: string | null
          contact_phone?: string
          contact_phone_2?: string | null
          country?: string
          county?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          nutritionist_id?: string
          postal_code?: string
          profession?: string | null
          region?: string
          status?: string
          tax_office?: string | null
          tax_reference_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_nutritionist_id_fkey"
            columns: ["nutritionist_id"]
            isOneToOne: false
            referencedRelation: "nutritionists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      progress_reports: {
        Row: {
          created_at: string | null
          date: string
          day_of_diet: number | null
          id: string
          morning_bm: boolean | null
          notes: string | null
          updated_at: string | null
          user_id: string
          wc: number | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          day_of_diet?: number | null
          id?: string
          morning_bm?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id: string
          wc?: number | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          day_of_diet?: number | null
          id?: string
          morning_bm?: boolean | null
          notes?: string | null
          updated_at?: string | null
          user_id?: string
          wc?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          generated_content: string
          id: string
          items: Json
          updated_at: string | null
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string | null
          generated_content: string
          id?: string
          items?: Json
          updated_at?: string | null
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string | null
          generated_content?: string
          id?: string
          items?: Json
          updated_at?: string | null
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_can_view_nutritionist: {
        Args: { _client_id: string; _nutritionist_id: string }
        Returns: boolean
      }
      copy_default_guidelines: {
        Args: { _user_id: string }
        Returns: undefined
      }
      get_nutritionist_id: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clients_nutritionist: {
        Args: { _client_id: string; _nutritionist_user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
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
      app_role: ["admin", "user", "super_admin"],
    },
  },
} as const
