import { Invite, InviteStatus, PrismaClient, Role, UserStatus } from '@prisma/client';
import { InviteConflictFlag } from '../types/adminUsers';
import { emitMetric, logAuditEvent } from '../middleware/logging';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
export const INVITE_TTL_DAYS = Number(process.env.INVITE_TTL_DAYS ?? 14);
export const INVITE_MAX_REMINDERS = Number(process.env.INVITE_MAX_REMINDERS ?? 5);

const inviteTtlMs = INVITE_TTL_DAYS * 24 * 60 * 60 * 1000;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const buildInviteExpiry = () => new Date(Date.now() + inviteTtlMs);

const buildPendingEmailKey = (status: InviteStatus, email: string) =>
  status === InviteStatus.PENDING ? normalizeEmail(email) : null;

export class InviteActionError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

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
  const cleanEmail = email.trim();
  return prisma.user.findUnique({
    where: { email: cleanEmail },
  });
};

export const createInvite = async (email: string, role: Role, createdByUserId: number, unitId?: string) => {
  const cleanEmail = email.trim();
  const normalizedEmail = normalizeEmail(email);
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = buildInviteExpiry();

  const baseData = {
    email: cleanEmail,
    role,
    unit_id: unitId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    created_by: createdByUserId,
    status: InviteStatus.PENDING,
    reminder_count: 0,
    last_sent_at: new Date(),
    revoked_at: null,
    pending_email_key: normalizedEmail,
  } as const;

  const existingPending = await prisma.invite.findUnique({
    where: { pending_email_key: normalizedEmail },
  });

  const invite = existingPending
    ? await prisma.invite.update({
        where: { id: existingPending.id },
        data: baseData,
      })
    : await prisma.invite.create({
        data: baseData,
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
      revoked_at: null,
      status: InviteStatus.PENDING,
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
    data: {
      used_at: new Date(),
      status: InviteStatus.ACCEPTED,
      pending_email_key: null,
    },
  });

  return user;
};

export const detectInviteConflicts = async (email: string): Promise<InviteConflictFlag[]> => {
  const cleanEmail = email.trim();
  const normalizedEmail = normalizeEmail(email);
  const conflicts: InviteConflictFlag[] = [];

  const [deactivatedUser, inviteSet] = await Promise.all([
    prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        status: UserStatus.SUSPENDED,
      },
      select: { id: true, status: true },
    }),
    prisma.invite.findMany({
      where: { email: cleanEmail },
      select: { id: true },
    }),
  ]);

  if (deactivatedUser) {
    conflicts.push({ type: 'DEACTIVATED_USER', userId: deactivatedUser.id, status: deactivatedUser.status });
  }

  if (inviteSet.length > 1) {
    conflicts.push({ type: 'DUPLICATE_EMAIL', inviteIds: inviteSet.map((invite) => invite.id) });
  }

  return conflicts;
};

const loadInviteOrThrow = async (inviteId: number): Promise<Invite> => {
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) {
    throw new InviteActionError('Invite not found', 404);
  }
  return invite;
};

const assertInviteResendable = (invite: Invite) => {
  if (invite.status === InviteStatus.ACCEPTED) {
    throw new InviteActionError('Invite already accepted', 409);
  }
  if (invite.status === InviteStatus.REVOKED) {
    throw new InviteActionError('Invite already revoked', 409);
  }
  if (invite.reminder_count >= INVITE_MAX_REMINDERS) {
    throw new InviteActionError('Maximum reminders reached', 400);
  }
};

const assertInviteRevokable = (invite: Invite) => {
  if (invite.status === InviteStatus.ACCEPTED) {
    throw new InviteActionError('Invite already accepted', 409);
  }
  if (invite.status === InviteStatus.REVOKED) {
    throw new InviteActionError('Invite already revoked', 409);
  }
};

export const resendInviteById = async (inviteId: number, actorId: number) => {
  const invite = await loadInviteOrThrow(inviteId);
  assertInviteResendable(invite);
  const now = new Date();
  const updated = await prisma.invite.update({
    where: { id: invite.id },
    data: {
      reminder_count: invite.reminder_count + 1,
      last_sent_at: now,
      expires_at: buildInviteExpiry(),
      status: InviteStatus.PENDING,
      revoked_at: null,
      pending_email_key: buildPendingEmailKey(InviteStatus.PENDING, invite.email),
    },
  });
  logAuditEvent('invite.resend', {
    actorId,
    inviteId: invite.id,
    reminderCount: updated.reminder_count,
    status: updated.status,
  });
  emitMetric('invite_resend_total', 1, { status: updated.status });
  return updated;
};

export const revokeInviteById = async (inviteId: number, actorId: number, reason?: string) => {
  const invite = await loadInviteOrThrow(inviteId);
  assertInviteRevokable(invite);
  const now = new Date();
  const updated = await prisma.invite.update({
    where: { id: invite.id },
    data: {
      status: InviteStatus.REVOKED,
      revoked_at: now,
      pending_email_key: null,
    },
  });
  logAuditEvent('invite.revoke', {
    actorId,
    inviteId: invite.id,
    reason: reason || null,
    status: updated.status,
  });
  emitMetric('invite_revoke_total', 1, { status: updated.status });
  return updated;
};
