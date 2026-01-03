import { Request, Response } from 'express';
import { PrismaClient, Role, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
      orderBy: { id: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Failed to list users', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, status } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        role: role as Role,
        status: status as UserStatus,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });
    res.json(user);
  } catch (error) {
    console.error('Failed to update user', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Failed to delete user', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSelectableUsers = async (req: Request, res: Response) => {
  try {
    const { search = '' } = req.query;

    // Build where clause for ACTIVE and INVITED users
    const whereClause: Prisma.UserWhereInput = {
      status: {
        in: ['ACTIVE', 'INVITED']
      }
    };

    // Add search filter if provided
    if (search && (search as string).trim()) {
      const searchTerm = (search as string).trim();
      whereClause.OR = [
        { email: { contains: searchTerm } },
        { unit_id: { contains: searchTerm } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        unit_id: true,
        status: true
      },
      // Order by unit_id first (nulls sorted last by MySQL default), then by email
      // Users without unit_id will appear after users with unit_id
      // NOTE: This assumes MySQL default NULL sorting. If using a custom configuration,
      // verify that NULLS LAST behavior is maintained.
      orderBy: [
        { unit_id: 'asc' },
        { email: 'asc' }
      ]
    });

    // Format users for response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.unit_id || user.email,
      email: user.email,
      status: user.status
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error('Failed to get selectable users', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

