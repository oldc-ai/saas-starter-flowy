import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { throwIfNoTeamAccess } from 'models/team';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { team, user } = await throwIfNoTeamAccess(req, res);
    console.log('Team ID:', team.id); // Debug log

    switch (req.method) {
      case 'GET':
        console.log('GET request received for team:', team.id);
        const items = await prisma.inventoryItem.findMany({
          where: {
            teamId: team.id,
          },
          orderBy: {
            name: 'asc',
          },
        });
        console.log('Query executed, found items:', JSON.stringify(items, null, 2)); // Debug log
        return res.status(200).json(items);

      case 'POST':
        const { name, value, unitType } = req.body;
        
        // Validate required fields
        if (!name || value === undefined || !unitType) {
          return res.status(400).json({ 
            error: 'Name, value, and unit type are required' 
          });
        }

        try {
          const newItem = await prisma.inventoryItem.create({
            data: {
              name,
              value: Number(value),
              unitType,
              teamId: team.id,
              updatedBy: user.id,
            },
          });
          console.log('Created item:', newItem); // Debug log
          return res.status(201).json(newItem);
        } catch (error) {
          if (error.code === 'P2002') {
            return res.status(400).json({ 
              error: 'An item with this name already exists' 
            });
          }
          throw error;
        }

      case 'PUT':
        const { id, name: updateName, value: updateValue, unitType: updateUnitType } = req.body;
        
        if (!id || !updateName || updateValue === undefined || !updateUnitType) {
          return res.status(400).json({ 
            error: 'ID, name, value, and unit type are required' 
          });
        }

        const existingItem = await prisma.inventoryItem.findUnique({
          where: { id },
        });

        if (!existingItem) {
          return res.status(404).json({ error: 'Item not found' });
        }

        // Verify item belongs to the team
        if (existingItem.teamId !== team.id) {
          return res.status(403).json({ error: 'You do not have access to this item' });
        }

        try {
          const updatedItem = await prisma.inventoryItem.update({
            where: { id },
            data: {
              name: updateName,
              value: Number(updateValue),
              unitType: updateUnitType,
              updatedBy: user.id,
            },
          });
          console.log('Updated item:', updatedItem); // Debug log
          return res.status(200).json(updatedItem);
        } catch (error) {
          if (error.code === 'P2002') {
            return res.status(400).json({ 
              error: 'An item with this name already exists' 
            });
          }
          throw error;
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Inventory API Error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
} 