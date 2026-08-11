import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/jwt';
import { LogoutButton } from '@/components/dashboard/LogoutButton';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;

  if (!authToken) {
    redirect('/login');
  }

  const payload = verifyAuthToken(authToken);

  if (!payload) {
    redirect('/login');
  }

  const company = await prisma.company.findUnique({
    where: { id: payload.companyId },
    select: {
      name: true,
      email: true,
    },
  });

  if (!company) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-[#F7F8FB] text-[#101828] dark:bg-[#0F1420] dark:text-zinc-100 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-[#1A2233] sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2E5B8A] dark:text-[#7CA8D8]">
            Dashboard
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome, {company.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Signed in as {company.email}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Account</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Company profile is loaded from the auth token and database lookup.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-950/40 flex flex-col justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Session</h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Your session is maintained by the authToken httpOnly cookie.
              </p>
            </div>
            <LogoutButton />
          </section>
        </div>
      </div>
    </main>
  );
}