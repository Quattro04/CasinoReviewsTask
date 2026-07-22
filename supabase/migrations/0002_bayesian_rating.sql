-- Bayesian ("shrunk") company rating.
--
-- Replaces the naive AVG in company_ratings with a Bayesian estimate so that
-- low-volume companies are pulled toward the global mean and cannot outrank
-- established ones on the strength of a single review. The formula mirrors
-- utils/rating.ts exactly:
--
--   bayesian = (C * m + sum(rating)) / (C + n)
--
-- where m = global mean rating, C = confidence constant (prior weight), and
-- n = the company's review count. Keep C in sync with BAYESIAN_CONFIDENCE.

create or replace view public.company_ratings
with (security_invoker = true)
as
with global as (
  -- m: the prior every company is shrunk toward.
  select avg(rating)::numeric as global_mean
  from public.reviews
)
select
  r.company_id,
  round(avg(r.rating)::numeric, 2)              as avg_rating,
  count(*)                                      as review_count,
  round(
    ((10 * g.global_mean) + sum(r.rating)) / (10 + count(*)),
    3
  )                                             as bayesian_rating
from public.reviews r
cross join global g
group by r.company_id, g.global_mean;
