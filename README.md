# Mabini, Batangas — Dive Tourism Management Dashboard

Administrative dashboard for the Mabini, Batangas Tourism Office: manage
tourists, operators, dive sites, manifestos, receipts and analytics in one
place.

Built with TanStack Start, React, TypeScript, Tailwind CSS v4, shadcn/ui-style
Radix components, Recharts, Leaflet and Framer Motion.

## Development

Requires [Bun](https://bun.sh) (or Node.js with npm).

```sh
bun install
bun run dev          # dev server on http://localhost:8080
bunx tsc --noEmit    # typecheck
bun run build        # production build — Vercel bundle in .vercel/output
bun run build:local  # production build with a runnable Node server (.output/server)
bun run preview      # serve the local production build on http://localhost:3000
```

## Scripts

| Script        | Description                                         |
| ------------- | --------------------------------------------------- |
| `dev`         | Start the Vite dev server                           |
| `build`       | Production build — Vercel (Build Output API) bundle |
| `build:local` | Production build as a runnable Node server          |
| `build:dev`   | Production build in development mode                |
| `preview`     | Serve the `build:local` output on localhost:3000    |
| `lint`        | ESLint                                              |
| `format`      | Prettier formatting                                 |

> `bun run preview` serves the local production build on `localhost:3000`. If no
> local server build exists yet it runs `bun run build:local` automatically.
> Plain `vite preview` doesn't work here because the production server is
> packaged by Nitro into a deploy bundle, not `dist/server/`.

## Supabase (live data)

Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` /
`VITE_SUPABASE_ANON_KEY` from the Sinsay Supabase project, then restart
`bun run dev`. Without both vars the dashboard runs on built-in demo data —
the header badge shows **Demo data**, otherwise **Live**.

Access tiers: two roles from `to_staff.role` (migration 034) — TO Staff
(queues, registries, announcements) vs Super Admin (adds users, roles,
settings, pricing). The login works pre-034 too (legacy rows read as
superadmin, matching 034's backfill). Client gating is UX only; enforcement
is RLS (`is_to_staff()` / `is_to_superadmin()`). Staff invites are a
documented manual flow (Auth dashboard + SQL insert, new rows default to
staff); the Settings roster itself is live (deactivate/reactivate,
promote/demote, with self-action and last-superadmin guards).

Session lifecycle: every live write re-verifies the staff session first
(refreshing once if needed) — an expired JWT otherwise degrades to the anon
context server-side and fails every staff policy with a confusing
row-security error. Dead sessions sign out back to login with an explicit
message; the auth listener keeps sign-in/out in sync without reloads. Error
toasts surface Supabase's verbatim reason (`dbErrorMessage`) instead of a
generic fallback.

Live scope: staff gate (`to_staff`, migration 030 in the Sinsay repo),
`operator_applications` + `tourists`, `payment_transactions` +
`dive_pass_inventory`, the tourist registry (`tourists`, incl. suspend /
renew writes — requires the 031 `status` column + staff UPDATE policy),
dive manifestos (`dive_manifests` + `manifest_divers` counts and rosters,
incl. verify writes — requires the 032 `verified` column + staff UPDATE
policy), the dive-site registry (`dive_sites` with real pins, storage photos
and manifest-rolled diver counts — full CRUD: add/edit for all staff,
status cycle for all staff, hard delete superadmin-only and blocked while
manifestos reference the site — requires 033 plus its DELETE amendment),
the establishment registry (`establishments` with manifest/credit rollups,
incl. suspend/reactivate writes via the `accredited` overlay and
approval-graduation inserts — requires 035 staff RLS),
and signed receipt URLs from the private `operator_uploads` bucket (1h TTL).
Still mock: dive-pass registries,
announcements, settings, analytics. Tourist registration and manifesto
generation stay mock-only (operator-side creation, no staff INSERT grant).

KPIs, headers, and reports compute from the live hooks above (real
month-over-month deltas from `created_at`/date fields, real month buckets
via `bucketByMonth`, diver totals from `manifest_divers` counts). Cards with
no live source are marked inline: Active Sites (no dive-sites table), peak
hour / depth (no hour/depth columns), credits-used % and expiring passes
(no ledger/expiry source — pending the `annual_pass_holders` probe),
establishment analytics (registry still mock).

The audit trail persists to `audit_logs` (migration 038): every action
writes memory-first (instant UI) plus a fire-and-forget insert carrying
staff id + email, so a failed insert never breaks the action. The Settings
tab merges session rows with persisted rows (deduplicated, newest-first)
with syncing/error states; sign-in and sign-out are logged. The
notification bell stays local-only (derived live from queue counts) —
`notifications` remains tourist-owned with staff read access. Bulk approve/reject
reports per-row results (failed rows stay selected for retry); a receipt
whose signed URL fails shows an explicit error, never the demo mock.

Both live queues refresh over Supabase Realtime (`postgres_changes` on
`operator_applications` / `payment_transactions`, mounted once per staff
session) with polling-by-invalidate as fallback — both tables must be in the
`supabase_realtime` publication for push updates to arrive.

## Deployment

The server is built with Nitro targeting the **Vercel** preset. On Vercel,
configure:

- **Framework Preset:** Other
- **Build Command:** `bun run build`
- **Install Command:** `bun install`
- **Output Directory:** `.vercel/output`
- **Environment Variables:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  (set before building — Vite bakes `VITE_*` at build time, so redeploy
  after any rotation), plus server-only `SUPABASE_SERVICE_ROLE_KEY`
  (powers superadmin staff creation via `src/lib/create-staff-fn.ts`;
  never `VITE_`-prefixed, never committed — anyone holding it bypasses RLS)

The build emits the Vercel Build Output API bundle under `.vercel/output`.

## Project structure

```
src/
  components/     Reusable UI (shadcn-style + feature components)
  lib/            Utilities and SSR error handling
  routes/         TanStack Router file-based routes
  server.ts       SSR entry wrapper (error handling)
  styles.css      Tailwind v4 theme
vite.config.ts    Vite + TanStack Start + Nitro config
```
