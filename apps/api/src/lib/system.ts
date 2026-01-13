import { prisma } from "@repo/database";

let cachedAdmin: {
  userId: string;
  accountId: string;
} | null = null;

export async function getAdminSystemIds() {
  if (cachedAdmin) return cachedAdmin;

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: {
      id: true,
      positions: {
        where: { positionType: "ORIGINAL" },
        select: { id: true },
      },
    },
  });

  if (!admin || admin.positions.length === 0) {
    throw new Error("Admin account not found or not seeded correctly");
  }

  cachedAdmin = {
    userId: admin.id,
    accountId: admin.positions[0].id,
  };

  return cachedAdmin;
}
