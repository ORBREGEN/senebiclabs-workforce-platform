"use client";

import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { PoolCard } from "@/components/PoolCard";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/ui/StatTile";
import { COLOR, CURRENCY, formatShortDate } from "@/lib/design";
import { DAILY_EARNINGS, POOLS, STATS } from "@/lib/seed-data";

function pctChange(now: number, prev: number): number {
  return ((now - prev) / prev) * 100;
}

export default function DashboardPage() {
  const router = useRouter();

  const eligiblePools = POOLS.filter((p) => p.eligible);
  const resumePool = POOLS.find(
    (p) => p.status === "in_progress" && p.reviewed > 0 && p.reviewed < p.items
  );

  const sparkline = DAILY_EARNINGS.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
  }));

  return (
    <AppLayout title="Dashboard">
      {/* Stat tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Earnings this week"
          value={CURRENCY.format(STATS.earningsThisWeek)}
          delta={pctChange(STATS.earningsThisWeek, STATS.earningsLastWeek)}
        />
        <StatTile
          label="Reviews completed"
          value={STATS.reviewsCompleted.toLocaleString()}
          delta={pctChange(
            STATS.reviewsCompleted,
            STATS.reviewsCompletedLastWeek
          )}
        />
        <StatTile
          label="Agreement score"
          value={`${STATS.agreementScore}%`}
          delta={pctChange(STATS.agreementScore, STATS.agreementScoreLastWeek)}
        />
        <StatTile
          label="Reviewed this week"
          value={STATS.reviewedThisWeek.toLocaleString()}
          delta={pctChange(STATS.reviewedThisWeek, STATS.reviewedLastWeek)}
        />
      </div>

      {/* Resume + sparkline */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeading>Continue where you left off</SectionHeading>
          {resumePool ? (
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-section text-ink">{resumePool.name}</h3>
                  <p className="mt-1 text-body text-muted">
                    {resumePool.description}
                  </p>
                </div>
                <Button
                  onClick={() =>
                    router.push(`/workspace?pool=${resumePool.id}`)
                  }
                >
                  Resume reviewing
                </Button>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="tnum text-[13px] font-medium text-ink">
                    {resumePool.reviewed} of {resumePool.items} reviewed
                  </span>
                  <span className="tnum text-[13px] text-muted">
                    {Math.round((resumePool.reviewed / resumePool.items) * 100)}%
                  </span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-hairline"
                  role="progressbar"
                  aria-valuenow={resumePool.reviewed}
                  aria-valuemin={0}
                  aria-valuemax={resumePool.items}
                  aria-label={`${resumePool.reviewed} of ${resumePool.items} reviewed`}
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${(resumePool.reviewed / resumePool.items) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              title="Nothing in progress"
              body="Pick a pool and your place will be saved here between sessions."
              action={
                <Button onClick={() => router.push("/queue")}>
                  Browse the review queue
                </Button>
              }
            />
          )}
        </div>

        <div>
          <SectionHeading>Earnings, last 14 days</SectionHeading>
          <Card className="p-5">
            <p className="tnum text-[22px] font-semibold leading-none text-ink">
              {CURRENCY.format(
                DAILY_EARNINGS.reduce((sum, d) => sum + d.amount, 0)
              )}
            </p>
            <p className="mt-1 text-[12px] text-muted">Across 14 days</p>
            <div className="mt-4 h-[104px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sparkline}
                  margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
                >
                  <defs>
                    <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={COLOR.accent}
                        stopOpacity={0.22}
                      />
                      <stop
                        offset="100%"
                        stopColor={COLOR.accent}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" hide />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ stroke: COLOR.hairline }}
                    contentStyle={{
                      borderRadius: 8,
                      border: `1px solid ${COLOR.hairline}`,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: COLOR.muted }}
                    formatter={(v) => [CURRENCY.format(Number(v)), "Earned"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke={COLOR.accent}
                    strokeWidth={2}
                    fill="url(#spark)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Pools */}
      <div className="mt-8">
        <SectionHeading
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/queue")}
            >
              View all
            </Button>
          }
        >
          Your pools
        </SectionHeading>

        {eligiblePools.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {eligiblePools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pools yet"
            body="Pass a calibration to become eligible for a pool. Each one takes about ten minutes."
            action={
              <Button onClick={() => router.push("/calibration")}>
                Take a calibration
              </Button>
            }
          />
        )}
      </div>
    </AppLayout>
  );
}
