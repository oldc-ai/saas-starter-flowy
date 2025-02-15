import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { throwIfNoTeamAccess } from 'models/team';
import { prisma } from '@/lib/prisma';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { team } = await throwIfNoTeamAccess(req, res);
    const { id } = req.query;

    // Get receipt record
    const receipt = await prisma.receiptUpload.findFirst({
      where: {
        id: id as string,
        teamId: team.id,
      },
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Extract file path from the URL
    const fileUrl = new URL(receipt.fileUrl);
    const filePath = fileUrl.pathname.split('/public/receipts/')[1];

    if (!filePath) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    // Get file from Supabase with authenticated request
    const { data, error } = await supabase.storage
      .from('receipts')
      .download(filePath);

    if (error || !data) {
      console.error('Supabase download error:', error);
      return res.status(404).json({ message: 'File not found' });
    }

    // Set appropriate content type
    res.setHeader('Content-Type', receipt.fileType === 'PDF' ? 'application/pdf' : 'image/jpeg');
    
    // Convert blob to buffer and send
    const buffer = Buffer.from(await data.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error('File fetch error:', error);
    return res.status(500).json({ message: (error as Error).message });
  }
} 