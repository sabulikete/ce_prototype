import { Request, Response } from 'express';
import * as contentService from '../services/contentService';
import { ContentType, ContentStatus, Visibility } from '@prisma/client';

export const listContent = async (req: Request, res: Response) => {
  const { type, limit, offset } = req.query;
  const userRole = req.user?.role || 'GUEST';

  try {
    const content = await contentService.listContent(
      type as ContentType,
      limit ? parseInt(limit as string) : 10,
      offset ? parseInt(offset as string) : 0,
      userRole
    );
    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getContent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userRole = req.user?.role || 'GUEST';

  try {
    const content = await contentService.getContentById(parseInt(id), userRole);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createContent = async (req: Request, res: Response) => {
  try {
    const content = await contentService.createContent(req.body);
    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateContent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const content = await contentService.updateContent(parseInt(id), req.body);
    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteContent = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await contentService.deleteContent(parseInt(id));
    res.json({ message: 'Content deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const content = await contentService.updateContent(parseInt(id), { status });
    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const pinContent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isPinned } = req.body;
  try {
    const content = await contentService.updateContent(parseInt(id), { is_pinned: isPinned });
    res.json(content);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const listEvents = async (req: Request, res: Response) => {
    const userRole = req.user?.role || 'GUEST';
    try {
        const events = await contentService.listEvents(userRole);
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
