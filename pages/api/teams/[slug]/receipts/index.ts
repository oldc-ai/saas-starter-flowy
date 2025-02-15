import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { throwIfNoTeamAccess } from 'models/team';
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

const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await throwIfNoTeamAccess(req, res);

  throwIfNotAllowed(user, 'team', 'read');

  try {
    const receipts = await prisma.receiptUpload.findMany({
      where: {
        teamId: user.team.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    throw new ApiError(500, 'Error fetching receipts');
  }
}; 