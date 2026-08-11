import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Split the Bill",
    short_name: "Split",
    description: "Snap a photo of the receipt, assign items, split fairly.",
    start_url: "/",
    display: "standalone",
    background_color: "#2b3a34",
    theme_color: "#2b3a34",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
