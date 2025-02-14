import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { getCurrentUserWithTeam, throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await throwIfNoTeamAccess(req, res);

    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET']);
        throw new ApiError(405, `Method ${req.method} Not Allowed`);
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get detailed sales data for a specific date
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team', 'read');

  const date = req.query.date as string;

  if (!date) {
    throw new ApiError(400, 'Date is required');
  }

  try {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get detailed sales data for the specified date
    const sales = await prisma.sale.findMany({
      where: {
        teamId: user.team.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Transform the data to include formatted time and items
    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      time: sale.date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      items: sale.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      total: sale.total,
      paymentType: sale.paymentType,
    }));

    return res.status(200).json(formattedSales);
  } catch (error) {
    console.error('Error fetching sales details:', error);
    throw new ApiError(500, 'Error fetching sales details');
  }
}; 