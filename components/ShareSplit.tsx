"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { buildShareUrl } from "@/lib/share";
import { Assignments, ItemWeights, ParsedReceipt, Person, PersonTotal } from "@/lib/types";

interface Props {
  receipt: ParsedReceipt;
  people: Person[];
  assignments: Assignments;
  itemWeights: ItemWeights;
  totals: PersonTotal[];
}

export default function ShareSplit({ receipt, people, assignments, itemWeights, totals }: Props) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) return;
    setShareUrl(buildShareUrl({ receipt, people, assignments, itemWeights }));
  }, [open, receipt, people, assignments, itemWeights]);

  useEffect(() => {
    if (!shareUrl) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, { width: 200, margin: 1, color: { dark: "#1c241f", light: "#ffffff" } })
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-brand-500 px-4 py-2.5 font-semibold text-brand-700 transition hover:bg-brand-50"
      >
        📤 Share this split
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-ledger-rule bg-white p-4">
      <p className="text-center text-sm text-ledger-inkSoft">
        Anyone with this link sees the split — no login, nothing saved on a server.
      </p>

      {qrDataUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={qrDataUrl}
          alt="QR code linking to this split"
          className="h-40 w-40 rounded-lg border border-ledger-ruleSoft"
        />
      )}

      <div className="flex w-full gap-2">
        <input
          readOnly
          value={shareUrl}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 rounded-md border border-ledger-rule bg-ledger-paperMuted px-2 py-1.5 text-xs text-ledger-inkSoft"
        />
        <button
          onClick={handleShareOrCopy}
          className="shrink-0 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {canNativeShare ? "Share" : copied === "main" ? "Copied!" : "Copy"}
        </button>
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
                    copy(buildShareUrl({ receipt, people, assignments, itemWeights }, t.personId), t.personId)
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
    </div>
  );
}
