/**
 * Resolves the root application URL dynamically.
 * Priority:
 * 1. Explicit NEXT_PUBLIC_APP_URL (production custom domain)
 * 2. Vercel production deployment URL (VERCEL_PROJECT_PRODUCTION_URL)
 * 3. Vercel deployment preview URL (VERCEL_URL)
 * 4. Fallback to localhost for development
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
