import 'server-only';

export const YOUTUBE_READONLY_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
export const YOUTUBE_CALLBACK_PATH = '/api/integrations/youtube/callback';

export type YouTubeOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

function validRedirectUri(value: string): string | null {
  try {
    const url = new URL(value);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.pathname !== YOUTUBE_CALLBACK_PATH || url.search || url.hash || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function getYouTubeOAuthConfig(): YouTubeOAuthConfig | null {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET?.trim();
  const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI?.trim();
  const validUri = redirectUri ? validRedirectUri(redirectUri) : null;
  if (!clientId || !clientSecret || !validUri) return null;
  return { clientId, clientSecret, redirectUri: validUri };
}

export function getAppOrigin(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) return null;
  try {
    const url = new URL(appUrl);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getYouTubeOAuthReady(): boolean {
  return Boolean(getYouTubeOAuthConfig() && getYouTubeEncryptionKey());
}

export function getYouTubeEncryptionKey(): Buffer | null {
  const encoded = process.env.TOKEN_ENCRYPTION_KEY?.trim();
  if (!encoded || !/^[A-Za-z0-9+/]{43}=$/.test(encoded)) return null;
  const key = Buffer.from(encoded, 'base64');
  return key.length === 32 && key.toString('base64') === encoded ? key : null;
}
