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

Configure the public backend address and publishable key using
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID`.
Server-side features also require `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.
The managed Lovable Cloud privileged key is supplied on Lovable hosting and is
not exportable. Do not put private keys in browser-visible variables.

## Vercel deployment

The Vite configuration selects Nitro's `vercel` preset when Vercel provides
`VERCEL=1`. Use `npm run build` as the build command; let Nitro generate the
Vercel output rather than treating this as a static SPA. Configure both public
and server environment variables in Vercel before building; public variables
are embedded at build time.

Public reads and authenticated RLS-backed data access can use the existing
publishable connection. Privileged administration functions currently use the
managed server client: a complete external deployment needs a backend you
control with its own server-only credential and migrated schema, policies,
storage and accounts, or a separately secured hosted service boundary. The
Lovable Cloud privileged credential cannot be retrieved for Vercel. Never expose
that credential or bypass role checks as a workaround.

For a separately managed backend, add the deployed site's public authentication
callback URL to its allowed redirects. Lovable-broker social sign-in and AI
Gateway credentials also require external-host configuration; they are not
automatically provisioned by Vercel. No Vercel deployment or production
authentication round-trip has been verified from this workspace.

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
