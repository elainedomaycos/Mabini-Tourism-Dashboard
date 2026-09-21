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

## Deployment

The server is built with Nitro targeting the **Vercel** preset. On Vercel,
configure:

- **Framework Preset:** Other
- **Build Command:** `bun run build`
- **Install Command:** `bun install`
- **Output Directory:** `.vercel/output`

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
