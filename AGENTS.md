<!-- BEGIN:nextjs-agent-rules -->
# Project conventions

ReviewHub — a Trustpilot-style review platform (Next.js 16, React 19, Tailwind 4, Supabase via `@supabase/ssr`).

## Data & Supabase
- Schema lives in `supabase/migrations/` (`0001` base, `0002` Bayesian view, `0003` review security, `0004` flat view). **New DB changes go in a new numbered migration** and must be applied to the target project (dashboard SQL editor or `supabase db push`) — nothing applies them automatically.
- Server code uses the SSR client from `utils/supabase/server.ts`; the browser client is in `utils/supabase/client.ts`. Middleware/session refresh is `proxy.ts` (Next 16 renames middleware).
- List queries read the `companies_with_ratings` view in **one** round trip — do not reintroduce per-row/per-card queries (the starter's N+1).

## Rating
- The Bayesian rating exists twice and must stay in sync: SQL view `0002_bayesian_rating.sql` and the TS mirror `utils/rating.ts` (`BAYESIAN_CONFIDENCE = 10`). Change both together and update `tests/rating.test.ts`.

## Security (all enforced at the DB, not just app logic)
- One review per user per company: `unique (company_id, user_id)`.
- One review per IP per company: `unique (company_id, ip_hash)`; the IP is HMAC-hashed with `IP_HASH_SECRET` in `utils/ip.ts` — never store raw IPs.
- Email-verified users only: RLS insert policy + `is_email_verified()`. `postReview` mirrors these checks for friendly messages via `utils/reviewErrors.ts`.

## SEO
- Absolute URLs come from `utils/seo.ts` (`siteUrl`/`absoluteUrl`, driven by `NEXT_PUBLIC_SITE_URL`). JSON-LD builders are pure functions in `utils/schema.ts`, rendered via `components/JsonLd.tsx`. Keep `sitemap.ts`/`robots.ts` in step with the indexability rules in `DECISIONS.md`.

## Testing & checks
- Vitest; `npm test` auto-loads `.env.local`. The DB integration test needs `SUPABASE_SERVICE_ROLE_KEY` (test-only — never used at runtime, never deploy it).
- Before committing, run `npx tsc --noEmit`, `npx eslint .` (lint the **whole** repo, tests included), and `npm test`.
- Record notable decisions and any discovered bugs in `DECISIONS.md`.
<!-- END:nextjs-agent-rules -->
