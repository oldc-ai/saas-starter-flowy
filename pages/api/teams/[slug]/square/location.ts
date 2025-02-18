import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      throw new ApiError(405, 'Method not allowed');
    }

    const teamMember = await throwIfNoTeamAccess(req, res);
    throwIfNotAllowed(teamMember, 'team_square', 'update');

    const { locationId } = req.body;
    const { team } = teamMember;

    if (!locationId) {
      throw new ApiError(400, 'Location ID is required');
    }

    if (!team.squareAccessToken) {
      throw new ApiError(400, 'Square is not connected');
    }

    // Update the team with the selected location ID
    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: { squareLocationId: locationId },
    });

    res.json({ data: updatedTeam });
  } catch (error) {
    console.error('Error saving Square location:', error);
    
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