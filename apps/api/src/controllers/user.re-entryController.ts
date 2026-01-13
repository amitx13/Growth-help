import { Request, Response } from 'express';
import { prisma } from '@repo/database';
import { ApiSuccessResponse, ApiErrorResponse } from '@repo/types';
import { nanoidAlphaNum } from './user.createController';

export const createReentryPosition = async (req: Request, res: Response) => {
  try {
    const { pendingLinkId } = req.body;

    // Validate input
    if (!pendingLinkId) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Pending link ID is required',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    // Get the pending link
    const pendingLink = await prisma.pendingLink.findUnique({
      where: { id: pendingLinkId },
      include: {
        position: {
          include: {
            user: true,
            placedUnderPosition: true,
          },
        },
      },
    });

    if (!pendingLink) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Pending link not found',
        statusCode: 404,
      };
      return res.status(404).json(errorResponse);
    }

    // Validate link type
    if (pendingLink.linkType !== 'REENTRY') {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid link type. Expected REENTRY',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    // Check if already completed
    if (pendingLink.isCompleted) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'This reentry link has already been completed',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    const reentryCount = pendingLink.reentryCount || 0;

    if (reentryCount === 0) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'No reentry positions to create',
        statusCode: 400,
      };
      return res.status(400).json(errorResponse);
    }

    // Get the original position that earned the reentry
    const originalPositionId = pendingLink.positionId;
    const userId = pendingLink.position.userId;

    // Create reentry positions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdPositions = [];

      // Create each reentry position
      for (let i = 0; i < reentryCount; i++) {
        // Find placement using BFS algorithm
        const placementPositionId = await findReentryPlacement(
          originalPositionId,
          tx
        );

        const count = await tx.position.count({
          where: { userId }
        })
        const index = count + 1
        const checksum = nanoidAlphaNum()

        const positionId = `${userId}${String(index).padStart(2, '0')}${checksum}`

        // Create the reentry position
        const reentryPosition = await tx.position.create({
          data: {
            id: positionId,
            userId: userId,
            positionType: 'REENTRY',
            placedUnderPositionId: placementPositionId,
            currentLevel: 0,
            isActive: false, // Needs activation payment
            directReferralCount: 0,
          },
        });

        // Increment directReferralCount of the placement position
        await tx.position.update({
          where: { id: placementPositionId },
          data: {
            directReferralCount: {
              increment: 1,
            },
          },
        });

        createdPositions.push(reentryPosition);
      }

      // Mark the pending link as completed
      await tx.pendingLink.update({
        where: { id: pendingLinkId },
        data: { isCompleted: true },
      });

      return createdPositions;
    });

    const successResponse: ApiSuccessResponse = {
      success: true,
      data: {},
      message: `Successfully created ${result.length} reentry positions`,
    };

    return res.status(201).json(successResponse);
  } catch (error) {
    console.error('Error creating reentry positions:', error);

    const errorResponse: ApiErrorResponse = {
      success: false,
      message: 'Failed to create reentry positions',
      error: error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
    };

    return res.status(500).json(errorResponse);
  }
};

/**
 * Helper function to find the correct placement position for reentry
 * using BFS algorithm as per your project logic
 */
async function findReentryPlacement(
  sponsorPositionId: string,
  tx: any
): Promise<string> {
  // Step 1: Get sponsor's position
  const sponsorPosition = await tx.position.findUnique({
    where: { id: sponsorPositionId },
    select: {
      placedUnderPositionId: true,
      directReferralCount: true,
    },
  });

  if (!sponsorPosition) {
    throw new Error('Sponsor position not found');
  }

  const grandSponsorId = sponsorPosition.placedUnderPositionId;

  // Step 2: If sponsor has no parent (is at top)
  if (!grandSponsorId) {
    // Check if sponsor itself has < 2 refs
    if (sponsorPosition.directReferralCount < 2) {
      return sponsorPositionId; // Place under sponsor directly
    }

    // Otherwise BFS through sponsor's tree
    return await breadthFirstSearch(sponsorPositionId, tx);
  }

  // Step 3: Get grand sponsor's direct ref count
  const grandSponsor = await tx.position.findUnique({
    where: { id: grandSponsorId },
    select: { directReferralCount: true },
  });

  if (!grandSponsor) {
    throw new Error('Grand sponsor position not found');
  }

  // Step 4: If grand sponsor has < 2 refs, place under grand sponsor
  if (grandSponsor.directReferralCount < 2) {
    return grandSponsorId;
  }

  // Step 5: Grand sponsor is full, do BFS through their tree
  return await breadthFirstSearch(grandSponsorId, tx);
}

/**
 * BFS algorithm to find first position with < 2 direct referrals
 * Searches level by level in createdAt order
 */
async function breadthFirstSearch(
  rootPositionId: string,
  tx: any
): Promise<string> {
  const queue: string[] = [rootPositionId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentLevelSize = queue.length;
    const currentLevelPositions = [];

    // Process entire current level
    for (let i = 0; i < currentLevelSize; i++) {
      const positionId = queue.shift()!;

      if (visited.has(positionId)) continue;
      visited.add(positionId);

      // Get direct downline for this position (ordered by createdAt)
      const downline = await tx.position.findMany({
        where: { 
          placedUnderPositionId: positionId,
          isActive: true,
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          directReferralCount: true,
          createdAt: true,
        },
      });

      currentLevelPositions.push(...downline);

      // Add all to queue for next level
      for (const pos of downline) {
        queue.push(pos.id);
      }
    }

    // Check current level for anyone with < 2 refs (ordered by createdAt)
    const eligible = currentLevelPositions.find(
      (p) => p.directReferralCount < 2
    );

    if (eligible) {
      return eligible.id; // Found someone with < 2 refs!
    }
  }

  // Fallback: place under root (edge case safety)
  return rootPositionId;
}
