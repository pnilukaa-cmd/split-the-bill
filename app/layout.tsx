import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Nothing_You_Could_Do, Work_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { siteUrl } from "@/lib/site";

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

const title = "Split the Bill – Free Receipt Splitter, No Login Needed";
const description =
  "Free bill splitter for restaurants and group hangouts. Snap a photo of the receipt, assign items, and split fairly — no login, no app to download, nothing saved.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "Split the Bill",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Split the Bill" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Split the Bill",
  description: "Snap a photo of the receipt, assign items, and split a bill fairly. No login, nothing saved.",
  url: siteUrl.toString(),
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any (web browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
      <head>
        <script
          type="application/ld+json"
          // Static, hardcoded object — no user input reaches this, so no escaping is needed.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen">
        <ServiceWorkerRegister />
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 sm:max-w-lg">{children}</div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
