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
