export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string;
          service_request_id: string;
          time_slot_id: string;
          appointment_type: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_request_id: string;
          time_slot_id: string;
          appointment_type: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_request_id?: string;
          time_slot_id?: string;
          appointment_type?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: {
          foreignKeyName: string;
          columns: string[];
          referencedRelation: string;
          referencedColumns: string[];
        }[];
      };
      service_requests: {
        Row: {
          id: string
          return_driver_id: string
          shop_id: string
          vehicle_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          return_driver_id: string
          shop_id: string
          vehicle_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          return_driver_id?: string
          shop_id?: string
          vehicle_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_return_driver_id_fkey"
            columns: ["return_driver_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_shop_id_fkey"
            columns: ["shop_id"]
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      shops: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          address: string
          city: string
          state: string
          zip: string
          phone: string
          email: string
          website: string | null
          logo_url: string | null
          is_accepting_requests: boolean
          operating_hours: Json | null
          stripe_account_id: string | null
          rating: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          address: string
          city: string
          state: string
          zip: string
          phone: string
          email: string
          website?: string | null
          logo_url?: string | null
          is_accepting_requests?: boolean
          operating_hours?: Json | null
          stripe_account_id?: string | null
          rating?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          address?: string
          city?: string
          state?: string
          zip?: string
          phone?: string
          email?: string
          website?: string | null
          logo_url?: string | null
          is_accepting_requests?: boolean
          operating_hours?: Json | null
          stripe_account_id?: string | null
          rating?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shops_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      time_slots: {
        Row: {
          id: string
          shop_id: string
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_shop_id_fkey"
            columns: ["shop_id"]
            referencedRelation: "shops"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          role: string
          avatar_url: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          role: string
          avatar_url?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          role?: string
          avatar_url?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          id: string
          customer_id: string
          make: string
          model: string
          year: number
          color: string | null
          license_plate: string
          vin: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          make: string
          model: string
          year: number
          color?: string | null
          license_plate: string
          vin?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          make?: string
          model?: string
          year?: number
          color?: string | null
          license_plate?: string
          vin?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      appointment_type: "pickup" | "delivery"
      notification_channel: "in_app" | "email" | "sms"
      notification_type: "info" | "warning" | "success" | "error" | "service_request_status" | "payment" | "driver_update"
      service_request_status: "pending_approval" | "approved" | "rejected" | "scheduled" | "driver_assigned_pickup" | "pickup_in_progress" | "picked_up" | "at_shop" | "in_progress" | "completed" | "ready_for_delivery" | "driver_assigned_return" | "delivery_in_progress" | "delivered" | "pending_payment" | "paid" | "cancelled"
      user_role: "customer" | "driver" | "shop" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 