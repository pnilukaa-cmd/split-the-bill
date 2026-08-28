import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Nothing_You_Could_Do, Work_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ThemeToggle from "@/components/ThemeToggle";
import { siteUrl } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

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
  "Free bill splitter for restaurants and group hangouts. Snap a photo of the receipt, assign items, and split fairly — no login, no app to download.";

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
  description: "Snap a photo of the receipt, assign items, and split a bill fairly. No login required.",
  url: siteUrl.toString(),
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any (web browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e3" },
    { media: "(prefers-color-scheme: dark)", color: "#2b3a34" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="dark"
      // The blocking theme-init script below can flip data-theme before React hydrates
      // (e.g. a light-system visitor) — that's expected, not a real mismatch to warn about.
      suppressHydrationWarning
      className={`${chalkHand.variable} ${chalkSans.variable} ${chalkMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          // Static, hardcoded object — no user input reaches this, so no escaping is needed.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Blocking (no defer/async) so the right theme is set before first paint —
            avoids a flash of the dark default for light-system or light-preference visitors. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        <ServiceWorkerRegister />
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 sm:max-w-lg">
          <div className="mb-1 flex justify-end">
            <ThemeToggle />
          </div>
          {children}
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
