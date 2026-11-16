# nzlha — Creator Studio (Phase 1)

Dark, bilingual (English / Arabic) creator workspace scaffold for scheduling content across YouTube, Instagram, TikTok and Facebook.

## Included in Phase 1

- Responsive dashboard shell, sidebar navigation, workspace overview and KPI cards.
- English / Arabic UI toggle with RTL layout.
- Content library, calendar, connected-account placeholder and settings views.
- Create-post modal with local draft state (no real video upload or publishing yet).
- Supabase browser/server clients using `@supabase/ssr` and a Next.js request proxy for cookie refresh.
- Email/password and magic-link login screen plus auth callback.
- Initial `profiles` migration with row-level security policies.

## Requirements

- Node.js 22 or newer
- A Supabase project dedicated to `nzlha` (do not reuse an unrelated project)

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Open http://localhost:3000.

If Supabase environment variables are not present, the dashboard remains available as a UI preview. Authentication is not active until a Supabase project is configured.

## Supabase setup

1. Create or select a dedicated Supabase project for nzlha.
2. Copy its Project URL and **publishable key** into `.env.local`.
3. Apply `supabase/migrations/202611160001_profiles.sql`.
4. Configure the Auth site URL and redirect URL: `http://localhost:3000/auth/callback` for local development and the production callback URL after deployment.
5. Enable the desired email sign-in methods.

Never place a Supabase secret/service-role key in a `NEXT_PUBLIC_` variable or browser code.

## Current boundaries

The dashboard currently uses sample data. Video upload, persistent posts, platform OAuth, per-platform scheduling, background jobs and real analytics are deliberately not represented as working integrations yet. Those belong to later phases and require the appropriate official platform API approvals.
