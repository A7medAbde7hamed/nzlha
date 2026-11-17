import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const protectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
  if (!claims && protectedRoute) {
    const destination = request.nextUrl.clone();
    destination.pathname = '/login';
    destination.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(destination);
  }
  if (claims && request.nextUrl.pathname === '/login') {
    const destination = request.nextUrl.clone();
    destination.pathname = '/dashboard';
    destination.search = '';
    return NextResponse.redirect(destination);
  }
  return response;
}
