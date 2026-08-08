import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Split the Bill",
  description: "Snap a photo of your receipt, assign items, split fairly.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6 sm:max-w-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
