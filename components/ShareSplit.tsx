"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { buildShareUrl } from "@/lib/share";
import { Assignments, ItemWeights, ParsedReceipt, Person, PersonTotal } from "@/lib/types";
import { PayoutHandles, savePayoutHandles } from "@/lib/payout";

interface Props {
  receipt: ParsedReceipt;
  people: Person[];
  assignments: Assignments;
  itemWeights: ItemWeights;
  totals: PersonTotal[];
  payouts: PayoutHandles;
  onPayoutsChange: (payouts: PayoutHandles) => void;
}

export default function ShareSplit({
  receipt,
  people,
  assignments,
  itemWeights,
  totals,
  payouts,
  onPayoutsChange,
}: Props) {
  const [showMore, setShowMore] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  function updatePayout(field: keyof PayoutHandles, value: string) {
    const next = { ...payouts, [field]: value || undefined };
    onPayoutsChange(next);
    savePayoutHandles(next);
  }

  useEffect(() => {
    setShareUrl(buildShareUrl({ receipt, people, assignments, itemWeights, organizerPayouts: payouts }));
  }, [receipt, people, assignments, itemWeights, payouts]);

  useEffect(() => {
    if (!shareUrl) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, { width: 200, margin: 1, color: { dark: "#2b3a34", light: "#ffffff" } })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        // QR generation failing still leaves the copyable link below — not fatal.
      });
    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  async function copy(url: string, key: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 2000);
    } catch {
      // Clipboard permission denied — the link is still visible on screen to copy by hand.
    }
  }

  async function handleShareOrCopy() {
    if (canNativeShare) {
      try {
        await navigator.share({ title: "Split the Bill", text: "Here's how we split the bill", url: shareUrl });
        return;
      } catch {
        // User backed out of the share sheet — leave the panel open so they can copy instead.
        return;
      }
    }
    copy(shareUrl, "main");
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-ledger-rule bg-ledger-surface p-4">
      <p className="text-center text-sm font-medium text-ledger-ink">Hold this up — everyone scans, everyone sees their total</p>

      {qrDataUrl && (
        <div className="rounded-md bg-white p-2 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR code linking to this split" className="h-40 w-40" />
        </div>
      )}

      <button
        onClick={handleShareOrCopy}
        className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-[#2b3a34] transition hover:bg-brand-700"
      >
        {canNativeShare ? "Share link instead" : copied === "main" ? "Copied!" : "Copy link instead"}
      </button>

      <p className="text-center text-xs text-ledger-inkFaint">No login, nothing saved on a server.</p>

      <button
        onClick={() => setShowMore((v) => !v)}
        className="text-xs font-medium text-brand-700 hover:underline"
      >
        {showMore ? "Fewer options" : "More options"}
      </button>

      {showMore && (
        <>
          <div className="w-full border-t border-dashed border-ledger-rule pt-3">
            <p className="mb-1.5 text-xs font-medium text-ledger-inkFaint">
              Add your payout handle so people can pay you directly (saved on this device only)
            </p>
            <div className="flex gap-2">
              <input
                value={payouts.venmo ?? ""}
                onChange={(e) => updatePayout("venmo", e.target.value)}
                placeholder="Venmo handle"
                className="min-w-0 flex-1 rounded-md border border-ledger-rule bg-ledger-paperMuted px-2 py-1.5 text-xs text-ledger-ink placeholder:text-ledger-inkFaint focus:border-brand-500 focus:outline-none"
              />
              <input
                value={payouts.paypal ?? ""}
                onChange={(e) => updatePayout("paypal", e.target.value)}
                placeholder="PayPal.me handle"
                className="min-w-0 flex-1 rounded-md border border-ledger-rule bg-ledger-paperMuted px-2 py-1.5 text-xs text-ledger-ink placeholder:text-ledger-inkFaint focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {people.length > 1 && (
            <div className="w-full">
              <p className="mb-1 text-xs font-medium text-ledger-inkFaint">Or send someone just their total:</p>
              <ul className="flex flex-col gap-1">
                {totals.map((t) => (
                  <li key={t.personId} className="flex items-center justify-between text-sm">
                    <span className="text-ledger-inkSoft">{t.name}</span>
                    <button
                      onClick={() =>
                        copy(
                          buildShareUrl(
                            { receipt, people, assignments, itemWeights, organizerPayouts: payouts },
                            t.personId
                          ),
                          t.personId
                        )
                      }
                      className="text-xs font-medium text-brand-700 hover:underline"
                    >
                      {copied === t.personId ? "Copied!" : "Copy link"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
