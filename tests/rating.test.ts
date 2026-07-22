import { describe, it, expect } from "vitest";
import {
  bayesianRating,
  bayesianRatingFromList,
  BAYESIAN_CONFIDENCE,
} from "@/utils/rating";

describe("bayesianRating", () => {
  it("returns the global mean when there are no reviews (pure prior)", () => {
    expect(bayesianRating(0, 0, 3.5)).toBe(3.5);
  });

  it("shrinks a single extreme review toward the global mean", () => {
    // One 5★ review, global mean 3, C=10 → (10*3 + 5) / (10 + 1) = 35/11 ≈ 3.18
    const score = bayesianRating(5, 1, 3);
    expect(score).toBeCloseTo(35 / 11, 10);
    expect(score).toBeLessThan(5);
    expect(score).toBeGreaterThan(3); // still nudged upward, just not all the way
  });

  it("computes an exact known value", () => {
    // Two 5★ reviews (sum 10, n 2), mean 3, C=10 → 40/12 = 3.333…
    expect(bayesianRating(10, 2, 3)).toBeCloseTo(40 / 12, 10);
  });

  it("converges to the raw average as review volume grows", () => {
    const mean = 3;
    // 1000 reviews averaging 4.8 → sum 4800
    const score = bayesianRating(4800, 1000, mean);
    expect(score).toBeCloseTo(4.8, 1);
    expect(Math.abs(score - 4.8)).toBeLessThan(0.02);
  });

  it("equals the plain average when confidence is 0", () => {
    expect(bayesianRating(9, 3, 3, 0)).toBe(3); // 9/3
    expect(bayesianRating(7, 2, 4.9, 0)).toBe(3.5); // 7/2
  });

  it("gives higher scores to more-reviewed companies at equal averages", () => {
    const mean = 3;
    const few = bayesianRating(5, 1, mean); // one 5★
    const many = bayesianRating(50, 10, mean); // ten 5★, same 5.0 average
    expect(many).toBeGreaterThan(few);
  });

  it("uses BAYESIAN_CONFIDENCE as the default prior weight", () => {
    const explicit = bayesianRating(20, 5, 3, BAYESIAN_CONFIDENCE);
    const implicit = bayesianRating(20, 5, 3);
    expect(implicit).toBe(explicit);
  });

  it("throws on invalid inputs", () => {
    expect(() => bayesianRating(0, -1, 3)).toThrow(RangeError);
    expect(() => bayesianRating(0, 0, 3, -1)).toThrow(RangeError);
  });
});

describe("bayesianRatingFromList", () => {
  it("matches the aggregated form", () => {
    const ratings = [5, 4, 3, 5, 2];
    const sum = ratings.reduce((a, b) => a + b, 0);
    expect(bayesianRatingFromList(ratings, 3.5)).toBeCloseTo(
      bayesianRating(sum, ratings.length, 3.5),
      12,
    );
  });

  it("returns the prior for an empty list", () => {
    expect(bayesianRatingFromList([], 4.2)).toBe(4.2);
  });
});
