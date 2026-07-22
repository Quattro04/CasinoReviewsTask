import { createHmac } from "crypto";
import { headers } from "next/headers";

/**
 * Best-effort extraction of the client IP from proxy headers.
 *
 * Behind Vercel/most reverse proxies the real client address is the first entry
 * of `x-forwarded-for`. We fall back to `x-real-ip`. Returns null when no
 * address can be determined (e.g. some local dev setups).
 *
 * NOTE: these headers are attacker-controllable when the app is not behind a
 * trusted proxy that overwrites them. See DECISIONS.md for the threat model.
 */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = h.get("x-real-ip");
  return realIp?.trim() || null;
}

/**
 * HMAC-SHA256 the IP with a server-side pepper so the stored value is not
 * personally identifying on its own and cannot be reversed from a DB dump
 * without the secret. Returns null for a null IP so callers can decide how to
 * handle the "no IP" case.
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const secret = process.env.IP_HASH_SECRET ?? "";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

/** Convenience: read the current request's IP and return its hash (or null). */
export async function getClientIpHash(): Promise<string | null> {
  return hashIp(await getClientIp());
}
