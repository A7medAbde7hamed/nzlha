# nzlha — Creator Studio

Private, bilingual (Arabic / English) creator workspace for organizing videos and recording intended platforms. The interface supports YouTube, Instagram, TikTok and Facebook. It does not claim to connect accounts, schedule, publish, or report analytics.

## What works

- Supabase email/password sign-in, sign-up, and email magic links.
- Private per-user video library with row-level security.
- Optional private video upload to Supabase Storage (MP4, MOV, WebM; up to 50 MB).
- Per-video selection of intended platforms, responsive Arabic RTL and English UI, searchable library, and deletion.
- Explicit loading, empty, and error states.

## Not implemented

Official OAuth connections, platform API permissions, scheduled publishing, background jobs, retries, platform-specific validation, and analytics. Platform selection records intent only. A `draft` is a saved library item, not a scheduled post.

## Local development

- Node.js 22.x
- Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
- Apply the migrations in `supabase/migrations` in order.
- In Supabase Auth, set the Site URL to the app origin and allow `/auth/callback` for local and production origins.
- Run `npm install`, `npm run dev`, then open http://localhost:3000.

The dashboard requires an authenticated user and the database migration. There is no sample-data mode.

## Security

The browser uses only the Supabase publishable key. Never put a service-role/secret key in a `NEXT_PUBLIC_` variable or client code. `video_posts` has per-user RLS. Video files live in a private Storage bucket and the first path segment must match the authenticated user ID. Uploads are size- and MIME-limited by both the client and bucket configuration.

## Deployment

Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production, Preview, and Development in Vercel. Confirm Supabase Auth redirect URLs include the deployment origin. Check the Vercel project access protection before presenting the site as public. Publishing integrations should be added only after the official platform OAuth, permissions, background execution, retries, and platform-specific rules are built and verified.
