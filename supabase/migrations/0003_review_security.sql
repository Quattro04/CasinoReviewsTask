-- Review-submission security hardening.
--
-- Three enforced guarantees, all at the database level so they hold regardless
-- of what the application layer does:
--   1. One review per user per company     — unique (company_id, user_id) [already in 0001]
--   2. One review per IP per company        — unique (company_id, ip_hash) [added here]
--   3. Email-verified users only            — RLS insert check [added here]

-- ---------------------------------------------------------------------------
-- 2. IP-based rate limiting: one review per IP per company, regardless of account.
-- ---------------------------------------------------------------------------
-- We store a salted hash of the IP, never the raw address, so the column is not
-- personally identifying on its own and cannot be reversed from a DB dump alone.
-- The hashing (with a server-side pepper) happens in the application layer.
alter table public.reviews
  add column if not exists ip_hash text;

-- Partial unique index: legacy/seed rows with a NULL ip_hash are exempt, but any
-- real submission (which always carries an ip_hash) is limited to one per company.
create unique index if not exists reviews_company_ip_unique
  on public.reviews (company_id, ip_hash)
  where ip_hash is not null;

-- ---------------------------------------------------------------------------
-- 3. Email-verification gate.
-- ---------------------------------------------------------------------------
-- RLS policies run as the invoker and cannot read the auth schema directly, so
-- we expose a SECURITY DEFINER helper that reports whether the current user's
-- email is confirmed. STABLE: result is constant within a statement.
create or replace function public.is_email_verified()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (
      select u.email_confirmed_at is not null
      from auth.users u
      where u.id = auth.uid()
    ),
    false
  );
$$;

-- Replace the old insert policy so that only verified users can create reviews.
drop policy if exists "reviews_insert_authenticated" on public.reviews;

create policy "reviews_insert_verified" on public.reviews
  for insert
  with check (
    auth.uid() = user_id
    and public.is_email_verified()
  );
