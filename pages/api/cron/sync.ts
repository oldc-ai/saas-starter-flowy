import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

// Verify that the request is coming from a cron job
const verifyCronSecret = (req: NextApiRequest): boolean => {
  const cronSecret = process.env.CRON_SECRET;
  return req.headers['x-cron-secret'] === cronSecret;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the cron secret
  if (!verifyCronSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get all teams
    const teams = await prisma.team.findMany({
      select: { id: true }
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day

    // For each team, get their inventory items and create snapshots
    for (const team of teams) {
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: { teamId: team.id }
      });

      // Create snapshots for each inventory item
      await prisma.inventorySnapshot.createMany({
        data: inventoryItems.map(item => ({
          inventoryItemId: item.id,
          teamId: team.id,
          value: item.value,
          snapshotDate: now
        }))
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Inventory snapshots created successfully' 
    });
  } catch (error) {
    console.error('Error creating inventory snapshots:', error);
    return res.status(500).json({ 
      error: 'Failed to create inventory snapshots',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 