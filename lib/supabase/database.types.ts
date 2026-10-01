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
      payment_orders: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          external_id: string;
          plan: string;
          amount_rub: number;
          deai_grant: number;
          status: string;
          created_at: string;
          paid_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: string;
          external_id: string;
          plan: string;
          amount_rub: number;
          deai_grant: number;
          status?: string;
          created_at?: string;
          paid_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          external_id?: string;
          plan?: string;
          amount_rub?: number;
          deai_grant?: number;
          status?: string;
          created_at?: string;
          paid_at?: string | null;
        };
        Relationships: [];
      };
      document_bases: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      source_documents: {
        Row: {
          id: string;
          base_id: string;
          user_id: string;
          filename: string;
          char_count: number;
          notice: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          base_id: string;
          user_id: string;
          filename: string;
          char_count?: number;
          notice?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          base_id?: string;
          user_id?: string;
          filename?: string;
          char_count?: number;
          notice?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          base_id: string;
          user_id: string;
          chunk_index: number;
          content: string;
          embedding: string | null;
        };
        Insert: {
          id?: string;
          document_id: string;
          base_id: string;
          user_id: string;
          chunk_index: number;
          content: string;
          embedding?: string | null;
        };
        Update: {
          id?: string;
          document_id?: string;
          base_id?: string;
          user_id?: string;
          chunk_index?: number;
          content?: string;
          embedding?: string | null;
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
      add_deai: {
        Args: { p_amount: number; p_user_id?: string };
        Returns: number;
      };
      match_document_chunks: {
        Args: { p_base_id: string; p_query: string; p_limit?: number };
        Returns: {
          chunk_id: string;
          document_id: string;
          filename: string;
          chunk_index: number;
          content: string;
          rank: number;
        }[];
      };
      match_document_chunks_semantic: {
        Args: { p_base_id: string; p_embedding: string; p_limit?: number };
        Returns: {
          chunk_id: string;
          document_id: string;
          filename: string;
          chunk_index: number;
          content: string;
          rank: number;
        }[];
      };
      expand_document_chunk_neighbors: {
        Args: { p_base_id: string; p_chunk_ids: string[] };
        Returns: {
          chunk_id: string;
          document_id: string;
          filename: string;
          chunk_index: number;
          content: string;
          rank: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ToolRow = Database["public"]["Tables"]["tools"]["Row"];
export type SubmissionInsert =
  Database["public"]["Tables"]["submissions"]["Insert"];
