import { NextResponse } from "next/server";
import { isGoogleApiConfigured } from "@/lib/providers/veo";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    runway: Boolean(process.env.RUNWAY_API_KEY?.trim()),
    google: isGoogleApiConfigured(),
  });
}
