import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { formatModelLabel } from "@/lib/models/labels";

import type { DeaiBillingMode } from "@/lib/subscription/deai-cost";
import { billingModeFromRequestType } from "@/lib/subscription/deai-cost";

export type ModelUsageRow = {
  model: string;
  modelLabel: string;
  toolSlug: string;
  billingMode: DeaiBillingMode;
  cost: number;
  requests: number;
};

export type DayUsageRow = {
  date: string;
  dateLabel: string;
  total: number;
  byModel: ModelUsageRow[];
};

export type DeaiUsageReport = {
  days: number;
  dayRows: DayUsageRow[];
  totalsByModel: ModelUsageRow[];
  periodTotal: number;
  periodRequests: number;
};

type UsageLogRow = {
  created_at: string;
  tool_slug: string;
  model: string | null;
  deai_cost: number | null;
  request_type: string;
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    weekday: "short",
    timeZone: "UTC",
  });
}

function aggregateModelRows(
  entries: {
    toolSlug: string;
    model: string | null;
    cost: number;
    requestType: string;
  }[],
): ModelUsageRow[] {
  const map = new Map<string, ModelUsageRow>();

  for (const entry of entries) {
    const model = entry.model ?? entry.toolSlug;
    const key = `${entry.toolSlug}:${model}`;
    const billingMode = billingModeFromRequestType(entry.requestType);
    const existing = map.get(key);

    if (existing) {
      existing.cost = Math.round((existing.cost + entry.cost) * 10) / 10;
      existing.requests += 1;
      continue;
    }

    map.set(key, {
      model,
      modelLabel: formatModelLabel(entry.model, entry.toolSlug),
      toolSlug: entry.toolSlug,
      billingMode,
      cost: entry.cost,
      requests: 1,
    });
  }

  return [...map.values()].sort((a, b) => b.cost - a.cost);
}

export async function getDeaiUsageReport(
  supabase: SupabaseClient<Database>,
  userId: string,
  days = 14,
): Promise<DeaiUsageReport> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  since.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("usage_logs")
    .select("created_at, tool_slug, model, deai_cost, request_type")
    .eq("user_id", userId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getDeaiUsageReport:", error.message);
  }

  const logs = (data ?? []) as UsageLogRow[];
  const byDay = new Map<string, UsageLogRow[]>();

  for (const log of logs) {
    const key = dayKey(log.created_at);
    const bucket = byDay.get(key) ?? [];
    bucket.push(log);
    byDay.set(key, bucket);
  }

  const dayRows: DayUsageRow[] = [];
  const cursor = new Date(since);

  for (let i = 0; i < days; i += 1) {
    const key = dayKey(cursor.toISOString());
    const dayLogs = byDay.get(key) ?? [];
    const entries = dayLogs.map((log) => ({
      toolSlug: log.tool_slug,
      model: log.model,
      cost: Number(log.deai_cost ?? 0),
      requestType: log.request_type,
    }));

    const byModel = aggregateModelRows(entries);
    const total = Math.round(byModel.reduce((sum, row) => sum + row.cost, 0) * 10) / 10;

    dayRows.push({
      date: key,
      dateLabel: formatDayLabel(key),
      total,
      byModel,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const allEntries = logs.map((log) => ({
    toolSlug: log.tool_slug,
    model: log.model,
    cost: Number(log.deai_cost ?? 0),
    requestType: log.request_type,
  }));

  const totalsByModel = aggregateModelRows(allEntries);
  const periodTotal = Math.round(totalsByModel.reduce((sum, row) => sum + row.cost, 0) * 10) / 10;

  return {
    days,
    dayRows: [...dayRows].reverse(),
    totalsByModel,
    periodTotal,
    periodRequests: logs.length,
  };
}
