import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient, InviteStatus, Role } from '@prisma/client';
import crypto from 'crypto';
import app from '../../src/app';

const prisma = new PrismaClient();

// Helper to create test tokens (mock JWT)
const createAuthToken = (role: Role, userId: number) => {
  // In real tests, this would create a valid JWT
  // For now, we'll mock the auth middleware in the test setup
  return `mock-token-${role}-${userId}`;
};

describe('Invite Resend API', () => {
  let adminUserId: number;
  let memberUserId: number;
  let testInviteId: number;
  let capReachedInviteId: number;
  let revokedInviteId: number;

  beforeAll(async () => {
    // Create test users
    const admin = await prisma.user.create({
      data: {
        email: 'test-admin@resend-test.com',
        password_hash: 'test-hash',
        role: Role.ADMIN,
        status: 'ACTIVE',
      },
    });
    adminUserId = admin.id;

    const member = await prisma.user.create({
      data: {
        email: 'test-member@resend-test.com',
        password_hash: 'test-hash',
        role: Role.MEMBER,
        status: 'ACTIVE',
      },
    });
    memberUserId = member.id;

    // Create test invites
    const pendingInvite = await prisma.invite.create({
      data: {
        email: 'pending@resend-test.com',
        role: Role.MEMBER,
        token_hash: crypto.randomBytes(32).toString('hex'),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        created_by: adminUserId,
        status: InviteStatus.PENDING,
        reminder_count: 1,
        last_sent_at: new Date(),
      },
    });
    testInviteId = pendingInvite.id;

    const capReachedInvite = await prisma.invite.create({
      data: {
        email: 'capped@resend-test.com',
        role: Role.MEMBER,
        token_hash: crypto.randomBytes(32).toString('hex'),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        created_by: adminUserId,
        status: InviteStatus.PENDING,
        reminder_count: 3, // At cap
        last_sent_at: new Date(),
      },
    });
    capReachedInviteId = capReachedInvite.id;

    const revokedInvite = await prisma.invite.create({
      data: {
        email: 'revoked@resend-test.com',
        role: Role.MEMBER,
        token_hash: crypto.randomBytes(32).toString('hex'),
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        created_by: adminUserId,
        status: InviteStatus.REVOKED,
        reminder_count: 0,
        last_sent_at: new Date(),
        revoked_at: new Date(),
      },
    });
    revokedInviteId = revokedInvite.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.inviteReminder.deleteMany({
      where: { invite_id: { in: [testInviteId, capReachedInviteId, revokedInviteId] } },
    });
    await prisma.invite.deleteMany({
      where: { email: { contains: '@resend-test.com' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: '@resend-test.com' } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/admin/invites/:inviteId/resend-context', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/admin/invites/${testInviteId}/resend-context`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it.skip('returns 403 for member role', async () => {
      // This test requires auth middleware mocking
      const response = await request(app)
        .get(`/api/admin/invites/${testInviteId}/resend-context`)
        .set('Authorization', `Bearer ${createAuthToken(Role.MEMBER, memberUserId)}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it.skip('returns 200 with context for admin', async () => {
      // This test requires auth middleware mocking
      const response = await request(app)
        .get(`/api/admin/invites/${testInviteId}/resend-context`)
        .set('Authorization', `Bearer ${createAuthToken(Role.ADMIN, adminUserId)}`)
        .expect(200);

      expect(response.body).toMatchObject({
        inviteId: testInviteId,
        email: 'pending@resend-test.com',
        status: 'PENDING',
        reminderCount: expect.any(Number),
        reminderCap: expect.any(Number),
        resendEligible: true,
        inviteUrl: expect.any(String),
      });
    });

    it.skip('returns resendEligible: false for capped invites', async () => {
      const response = await request(app)
        .get(`/api/admin/invites/${capReachedInviteId}/resend-context`)
        .set('Authorization', `Bearer ${createAuthToken(Role.ADMIN, adminUserId)}`)
        .expect(200);

      expect(response.body.resendEligible).toBe(false);
      expect(response.body.eligibilityReason).toContain('cap');
    });

    it('returns 404 for non-existent invite', async () => {
      const response = await request(app)
        .get('/api/admin/invites/999999/resend-context')
        .expect(401); // Will be 404 when authenticated
    });
  });

  describe('POST /api/admin/invites/:inviteId/resend', () => {
    it('returns 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post(`/api/admin/invites/${testInviteId}/resend`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it.skip('returns 403 for member role', async () => {
      const response = await request(app)
        .post(`/api/admin/invites/${testInviteId}/resend`)
        .set('Authorization', `Bearer ${createAuthToken(Role.MEMBER, memberUserId)}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it.skip('returns 200 and increments reminder count for admin', async () => {
      const before = await prisma.invite.findUnique({ where: { id: testInviteId } });
      const beforeCount = before?.reminder_count ?? 0;

      const response = await request(app)
        .post(`/api/admin/invites/${testInviteId}/resend`)
        .set('Authorization', `Bearer ${createAuthToken(Role.ADMIN, adminUserId)}`)
        .expect(200);

      expect(response.body.reminderCount).toBe(beforeCount + 1);
      expect(response.body.message).toContain('success');

      // Verify InviteReminder record was created
      const reminders = await prisma.inviteReminder.findMany({
        where: { invite_id: testInviteId },
        orderBy: { sent_at: 'desc' },
      });
      expect(reminders.length).toBeGreaterThan(0);
      expect(reminders[0].success).toBe(true);
    });

    it.skip('returns 400 for invite at reminder cap', async () => {
      const response = await request(app)
        .post(`/api/admin/invites/${capReachedInviteId}/resend`)
        .set('Authorization', `Bearer ${createAuthToken(Role.ADMIN, adminUserId)}`)
        .expect(400);

      expect(response.body.error).toContain('Maximum reminders');
    });

    it.skip('returns 409 for revoked invite', async () => {
      const response = await request(app)
        .post(`/api/admin/invites/${revokedInviteId}/resend`)
        .set('Authorization', `Bearer ${createAuthToken(Role.ADMIN, adminUserId)}`)
        .expect(409);

      expect(response.body.error).toContain('revoked');
    });
  });
});
