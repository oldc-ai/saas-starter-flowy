import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import env from '@/lib/env';
import { prisma } from '@/lib/prisma';

const SQUARE_REVOKE_URL = env.squareUseSandbox
  ? 'https://connect.squareupsandbox.com/oauth2/revoke'
  : 'https://connect.squareup.com/oauth2/revoke';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      throw new ApiError(405, 'Method not allowed');
    }

    console.log('Starting Square disconnection process...');

    const teamMember = await throwIfNoTeamAccess(req, res);
    console.log('Team access verified for team:', teamMember.team.id);
    
    throwIfNotAllowed(teamMember, 'team_square', 'delete');
    console.log('User permissions verified');

    // Get the team's Square access token
    const team = await prisma.$queryRaw`
      SELECT "squareAccessToken" FROM "Team" WHERE id = ${teamMember.team.id}
    `;
    console.log('Current team Square status:', { hasToken: !!team?.[0]?.squareAccessToken });

    const accessToken = team?.[0]?.squareAccessToken;

    if (accessToken) {
      console.log('accessToken', accessToken);

      console.log('Attempting to revoke Square access token...');
      // Revoke the access token
      const response = await fetch(SQUARE_REVOKE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Square-Version': '2024-01-17',
          'Authorization': `Client ${env.squareAppSecret}`
        },
        body: JSON.stringify({
          access_token: accessToken,
          client_id: env.squareAppId,
          revoke_only_access_token: false
        }),
      });

      const responseText = await response.text();
      console.log('Square revoke response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to revoke access token';
        try {
          const data = JSON.parse(responseText);
          errorMessage = data.message || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new ApiError(400, errorMessage);
      }
      console.log('Successfully revoked Square access token');
    }

    console.log('Removing Square credentials from database...');
    // Remove Square credentials from the database using raw query
    await prisma.$executeRaw`
      UPDATE "Team" 
      SET "squareAccessToken" = NULL, 
          "squareRefreshToken" = NULL, 
          "squareTokenExpiresAt" = NULL 
      WHERE id = ${teamMember.team.id}
    `;
    console.log('Successfully removed Square credentials from database');

    res.json({ data: { message: 'Successfully disconnected from Square' } });
  } catch (error) {
    console.error('Square disconnect error:', error);
    if (error instanceof ApiError) {
      res.status(error.status).json({ error });
    } else {
      console.error('Unexpected error during Square disconnection:', error);
      res.status(500).json({
        error: { code: 500, message: 'Internal Server Error' },
      });
    }
  }
} 