import { unstable_noStore as noStore } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { ToolRow } from "@/lib/supabase/database.types";
import type { PricingModel, Tool } from "@/types/tool";

function mapToolRow(row: ToolRow): Tool {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.short_description,
    description: row.short_description,
    longDescription: row.description,
    categoryLabel: row.category,
    toolType: row.tool_type,
    pricing: row.pricing as PricingModel,
    website: row.website_url,
    logoUrl: row.logo_url,
    featured: row.featured,
    tags: [],
    features: [],
  };
}

export async function getPublishedTools(): Promise<Tool[]> {
  noStore();
  const supabase = createAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("is_published", true)
    .order("name");

  if (error) {
    console.error("getPublishedTools:", error.message);
    return [];
  }

  return (data ?? []).map(mapToolRow);
}

export async function getFeaturedTools(): Promise<Tool[]> {
  const supabase = createAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("is_published", true)
    .eq("featured", true)
    .order("name");

  if (error) {
    console.error("getFeaturedTools:", error.message);
    return [];
  }

  return (data ?? []).map(mapToolRow);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const supabase = createAnonClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("getToolBySlug:", error.message);
    return null;
  }

  return data ? mapToolRow(data) : null;
}

export async function getPublishedToolSlugs(): Promise<string[]> {
  const supabase = createAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tools")
    .select("slug")
    .eq("is_published", true);

  if (error) {
    console.error("getPublishedToolSlugs:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.slug);
}

export async function getRelatedTools(
  toolType: string,
  excludeSlug: string,
  limit = 3,
): Promise<Tool[]> {
  const supabase = createAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .eq("is_published", true)
    .eq("tool_type", toolType)
    .neq("slug", excludeSlug)
    .order("name")
    .limit(limit);

  if (error) {
    console.error("getRelatedTools:", error.message);
    return [];
  }

  return (data ?? []).map(mapToolRow);
}

export type MarqueeToolItem = {
  slug: string;
  name: string;
  createdAt: string;
};

export async function getMarqueeTools(limit = 3): Promise<MarqueeToolItem[]> {
  const supabase = createAnonClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("tools")
    .select("slug, name, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getMarqueeTools:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    slug: row.slug,
    name: row.name,
    createdAt: row.created_at,
  }));
}
