import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import env from '@/lib/env';

const SQUARE_TOKEN_URL = env.squareUseSandbox
  ? 'https://connect.squareupsandbox.com/oauth2/token'
  : 'https://connect.squareup.com/oauth2/token';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state } = req.query;

  if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Decode and parse the state parameter
  let teamId: string = '';
  let teamSlug: string = '';
  
  try {
    const decodedState = Buffer.from(state, 'base64').toString();
    const teamInfo = JSON.parse(decodedState);
    
    if (!teamInfo.teamId || !teamInfo.teamSlug) {
      return res.status(400).json({ error: 'Invalid team information in state' });
    }
    
    teamId = teamInfo.teamId;
    teamSlug = teamInfo.teamSlug;

    // Exchange the authorization code for an access token
    const response = await fetch(SQUARE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.squareAppId,
        client_secret: env.squareAppSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${env.appUrl}/api/square/callback`,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Square token exchange error:', JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        responseData,
      }));
      
      return res.status(400).json({ 
        error: `Failed to exchange token: ${responseData?.error_description || 'Unknown error'}` 
      });
    }

    // Store the Square credentials in the database
    await prisma.team.update({
      where: { id: teamId },
      data: {
        squareAccessToken: responseData.access_token,
        squareRefreshToken: responseData.refresh_token,
        squareTokenExpiresAt: responseData.expires_at ? new Date(responseData.expires_at) : null,
      },
    });

    // Redirect back to the settings page with success parameter
    const redirectUrl = `${env.appUrl}/teams/${teamSlug}/square?success=true`;
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Unexpected error in Square callback:', error);
    // Redirect back with error message
    const errorMessage = encodeURIComponent((error as Error)?.message || 'Internal server error');
    const redirectUrl = `${env.appUrl}/teams/${teamSlug || ''}/square?error=${errorMessage}`;
    return res.redirect(302, redirectUrl);
  }
} 