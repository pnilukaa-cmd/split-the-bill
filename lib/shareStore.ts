import { Redis } from "@upstash/redis";
import { SHARE_LINK_TTL_DAYS } from "@/lib/config";

const TTL_SECONDS = SHARE_LINK_TTL_DAYS * 24 * 60 * 60;
// Avoids 0/O/1/l/I — a slug that gets read aloud or hand-copied shouldn't be ambiguous.
const SLUG_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
const SLUG_LENGTH = 7;
// Generous for a large multi-page split; mainly a guard against someone trying to
// stash arbitrary large blobs in Redis via this endpoint.
const MAX_PAYLOAD_CHARS = 20_000;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;

export const shortLinksAvailable = redis !== null;

function generateSlug(): string {
  const bytes = new Uint8Array(SLUG_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join("");
}

function keyFor(slug: string): string {
  return `split-the-bill:share:${slug}`;
}

/**
 * Stores an already lz-string-encoded share payload and returns a short slug
 * to resolve it later, or null when short links aren't available (no Upstash
 * configured) or the payload is unreasonably large — callers should fall
 * back to the long, fully self-contained URL in either case.
 */
export async function createShortLink(encoded: string): Promise<string | null> {
  if (!redis) return null;
  if (encoded.length > MAX_PAYLOAD_CHARS) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    // NX: only write if this slug isn't already taken — guards the (astronomically
    // unlikely, at ~55^7 combinations) chance of two links colliding.
    const wrote = await redis.set(keyFor(slug), encoded, { ex: TTL_SECONDS, nx: true });
    if (wrote) return slug;
  }
  return null;
}

export async function resolveShortLink(slug: string): Promise<string | null> {
  if (!redis) return null;
  const value = await redis.get<string>(keyFor(slug));
  return value ?? null;
}
