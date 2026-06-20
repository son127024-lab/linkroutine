'use client';

import { useMemo, useState } from 'react';
import { createSubscriptionPayment } from '@/lib/pi';
import {
  calculateSubscriptionSummary,
  isSubscriptionActive,
  markSubscriptionPaid,
  SubscriptionRecord,
} from '@/lib/subscription';

type Props = {
  record: SubscriptionRecord;
  onRecordChange: (record: SubscriptionRecord) => void;
};

export default function SubscriptionPanel({ record, onRecordChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Monthly subscription is ready. Direct Pi cashback is disabled in V1.');
  const summary = useMemo(() => calculateSubscriptionSummary(record), [record]);
  const active = isSubscriptionActive(record);
  const progressPercent = summary.isDiscountMaxed
    ? 100
    : Math.min((summary.qualifiedVisits % 1000) / 10, 100);

  async function handleSubscriptionPay() {
    setBusy(true);
    setMessage(`Opening Pi subscription payment for ${summary.nextFeePi} Pi...`);
    try {
      await createSubscriptionPayment(summary.nextFeePi, () => {
        const updated = markSubscriptionPaid(summary.nextFeePi);
        onRecordChange(updated);
        setMessage(`Subscription payment completed: ${summary.nextFeePi} Pi.`);
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Subscription payment failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="subscriptionCard">
      <div className="subscriptionTop">
        <div>
          <p className="eyebrow">SUBSCRIPTION</p>
          <h2>Monthly Pro Access</h2>
          <p className="microCopy">Base fee {summary.baseFeePi} Pi/month. Link Points can reduce the next fee, not create direct payouts.</p>
        </div>
        <span className={active ? 'statusPill activeStatus' : 'statusPill'}>{active ? 'ACTIVE' : 'READY'}</span>
      </div>

      <div className="priceRow">
        <div>
          <span>Current next fee</span>
          <strong>{summary.nextFeePi.toFixed(2)} Pi</strong>
        </div>
        <div>
          <span>Discount</span>
          <strong>-{summary.discountPi.toFixed(2)} Pi</strong>
        </div>
        <div>
          <span>Minimum fee</span>
          <strong>{summary.minFeePi.toFixed(2)} Pi</strong>
        </div>
      </div>

      <div className="pointsBox">
        <div className="pointsHeader">
          <strong>{summary.linkPoints.toLocaleString()} Link Points</strong>
          <span>{summary.qualifiedVisits.toLocaleString()} qualified visits this month</span>
        </div>
        <div className="progressTrack" aria-label="Qualified visit progress">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="microCopy">
          {summary.isDiscountMaxed
            ? 'Maximum monthly discount reached. Cashback is reserved for a future ad-revenue proven version.'
            : `${summary.visitsUntilNextDiscount.toLocaleString()} more qualified visits until the next 0.1 Pi discount.`}
        </p>
      </div>

      <button className="primaryButton fullWidthButton" onClick={handleSubscriptionPay} disabled={busy}>
        {busy ? 'Processing...' : `Pay Monthly Subscription ${summary.nextFeePi.toFixed(2)} Pi`}
      </button>
      <p className="microCopy centerText">Qualified visits are counted after meaningful viewing time in Smart Viewer. Repeated rapid refreshes are ignored.</p>
      {record.lastPaidAt ? <p className="microCopy centerText">Last payment: {new Date(record.lastPaidAt).toLocaleDateString()} / {record.lastPaymentAmount?.toFixed(2)} Pi</p> : null}
      {message ? <p className="subscriptionMessage">{message}</p> : null}
    </section>
  );
}
