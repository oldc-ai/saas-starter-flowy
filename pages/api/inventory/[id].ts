import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { throwIfNoTeamAccess } from 'models/team';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { team } = await throwIfNoTeamAccess(req, res);
    const { id } = req.query;

    if (req.method !== 'DELETE') {
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Check if item exists and belongs to the team
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: id as string,
        teamId: team.id,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Delete the item
    await prisma.inventoryItem.delete({
      where: {
        id: id as string,
      },
    });

    return res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Inventory API Error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
} 