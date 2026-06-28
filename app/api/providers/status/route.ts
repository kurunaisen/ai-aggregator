import { NextResponse } from "next/server";
import { isFluxConfigured } from "@/lib/providers/flux";
import { isKlingConfigured } from "@/lib/providers/kling-jwt";
import { isRunwayConfigured } from "@/lib/providers/ai";
import { isGoogleApiConfigured } from "@/lib/providers/veo";
import { isXaiConfigured } from "@/lib/providers/xai-chat";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    xai: isXaiConfigured(),
    runway: isRunwayConfigured(),
    google: isGoogleApiConfigured(),
    bfl: isFluxConfigured(),
    kling: isKlingConfigured(),
  });
}
