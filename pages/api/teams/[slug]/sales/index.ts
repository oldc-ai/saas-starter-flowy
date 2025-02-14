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

// Get daily sales data
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUserWithTeam(req, res);

  throwIfNotAllowed(user, 'team', 'read');

  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  try {
    // Get daily aggregated sales data
    const dailySales = await prisma.sale.groupBy({
      by: ['date'],
      where: {
        teamId: user.team.id,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Transform the data to match the frontend expectations
    const formattedSales = dailySales.map((sale) => ({
      date: sale.date.toISOString().split('T')[0],
      totalSales: sale._sum.total || 0,
      transactionCount: sale._count.id,
    }));

    return res.status(200).json(formattedSales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw new ApiError(500, 'Error fetching sales data');
  }
}; 