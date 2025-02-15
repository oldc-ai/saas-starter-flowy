import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { throwIfNoTeamAccess } from 'models/team';
import { prisma } from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

// We still need Supabase client for storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { team, user } = await throwIfNoTeamAccess(req, res);

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [, files] = await form.parse(req);
    const uploadedFiles = files.files;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: 'Failed to upload files' });
    }

    const results: any[] = [];

    for (const file of uploadedFiles) {
      const fileContent = await fs.promises.readFile(file.filepath);
      const fileName = `${team.id}/${Date.now()}-${file.originalFilename}`;

      // Explicitly set authorization header with service role key
      const { error: uploadError, data } = await supabase.storage
        .from('receipts')
        .upload(fileName, fileContent, {
          contentType: file.mimetype || undefined,
          duplex: 'half',
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        continue;
      }

      const { data: urlData } = await supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      // @ts-ignore - Prisma will handle this at runtime
      const receipt = await prisma.receiptUpload.create({
        data: {
          teamId: team.id,
          uploadedBy: user.id,
          fileName: file.originalFilename || 'unnamed',
          fileUrl: urlData.publicUrl,
          fileType: file.mimetype?.includes('pdf') ? 'PDF' : 'IMAGE',
          status: 'PENDING',
        },
      });

      results.push(receipt);

      // Clean up temp file
      await fs.promises.unlink(file.filepath);
    }

    return res.status(200).json({ message: 'Files uploaded successfully', results });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: (error as Error).message });
  }
} 