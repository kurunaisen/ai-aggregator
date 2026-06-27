import Link from "next/link";
import { DeaiModeTag } from "@/components/deai/DeaiModeTag";
import type { DeaiUsageReport } from "@/lib/subscription/deai-analytics";
import { formatDeai } from "@/lib/subscription/deai-cost";

type DeaiUsageAnalyticsProps = {
  report: DeaiUsageReport;
};

export function DeaiUsageAnalytics({ report }: DeaiUsageAnalyticsProps) {
  const maxDayTotal = Math.max(...report.dayRows.map((row) => row.total), 1);
  const maxModelTotal = Math.max(...report.totalsByModel.map((row) => row.cost), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold/70">
            Расход Deai
          </h2>
          <p className="mt-1 text-xs text-silver-dim">
            За последние {report.days} дней · один баланс Deai · режимы токены / кредиты
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gold-light">
            {formatDeai(report.periodTotal)} Deai
          </p>
          <p className="text-xs text-silver-dim">{report.periodRequests} запросов</p>
        </div>
      </div>

      {report.totalsByModel.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-silver-dim">
            По моделям за период
          </h3>
          <ul className="space-y-2">
            {report.totalsByModel.map((row) => (
              <li key={`${row.toolSlug}:${row.model}`} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex flex-wrap items-center gap-2 text-silver">
                    {row.modelLabel}
                    <DeaiModeTag mode={row.billingMode} />
                  </span>
                  <span className="tabular-nums text-gold-light">
                    {formatDeai(row.cost)} Deai
                    <span className="ml-2 text-silver-dim">· {row.requests}</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold-light/80"
                    style={{ width: `${Math.max(4, (row.cost / maxModelTotal) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-silver-dim">
          По дням
        </h3>

        {report.dayRows.every((row) => row.total === 0) ? (
          <p className="rounded-xl border divider-metallic bg-black/30 px-4 py-6 text-sm text-silver-dim">
            Пока нет расхода за выбранный период.{" "}
            <Link href="/catalog" className="text-gold-light hover:underline">
              Откройте инструмент
            </Link>{" "}
            и сделайте первый запрос.
          </p>
        ) : (
          <div className="space-y-3">
            {report.dayRows.map((day) => (
              <div
                key={day.date}
                className="rounded-xl border divider-metallic bg-black/30 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium capitalize text-silver">
                    {day.dateLabel}
                  </span>
                  <span className="text-sm tabular-nums text-gold-light">
                    {formatDeai(day.total)} Deai
                  </span>
                </div>

                {day.total > 0 && (
                  <>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/50">
                      <div
                        className="h-full rounded-full bg-gold/60"
                        style={{ width: `${Math.max(4, (day.total / maxDayTotal) * 100)}%` }}
                      />
                    </div>
                    <ul className="mt-3 space-y-1.5 border-t divider-metallic pt-3">
                      {day.byModel.map((row) => (
                        <li
                          key={`${day.date}:${row.model}`}
                          className="flex justify-between gap-3 text-xs text-silver-dim"
                        >
                          <span className="flex items-center gap-2">
                            {row.modelLabel}
                            <DeaiModeTag mode={row.billingMode} />
                          </span>
                          <span className="tabular-nums text-silver">
                            {formatDeai(row.cost)} Deai · {row.requests}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
