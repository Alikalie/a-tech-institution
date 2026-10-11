# A-TECH Course Application & Student Portal

React 19 + Vite 7 + TanStack Start, Tailwind CSS v4, with the Lovable Cloud backend.

## Run locally

Requirements: Node.js 20+ (or Bun 1.1+), Git.

```bash
git clone <your-repo-url> atech-portal
cd atech-portal
npm install        # or: bun install
npm run dev        # or: bun run dev
```

Open http://localhost:8080.

The `.env` file in the repo root already contains the public backend address and
publishable key (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`). Keep it when cloning. Admin features that run on the
server (issuing payment codes, Student IDs, role changes) also need
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in the
environment; these are provided automatically when hosted on Lovable.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint |

## Branding

- Logo files live in `public/` (`atech-mark.jpg`, `atech-logo-full.jpg`, `favicon.png`) so they work offline and when cloned.
- Brand colours: blue (primary), white, yellow (accent) — defined in `src/styles.css`.
