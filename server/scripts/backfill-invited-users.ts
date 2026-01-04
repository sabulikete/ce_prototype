import { PrismaClient, UserStatus, InviteStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function backfillInvitedUsers() {
  // Get all PENDING invites
  const pendingInvites = await prisma.invite.findMany({
    where: { status: InviteStatus.PENDING }
  });
  
  console.log('Found', pendingInvites.length, 'pending invites');
  
  for (const invite of pendingInvites) {
    const normalizedEmail = invite.email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    
    if (!existingUser) {
      const placeholderHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          password_hash: placeholderHash,
          role: invite.role,
          unit_id: invite.unit_id,
          status: UserStatus.INVITED,
          name: invite.name
        }
      });
      console.log('Created INVITED user for:', invite.email);
    } else {
      console.log('User already exists:', invite.email, 'status:', existingUser.status);
    }
  }
  
  console.log('Backfill complete');
}

backfillInvitedUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
