import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.companyId },
      select: { status: true },
    });
    if (company?.status === "suspended") {
      redirect("/login?error=suspended");
    }
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

