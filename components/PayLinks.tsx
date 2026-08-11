import { buildPayPalPayUrl, buildVenmoPayUrl, PayoutHandles } from "@/lib/payout";

interface Props {
  payouts: PayoutHandles;
  amountCents: number;
  note: string;
}

export default function PayLinks({ payouts, amountCents, note }: Props) {
  if (!payouts.venmo && !payouts.paypal) return null;

  return (
    <div className="mt-1 flex gap-3">
      {payouts.venmo && (
        <a
          href={buildVenmoPayUrl(payouts.venmo, amountCents, note)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-brand-700 hover:underline"
        >
          Pay on Venmo
        </a>
      )}
      {payouts.paypal && (
        <a
          href={buildPayPalPayUrl(payouts.paypal, amountCents)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-brand-700 hover:underline"
        >
          Pay on PayPal
        </a>
      )}
    </div>
  );
}
