import { cookies } from "next/headers";
import { PLATFORM_ADMIN_COOKIE_NAME } from "@/lib/platformAdminAuth";
import { PlatformAdminSidebar } from "@/components/platform-admin/PlatformAdminSidebar";

export const metadata = {
  title: "Platform Admin | AI Recruiter Root",
  description: "Isolated platform management and root administration portal.",
};

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PLATFORM_ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = Boolean(token);

  return (
    <div className="min-h-screen bg-[#070a11] text-zinc-100 flex font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {isAuthenticated && <PlatformAdminSidebar />}
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#070a11]">
        {children}
      </main>
    </div>
  );
}
