# ReviewHub

A simplified Trustpilot-style review platform: discover companies, read reviews,
and leave your own. Built on Next.js 16 · React 19 · TypeScript · Tailwind CSS 4
· Supabase (`@supabase/ssr`).

See [DECISIONS.md](./DECISIONS.md) for the rationale behind the changes,
trade-offs, the security threat model, and how AI tooling was used and verified.

## Getting started

### 1. Environment

Copy the example and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Publishable (anon) key; safe in the browser, RLS enforces access. |
| `NEXT_PUBLIC_SITE_URL` | prod | Canonical origin for canonicals/sitemap/OG. Defaults to `http://localhost:3000`. |
| `IP_HASH_SECRET` | prod | Server pepper for hashing reviewer IPs. `openssl rand -hex 32`. |
| `SUPABASE_SERVICE_ROLE_KEY` | tests only | Enables the integration test; **never** ship to the client. |

### 2. Database

Apply the migrations in `supabase/migrations/` to your project (via the Supabase
SQL editor, or `supabase db push` if using the CLI), then optionally load
`supabase/seed.sql` for sample companies. Enable **email confirmations** in
Supabase Auth so the verification gate is exercised.

### 3. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### 4. Test

```bash
npm test
```

Vitest auto-loads `.env.local`, so unit tests run out of the box and the
duplicate-review integration test runs automatically when
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present there
(otherwise it's skipped). No need to export env vars by hand.

## Project layout

- `app/` — routes (App Router). Server actions in `app/actions/`.
- `components/` — presentational + form components.
- `utils/` — Supabase clients, rating math, IP hashing, SEO/schema helpers.
- `supabase/migrations/` — schema, RLS, Bayesian view, security constraints.
- `tests/` — Vitest suite.
