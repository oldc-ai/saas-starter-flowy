import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { Client } from 'square';

// Verify that the request is coming from a cron job
const verifyCronSecret = (req: NextApiRequest): boolean => {
  const cronSecret = process.env.CRON_SECRET;
  return req.headers['x-cron-secret'] === cronSecret;
};

type TeamWithSquare = {
  id: string;
  squareAccessToken: string | null;
  squareLocationId: string | null;
};

async function syncSquareOrders(team: TeamWithSquare) {
  if (!team.squareAccessToken || !team.squareLocationId) {
    console.log(`Team ${team.id} missing Square credentials, skipping`);
    return;
  }

  const squareClient = new Client({
    accessToken: team.squareAccessToken,
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
  });

  // Find the latest order we've synced for this team
  const latestSale = await prisma.sale.findFirst({
    where: {
      teamId: team.id,
      posProvider: 'SQUARE'
    },
    orderBy: {
      date: 'desc'
    }
  });

  // If no sales exist, fetch last week's data. Otherwise, fetch since last sale
  const startDate = latestSale 
    ? new Date(latestSale.date) 
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  try {
    let cursor: string | undefined;
    do {
      const response = await squareClient.ordersApi.searchOrders({
        locationIds: [team.squareLocationId],
        query: {
          filter: {
            dateTimeFilter: {
              createdAt: {
                startAt: startDate.toISOString()
              }
            },
            stateFilter: {
              states: ['COMPLETED']
            }
          }
        },
        cursor
      });

      if (response.result.orders) {
        for (const order of response.result.orders) {
          // Check if this order already exists
          const existingOrder = await prisma.sale.findFirst({
            where: {
              teamId: team.id,
              posProvider: 'SQUARE',
              posOrderId: order.id
            }
          });

          if (!existingOrder && order.totalMoney) {
            // Calculate total (Square stores amounts in cents)
            const total = parseFloat((order.totalMoney.amount || 0).toString()) / 100;

            // Create the sale record
            await prisma.sale.create({
              data: {
                teamId: team.id,
                date: new Date(order.createdAt || Date.now()),
                total,
                paymentType: 'SQUARE',
                status: order.state || 'COMPLETED',
                posProvider: 'SQUARE',
                posOrderId: order.id,
                items: {
                  create: order.lineItems?.map(item => ({
                    name: item.name || 'Unknown Item',
                    quantity: parseInt(item.quantity || '1'),
                    unitPrice: item.basePriceMoney ? parseFloat(item.basePriceMoney.amount?.toString() || '0') / 100 : 0,
                    totalPrice: item.totalMoney ? parseFloat(item.totalMoney.amount?.toString() || '0') / 100 : 0,
                    category: item.categoryId || null,
                    notes: item.note || null
                  })) || []
                }
              }
            });
          }
        }
      }

      cursor = response.result.cursor;
    } while (cursor);

  } catch (error: unknown) {
    console.error(`Error syncing Square orders for team ${team.id}:`, error);
    if (error && typeof error === 'object' && 'result' in error) {
      const squareError = error as { result: { errors?: Array<{ category: string; code: string; detail: string }> } };
      if (squareError.result.errors) {
        squareError.result.errors.forEach(e => {
          console.log('Category:', e.category);
          console.log('Code:', e.code);
          console.log('Detail:', e.detail);
        });
      }
    } else {
      console.log("Unexpected error occurred: ", error);
    }
    throw error;
  }
}

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
      select: { 
        id: true,
        squareAccessToken: true,
        squareLocationId: true
      }
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

      // Sync Square orders if team has Square integration
      await syncSquareOrders(team);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Sync completed successfully' 
    });
  } catch (error) {
    console.error('Error during sync:', error);
    return res.status(500).json({ 
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 