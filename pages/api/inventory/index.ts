import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { throwIfNoTeamAccess } from 'models/team';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { team, user } = await throwIfNoTeamAccess(req, res);

    switch (req.method) {
      case 'GET':
        const items = await prisma.inventoryItem.findMany({
          where: {
            teamId: team.id,
          },
          orderBy: {
            name: 'asc',
          },
        });
        return res.status(200).json(items);

      case 'POST':
        const { name, value, unitType } = req.body;
        const newItem = await prisma.inventoryItem.create({
          data: {
            name,
            value,
            unitType,
            teamId: team.id,
            updatedBy: user.id,
          },
        });

        return res.status(201).json(newItem);

      case 'PUT':
        const { id, name: updateName, value: updateValue, unitType: updateUnitType } = req.body;
        
        const existingItem = await prisma.inventoryItem.findUnique({
          where: { id },
        });

        if (!existingItem) {
          return res.status(404).json({ error: 'Item not found' });
        }
        
        const updatedItem = await prisma.inventoryItem.update({
          where: { id },
          data: {
            name: updateName,
            value: updateValue,
            unitType: updateUnitType,
            updatedBy: user.id,
          },
        });

        return res.status(200).json(updatedItem);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Inventory API Error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
} 