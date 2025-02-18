import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import env from '@/lib/env';

const SQUARE_API_URL = env.squareUseSandbox
  ? 'https://connect.squareupsandbox.com'
  : 'https://connect.squareup.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      throw new ApiError(405, 'Method not allowed');
    }

    const teamMember = await throwIfNoTeamAccess(req, res);
    throwIfNotAllowed(teamMember, 'team_square', 'read');

    const { team } = teamMember;

    if (!team.squareAccessToken) {
      throw new ApiError(400, 'Square is not connected');
    }

    // Fetch locations from Square API
    const response = await fetch(`${SQUARE_API_URL}/v2/locations`, {
      headers: {
        'Authorization': `Bearer ${team.squareAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.errors?.[0]?.detail || 'Failed to fetch locations'
      );
    }

    const locations = data.locations?.map((location: any) => ({
      id: location.id,
      name: location.name,
      address: location.address || null,
      isSelected: location.id === team.squareLocationId
    })) || [];

    res.json({ data: { locations } });
  } catch (error) {
    console.error('Error fetching Square locations:', error);
    
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