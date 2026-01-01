import { PrismaClient, User, Invite, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const createUser = async (email: string, password: string, role: Role, unitId?: string) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      role,
      unit_id: unitId,
      status: UserStatus.ACTIVE,
    },
  });
};

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const createInvite = async (email: string, role: Role, createdByUserId: number, unitId?: string) => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const invite = await prisma.invite.create({
    data: {
      email,
      role,
      unit_id: unitId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_by: createdByUserId,
    },
  });

  return { invite, token };
};

export const validateInvite = async (token: string) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const invite = await prisma.invite.findFirst({
    where: {
      token_hash: tokenHash,
      expires_at: { gt: new Date() },
      used_at: null,
    },
  });

  return invite;
};

export const acceptInvite = async (token: string, password: string) => {
  const invite = await validateInvite(token);

  if (!invite) {
    throw new Error('Invalid or expired invite');
  }

  const existingUser = await findUserByEmail(invite.email);
  if (existingUser) {
      throw new Error('User already exists');
  }

  const user = await createUser(invite.email, password, invite.role, invite.unit_id || undefined);

  await prisma.invite.update({
    where: { id: invite.id },
    data: { used_at: new Date() },
  });

  return user;
};
