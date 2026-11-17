import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getYouTubeOAuthReady } from '@/lib/integrations/youtube';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });

  const { data, error } = await supabase
    .from('connected_accounts')
    .select('id, platform, provider_account_id, display_name, avatar_url, scopes, connected_at')
    .eq('platform', 'youtube')
    .order('connected_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'status_unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });

  return NextResponse.json({
    configured: getYouTubeOAuthReady(),
    accounts: data ?? [],
  }, { headers: { 'Cache-Control': 'no-store, private' } });
}
