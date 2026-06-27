export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tools: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: string;
          pricing: string;
          tool_type: string;
          short_description: string;
          description: string;
          website_url: string;
          affiliate_url: string | null;
          logo_url: string | null;
          cover_url: string | null;
          featured: boolean;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          category: string;
          pricing: string;
          tool_type: string;
          short_description: string;
          description: string;
          website_url: string;
          affiliate_url?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          featured?: boolean;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          category?: string;
          pricing?: string;
          tool_type?: string;
          short_description?: string;
          description?: string;
          website_url?: string;
          affiliate_url?: string | null;
          logo_url?: string | null;
          cover_url?: string | null;
          featured?: boolean;
          is_published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          name: string;
          url: string;
          category: string;
          description: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          category: string;
          description: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          category?: string;
          description?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_id: string | null;
          plan: string;
          deai_balance: number;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_id?: string | null;
          plan?: string;
          deai_balance?: number;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_id?: string | null;
          plan?: string;
          deai_balance?: number;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string;
          tool_slug: string;
          request_type: string;
          deai_cost: number | null;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_slug: string;
          request_type: string;
          deai_cost?: number | null;
          model?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_slug?: string;
          request_type?: string;
          deai_cost?: number | null;
          model?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      deduct_deai: {
        Args: { p_amount: number };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ToolRow = Database["public"]["Tables"]["tools"]["Row"];
export type SubmissionInsert =
  Database["public"]["Tables"]["submissions"]["Insert"];
