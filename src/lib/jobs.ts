import { prisma } from '@/lib/prisma';

export function generatePublicUrl(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return slug ? `${slug}-${suffix}` : `job-${suffix}`;
}

export async function expireStaleJobs(companyId: string): Promise<void> {
  await prisma.job.updateMany({
    where: {
      companyId,
      status: 'active',
      expiryDate: { lt: new Date() },
    },
    data: { status: 'expired' },
  });
}

export async function autoCloseExpiredJobsAllCompanies(): Promise<number> {
  const result = await prisma.job.updateMany({
    where: {
      status: 'active',
      expiryDate: { lt: new Date() },
    },
    data: { status: 'expired' },
  });
  return result.count;
}

export function daysUntilExpiry(expiryDate: Date | null | undefined): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function resolveExpiryDate(
  expiryDays?: number,
  customExpiryDate?: string
): Date | null {
  if (customExpiryDate) {
    const parsed = new Date(customExpiryDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (expiryDays && expiryDays > 0) {
    const date = new Date();
    date.setDate(date.getDate() + expiryDays);
    return date;
  }

  return null;
}
