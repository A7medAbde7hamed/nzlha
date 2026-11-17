import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decryptRefreshToken } from '@/lib/integrations/token-vault';
import { getAppOrigin, getYouTubeOAuthConfig } from '@/lib/integrations/youtube';

export const runtime = 'nodejs';

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  const allowed = [getAppOrigin(), getYouTubeOAuthConfig() ? new URL(getYouTubeOAuthConfig()!.redirectUri).origin : null].filter(Boolean);
  return allowed.includes(origin);
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request.headers.get('origin'))) {
    return NextResponse.json({ error: 'invalid_origin' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const body = await request.json().catch(() => null) as { accountId?: unknown } | null;
  const accountId = body?.accountId;
  if (typeof accountId !== 'string' || !/^[0-9a-f-]{36}$/i.test(accountId)) {
    return NextResponse.json({ error: 'invalid_account' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  const { data: account, error: accountError } = await supabase
    .from('connected_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .eq('platform', 'youtube')
    .maybeSingle();
  if (accountError) return NextResponse.json({ error: 'disconnect_failed' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  if (!account) return NextResponse.json({ error: 'account_not_found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });

  const { data: storedToken, error: tokenError } = await supabase
    .from('platform_oauth_tokens')
    .select('refresh_token_ciphertext')
    .eq('account_id', accountId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (tokenError) return NextResponse.json({ error: 'disconnect_failed' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });

  let revoked = true;
  if (storedToken?.refresh_token_ciphertext) {
    try {
      const refreshToken = decryptRefreshToken(storedToken.refresh_token_ciphertext);
      const response = await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: refreshToken }),
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      });
      revoked = response.ok;
    } catch {
      revoked = false;
    }
  }

  const { error: deleteError } = await supabase.from('connected_accounts').delete().eq('id', accountId).eq('user_id', user.id);
  if (deleteError) return NextResponse.json({ error: 'disconnect_failed' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ disconnected: true, providerRevoked: revoked }, { headers: { 'Cache-Control': 'no-store, private' } });
}
