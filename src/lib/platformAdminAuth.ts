import { cookies } from 'next/headers';
import { verifyPlatformAdminToken, type PlatformAdminTokenPayload } from '@/lib/jwt';

export const PLATFORM_ADMIN_COOKIE_NAME = 'platformAdminToken';

export async function getPlatformAdminSession(): Promise<PlatformAdminTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PLATFORM_ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyPlatformAdminToken(token);
  } catch {
    return null;
  }
}

export function getPlatformAdminSessionFromRequest(request: Request): PlatformAdminTokenPayload | null {
  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    const token = (request as any).cookies.get(PLATFORM_ADMIN_COOKIE_NAME)?.value;
    if (token) return verifyPlatformAdminToken(token);
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${PLATFORM_ADMIN_COOKIE_NAME}=([^;]*)`));
  const token = match?.[1] ? decodeURIComponent(match[1]) : null;
  if (!token) return null;

  return verifyPlatformAdminToken(token);
}

export async function requirePlatformAdminSession(request?: Request): Promise<PlatformAdminTokenPayload> {
  if (request) {
    const session = getPlatformAdminSessionFromRequest(request);
    if (session && session.type === 'platform_admin') {
      return session;
    }
  }

  const session = await getPlatformAdminSession();
  if (!session || session.type !== 'platform_admin') {
    throw new Error('Unauthorized Platform Admin');
  }
  return session;
}

