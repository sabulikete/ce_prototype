import { InviteStatus, PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const dayMs = 24 * 60 * 60 * 1000;
const inviteTtlDays = Number(process.env.INVITE_TTL_DAYS ?? 14);

const daysFromNow = (days: number) => new Date(Date.now() + days * dayMs);

/**
 * Calculate the sent date for a reminder in a sequence.
 * Reminders are spread backwards from the last sent date.
 * @param lastSentOffsetDays - Days offset from now for the most recent send
 * @param reminderIndex - Zero-based index of this reminder (0 = oldest)
 * @param totalReminders - Total number of reminders in the sequence
 */
const calculateReminderSentDate = (
  lastSentOffsetDays: number,
  reminderIndex: number,
  totalReminders: number
): Date => {
  // Each reminder is 1 day apart, oldest first
  const daysBack = totalReminders - 1 - reminderIndex;
  return daysFromNow(lastSentOffsetDays - daysBack);
};

type InviteSeed = {
  email: string;
  label: string;
  role: Role;
  expiresOffsetDays: number;
  usedAt?: Date | null;
  status: InviteStatus;
  reminderCount?: number;
  lastSentOffsetDays?: number;
  /** If true, last_sent_by will be set to the admin user (simulating a resend). */
  hasBeenResent?: boolean;
};

const inviteSeeds: InviteSeed[] = [
  {
    email: 'pending.invite@example.com',
    label: 'Pending invite',
    role: Role.MEMBER,
    expiresOffsetDays: inviteTtlDays,
    status: InviteStatus.PENDING,
    reminderCount: 1,
    lastSentOffsetDays: -3,
    hasBeenResent: true,
  },
  {
    email: 'pending.maxed@example.com',
    label: 'Pending invite at reminder cap',
    role: Role.MEMBER,
    expiresOffsetDays: inviteTtlDays,
    status: InviteStatus.PENDING,
    reminderCount: 3, // matches default INVITE_REMINDER_CAP
    lastSentOffsetDays: -1,
    hasBeenResent: true,
  },
  {
    email: 'expired.invite@example.com',
    label: 'Expired invite',
    role: Role.STAFF,
    expiresOffsetDays: -inviteTtlDays,
    status: InviteStatus.EXPIRED,
  },
  {
    email: 'accepted.invite@example.com',
    label: 'Accepted invite',
    role: Role.MEMBER,
    expiresOffsetDays: Math.max(1, Math.floor(inviteTtlDays / 2)),
    status: InviteStatus.ACCEPTED,
    usedAt: new Date(),
  },
  {
    email: 'revoked.invite@example.com',
    label: 'Revoked invite',
    role: Role.MEMBER,
    expiresOffsetDays: inviteTtlDays,
    status: InviteStatus.REVOKED,
    reminderCount: 0,
  },
];

async function main() {
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password_hash: hashedPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('Admin user ready:', adminUser.email);

  await prisma.invite.deleteMany({
    where: {
      email: { in: inviteSeeds.map((seed) => seed.email) },
    },
  });

  const seededInvites: Array<{ label: string; email: string; token: string }> = [];

  for (const seed of inviteSeeds) {
    const token = crypto.randomBytes(16).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const now = new Date();
    const lastSentAt = seed.lastSentOffsetDays ? daysFromNow(seed.lastSentOffsetDays) : now;
    const pendingKey = seed.status === InviteStatus.PENDING ? seed.email.toLowerCase() : null;

    const invite = await prisma.invite.create({
      data: {
        email: seed.email.toLowerCase(),
        role: seed.role,
        token_hash: tokenHash,
        expires_at: daysFromNow(seed.expiresOffsetDays),
        used_at: seed.usedAt ?? null,
        created_by: adminUser.id,
        status: seed.status,
        reminder_count: seed.reminderCount ?? 0,
        last_sent_at: lastSentAt,
        last_sent_by: seed.hasBeenResent ? adminUser.id : null,
        pending_email_key: pendingKey,
      },
    });

    // Create InviteReminder history rows for resent invites
    if (seed.hasBeenResent && (seed.reminderCount ?? 0) > 0) {
      const reminderCount = seed.reminderCount ?? 0;
      const reminderData = Array.from({ length: reminderCount }, (_, i) => ({
        invite_id: invite.id,
        sent_by: adminUser.id,
        sent_at: calculateReminderSentDate(seed.lastSentOffsetDays ?? 0, i, reminderCount),
        channels: JSON.stringify(['email']),
        success: true,
      }));
      await prisma.inviteReminder.createMany({ data: reminderData });
    }

    seededInvites.push({ label: seed.label, email: seed.email, token });
  }

  console.log('Seeded invites for QA:');
  for (const invite of seededInvites) {
    console.log(`- ${invite.label}: ${invite.email} (token: ${invite.token})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
