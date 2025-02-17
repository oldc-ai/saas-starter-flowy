import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import env from '@/lib/env';

const SQUARE_OAUTH_URL = env.squareUseSandbox 
  ? 'https://app.squareupsandbox.com/oauth2/authorize'
  : 'https://connect.squareup.com/oauth2/authorize';

const SCOPES = [
  'MERCHANT_PROFILE_READ',
  'ORDERS_READ',
  'INVENTORY_READ',
  'PAYMENTS_READ',
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

    const teamMember = await throwIfNoTeamAccess(req, res);
    throwIfNotAllowed(teamMember, 'team_square', 'update');

    // Generate state parameter with team info
    const state = Buffer.from(JSON.stringify({ 
      teamId: teamMember.team.id,
      teamSlug: teamMember.team.slug 
    })).toString('base64');
    
    // Construct OAuth URL with required parameters
    const queryParams = new URLSearchParams({
      client_id: env.squareAppId,
      scope: SCOPES,
      state: state,
      session: 'false',
      // Use a general callback URL without team-specific information
      redirect_uri: `${env.appUrl}/api/square/callback`,
    });

    const authUrl = `${SQUARE_OAUTH_URL}?${queryParams.toString()}`;

    res.json({ data: { url: authUrl } });
  } catch (error) {
    console.error('Square connect error:', error);
    
    if (error instanceof ApiError) {
      res.status(error.status).json({ 
        error: {
          code: error.status,
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