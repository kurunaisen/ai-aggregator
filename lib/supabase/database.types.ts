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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ToolRow = Database["public"]["Tables"]["tools"]["Row"];
export type SubmissionInsert =
  Database["public"]["Tables"]["submissions"]["Insert"];
