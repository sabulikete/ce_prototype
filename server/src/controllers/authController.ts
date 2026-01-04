import { Request, Response } from 'express';
import * as inviteService from '../services/inviteService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await inviteService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not configured");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, unitId: user.unit_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Don't return password hash
    const { password_hash, ...userWithoutPassword } = user;

    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createInvite = async (req: Request, res: Response) => {
  const { email, role, unitId, name } = req.body;
  const createdBy = req.user!.id;

  try {
    const { invite, token } = await inviteService.createInvite(email, role as Role, createdBy, unitId, name);
    // In a real app, we would email this link. For MVP, we return it.
    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;
    
    res.json({ inviteLink, expiresAt: invite.expires_at });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateInvite = async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const invite = await inviteService.validateInvite(token);
    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite' });
    }

    res.json({
      email: invite.email,
      role: invite.role,
      unitId: invite.unit_id,
      expiresAt: invite.expires_at,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const acceptInvite = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await inviteService.acceptInvite(token, password);
    
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not configured");
    }

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, unitId: user.unit_id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { password_hash, ...userWithoutPassword } = user;

    res.json({ token: jwtToken, user: userWithoutPassword });
  } catch (error: any) {
    console.error(error);
    if (error.message === 'Invalid or expired invite' || error.message === 'User already exists') {
        return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
    // Placeholder for MVP
    res.json({ message: "If email exists, reset link sent" });
}

export const resetPassword = async (req: Request, res: Response) => {
    // Placeholder for MVP
    res.json({ message: "Password reset successful" });
}
