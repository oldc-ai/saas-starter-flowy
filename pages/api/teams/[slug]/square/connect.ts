import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { getCurrentUserWithTeam } from '@/lib/session';
import { throwIfNotAllowed } from '@/lib/permissions';
import env from '@/lib/env';

const SQUARE_OAUTH_URL = 'https://connect.squareup.com/oauth2/authorize';
const SCOPES = [
  'MERCHANT_PROFILE_READ',
  'ORDERS_READ',
  'ORDERS_WRITE',
  'INVENTORY_READ',
  'INVENTORY_WRITE',
  'PAYMENTS_READ',
  'PAYMENTS_WRITE',
].join(' ');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      throw new ApiError(405, 'Method not allowed');
    }

    // Check if Square credentials are configured
    if (!env.squareAppId || !env.squareAppSecret) {
      throw new ApiError(500, 'Square credentials are not configured');
    }

    const user = await getCurrentUserWithTeam(req, res);
    
    if (!user || !user.team) {
      throw new ApiError(401, 'Unauthorized');
    }

    throwIfNotAllowed(user, 'team_square', 'update');

    // Generate state parameter with team info
    const state = Buffer.from(JSON.stringify({ 
      teamId: user.team.id,
      teamSlug: user.team.slug 
    })).toString('base64');
    
    // Construct OAuth URL with required parameters
    const queryParams = new URLSearchParams({
      client_id: env.squareAppId,
      scope: SCOPES,
      state: state,
      session: 'false',
      // Add redirect URI for the callback
      redirect_uri: `${env.appUrl}/api/teams/${user.team.slug}/square/callback`,
    });

    const authUrl = `${SQUARE_OAUTH_URL}?${queryParams.toString()}`;

    res.json({ data: { url: authUrl } });
  } catch (error) {
    console.error('Square connect error:', error);
    
    if (error instanceof ApiError) {
      res.status(error.code).json({ 
        error: {
          code: error.code,
          message: error.message
        }
      });
    } else {
      res.status(500).json({
        error: { 
          code: 500, 
          message: 'Internal Server Error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
} 