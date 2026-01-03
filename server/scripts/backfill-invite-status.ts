import { InviteStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function deriveStatus(invite: {
  used_at: Date | null;
  revoked_at: Date | null;
  expires_at: Date;
}): InviteStatus {
  if (invite.revoked_at) {
    return InviteStatus.REVOKED;
  }

  if (invite.used_at) {
    return InviteStatus.ACCEPTED;
  }

  if (invite.expires_at.getTime() < Date.now()) {
    return InviteStatus.EXPIRED;
  }

  return InviteStatus.PENDING;
}

async function backfill() {
  const invites = await prisma.invite.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      email: true,
      expires_at: true,
      used_at: true,
      revoked_at: true,
      reminder_count: true,
      last_sent_at: true,
      created_at: true,
    },
  });
  let pending = 0;
  let expired = 0;
  let accepted = 0;
  let revoked = 0;

  for (const invite of invites) {
    const status = deriveStatus(invite);
    switch (status) {
      case InviteStatus.PENDING:
        pending += 1;
        break;
      case InviteStatus.EXPIRED:
        expired += 1;
        break;
      case InviteStatus.ACCEPTED:
        accepted += 1;
        break;
      case InviteStatus.REVOKED:
        revoked += 1;
        break;
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: {
        status,
        reminder_count: invite.reminder_count ?? 0,
        last_sent_at: invite.last_sent_at ?? invite.created_at,
        pending_email_key: status === InviteStatus.PENDING ? normalizeEmail(invite.email) : null,
      },
    });
  }

  console.log('Invite backfill complete', { pending, expired, accepted, revoked });
}

backfill()
  .catch((error) => {
    console.error('Failed to backfill invite status', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
