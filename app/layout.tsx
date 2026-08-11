import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Nothing_You_Could_Do, Work_Sans } from "next/font/google";
import "./globals.css";
import { TIP_URL } from "@/lib/config";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const chalkHand = Nothing_You_Could_Do({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-chalk-hand",
});

const chalkSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chalk-sans",
});

const chalkMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-chalk-mono",
});

export const metadata: Metadata = {
  title: "Split the Bill",
  description: "Snap a photo of your receipt, assign items, split fairly.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2b3a34",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${chalkHand.variable} ${chalkSans.variable} ${chalkMono.variable}`}>
      <body className="min-h-screen">
        <ServiceWorkerRegister />
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 sm:max-w-lg">
          {children}
          <div className="mt-6 flex justify-center">
            <a
              href={TIP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-ledger-inkFaint underline decoration-dotted underline-offset-2 transition hover:text-ledger-brass"
            >
              Made this for fun — tips welcome on Venmo
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
