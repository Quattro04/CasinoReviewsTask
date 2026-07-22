import { describe, it, expect } from "vitest";
import { mapReviewInsertError } from "@/utils/reviewErrors";

describe("mapReviewInsertError (duplicate-prevention logic)", () => {
  it("returns null when there is no error", () => {
    expect(mapReviewInsertError(null)).toBeNull();
    expect(mapReviewInsertError(undefined)).toBeNull();
  });

  it("maps the per-user unique violation to the 'already reviewed' message", () => {
    const err = {
      code: "23505",
      message: 'duplicate key value violates unique constraint "reviews_company_id_user_id_key"',
    };
    expect(mapReviewInsertError(err)).toBe("You have already reviewed this company.");
  });

  it("maps the per-IP unique violation to the network message", () => {
    const err = {
      code: "23505",
      message: 'duplicate key value violates unique constraint "reviews_company_ip_unique"',
    };
    expect(mapReviewInsertError(err)).toBe(
      "A review for this company has already been submitted from your network.",
    );
  });

  it("returns null for unrelated errors so the caller shows the raw message", () => {
    expect(mapReviewInsertError({ code: "23503", message: "fk violation" })).toBeNull();
    expect(mapReviewInsertError({ code: "42501", message: "rls denied" })).toBeNull();
  });
});
