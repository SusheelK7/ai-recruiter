import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'authToken';
const JWT_SECRET = process.env.JWT_SECRET || 'ai-recruiter-jwt-secret-key-2026';

const publicExactPaths = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
]);

const publicPrefixes = ['/jobs'];
const protectedPrefixes = ['/dashboard'];
const authEntryPaths = new Set(['/', '/login', '/register']);

function base64UrlToUint8Array(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function base64UrlToJson(input: string): unknown {
  const bytes = base64UrlToUint8Array(input);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text);
}

async function verifyAuthToken(token: string) {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const header = base64UrlToJson(headerPart) as { alg?: string };
    const payload = base64UrlToJson(payloadPart) as { type?: string; exp?: number };

    if (header?.alg !== 'HS256' || payload?.type !== 'auth') {
      return null;
    }

    if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
      return null;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlToUint8Array(signaturePart) as BufferSource,
      new TextEncoder().encode(`${headerPart}.${payloadPart}`)
    );

    return isValid ? payload : null;
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string) {
  if (publicExactPaths.has(pathname)) {
    return true;
  }

  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = authToken ? await verifyAuthToken(authToken) : null;
  const isAuthenticated = Boolean(payload);

  if (authEntryPaths.has(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedPath(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};