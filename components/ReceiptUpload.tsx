"use client";

import { useEffect, useRef, useState } from "react";
import { ParsedReceipt } from "@/lib/types";
import { MOCK_RECEIPT } from "@/lib/mockReceipt";

interface Props {
  onParsed: (receipt: ParsedReceipt) => void;
  onQuickSplit: () => void;
}

const UPLOAD_TIMEOUT_MS = 55000;
// Combined cap across all pages of one scan — stay well under Vercel's
// ~4.5MB request body limit for serverless functions, split evenly when
// there's more than one page.
const TOTAL_UPLOAD_BUDGET = 3.5 * 1024 * 1024;
const MAX_PAGES = 3;
// Laplacian-variance threshold below which a photo is flagged as possibly
// too blurry to OCR well. Calibrated against a real receipt image: a sharp
// photo scored ~4600, a mildly blurred one ~240, a clearly blurred one
// ~16 — 200 catches real blur with a wide safety margin against false
// positives on a genuinely sharp photo.
const BLUR_VARIANCE_THRESHOLD = 200;

// Progressively smaller/lower-quality passes. A 4K phone photo (often
// 8-12MB) needs more than one round of downscaling to land under the
// upload cap, so try each step and keep the first one that fits.
const COMPRESSION_STEPS = [
  { maxDimension: 1600, quality: 0.85 },
  { maxDimension: 1600, quality: 0.6 },
  { maxDimension: 1200, quality: 0.6 },
  { maxDimension: 1000, quality: 0.5 },
  { maxDimension: 800, quality: 0.4 },
];

function renderToJpeg(bitmap: ImageBitmap, maxDimension: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process this image on your device.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process this image."))),
      "image/jpeg",
      quality
    );
  });
}

async function compressImage(file: File | Blob, maxBytes: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let smallest: Blob | null = null;
  for (const { maxDimension, quality } of COMPRESSION_STEPS) {
    const blob = await renderToJpeg(bitmap, maxDimension, quality);
    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= maxBytes) return blob;
  }
  // Even the smallest pass didn't fit — use it anyway; the server will
  // give a clear error rather than silently truncating.
  return smallest!;
}

// Sharpness heuristic: grayscale + Laplacian variance on a small downscale.
// A blurry photo has few sharp edges, so this variance comes out low.
// Best-effort only — always pairable with "use it anyway" since a wrong
// call here should never block someone from scanning a real receipt.
async function estimateSharpness(file: File): Promise<number | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = 200;
    const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const { data } = ctx.getImageData(0, 0, w, h);
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    }

    let sum = 0;
    let sumSq = 0;
    let count = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const lap = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - w] - gray[idx + w];
        sum += lap;
        sumSq += lap * lap;
        count++;
      }
    }
    if (count === 0) return null;
    const mean = sum / count;
    return sumSq / count - mean * mean;
  } catch {
    return null;
  }
}

interface CapturedPage {
  id: string;
  file: File;
  previewUrl: string;
  sharpness: number | null;
}

export default function ReceiptUpload({ onParsed, onQuickSplit }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<CapturedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Guards against a stale compression/upload finishing after the watchdog
  // already gave up and showed an error for that same attempt.
  const requestIdRef = useRef(0);
  // Lets you test the rest of the flow without paying for OCR each time:
  // always on in local dev, and on a deployed URL only when visiting
  // with ?demo=1 — so real users never see it.
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setDemoMode(true);
      return;
    }
    const params = new URLSearchParams(window.location.search);
    setDemoMode(params.get("demo") === "1");
  }, []);

  useEffect(() => {
    return () => {
      pages.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addPage(file: File) {
    setError(null);
    const previewUrl = URL.createObjectURL(file);
    const page: CapturedPage = { id: crypto.randomUUID(), file, previewUrl, sharpness: null };
    setPages((prev) => [...prev, page]);

    const sharpness = await estimateSharpness(file);
    setPages((prev) => prev.map((p) => (p.id === page.id ? { ...p, sharpness } : p)));
  }

  function removePage(id: string) {
    setPages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function scanReceipt() {
    if (pages.length === 0) return;
    setError(null);
    setLoading(true);
    setStatus("Compressing photo…");

    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestIdRef.current === requestId;

    const controller = new AbortController();
    // Covers the WHOLE pipeline — compression can stall on some phones
    // just as easily as the network request, and a timeout that only
    // wraps fetch() never fires if it's stuck before that point.
    const watchdogId = setTimeout(() => {
      if (!isCurrent()) return;
      controller.abort();
      setLoading(false);
      setError("This is taking too long — check your connection and try a different photo.");
    }, UPLOAD_TIMEOUT_MS);

    try {
      const perPageBudget = Math.floor(TOTAL_UPLOAD_BUDGET / pages.length);
      const uploads: Blob[] = [];
      for (const page of pages) {
        try {
          uploads.push(await compressImage(page.file, perPageBudget));
        } catch {
          // Fall back to the original file if client-side compression fails
          // (e.g. an image format the canvas can't decode) — the server
          // still validates the format and gives a clear error if it can't.
          uploads.push(page.file);
        }
      }
      if (!isCurrent()) return;

      setStatus(pages.length > 1 ? "Reading receipt (multiple pages)…" : "Reading receipt…");
      const formData = new FormData();
      uploads.forEach((blob, i) => formData.append("image", blob, `receipt-${i}.jpg`));
      const res = await fetch("/api/parse-receipt", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      if (!isCurrent()) return;

      const data = await res.json();
      if (!isCurrent()) return;
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong reading the receipt.");
      }
      onParsed(data as ParsedReceipt);
    } catch (err) {
      if (!isCurrent()) return;
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("This is taking too long — check your connection and try a different photo.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      clearTimeout(watchdogId);
      if (isCurrent()) setLoading(false);
    }
  }

  const reviewing = pages.length > 0;
  const canAddMore = pages.length < MAX_PAGES;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ledger-ink">Split the Bill</h1>
        <p className="mt-2 text-ledger-inkSoft">
          {reviewing
            ? "Long receipt? Add another page before scanning."
            : "Snap a photo of the receipt. We'll read the items so you can split them fairly."}
        </p>
      </div>

      {reviewing && (
        <ul className="flex w-full flex-col gap-2">
          {pages.map((p, i) => {
            const blurry = p.sharpness !== null && p.sharpness < BLUR_VARIANCE_THRESHOLD;
            return (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border border-ledger-rule bg-white p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.previewUrl}
                  alt={`Receipt page ${i + 1}`}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-ledger-ink">Page {i + 1}</p>
                  {blurry && <p className="text-xs text-amber-700">This looks blurry — consider retaking it.</p>}
                </div>
                <button
                  onClick={() => removePage(p.id)}
                  disabled={loading}
                  className="text-ledger-inkFaint hover:text-red-600 disabled:opacity-40"
                  aria-label={`Remove page ${i + 1}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) addPage(file);
          e.target.value = "";
        }}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) addPage(file);
          e.target.value = "";
        }}
      />

      {reviewing && (
        <button
          onClick={scanReceipt}
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? status || "Working…" : `Scan receipt${pages.length > 1 ? ` (${pages.length} pages)` : ""}`}
        </button>
      )}

      <div className="flex w-full gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={loading || !canAddMore}
          className={
            reviewing
              ? "flex-1 rounded-xl border border-ledger-rule bg-white px-4 py-3 font-semibold text-ledger-ink shadow-sm transition hover:bg-ledger-paperMuted disabled:opacity-40"
              : "flex-1 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
          }
        >
          {reviewing ? "+ Add page (camera)" : loading ? status || "Working…" : "Take photo"}
        </button>
        <button
          onClick={() => libraryInputRef.current?.click()}
          disabled={loading || !canAddMore}
          className="flex-1 rounded-xl border border-ledger-rule bg-white px-4 py-3 font-semibold text-ledger-ink shadow-sm transition hover:bg-ledger-paperMuted disabled:opacity-40"
        >
          {reviewing ? "+ Add page (photos)" : "Choose photo"}
        </button>
      </div>

      {!reviewing && (
        <button
          onClick={onQuickSplit}
          className="text-sm text-ledger-inkSoft underline decoration-dotted underline-offset-2 hover:text-brand-700"
        >
          No receipt? Split a total evenly
        </button>
      )}

      {!reviewing && demoMode && (
        <button
          onClick={() => onParsed(MOCK_RECEIPT)}
          className="text-xs text-ledger-inkFaint underline decoration-dotted underline-offset-2 hover:text-ledger-brass"
        >
          Try a sample receipt (no API call)
        </button>
      )}
    </div>
  );
}
