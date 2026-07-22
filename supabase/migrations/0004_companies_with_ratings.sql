-- Flat, orderable company + rating view.
--
-- The app needs to list companies ordered by their Bayesian rating in a single
-- round trip. company_ratings is keyed by company_id and only contains reviewed
-- companies, and PostgREST cannot ORDER parent rows by an embedded resource's
-- column. This view LEFT JOINs the two into flat columns so callers can simply:
--
--   select * from companies_with_ratings order by bayesian_rating desc nulls last
--
-- security_invoker = true keeps the underlying tables' RLS in force.
create or replace view public.companies_with_ratings
with (security_invoker = true)
as
select
  c.*,
  cr.avg_rating,
  coalesce(cr.review_count, 0) as review_count,
  cr.bayesian_rating
from public.companies c
left join public.company_ratings cr on cr.company_id = c.id;
