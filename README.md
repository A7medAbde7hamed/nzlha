# nzlha — Creator Studio

Private, bilingual (Arabic / English) creator workspace for organizing videos and recording intended platforms. The interface supports YouTube, Instagram, TikTok and Facebook. It does not claim to connect accounts, schedule, publish, or report analytics.

## What works

- Supabase email/password sign-in, sign-up, and email magic links.
- Private per-user video library with row-level security.
- Optional private video upload to Supabase Storage (MP4, MOV, WebM; up to 50 MB).
- Per-video selection of intended platforms, responsive Arabic RTL and English UI, searchable library, and deletion.
- A Google OAuth authorization flow for reading the connected YouTube channel, once the owner configures a Google Cloud web client and server secrets.
- Explicit loading, empty, and error states.

## Not implemented

Instagram, TikTok, and Facebook OAuth; YouTube uploads; scheduled publishing; background jobs; retries; platform-specific publishing validation; and analytics. Connecting YouTube only confirms and reads the channel with the `youtube.readonly` scope. Platform selection records intent only. A `draft` is a saved library item, not a scheduled post.

## Local development

- Node.js 22.x
- Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
- For local YouTube connection testing, configure the Google OAuth variables below and generate a private token encryption key.
- Apply the migrations in `supabase/migrations` in order.
- In Supabase Auth, set the Site URL to the app origin and allow `/auth/callback` for local and production origins.
- Run `npm install`, `npm run dev`, then open http://localhost:3000.

The dashboard requires an authenticated user and the database migrations. There is no sample-data mode.

## YouTube account connection

The first integration uses Google's official OAuth web-server authorization code flow. It requests only `https://www.googleapis.com/auth/youtube.readonly` and never receives a Google password. The flow validates a one-time state value, binds the callback to the signed-in nzlha user, reads the authorized channel through YouTube Data API v3, and stores the refresh token encrypted with AES-256-GCM. The browser never receives the token plaintext. Disconnecting asks Google to revoke the grant and removes the local encrypted token and account record.

1. In Google Cloud, create or choose a project and enable **YouTube Data API v3**.
2. Configure Google's OAuth consent screen. While the app is in Testing, add the Google accounts that will test the connection. A public product may need Google's verification for the requested YouTube scope.
3. Create a **Web application** OAuth client. Add the exact callback URL below to its authorized redirect URIs:
   - Local: `http://localhost:3000/api/integrations/youtube/callback`
   - Production: `https://nzlha.vercel.app/api/integrations/youtube/callback`
4. Add these variables to `.env.local` for local development and to Vercel as **server-only** variables for Production:
   - `YOUTUBE_OAUTH_CLIENT_ID`
   - `YOUTUBE_OAUTH_CLIENT_SECRET`
   - `YOUTUBE_OAUTH_REDIRECT_URI` (must exactly match a Google authorized redirect URI)
   - `TOKEN_ENCRYPTION_KEY` (32 random bytes, base64 encoded; generate with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`)
5. Set `NEXT_PUBLIC_APP_URL=https://nzlha.vercel.app` in the production environment. Never prefix OAuth secrets or the encryption key with `NEXT_PUBLIC_`, and never commit their values.

Google's OAuth settings and YouTube Data API access must be approved and configured by the project owner. The app reports setup as incomplete until all required values are present. YouTube connection does not enable upload, scheduling, or publishing; those require additional scopes, platform review, and a separately implemented publishing system.

## Security

The browser uses only the Supabase publishable key. Never put a service-role/secret key in a `NEXT_PUBLIC_` variable or client code. `video_posts`, connected-account metadata, OAuth state, and encrypted provider tokens have per-user RLS. The provider token table stores ciphertext only; the AES key is a server-only Vercel environment variable. Video files live in a private Storage bucket and the first path segment must match the authenticated user ID. Uploads are size- and MIME-limited by both the client and bucket configuration.

## Deployment

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_URL` for Production, Preview, and Development in Vercel. Configure the YouTube OAuth values for Production only unless separate Google OAuth clients and exact Preview/Development redirect URIs are intentionally maintained. Confirm Supabase Auth redirect URLs include the deployment origin. Check the Vercel project access protection before presenting the site as public. Publishing integrations should be added only after the official platform OAuth, permissions, background execution, retries, and platform-specific rules are built and verified.
