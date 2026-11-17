import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encryptRefreshToken } from '@/lib/integrations/token-vault';
import { getAppOrigin, getYouTubeOAuthConfig, YOUTUBE_READONLY_SCOPE } from '@/lib/integrations/youtube';

export const runtime = 'nodejs';

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

type ChannelResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
  }>;
};

function resultRedirect(code: string) {
  const config = getYouTubeOAuthConfig();
  const origin = config ? new URL(config.redirectUri).origin : getAppOrigin();
  if (!origin) return NextResponse.json({ error: 'app_url_not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const destination = new URL('/dashboard', origin);
  destination.searchParams.set('section', 'accounts');
  destination.searchParams.set('connection', code);
  return NextResponse.redirect(destination, { headers: { 'Cache-Control': 'no-store, private' } });
}

function thumbnailUrl(thumbnails?: Record<string, { url?: string }>): string | null {
  if (!thumbnails || typeof thumbnails !== 'object') return null;
  const candidate = ['high', 'medium', 'default'].map((key) => thumbnails[key]?.url).find((value) => typeof value === 'string');
  if (!candidate) return null;
  try {
    return new URL(candidate).protocol === 'https:' ? candidate : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const config = getYouTubeOAuthConfig();
  if (!config) return resultRedirect('setup_required');
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  if (!state || state.length > 128 || !/^[A-Za-z0-9_-]+$/.test(state)) return resultRedirect('failed');

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return resultRedirect('auth_required');

  const stateHash = createHash('sha256').update(state).digest('hex');
  const { data: transaction, error: stateError } = await supabase
    .from('youtube_oauth_transactions')
    .select('id')
    .eq('state_hash', stateHash)
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (stateError || !transaction) return resultRedirect('failed');

  const { data: consumed, error: consumeError } = await supabase
    .from('youtube_oauth_transactions')
    .delete()
    .eq('id', transaction.id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();
  if (consumeError || !consumed) return resultRedirect('failed');

  if (searchParams.has('error')) return resultRedirect('denied');
  const code = searchParams.get('code');
  if (!code || code.length > 4096) return resultRedirect('failed');

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    });
    if (!tokenResponse.ok) return resultRedirect('failed');
    const token = await tokenResponse.json() as TokenResponse;
    if (!token.access_token || (token.scope && !token.scope.split(' ').includes(YOUTUBE_READONLY_SCOPE))) return resultRedirect('failed');

    const channelUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
    channelUrl.searchParams.set('part', 'snippet');
    channelUrl.searchParams.set('mine', 'true');
    channelUrl.searchParams.set('maxResults', '50');
    const channelResponse = await fetch(channelUrl, {
      headers: { Authorization: `Bearer ${token.access_token}` },
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    });
    if (!channelResponse.ok) return resultRedirect('failed');
    const channelData = await channelResponse.json() as ChannelResponse;
    const channels = channelData.items ?? [];
    if (!channels.length) return resultRedirect('no_channel');
    if (channels.length !== 1) return resultRedirect('multiple_channels');
    const channel = channels[0];
    const accountId = channel.id?.trim();
    const displayName = channel.snippet?.title?.trim();
    if (!accountId || !displayName || accountId.length > 256 || displayName.length > 200) return resultRedirect('failed');

    const { data: existing, error: existingError } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'youtube')
      .eq('provider_account_id', accountId)
      .maybeSingle();
    if (existingError) return resultRedirect('failed');

    let connectedAccountId = existing?.id as string | undefined;
    const accountValues = {
      user_id: user.id,
      platform: 'youtube',
      provider_account_id: accountId,
      display_name: displayName,
      avatar_url: thumbnailUrl(channel.snippet?.thumbnails),
      scopes: [YOUTUBE_READONLY_SCOPE],
      connected_at: new Date().toISOString(),
    };
    if (connectedAccountId) {
      const { error } = await supabase.from('connected_accounts').update(accountValues).eq('id', connectedAccountId).eq('user_id', user.id);
      if (error) return resultRedirect('failed');
    } else {
      const { data: inserted, error } = await supabase.from('connected_accounts').insert(accountValues).select('id').single();
      if (error || !inserted) return resultRedirect('failed');
      connectedAccountId = inserted.id as string;
    }

    const { data: previousToken, error: previousTokenError } = await supabase
      .from('platform_oauth_tokens')
      .select('refresh_token_ciphertext')
      .eq('account_id', connectedAccountId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (previousTokenError) return resultRedirect('failed');
    const refreshToken = token.refresh_token;
    if (!refreshToken && !previousToken?.refresh_token_ciphertext) return resultRedirect('failed');

    const tokenValues = {
      account_id: connectedAccountId,
      user_id: user.id,
      refresh_token_ciphertext: refreshToken ? encryptRefreshToken(refreshToken) : previousToken!.refresh_token_ciphertext,
      updated_at: new Date().toISOString(),
    };
    const { error: tokenError } = await supabase.from('platform_oauth_tokens').upsert(tokenValues, { onConflict: 'account_id' });
    if (tokenError) return resultRedirect('failed');
    return resultRedirect('connected');
  } catch {
    return resultRedirect('failed');
  }
}
