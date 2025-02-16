import type { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import env from '@/lib/env';
import { prisma } from '@/lib/prisma';

const SQUARE_TOKEN_URL = 'https://connect.squareup.com/oauth2/token';

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

    const { code, state } = req.query;

    if (!code || !state) {
      throw new ApiError(400, 'Missing required parameters');
    }

    // Decode and validate state parameter
    let decodedState;
    try {
      decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch (error) {
      throw new ApiError(400, 'Invalid state parameter');
    }

    const { teamId, teamSlug } = decodedState;

    if (!teamId || !teamSlug) {
      throw new ApiError(400, 'Invalid state parameter');
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    // Exchange code for access token
    const response = await fetch(SQUARE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2023-12-13',
      },
      body: JSON.stringify({
        client_id: env.squareAppId,
        client_secret: env.squareAppSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${env.appUrl}/api/teams/${teamSlug}/square/callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Square token exchange error:', data);
      throw new ApiError(400, data.message || 'Failed to exchange code for token');
    }

    // Store the access token and refresh token in your database
    await prisma.team.update({
      where: { id: teamId },
      data: {
        squareAccessToken: data.access_token,
        squareRefreshToken: data.refresh_token,
        squareTokenExpiresAt: new Date(Date.now() + (data.expires_in * 1000)),
      },
    });

    // Redirect back to the Square integration page with success parameter
    res.redirect(`/teams/${teamSlug}/square?success=true`);
  } catch (error) {
    console.error('Square callback error:', error);
    
    // For OAuth callbacks, it's better to redirect to the integration page with an error
    // rather than returning a JSON error response
    const errorMessage = error instanceof ApiError ? error.message : 'An unexpected error occurred';
    const team = req.query.slug;
    
    res.redirect(`/teams/${team}/square?error=${encodeURIComponent(errorMessage)}`);
  }
} 