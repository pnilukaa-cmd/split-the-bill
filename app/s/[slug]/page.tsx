"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

// A short link (yoursite.com/s/x7k2p9) just resolves the slug to the same
// lz-string-encoded payload the long links carry directly, then hands off
// to the existing hash-based ShareView flow in app/page.tsx — no separate
// rendering path to maintain.
export default function ShortLinkRedirect() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slug = params.slug;
    const personId = searchParams.get("p");
    let cancelled = false;

    fetch(`/api/share/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json() as Promise<{ encoded: string }>;
      })
      .then(({ encoded }) => {
        if (cancelled) return;
        const hash = personId ? `#s=${encoded}&p=${encodeURIComponent(personId)}` : `#s=${encoded}`;
        window.location.replace(`/${hash}`);
      })
      .catch(() => {
        if (!cancelled) setError("This link has expired or doesn't exist.");
      });

    return () => {
      cancelled = true;
    };
  }, [params.slug, searchParams]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      {error ? (
        <>
          <p className="font-hand text-2xl text-ledger-ink">{error}</p>
          <a href="/" className="text-sm font-semibold text-ledger-accent hover:underline">
            Start a new split
          </a>
        </>
      ) : (
        <p className="text-sm text-ledger-inkSoft">Opening your split…</p>
      )}
    </div>
  );
}
