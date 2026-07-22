import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Integration test for the DB-level review guards. It exercises the real unique
 * constraints against a live Supabase project, so it only runs when a
 * service-role key is provided (the service role bypasses RLS but NOT unique
 * constraints, which is exactly what we want to verify):
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm test
 *
 * Without those env vars the suite is skipped rather than failing.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const canRun = Boolean(url && serviceKey);

describe.skipIf(!canRun)("review guards (integration)", () => {
  // Created in beforeAll: a skipped describe still executes its body at
  // collection time, so we must not construct the client here.
  let admin: SupabaseClient;

  const tag = Date.now();
  const userAId = { id: "" };
  const userBId = { id: "" };
  let companyId = "";
  const slug = `test-co-${tag}`;

  beforeAll(async () => {
    admin = createClient(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const a = await admin.auth.admin.createUser({
      email: `test-a-${tag}@example.com`,
      password: "password123",
      email_confirm: true,
    });
    const b = await admin.auth.admin.createUser({
      email: `test-b-${tag}@example.com`,
      password: "password123",
      email_confirm: true,
    });
    userAId.id = a.data.user!.id;
    userBId.id = b.data.user!.id;

    const c = await admin
      .from("companies")
      .insert({ slug, name: `Test Co ${tag}` })
      .select("id")
      .single();
    companyId = c.data!.id;
  });

  afterAll(async () => {
    await admin.from("reviews").delete().eq("company_id", companyId);
    await admin.from("companies").delete().eq("id", companyId);
    if (userAId.id) await admin.auth.admin.deleteUser(userAId.id);
    if (userBId.id) await admin.auth.admin.deleteUser(userBId.id);
  });

  it("allows one review per user per company but rejects a duplicate (23505)", async () => {
    const review = {
      company_id: companyId,
      user_id: userAId.id,
      rating: 5,
      title: "First review",
      body: "This is a genuine review body.",
      ip_hash: `hash-a-${tag}`,
    };

    const first = await admin.from("reviews").insert(review);
    expect(first.error).toBeNull();

    const duplicate = await admin
      .from("reviews")
      .insert({ ...review, title: "Second attempt", ip_hash: `hash-a2-${tag}` });
    expect(duplicate.error?.code).toBe("23505");
    expect(duplicate.error?.message).toContain("user_id");
  });

  it("rejects a second review from the same IP hash for the same company (23505)", async () => {
    // A different user, reusing user A's ip_hash on the same company.
    const sharedIpHash = `hash-a-${tag}`;
    const result = await admin.from("reviews").insert({
      company_id: companyId,
      user_id: userBId.id,
      rating: 4,
      title: "Same network",
      body: "Another genuine review body.",
      ip_hash: sharedIpHash,
    });
    expect(result.error?.code).toBe("23505");
    expect(result.error?.message).toContain("ip");
  });
});
