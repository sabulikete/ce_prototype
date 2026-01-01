import { PrismaClient, BillingStatement } from '@prisma/client';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Directory to store billing files
const BILLING_DIR = process.env.BILLING_DIR || path.join(__dirname, '../../uploads/billing');

// Ensure directory exists
if (!fs.existsSync(BILLING_DIR)) {
  fs.mkdirSync(BILLING_DIR, { recursive: true });
}

export const parseFilename = (filename: string) => {
  // Format: DEC-2025 3C-201.pdf
  // Regex: ^([A-Z]{3})-(\d{4})\s+(.+)\.pdf$
  const regex = /^([A-Z]{3})-(\d{4})\s+(.+)\.pdf$/i;
  const match = filename.match(regex);

  if (!match) return null;

  const [_, monthStr, yearStr, unitId] = match;
  
  const monthMap: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
  };

  const month = monthMap[monthStr.toUpperCase()];
  if (month === undefined) return null;

  const year = parseInt(yearStr);
  const period = new Date(year, month, 1); // First day of the month

  return { period, unitId };
};

export const saveBillingFile = async (fileBuffer: Buffer, filename: string) => {
  const parsed = parseFilename(filename);
  if (!parsed) {
    throw new Error('Invalid filename format');
  }

  const { period, unitId } = parsed;

  // Find user by unitId
  const user = await prisma.user.findFirst({
    where: { unit_id: unitId },
  });

  if (!user) {
    throw new Error(`User not found for unit ${unitId}`);
  }

  // Save file
  const filePath = path.join(BILLING_DIR, filename);
  fs.writeFileSync(filePath, fileBuffer);

  // Create or update BillingStatement
  // Check if statement exists for this user and period
  const existing = await prisma.billingStatement.findFirst({
    where: {
      user_id: user.id,
      period: period,
    },
  });

  if (existing) {
    return prisma.billingStatement.update({
      where: { id: existing.id },
      data: { file_path: filename }, // Store relative path or filename
    });
  } else {
    return prisma.billingStatement.create({
      data: {
        user_id: user.id,
        period: period,
        file_path: filename,
      },
    });
  }
};

export const processBulkUpload = async (zipBuffer: Buffer) => {
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  const results = [];
  let successCount = 0;
  const failures = [];

  for (const entry of zipEntries) {
    if (entry.isDirectory || !entry.entryName.endsWith('.pdf')) {
      continue;
    }

    const filename = path.basename(entry.entryName);
    
    try {
      const parsed = parseFilename(filename);
      if (!parsed) {
        failures.push({ file: filename, error: 'Invalid filename format' });
        results.push({ file: filename, status: 'FAILED', error: 'Invalid filename format' });
        continue;
      }

      await saveBillingFile(entry.getData(), filename);
      
      successCount++;
      results.push({ 
          file: filename, 
          userId: 0, // We don't have user ID easily here without refetching, but saveBillingFile finds it.
          unitId: parsed.unitId,
          period: parsed.period.toISOString().split('T')[0],
          status: 'SUCCESS' 
      });

    } catch (error: any) {
      failures.push({ file: filename, error: error.message });
      results.push({ file: filename, status: 'FAILED', error: error.message });
    }
  }

  return {
    total: zipEntries.filter(e => !e.isDirectory && e.entryName.endsWith('.pdf')).length,
    success: successCount,
    failures,
    results
  };
};

export const getAllStatements = async (limit: number = 20, offset: number = 0) => {
  return prisma.billingStatement.findMany({
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          unit_id: true,
        },
      },
    },
    orderBy: { period: 'desc' },
  });
};

export const getStatementsByUser = async (userId: number, limit: number, offset: number) => {
    // Rolling window check?
    // "Enforce rolling window (e.g., last 12 months)."
    // We can filter by period >= 12 months ago.
    const visibleMonths = parseInt(process.env.BILLING_VISIBLE_MONTHS || '12');
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - visibleMonths);

    return prisma.billingStatement.findMany({
        where: {
            user_id: userId,
            period: { gte: cutoffDate }
        },
        orderBy: { period: 'desc' },
        take: limit,
        skip: offset
    });
}

export const getStatementFilePath = async (id: number, userId: number) => {
    const statement = await prisma.billingStatement.findUnique({
        where: { id }
    });

    if (!statement) return null;
    if (statement.user_id !== userId) return null; // Security check

    return path.join(BILLING_DIR, statement.file_path);
}
