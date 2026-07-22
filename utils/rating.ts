/**
 * Bayesian ("shrunk") average rating.
 *
 * A plain average is unreliable for small samples: one 5★ review would rank a
 * brand-new company above an established one with hundreds of 4.8★ reviews. The
 * Bayesian estimate pulls each company toward the global mean until it has
 * accumulated enough reviews to speak for itself.
 *
 *   score = (C · m + Σ ratings) / (C + n)
 *
 *   m = global mean rating across all reviews (the prior)
 *   C = confidence constant — the number of "virtual" prior reviews at the mean.
 *       Larger C ⇒ more shrinkage toward m for low-volume companies.
 *   n = number of reviews for the company
 *   Σ = sum of the company's ratings
 *
 * The SQL view `company_ratings` computes the same formula so the database can
 * ORDER BY it directly (see supabase/migrations/0002_bayesian_rating.sql). This
 * TS copy is the reusable, unit-testable source of truth for the calculation.
 */

/** Prior weight, in units of "reviews at the global mean". Keep in sync with the SQL view. */
export const BAYESIAN_CONFIDENCE = 10;

/**
 * Compute the Bayesian rating from pre-aggregated values.
 *
 * @param ratingSum  Sum of the company's ratings (Σ).
 * @param reviewCount Number of reviews for the company (n).
 * @param globalMean Mean rating across all reviews in the system (m).
 * @param confidence Prior weight C (defaults to {@link BAYESIAN_CONFIDENCE}).
 * @returns The shrunk rating. With zero reviews it returns the global mean (the prior).
 */
export function bayesianRating(
  ratingSum: number,
  reviewCount: number,
  globalMean: number,
  confidence: number = BAYESIAN_CONFIDENCE,
): number {
  if (confidence < 0) throw new RangeError("confidence must be >= 0");
  if (reviewCount < 0) throw new RangeError("reviewCount must be >= 0");

  const denominator = confidence + reviewCount;
  // Only possible when C = 0 and there are no reviews; fall back to the prior.
  if (denominator === 0) return globalMean;

  return (confidence * globalMean + ratingSum) / denominator;
}

/**
 * Convenience wrapper computing the Bayesian rating from a raw list of ratings.
 * The global mean must still be supplied — it is a property of the whole system,
 * not of this one company's ratings.
 */
export function bayesianRatingFromList(
  ratings: readonly number[],
  globalMean: number,
  confidence: number = BAYESIAN_CONFIDENCE,
): number {
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return bayesianRating(sum, ratings.length, globalMean, confidence);
}
