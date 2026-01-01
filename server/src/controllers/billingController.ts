import { Request, Response } from 'express';
import * as billingService from '../services/billingService';
import fs from 'fs';

export const getAllStatements = async (req: Request, res: Response) => {
  const { limit, offset } = req.query;
  try {
    const statements = await billingService.getAllStatements(
      limit ? parseInt(limit as string) : 20,
      offset ? parseInt(offset as string) : 0
    );
    res.json(statements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyStatements = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { limit, offset } = req.query;

  try {
    const statements = await billingService.getStatementsByUser(
      userId,
      limit ? parseInt(limit as string) : 10,
      offset ? parseInt(offset as string) : 0
    );
    res.json(statements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadStatement = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const filePath = await billingService.getStatementFilePath(parseInt(id), userId);
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadStatement = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    if (req.file.mimetype === 'application/zip' || req.file.originalname.endsWith('.zip')) {
      const result = await billingService.processBulkUpload(req.file.buffer);
      res.json(result);
    } else {
      await billingService.saveBillingFile(req.file.buffer, req.file.originalname);
      res.json({ message: 'Upload successful' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

export const bulkUploadStatements = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await billingService.processBulkUpload(req.file.buffer);
    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
