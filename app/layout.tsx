import type { Metadata, Viewport } from "next";
import { Lora } from "next/font/google";
import "./globals.css";
import { BUY_ME_A_COFFEE_URL } from "@/lib/config";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const ledgerSerif = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ledger-serif",
});

export const metadata: Metadata = {
  title: "Split the Bill",
  description: "Snap a photo of your receipt, assign items, split fairly.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1f5c43",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={ledgerSerif.variable}>
      <body className="min-h-screen">
        <ServiceWorkerRegister />
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 sm:max-w-lg">
          {children}
          <div className="mt-6 flex justify-center">
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ledger-inkFaint underline decoration-dotted underline-offset-2 transition hover:text-ledger-brass"
            >
              ☕ Buy me a coffee
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
