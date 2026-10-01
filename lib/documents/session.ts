import { NextResponse } from "next/server";
import { ensureProfile, getSessionUser, type Profile } from "@/lib/auth/profile";
import { MIGRATION_HINT } from "@/lib/documents/constants";
import { isMissingDocumentsSchema } from "@/lib/documents/schema";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DocumentSession = {
  supabase: SupabaseClient<Database>;
  userId: string;
  profile: Profile;
};

export async function requireDocumentSession(): Promise<DocumentSession | NextResponse> {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase не настроен." }, { status: 503 });
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Войдите, чтобы работать со своими документами." }, { status: 401 });
  }

  const profile = await ensureProfile(supabase, user);
  return { supabase, userId: user.id, profile };
}

export function schemaErrorResponse(error: unknown): NextResponse | null {
  const message = error instanceof Error ? error.message : "";
  if (!message || !isMissingDocumentsSchema(message)) return null;
  return NextResponse.json({ error: MIGRATION_HINT, code: "MIGRATION_REQUIRED" }, { status: 503 });
}
