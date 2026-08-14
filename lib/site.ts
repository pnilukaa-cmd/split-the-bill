const siteHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "localhost:3000";

export const siteUrl = new URL(`http${siteHost.startsWith("localhost") ? "" : "s"}://${siteHost}`);
