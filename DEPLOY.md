# BiteSafe Deployment Checklist

## Pre-Deploy

- [ ] Run migrations: `supabase db push` (or apply SQL files in Supabase Dashboard)
- [ ] Ensure `meal-images` and `avatars` storage buckets exist
- [ ] Set environment variables for production build
- [ ] **Do NOT set** `VITE_DEV_BYPASS_AUTH` in production (omit it or leave unset)

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

## Post-Deploy

- [ ] Test meal scan flow
- [ ] Verify storage uploads work
- [ ] Test deep links (e.g. `/history`, `/profile`) – refresh should not 404
- [ ] Check error tracking (if using Sentry)
