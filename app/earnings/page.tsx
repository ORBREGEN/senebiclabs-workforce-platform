"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Card, SectionHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { useAppState } from "@/components/AppState";
import {
  COLOR,
  CURRENCY,
  CURRENCY_COMPACT,
  formatDate,
} from "@/lib/design";
import { BALANCE, CLINICIAN, PAYMENTS, WEEKLY_EARNINGS } from "@/lib/seed-data";

const WITHDRAW_FEE_RATE = 0.005;

function WithdrawModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { showToast } = useAppState();
  const [amount, setAmount] = useState(BALANCE.toFixed(2));
  const [error, setError] = useState("");

  const parsed = Number.parseFloat(amount);
  const valid = Number.isFinite(parsed) && parsed > 0 && parsed <= BALANCE;
  const fee = valid ? parsed * WITHDRAW_FEE_RATE : 0;
  const net = valid ? parsed - fee : 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (parsed > BALANCE) {
      setError(
        `Your balance is ${CURRENCY.format(BALANCE)}. Enter that or less.`
      );
      return;
    }
    showToast(`Withdrew ${CURRENCY.format(net)} to ${CLINICIAN.payoutMethod}`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Withdraw funds">
      <form onSubmit={submit}>
        <label
          htmlFor="withdraw-amount"
          className="mb-1.5 block text-label uppercase text-muted"
        >
          Amount
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-body text-muted">
            $
          </span>
          <input
            id="withdraw-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError("");
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "withdraw-error" : undefined}
            className={`tnum focusable h-10 w-full rounded-card border bg-surface pl-7 pr-3 text-body text-ink ${
              error ? "border-danger" : "border-hairline"
            }`}
          />
        </div>
        {error && (
          <p id="withdraw-error" className="mt-1.5 text-[13px] text-danger">
            {error}
          </p>
        )}
        <p className="tnum mt-1.5 text-[12px] text-muted">
          Available balance {CURRENCY.format(BALANCE)}
        </p>

        <dl className="mt-5 space-y-2 rounded-card bg-canvas p-4 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-muted">Withdrawal</dt>
            <dd className="tnum text-ink">
              {CURRENCY.format(valid ? parsed : 0)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Transfer fee (0.5%)</dt>
            <dd className="tnum text-ink">−{CURRENCY.format(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-hairline pt-2">
            <dt className="font-medium text-ink">You receive</dt>
            <dd className="tnum font-semibold text-ink">
              {CURRENCY.format(net)}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-[12px] text-muted">
          Arrives in {CLINICIAN.payoutMethod} within two business days.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!valid}>
            Withdraw funds
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function EarningsPage() {
  const { showToast } = useAppState();
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <AppLayout title="Earnings">
      {/* Balance + payout method */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <p className="text-label uppercase text-muted">Current balance</p>
          <p className="tnum mt-2 text-[40px] font-semibold leading-none text-ink">
            {CURRENCY.format(BALANCE)}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={() => setWithdrawOpen(true)}>Withdraw funds</Button>
            <span className="text-[13px] text-muted">
              Next payout: {CLINICIAN.nextPayout}
            </span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-5">
          <div>
            <p className="text-label uppercase text-muted">Payout method</p>
            <p className="mt-2 text-body font-medium text-ink">
              {CLINICIAN.payoutMethod}
            </p>
            <p className="mt-1 text-[13px] text-muted">
              Paid every Friday for the week prior.
            </p>
          </div>
          <button
            onClick={() => showToast("Opening your payout settings")}
            className="focusable mt-4 self-start rounded-btn text-[13px] font-medium text-accent underline-offset-2 hover:underline"
          >
            Change
          </button>
        </Card>
      </div>

      {/* Weekly chart */}
      <div className="mt-8">
        <SectionHeading>Earnings by week</SectionHeading>
        <Card className="p-5">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={WEEKLY_EARNINGS}
                margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke={COLOR.hairline}
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={{ stroke: COLOR.hairline }}
                  tick={{ fill: COLOR.muted, fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tick={{ fill: COLOR.muted, fontSize: 12 }}
                  tickFormatter={(v: number) => CURRENCY_COMPACT.format(v)}
                />
                <Tooltip
                  cursor={{ fill: COLOR.accentSoft }}
                  contentStyle={{
                    borderRadius: 8,
                    border: `1px solid ${COLOR.hairline}`,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: COLOR.muted }}
                  formatter={(v) => [CURRENCY.format(Number(v)), "Earned"]}
                />
                <Bar
                  dataKey="amount"
                  fill={COLOR.accent}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={44}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Payment history */}
      <div className="mt-8">
        <SectionHeading>Payment history</SectionHeading>
        {PAYMENTS.length === 0 ? (
          <EmptyState
            title="No payments yet"
            body="Your first payment lands the Friday after your first completed review."
            action={<Button>Start reviewing</Button>}
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-left">
                <caption className="sr-only">
                  Payments made to you, most recent first
                </caption>
                <thead>
                  <tr className="border-b border-hairline bg-canvas">
                    <th scope="col" className="px-5 py-3 text-label uppercase text-muted">
                      Date
                    </th>
                    <th scope="col" className="px-4 py-3 text-label uppercase text-muted">
                      Description
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-label uppercase text-muted">
                      Reviews
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-label uppercase text-muted">
                      Gross
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-label uppercase text-muted">
                      Platform fee
                    </th>
                    <th scope="col" className="px-5 py-3 text-right text-label uppercase text-muted">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PAYMENTS.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-hairline last:border-b-0 transition-colors hover:bg-canvas"
                    >
                      <td className="tnum whitespace-nowrap px-5 py-3.5 text-body text-muted">
                        {formatDate(p.date)}
                      </td>
                      <th scope="row" className="px-4 py-3.5 text-body font-medium text-ink">
                        {p.description}
                      </th>
                      <td className="tnum px-4 py-3.5 text-right text-body text-ink">
                        {p.reviews}
                      </td>
                      <td className="tnum px-4 py-3.5 text-right text-body text-ink">
                        {CURRENCY.format(p.gross)}
                      </td>
                      <td className="tnum px-4 py-3.5 text-right text-body text-muted">
                        −{CURRENCY.format(p.fee)}
                      </td>
                      <td className="tnum px-5 py-3.5 text-right text-body font-semibold text-ink">
                        {CURRENCY.format(p.gross - p.fee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <WithdrawModal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />
    </AppLayout>
  );
}
