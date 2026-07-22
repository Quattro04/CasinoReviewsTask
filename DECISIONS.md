# DECISIONS

This document records what I changed, why, the trade-offs I weighed, the
security threat model, and how I used and verified AI tooling. The starter was
AI-generated and, as the brief warned, looked fine but had real correctness,
security, SEO, and performance gaps. Each section below maps to a task area.

## How AI was used (summary)

The whole task was done with **Claude Code (an agentic AI coder)** driving the
edits, with me directing the plan, making the judgment calls, and verifying
every output. My verification loop for each change was: read the generated diff,
run `npx tsc --noEmit` and `npx eslint .`, run the unit tests, and reason about
edge cases, plus test it by hand in the app myself before committing.

Nothing was committed that I hadn't type-checked, linted, and — for logic —
covered with a test or hand-verified.

For prompts, i let it read the instructions straight from Task.pdf and let him
explain to me everything and structure a plan before commiting to any code changes.
I made sure to understand the changes he will do, and then, as mentioned above,
review them accordingly.

---

## Discovered bugs

Bugs found by manually going through the site after it was done.

- **`StarRating` filled-overlay shrinking** — my a11y rewrite (#5) put the green
   filled-star row *inside* the width-clipped overlay container. As a flex row,
   its star SVGs shrank to the clipped width (e.g. 76% for a 3.8 score) instead
   of rendering full-size and being cropped, so the green stars came out narrower
   than the gray stars beneath and visibly drifted out of alignment. Caught by
   visual review, not by `tsc`/lint/tests — a reminder that pixel layout needs an
   actual look. Fixed by pinning both rows to natural width (`w-max shrink-0`) so
   the overlay renders full stars and the container merely clips them; verified in
   the browser that all stars render at 20px and every filled star is
   pixel-aligned with its gray counterpart. *(fix commit `fix(StarRating): …`)*

---

## 1. Site Architecture

### What I added
- **Public user profile pages** — `/users/[id]`. Shows the member's display name,
  join month, and all their reviews (each linking to the company and the review
  permalink).
- **Individual review permalinks** — `/companies/[slug]/reviews/[id]`. Nested
  under the company so breadcrumbs and context are natural. Includes a
  breadcrumb trail, author link, and company link.
- Wired existing surfaces to the new URLs: review cards link their title to the
  permalink and the author name to the profile.

### What I deliberately did *not* add
- **Username-based profile URLs** (`/u/jane`). `profiles` has no unique username;
  `display_name` is free-text and non-unique. Adding usernames means a new unique
  column, backfill, and collision UX — out of scope for this slice. I used the
  user UUID, which is stable and already the FK.
- **Editable public profiles / avatars.** `avatar_url` exists but isn't
  populated; I left avatar upload out and render an initial instead.

### Indexability decisions
| URL | Indexable | Rationale |
|---|---|---|
| `/`, `/companies`, `/companies/[slug]` | Yes | Primary content. |
| `/companies/[slug]/reviews/[id]` | Yes, self-canonical | Real content with a stable URL; Trustpilot-style. Some near-duplication with the company page, accepted as a trade-off for shareable, linkable, individually-rankable reviews. |
| `/users/[id]` | Yes, **noindex when 0 reviews** | A profile with reviews aggregates content; an empty one is thin, so it's `noindex, follow`. |
| `/companies?q=...` | **noindex**, canonical → `/companies` | Avoids near-infinite thin query-string URLs in the index. |
| `/account`, `/auth/*`, `/companies/new` | No | Private/utility; disallowed in `robots.ts` and behind auth. |

---

## 2. SEO

### Metadata
- `metadataBase`, a title template (`%s | ReviewHub`), and default OpenGraph in
  the root layout for the preview card in number of apps.
- Per-page `generateMetadata` with canonical URLs for home, companies list,
  company, review, and user pages. Company/review descriptions are derived from
  real content (rating summary, review body excerpt).

### Structured data (JSON-LD)
- **Home**: `WebSite` + `SearchAction` (Sitelinks Search Box).
- **Company**: `Organization` + `AggregateRating` + `BreadcrumbList`.
- **Review**: `Review` (with `itemReviewed` → the company) + `BreadcrumbList`.
- Builders are pure functions in `utils/schema.ts`, unit-tested, rendered via a
  small `JsonLd` component that escapes `<` to prevent script break-out.
- **Honest caveat**: Google restricts *self-serving* review rich results — a
  site showing an `AggregateRating` for an entity it hosts reviews about may not
  get star snippets. I still emit valid schema (useful for understanding and for
  other consumers) but don't assume stars will render in Google.

### Bayesian rating
- The naive `AVG` view let a single 5★ review outrank an established company.
  Replaced with a Bayesian estimate `score = (C·m + Σ) / (C + n)` (m = global
  mean, C = 10 prior reviews). Implemented **in SQL** so the DB can
  `ORDER BY bayesian_rating` (fixing the home page, which previously labelled
  results "Top rated" while sorting by `created_at`), and mirrored as a pure,
  unit-tested TS util (`utils/rating.ts`) as the source of truth.
- The company page shows the Bayesian score as the headline TrustScore and the
  raw average as secondary context (honesty for users).
- Trade-off: C=10 is a judgement call. Higher C punishes low-volume companies
  more. It should be tuned against the real rating distribution once there's data.

### Pagination
- Company reviews are paginated at 10/page via a crawlable `?page=N` querystring
  with real `<a>` links and `rel="prev"/"next"`. Server-side `range()`; page 1 is
  the canonical clean URL; out-of-range pages 404 (no infinite crawl space).
- Trade-off: **offset pagination** is simple and fine at this scale but degrades
  on deep pages and can skip/duplicate rows under concurrent inserts. At
  hundreds-of-thousands of reviews I'd switch to **keyset (created_at, id)**
  pagination ("seek" pagination: instead of "skip N").

### Other SEO basics
- Dynamic `sitemap.ts` (home, listing, companies, reviews, and profiles of users
  who have ≥1 review — matching the noindex rule) and `robots.ts` disallowing
  private routes and pointing at the sitemap.

---

## 3. Security

Three guarantees, all enforced at the **database** level so they hold even if the
application layer is bypassed:

1. **One review per user per company** — `unique (company_id, user_id)` (present
   in the starter; kept). The app maps the `23505` to a friendly message.
2. **One review per IP per company** — new `unique (company_id, ip_hash)` partial
   index. The app reads `x-forwarded-for`/`x-real-ip` and stores an **HMAC-SHA256
   hash** of the IP with a server-side pepper (`IP_HASH_SECRET`) — never the raw
   IP.
3. **Email-verification gate** — a `SECURITY DEFINER` function
   `is_email_verified()` checks `auth.users.email_confirmed_at`, enforced in the
   reviews `INSERT` RLS policy, and also checked in the action for a good error.

I also fixed the `hasReviewed` UI check (it previously scanned only the latest 50
loaded reviews, so at scale the form could wrongly reappear) with a targeted
lookup.

### Threat model

**What this prevents**
- Duplicate reviews from one account (DB unique constraint — atomic, race-free).
- Trivially creating N accounts to spam one company from one machine (per-IP
  unique constraint).
- Review submission by unverified/throwaway emails (verification gate at RLS,
  not just UI).
- Raw IP exposure in a DB dump (peppered hash).

**What it does *not* prevent (honest limits)**
- **IP rotation**: an attacker with many IPs (VPNs, botnet, mobile IP churn) can
  still post multiple reviews. Per-IP uniqueness raises cost, not a wall.
- **Shared-network false positives**: a hard `unique(company_id, ip_hash)` blocks
  legitimate distinct users behind one NAT/office/CGNAT from each reviewing the
  same company. This is the literal reading of the requirement; I chose it for
  provable enforcement and documented the cost. A production system would more
  likely use a **time-windowed** limit (e.g. 1/IP/company/24h) plus signals.
- **Header spoofing**: `x-forwarded-for` is client-controllable unless a trusted
  proxy overwrites it. Behind Vercel/a real LB the left-most hop is trustworthy;
  standalone it is not. The app must be deployed behind such a proxy for the IP
  limit to mean anything.
- **Email verification ≠ human**: disposable-but-verifiable inboxes exist.
- Content quality / fake-but-unique reviews, and review-bombing coordinated
  across many real accounts, are out of scope.

**What I'd add at production scale**
- A proper rate limiter (Redis/Upstash sliding window) on IP *and* account, with
  a time window rather than a permanent unique lock.
- Bot defenses (CAPTCHA/attestation) on submit, velocity checks, and anomaly
  detection.
- Trusted-proxy IP extraction config; consider `/64` grouping for IPv6.
- Moderation queue, reviewer-verified-purchase signals, and abuse reporting.

---

## 4. Performance

### Fixed independently of Lighthouse
- **N+1 query elimination** (biggest win): the home page and companies list
  fetched a list of IDs and then issued **one query per card** (and
  `CompanyCard` itself queried the DB). Both now read a single flat
  `companies_with_ratings` view in one round trip, ordered by Bayesian rating.
  `CompanyCard` is now purely presentational.
- Font `display: swap` to avoid invisible-text / layout shift during font load.
- `StarRating` rewrite: the starter reused a single SVG gradient `id="partial"`
  across every partial star (invalid duplicate IDs, broken fill) and exposed raw
  floats to screen readers ("3.6666 out of 5"). Replaced with a clip-based
  fractional fill and a single clean `aria-label`.
- Accessibility: bumped low-contrast `text-gray-400` body text to meet WCAG AA,
  added `rel="nofollow"` to outbound company domains, breadcrumb `aria-current`,
  and `<time dateTime>` on dates.

### Lighthouse

Method: `npm run build && npm start` (production build for realistic metrics),
then Lighthouse (default mobile throttling) on the home page, companies list,
and a company page.

**Final scores** (Performance / Accessibility / Best-Practices / SEO):

| Page | Perf | A11y | BP | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Home | 98–100 | 100 | 100 | 100 | ~2.4 s | 0 |
| Companies list | 100 | 100 | 100 | 100 | 1.8 s | 0 |
| Company | 98–100 | 100 | 100 | 100 | 1.7–2.4 s | 0 |

LCP is comfortably under the 2.5 s target, CLS is 0, and TBT ~20 ms on every
page. The LCP element is the page/company H1 (text, no hero image), so the wins
came from the server-side N+1 removal and `display:swap`, not image work.

**Accessibility issues found and fixed** (started at 95):
- **Color contrast**: Tailwind v4's `green-600` (#00a63e) gives only 3.21:1 for
  white-on-green buttons and green links on white (AA needs 4.5:1), and the
  footer's `gray-400` was 2.6:1. Darkened the brand to `green-700` (buttons,
  links; hover `green-800`) and body grays to `gray-500` site-wide → all pass.
- **Heading order**: the companies list jumped `h1 → h3` (the card title) with no
  `h2`. Added a screen-reader-only `h2` so the outline is sequential.

After both fixes, accessibility is 100 on all three pages.

---

## 5. Verification (tests)

Runner: **Vitest** (fast, TS-native, zero-config ESM, good for both pure units
and a DB integration test).

- **Bayesian rating (unit, required)** — `tests/rating.test.ts`: prior fallback
  at zero reviews, shrinkage of a single extreme review, exact known values,
  convergence to the raw average at high volume, monotonicity (more reviews rank
  higher at equal average), `C=0` ⇒ plain average, and input validation.
- **Duplicate-prevention logic (unit, required)** — `tests/reviewErrors.test.ts`:
  the pure `mapReviewInsertError` correctly distinguishes the per-user vs per-IP
  `23505` and passes through unrelated errors.
- **Duplicate prevention (integration, bonus)** —
  `tests/reviews.integration.test.ts`: against a real Supabase project (via a
  service-role key) it inserts a review, asserts a duplicate `(company,user)`
  raises `23505`, and asserts a second review with the same `ip_hash` for the
  same company raises `23505`. **Skipped** unless `NEXT_PUBLIC_SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` are set, so `npm test` is green out of the box.
- Plus unit coverage for IP hashing and the JSON-LD builders.

`npm test` → 23 passing, 2 skipped (integration).

I also installed a vscode extension for vitest and tested everything that way.

## Fixes to the initial repo

Things that were actually wrong in the starter (bugs/defects), as opposed to the features added above:

- **N+1 queries** — home and companies list issued one query *per company* (and `CompanyCard` queried the DB itself); replaced with a single view read.
- **"Top rated" sorted by `created_at`**, not by any rating — mislabeled ordering.
- **`hasReviewed` scanned only the latest 50 reviews** — the review form wrongly reappeared for users past that window.
- **`StarRating` reused one SVG gradient `id="partial"`** across stars (invalid duplicate IDs, broken partial fill) and exposed raw floats to screen readers ("3.6666 out of 5").
- **Signup redirected home as if logged in** even when email confirmation was still pending.
- **Low-contrast colors** — Tailwind v4 `green-600`/`gray-400` fail WCAG AA on white.
- **Committed `supabase/.temp`** (leaks internal project ref/email); missing `.env.example`.
- **Placeholder** create-next-app README.

## Reason for additional edits of this file:

After the app was done, i went through this file which was generated by AI and corrected what
he had hallucinated and more importantly, to understand again everything he has
done and if i missed something. Now this file reflectes my decisions and understanding
of everything in this app (with the help of AI of course).
