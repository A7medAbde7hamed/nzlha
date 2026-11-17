import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAppOrigin, getYouTubeOAuthConfig, getYouTubeOAuthReady, YOUTUBE_READONLY_SCOPE } from '@/lib/integrations/youtube';

export const runtime = 'nodejs';

function dashboardRedirect(code: string) {
  const origin = getAppOrigin();
  if (!origin) return NextResponse.json({ error: 'app_url_not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const destination = new URL('/dashboard', origin);
  destination.searchParams.set('section', 'accounts');
  destination.searchParams.set('connection', code);
  return NextResponse.redirect(destination, { headers: { 'Cache-Control': 'no-store, private' } });
}

export async function GET() {
  const config = getYouTubeOAuthConfig();
  if (!config || !getYouTubeOAuthReady()) return dashboardRedirect('setup_required');

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return dashboardRedirect('auth_required');

  const now = new Date();
  await supabase.from('youtube_oauth_transactions').delete().lt('expires_at', now.toISOString());
  const state = randomBytes(32).toString('base64url');
  const stateHash = createHash('sha256').update(state).digest('hex');
  const { error } = await supabase.from('youtube_oauth_transactions').insert({
    user_id: user.id,
    state_hash: stateHash,
    expires_at: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
  });
  if (error) return dashboardRedirect('failed');

  const authorization = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorization.searchParams.set('client_id', config.clientId);
  authorization.searchParams.set('redirect_uri', config.redirectUri);
  authorization.searchParams.set('response_type', 'code');
  authorization.searchParams.set('scope', YOUTUBE_READONLY_SCOPE);
  authorization.searchParams.set('state', state);
  authorization.searchParams.set('access_type', 'offline');
  authorization.searchParams.set('include_granted_scopes', 'true');
  authorization.searchParams.set('prompt', 'consent');
  return NextResponse.redirect(authorization, { headers: { 'Cache-Control': 'no-store, private' } });
}
