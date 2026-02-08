# BiteSafe Deployment Checklist

## Step-by-Step Deployment

1. **Push to GitHub** (from your terminal): `git push origin main`
2. **Connect repo to Vercel**: vercel.com → Add New Project → Import `bitesafe-ai`
3. **Add env vars in Vercel**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (do NOT add `VITE_DEV_BYPASS_AUTH`)
4. **Deploy** – Vercel will build and deploy
5. **Run Supabase migrations** (see below)
6. **Configure Edge Function** – set `CORS_ALLOWED_ORIGINS` to your Vercel URL, plus `SUPABASE_SERVICE_ROLE_KEY` and `LOVABLE_API_KEY`

---

## Pre-Deploy

- [ ] Run migrations (see Migrations section below)
- [ ] Ensure `meal-images` and `avatars` storage buckets exist
- [ ] Set environment variables for production build
- [ ] **Do NOT set** `VITE_DEV_BYPASS_AUTH` in production (omit it or leave unset)

## Migrations

**Option A** – If project is linked: `supabase db push`

**Option B** – Manual (Supabase Dashboard → SQL Editor): Run in order:
1. `supabase/migrations/20260203000001_storage_and_rate_limit.sql`
2. `supabase/migrations/20260203100000_avatars_bucket.sql`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `VITE_SENTRY_DSN` | No | Sentry error tracking |
| `VITE_DEV_BYPASS_AUTH` | No | **Never set in production** – dev only |

## Supabase Edge Function (analyze-food)

- [ ] Set `CORS_ALLOWED_ORIGINS` to your production domain (e.g. `https://your-app.vercel.app`)
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` for rate limiting
- [ ] Set `LOVABLE_API_KEY` for AI analysis

## Vercel Deployment

The project includes `vercel.json` with SPA rewrites so client-side routing works correctly (no 404 on refresh or direct links).

1. Connect your repo to Vercel
2. Add environment variables in Vercel project settings
3. Build command: `npm run build` (default)
4. Output directory: `dist` (default for Vite)

## Build & Deploy

```bash
npm run build
```

Deploy the `dist/` folder to Vercel, Netlify, or your hosting provider.

## Troubleshooting

- **npm "devdir" warning** – If you see `Unknown env config "devdir"`, run `npm config delete devdir` or remove it from `~/.npmrc`. This is a local npm config and does not affect deployment.
- **npm audit vulnerabilities** – Run `npm audit` to review. Fix with `npm audit fix`; some may require `npm audit fix --force` (breaking changes). The Vite/esbuild advisory is dev-server only and does not affect the production build.

## Post-Deploy

- [ ] Test meal scan flow
- [ ] Verify storage uploads work
- [ ] Test deep links (e.g. `/history`, `/profile`) – refresh should not 404
- [ ] Check error tracking (if using Sentry)
