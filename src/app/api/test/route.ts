// src/app/api/test/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
    const companies = await prisma.company.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            createdAt: true,
        },
    });
    return Response.json(companies);
}