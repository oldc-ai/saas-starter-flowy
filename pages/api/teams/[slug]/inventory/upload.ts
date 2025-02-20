import { NextApiRequest, NextApiResponse } from 'next';
import { throwIfNoTeamAccess } from 'models/team';
import { prisma } from '@/lib/prisma';
import { ApiError } from 'next/dist/server/api-utils';
import { parse } from 'csv-parse/sync';
import formidable from 'formidable';
import { promises as fs } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      throw new ApiError(405, 'Method not allowed');
    }

    const { slug } = req.query;
    if (!slug || typeof slug !== 'string') {
      throw new ApiError(400, 'Invalid team slug');
    }

    const { team } = await throwIfNoTeamAccess(req, res);
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    // Parse the multipart form data
    const form = formidable();
    const [, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = (files.inventoryFile as formidable.File[])?.[0];
    if (!file) {
      throw new ApiError(400, 'No file uploaded');
    }

    // Read the file content
    const fileContent = await fs.readFile(file.filepath, 'utf-8');
    
    // Parse the CSV data
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Clean up the temp file
    await fs.unlink(file.filepath);

    // Validate CSV structure with case-insensitive matching
    const requiredColumns = ['name', 'current level', 'unit', 'count date'];
    const headers = Object.keys(records[0] || {});
    const headerMap = headers.reduce((acc, header) => {
      acc[header.toLowerCase()] = header;
      return acc;
    }, {} as Record<string, string>);

    const missingColumns = requiredColumns.filter(col => !Object.keys(headerMap).includes(col));

    if (missingColumns.length > 0) {
      throw new ApiError(400, `Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Process and save inventory items
    const inventoryItems = await Promise.all(
      records.map(async (record: any) => {
        const lastCountDate = new Date(record[headerMap['count date']]);
        if (isNaN(lastCountDate.getTime())) {
          throw new ApiError(400, 'Invalid date format in count date');
        }

        const currentLevel = parseFloat(record[headerMap['current level']]);
        if (isNaN(currentLevel)) {
          throw new ApiError(400, 'Invalid number format in current level');
        }

        return prisma.inventoryItem.create({
          data: {
            teamId: team.id,
            name: record[headerMap['name']],
            value: currentLevel,
            unitType: record[headerMap['unit']],
            updatedBy: 'SYSTEM',
            updatedAt: lastCountDate,
          },
        });
      })
    );

    res.status(200).json({
      data: {
        message: 'Inventory data uploaded successfully',
        count: inventoryItems.length,
      },
    });
  } catch (error: any) {
    console.error('Error in inventory upload:', error.message);
    res.status(error.statusCode || 500).json({
      error: {
        message: error.message || 'Internal server error',
      },
    });
  }
} 