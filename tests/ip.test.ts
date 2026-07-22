import { describe, it, expect, beforeAll } from "vitest";
import { hashIp } from "@/utils/ip";

describe("hashIp", () => {
  beforeAll(() => {
    process.env.IP_HASH_SECRET = "test-secret";
  });

  it("returns null for a null IP", () => {
    expect(hashIp(null)).toBeNull();
  });

  it("is deterministic for the same input", () => {
    expect(hashIp("203.0.113.7")).toBe(hashIp("203.0.113.7"));
  });

  it("produces a 64-char hex SHA-256 digest", () => {
    const h = hashIp("203.0.113.7");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different hashes for different IPs", () => {
    expect(hashIp("203.0.113.7")).not.toBe(hashIp("203.0.113.8"));
  });

  it("depends on the server pepper (not reversible without it)", () => {
    const withA = hashIp("203.0.113.7");
    process.env.IP_HASH_SECRET = "a-different-secret";
    const withB = hashIp("203.0.113.7");
    expect(withA).not.toBe(withB);
  });
});
