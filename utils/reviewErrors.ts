/** Postgres error shape we care about from a failed reviews insert. */
export type InsertError = { code?: string; message?: string };

/**
 * Map a reviews-insert error to a user-facing message. Pure function so the
 * duplicate-prevention logic is unit-testable without a database. Returns null
 * when the error is not one we translate (caller falls back to the raw message).
 *
 * Two unique constraints can raise 23505:
 *   - unique(company_id, user_id)  → one review per user per company
 *   - unique(company_id, ip_hash)  → one review per IP per company
 * We disambiguate on the constraint/index name embedded in the message.
 */
export function mapReviewInsertError(error: InsertError | null | undefined): string | null {
  if (!error) return null;
  if (error.code === "23505") {
    if ((error.message ?? "").includes("ip")) {
      return "A review for this company has already been submitted from your network.";
    }
    return "You have already reviewed this company.";
  }
  return null;
}
