import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const DAILY_SCAN_LIMIT = 8;

const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(DAILY_SCAN_LIMIT, "1 d"),
        prefix: "split-the-bill:scan",
      })
    : null;

export async function isScanAllowed(identifier: string): Promise<boolean> {
  // No Upstash configured — rate limiting is a no-op until
  // UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are set.
  if (!ratelimit) return true;
  const { success } = await ratelimit.limit(identifier);
  return success;
}

export function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}
