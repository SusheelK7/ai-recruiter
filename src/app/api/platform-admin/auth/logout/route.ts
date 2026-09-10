import { NextResponse } from 'next/server';
import { PLATFORM_ADMIN_COOKIE_NAME } from '@/lib/platformAdminAuth';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Platform admin logged out successfully.' },
    { status: 200 }
  );

  response.cookies.delete(PLATFORM_ADMIN_COOKIE_NAME);
  return response;
}
