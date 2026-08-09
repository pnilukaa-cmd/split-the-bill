"use client";

import { useEffect, useRef, useState } from "react";
import { ParsedReceipt } from "@/lib/types";

interface Props {
  onParsed: (receipt: ParsedReceipt) => void;
}

const UPLOAD_TIMEOUT_MS = 45000;
const MAX_DIMENSION = 1600;

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
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
      0.85
    );
  });
}

export default function ReceiptUpload({ onParsed }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  async function handleFile(file: File) {
    setError(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

    try {
      let upload: Blob = file;
      try {
        upload = await compressImage(file);
      } catch {
        // Fall back to the original file if client-side compression fails
        // (e.g. an image format the canvas can't decode) — the server
        // still validates the format and gives a clear error if it can't.
      }

      const formData = new FormData();
      formData.append("image", upload, "receipt.jpg");
      const res = await fetch("/api/parse-receipt", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong reading the receipt.");
      }
      onParsed(data as ParsedReceipt);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("This is taking too long — check your connection and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Split the Bill</h1>
        <p className="mt-2 text-slate-500">
          Snap a photo of the receipt. We&apos;ll read the items so you can split them fairly.
        </p>
      </div>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Receipt preview"
          className="max-h-64 w-full rounded-xl border border-slate-200 object-contain shadow-sm"
        />
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
          if (file) handleFile(file);
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
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="flex w-full gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={loading}
          className="flex-1 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Reading…" : "Take photo"}
        </button>
        <button
          onClick={() => libraryInputRef.current?.click()}
          disabled={loading}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          Choose photo
        </button>
      </div>
    </div>
  );
}
