import { prisma } from "@repo/database";
import { AutopoolError, LEVEL_CONFIGS, type AutopoolLevel } from "./autopool.types";

export async function findBFSSlot(level: AutopoolLevel) {
  const { matrixWidth } = LEVEL_CONFIGS[level];

  const accounts = await prisma.autopoolAccount.findMany({
    where: {
      level,
      isActive: true,
      isUpgradeLocked: false, // ← KEY CHANGE: skip locked accounts entirely
    },
    select: {
      id: true,
      treePosition: true,
      _count: { select: { children: true } },
    },
    orderBy: { treePosition: "asc" },
  });

  const slot = accounts.find((acc) => acc._count.children < matrixWidth);

  if (!slot) {
    throw new AutopoolError(
      `No BFS slot found for level ${level}`,
      "BFS_SLOT_NOT_FOUND",
      404
    );
  }

  return slot;
}

export async function getNextTreePosition(level: AutopoolLevel): Promise<number> {
  const last = await prisma.autopoolAccount.findFirst({
    where: { level },
    orderBy: { treePosition: "desc" },
    select: { treePosition: true },
  });

  return (last?.treePosition ?? 0) + 1;
}
