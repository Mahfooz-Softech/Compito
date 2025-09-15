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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_conversations: {
        Row: {
          blocked_at: string
          customer_id: string
          id: string
          worker_id: string
        }
        Insert: {
          blocked_at?: string
          customer_id: string
          id?: string
          worker_id: string
        }
        Update: {
          blocked_at?: string
          customer_id?: string
          id?: string
          worker_id?: string
        }
        Relationships: []
      }
      booking_checkout: {
        Row: {
          address: string
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          scheduled_date: string
          service_id: string
          status: string | null
          total_amount: number
          worker_id: string
        }
        Insert: {
          address: string
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          scheduled_date: string
          service_id: string
          status?: string | null
          total_amount: number
          worker_id: string
        }
        Update: {
          address?: string
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          service_id?: string
          status?: string | null
          total_amount?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_checkout_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          customer_confirmed_at: string | null
          customer_id: string | null
          duration_hours: number | null
          id: string
          notes: string | null
          scheduled_date: string | null
          service_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          stripe_session_id: string | null
          total_amount: number | null
          worker_completed_at: string | null
          worker_id: string | null
          worker_payout: number | null
        }
        Insert: {
          address?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          customer_confirmed_at?: string | null
          customer_id?: string | null
          duration_hours?: number | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          service_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          worker_completed_at?: string | null
          worker_id?: string | null
          worker_payout?: number | null
        }
        Update: {
          address?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          customer_confirmed_at?: string | null
          customer_id?: string | null
          duration_hours?: number | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          service_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_session_id?: string | null
          total_amount?: number | null
          worker_completed_at?: string | null
          worker_id?: string | null
          worker_payout?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      commission_settings: {
        Row: {
          category_id: string | null
          commission_rate: number
          created_at: string | null
          id: string
          is_global: boolean | null
          updated_at: string | null
          worker_id: string | null
        }
        Insert: {
          category_id?: string | null
          commission_rate: number
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Update: {
          category_id?: string | null
          commission_rate?: number
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          updated_at?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_settings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "worker_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_settings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          service_id: string | null
          worker_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          service_id?: string | null
          worker_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          service_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          created_at: string
          customer_id: string
          description: string
          estimated_hours: number
          expires_at: string | null
          id: string
          price: number
          service_id: string | null
          service_request_id: string | null
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description: string
          estimated_hours: number
          expires_at?: string | null
          id?: string
          price: number
          service_id?: string | null
          service_request_id?: string | null
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string
          estimated_hours?: number
          expires_at?: string | null
          id?: string
          price?: number
          service_id?: string | null
          service_request_id?: string | null
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          booking_id: string
          commission_amount: number
          commission_rate: number | null
          created_at: string | null
          customer_id: string
          id: string
          payment_method: string | null
          payment_status: string | null
          total_amount: number
          transaction_id: string | null
          updated_at: string | null
          worker_id: string
          worker_paid: boolean | null
          worker_payout: number
        }
        Insert: {
          booking_id: string
          commission_amount: number
          commission_rate?: number | null
          created_at?: string | null
          customer_id: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          total_amount: number
          transaction_id?: string | null
          updated_at?: string | null
          worker_id: string
          worker_paid?: boolean | null
          worker_payout: number
        }
        Update: {
          booking_id?: string
          commission_amount?: number
          commission_rate?: number | null
          created_at?: string | null
          customer_id?: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string | null
          worker_id?: string
          worker_paid?: boolean | null
          worker_payout?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          customer_rating: number | null
          customer_total_reviews: number | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          latitude: number | null
          location: string | null
          longitude: number | null
          phone: string | null
          postcode: string | null
          updated_at: string | null
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_rating?: number | null
          customer_total_reviews?: number | null
          email?: string | null
          first_name?: string
          id: string
          last_name?: string
          latitude?: number | null
          location?: string | null
          longitude?: string | null
          phone?: string | null
          postcode?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          customer_rating?: number | null
          customer_total_reviews?: number | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          latitude?: number | null
          location?: string | null
          longitude?: string | null
          phone?: string | null
          postcode?: string | null
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          rating: number | null
          review_type: string
          reviewer_id: string | null
          worker_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          rating?: number | null
          review_type?: string
          reviewer_id?: string | null
          worker_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          rating?: number | null
          review_type?: string
          reviewer_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          customer_id: string
          expires_at: string | null
          id: string
          location_address: string
          location_latitude: number | null
          location_longitude: number | null
          message_to_worker: string | null
          preferred_date: string | null
          service_id: string
          status: string | null
          updated_at: string | null
          worker_id: string
          worker_response: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          customer_id: string
          expires_at?: string | null
          id?: string
          location_address: string
          location_latitude?: number | null
          location_longitude?: number | null
          message_to_worker?: string | null
          preferred_date?: string | null
          service_id: string
          status?: string | null
          updated_at?: string | null
          worker_id: string
          worker_response?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          customer_id?: string
          expires_at?: string | null
          id?: string
          location_address?: string
          location_latitude?: number | null
          location_longitude?: number | null
          message_to_worker?: string | null
          preferred_date?: string | null
          service_id?: string
          status?: string | null
          updated_at?: string | null
          worker_id?: string
          worker_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          description: string | null
          duration_hours: number | null
          id: string
          price_max: number | null
          price_min: number | null
          title: string
          worker_id: string | null
        }
        Insert: {
          category_id?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          price_max?: number | null
          price_min?: number | null
          title: string
          worker_id?: string | null
        }
        Update: {
          category_id?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          price_max?: number | null
          price_min?: number | null
          title?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean | null
          start_time: string
          updated_at: string | null
          worker_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean | null
          start_time: string
          updated_at?: string | null
          worker_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean | null
          start_time?: string
          updated_at?: string | null
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_availability_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_categories: {
        Row: {
          color: string | null
          commission_rate: number | null
          created_at: string | null
          description: string | null
          id: string
          min_customers: number | null
          min_experience: number | null
          min_rating: number | null
          name: string
        }
        Insert: {
          color?: string | null
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_customers?: number | null
          min_experience?: number | null
          min_rating?: number | null
          name: string
        }
        Update: {
          color?: string | null
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_customers?: number | null
          min_experience?: number | null
          min_rating?: number | null
          name?: string
        }
        Relationships: []
      }
      worker_profiles: {
        Row: {
          bio: string | null
          category_id: string | null
          certifications: string[] | null
          city: string | null
          completed_jobs: number | null
          country: string | null
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_available: boolean | null
          is_online: boolean | null
          is_verified: boolean | null
          last_seen: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          online_services: boolean | null
          postcode: string | null
          rating: number | null
          service_radius_miles: number | null
          skills: string[] | null
          total_earnings: number | null
          total_reviews: number | null
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          bio?: string | null
          category_id?: string | null
          certifications?: string[] | null
          city?: string | null
          completed_jobs?: number | null
          country?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id: string
          is_available?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          online_services?: boolean | null
          postcode?: string | null
          rating?: number | null
          service_radius_miles?: number | null
          skills?: string[] | null
          total_earnings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          bio?: string | null
          category_id?: string | null
          certifications?: string[] | null
          city?: string | null
          completed_jobs?: number | null
          country?: string | null
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_available?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          last_seen?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          online_services?: boolean | null
          postcode?: string | null
          rating?: number | null
          service_radius_miles?: number | null
          skills?: string[] | null
          total_earnings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_profiles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "worker_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_profiles_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_worker_category: {
        Args: { worker_id: string }
        Returns: string
      }
      get_worker_commission_rate: {
        Args: { worker_id: string }
        Returns: number
      }
      get_worker_payment_summaries: {
        Args: {
          page_limit?: number
          page_offset?: number
          search_term?: string
        }
        Returns: {
          paid_amount: number
          required_payout: number
          total_amount: number
          total_commission: number
          total_customers: number
          total_services: number
          worker_id: string
          worker_name: string
        }[]
      }
      get_worker_payment_summaries_count: {
        Args: { search_term?: string }
        Returns: number
      }
      get_worker_unique_customers: {
        Args: { worker_id: string }
        Returns: number
      }
      is_conversation_blocked: {
        Args: { receiver_id: string; sender_id: string }
        Returns: boolean
      }
      reject_worker_profile: {
        Args: {
          rejection_reason?: string
          verifier_id: string
          worker_id: string
        }
        Returns: boolean
      }
      update_customer_rating_stats: {
        Args: { customer_id: string }
        Returns: undefined
      }
      update_worker_rating_stats: {
        Args: { worker_id: string }
        Returns: undefined
      }
      verify_worker_profile: {
        Args: { verifier_id: string; worker_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_id?: string;
  related_type?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationParams {
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
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
