import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Nothing_You_Could_Do, Work_Sans } from "next/font/google";
import "./globals.css";
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

const siteHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "localhost:3000";
const siteUrl = new URL(`http${siteHost.startsWith("localhost") ? "" : "s"}://${siteHost}`);

const description = "Snap a photo of the receipt, assign items, split fairly — no login, nothing saved.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Split the Bill",
  description,
  openGraph: {
    title: "Split the Bill",
    description,
    url: "/",
    siteName: "Split the Bill",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Split the Bill" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Split the Bill",
    description,
    images: ["/og-image.png"],
  },
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
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 sm:max-w-lg">{children}</div>
      </body>
    </html>
  );
}
