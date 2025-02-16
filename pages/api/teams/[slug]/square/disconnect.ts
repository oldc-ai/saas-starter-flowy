import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { getCurrentUserWithTeam } from '@/lib/session';
import { throwIfNotAllowed } from '@/lib/permissions';
import env from '@/lib/env';
import { prisma } from '@/lib/prisma';

const SQUARE_REVOKE_URL = 'https://connect.squareup.com/oauth2/revoke';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      throw new ApiError(405, 'Method not allowed');
    }

    const user = await getCurrentUserWithTeam(req, res);
    throwIfNotAllowed(user, 'team_square', 'delete');

    const team = await prisma.team.findUnique({
      where: { id: user.team.id },
      select: { squareAccessToken: true },
    });

    if (team?.squareAccessToken) {
      // Revoke the access token
      const response = await fetch(SQUARE_REVOKE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.squareAppId,
          client_secret: env.squareAppSecret,
          access_token: team.squareAccessToken,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new ApiError(400, data.message || 'Failed to revoke access token');
      }
    }

    // Remove Square credentials from the database
    await prisma.team.update({
      where: { id: user.team.id },
      data: {
        squareAccessToken: null,
        squareRefreshToken: null,
        squareTokenExpiresAt: null,
      },
    });

    res.json({ data: { message: 'Successfully disconnected from Square' } });
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.code).json({ error });
    } else {
      res.status(500).json({
        error: { code: 500, message: 'Internal Server Error' },
      });
    }
  }
} 