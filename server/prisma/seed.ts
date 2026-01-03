import { InviteStatus, PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const dayMs = 24 * 60 * 60 * 1000;
const inviteTtlDays = Number(process.env.INVITE_TTL_DAYS ?? 14);

type InviteSeed = {
  email: string;
  label: string;
  role: Role;
  expiresOffsetDays: number;
  usedAt?: Date | null;
  status: InviteStatus;
  reminderCount?: number;
  lastSentOffsetDays?: number;
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
];

const daysFromNow = (days: number) => new Date(Date.now() + days * dayMs);

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

    await prisma.invite.create({
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
        pending_email_key: pendingKey,
      },
    });

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
