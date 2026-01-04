import { Invite, InviteStatus, PrismaClient, Role, UserStatus } from '@prisma/client';
import { InviteConflictFlag } from '../types/adminUsers';
import { emitMetric, logAuditEvent } from '../middleware/logging';
import {
  logInviteResendSuccess,
  logInviteResendFailure,
  logInviteRevoke,
  emitMetric as emitAuditMetric,
} from '../utils/auditLogger';
import { inviteConfig, resolveResendChannels, isReminderCapReached } from '../config/invites';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
export const INVITE_TTL_DAYS = Number(process.env.INVITE_TTL_DAYS ?? 14);
/**
 * @deprecated Use inviteConfig.reminderCap from config/invites.ts instead.
 * This constant is exported only for backward compatibility and will be removed
 * after 2026-07-01. Do not use in new code or reference from environment variables.
 */
export const INVITE_MAX_REMINDERS = inviteConfig.reminderCap;

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

export const createUser = async (email: string, password: string, role: Role, unitId?: string, name?: string) => {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      password_hash: passwordHash,
      role,
      unit_id: unitId,
      status: UserStatus.ACTIVE,
      name: name?.trim() || null,
    },
  });
};

export const findUserByEmail = async (email: string) => {
  const cleanEmail = normalizeEmail(email);
  return prisma.user.findUnique({
    where: { email: cleanEmail },
  });
};

export const createInvite = async (
  email: string,
  role: Role,
  createdByUserId: number,
  unitId?: string,
  name?: string,
) => {
  const cleanEmail = email.trim();
  const normalizedEmail = normalizeEmail(email);
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = buildInviteExpiry();

  const baseData = {
    email: cleanEmail,
    name: name?.trim() || null,
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

  const user = await createUser(invite.email, password, invite.role, invite.unit_id || undefined, invite.name || undefined);

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
  if (isReminderCapReached(invite.reminder_count)) {
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

// ────────────────────────────────────────────────────────────────────────────────
// Resend eligibility helpers (used by resend-context endpoint and modal)
// ────────────────────────────────────────────────────────────────────────────────

export type ResendEligibility = {
  eligible: boolean;
  reason: string | null;
};

/**
 * Determine whether an invite can be resent and provide a human-readable reason if not.
 */
export const checkResendEligibility = (invite: Invite): ResendEligibility => {
  if (invite.status === InviteStatus.ACCEPTED) {
    return { eligible: false, reason: 'Invite has already been accepted' };
  }
  if (invite.status === InviteStatus.REVOKED) {
    return { eligible: false, reason: 'Invite has been revoked' };
  }
  if (isReminderCapReached(invite.reminder_count)) {
    return { eligible: false, reason: `Reminder cap of ${inviteConfig.reminderCap} reached` };
  }
  return { eligible: true, reason: null };
};

/**
 * Build the resend context payload for the modal, including invite metadata and eligibility.
 */
export const getResendContext = async (inviteId: number) => {
  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: {
      creator: { select: { id: true, email: true } },
      sender: { select: { id: true, email: true } },
    },
  });

  if (!invite) {
    throw new InviteActionError('Invite not found', 404);
  }

  const eligibility = checkResendEligibility(invite);

  return {
    inviteId: invite.id,
    email: invite.email,
    name: invite.name,
    status: invite.status,
    reminderCount: invite.reminder_count,
    reminderCap: inviteConfig.reminderCap,
    lastSentAt: invite.last_sent_at,
    lastSentBy: invite.sender?.email ?? invite.creator.email,
    resendEligible: eligibility.eligible,
    eligibilityReason: eligibility.reason,
    expiresAt: invite.expires_at,
    // Additional status dates for guardrail UI messaging
    usedAt: invite.used_at,
    revokedAt: invite.revoked_at,
  };
};

export const resendInviteById = async (
  inviteId: number,
  actorId: number,
  originalChannels: Array<'email' | 'sms'> = ['email'],
) => {
  const invite = await loadInviteOrThrow(inviteId);

  // Check eligibility and log failure if blocked
  const eligibility = checkResendEligibility(invite);
  if (!eligibility.eligible) {
    logInviteResendFailure({
      actorId,
      inviteId: invite.id,
      reason: eligibility.reason || 'Unknown',
      status: invite.status,
      reminderCount: invite.reminder_count,
    });
    emitAuditMetric('invite_resend_failed', 1, {
      status: invite.status,
      reason: eligibility.reason,
    });
    throw new InviteActionError(eligibility.reason || 'Invite cannot be resent', 400);
  }

  const channels = resolveResendChannels(originalChannels);
  const now = new Date();

  // Generate a new token for the resend
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Transactional: insert reminder record (source of truth) and update invite summary
  const [, updated] = await prisma.$transaction([
    prisma.inviteReminder.create({
      data: {
        invite_id: invite.id,
        sent_by: actorId,
        sent_at: now,
        channels: JSON.stringify(channels),
        success: true,
      },
    }),
    prisma.invite.update({
      where: { id: invite.id },
      data: {
        reminder_count: { increment: 1 },
        last_sent_at: now,
        last_sent_by: actorId,
        expires_at: buildInviteExpiry(),
        status: InviteStatus.PENDING,
        revoked_at: null,
        pending_email_key: buildPendingEmailKey(InviteStatus.PENDING, invite.email),
        token_hash: tokenHash,
      },
    }),
  ]);

  logInviteResendSuccess({
    actorId,
    inviteId: invite.id,
    reminderCount: updated.reminder_count,
    status: updated.status,
    channels,
  });
  emitAuditMetric('invite_resend_total', 1, { status: updated.status });

  return {
    ...updated,
    token,
    resendEligible: !isReminderCapReached(updated.reminder_count),
  };
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
  logInviteRevoke({
    actorId,
    inviteId: invite.id,
    reason: reason || null,
    status: updated.status,
  });
  emitAuditMetric('invite_revoke_total', 1, { status: updated.status });
  return updated;
};
