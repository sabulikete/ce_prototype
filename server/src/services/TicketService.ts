import { PrismaClient, TicketStatus, UserStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';
import { MAX_TICKETS_PER_USER_PER_EVENT, DEFAULT_EVENT_CAPACITY } from '../config/constants';

const prisma = new PrismaClient();

// Secret for signing QR codes
const QR_SECRET = process.env.QR_SECRET || 'default-qr-secret';

/**
 * Result of a ticket issuance operation
 */
export interface IssuanceResult {
  issuedCount: number;
  requestedCount: number;
  capReached: boolean;
  tickets: TicketWithToken[];
}

/**
 * Ticket with generated QR token
 */
export interface TicketWithToken {
  id: number;
  eventId: number;
  userId: number;
  code: string;
  status: TicketStatus;
  createdAt: Date;
  token: string | null;
}

/**
 * Generate a unique ticket code
 */
const generateTicketCode = (): string => {
  return `TKT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
};

/**
 * Generate a QR token for a ticket
 */
const generateQRToken = (ticketId: number, eventId: number): string => {
  const payload = JSON.stringify({ ticketId, eventId });
  const signature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
  return `${Buffer.from(payload).toString('base64')}.${signature}`;
};

/**
 * Get the count of valid (non-voided) tickets for a user at an event
 */
export const getUserTicketCount = async (
  userId: number,
  eventId: number,
  tx?: Prisma.TransactionClient
): Promise<number> => {
  const client = tx || prisma;
  return client.ticket.count({
    where: {
      user_id: userId,
      event_id: eventId,
      status: TicketStatus.VALID,
    },
  });
};

/**
 * Get the total count of valid tickets issued for an event
 */
export const getEventTicketCount = async (
  eventId: number,
  tx?: Prisma.TransactionClient
): Promise<number> => {
  const client = tx || prisma;
  return client.ticket.count({
    where: {
      event_id: eventId,
      status: TicketStatus.VALID,
    },
  });
};

/**
 * Get event capacity (returns default if event not found)
 */
export const getEventCapacity = async (
  eventId: number,
  tx?: Prisma.TransactionClient
): Promise<number> => {
  const client = tx || prisma;
  const event = await client.event.findUnique({
    where: { content_id: eventId },
    select: { capacity: true },
  });
  return event?.capacity ?? DEFAULT_EVENT_CAPACITY;
};

/**
 * Check if a user is eligible for ticket issuance (ACTIVE or INVITED status)
 */
export const isUserEligible = async (userId: number): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  
  if (!user) return false;
  return user.status === UserStatus.ACTIVE || user.status === UserStatus.INVITED;
};

/**
 * Get user status for ticket visibility decisions
 */
export const getUserStatus = async (userId: number): Promise<UserStatus | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  return user?.status ?? null;
};

/**
 * Issue multiple tickets to a user for an event
 * Handles capacity checks and partial fulfillment
 */
export const issueTickets = async (
  userId: number,
  eventId: number,
  quantity: number
): Promise<IssuanceResult> => {
  // Validate quantity
  if (quantity < 1 || quantity > MAX_TICKETS_PER_USER_PER_EVENT) {
    throw new Error(`Quantity must be between 1 and ${MAX_TICKETS_PER_USER_PER_EVENT}`);
  }

  // Validate event exists
  const event = await prisma.event.findUnique({
    where: { content_id: eventId },
  });
  if (!event) {
    throw new Error('Event not found');
  }

  // Check user eligibility
  const eligible = await isUserEligible(userId);
  if (!eligible) {
    throw new Error('User is not eligible for ticket issuance');
  }

  // Use transaction for atomic capacity checks and ticket creation
  return prisma.$transaction(async (tx) => {
    // Get current counts
    const userTicketCount = await getUserTicketCount(userId, eventId, tx);
    const eventTicketCount = await getEventTicketCount(eventId, tx);
    const eventCapacity = await getEventCapacity(eventId, tx);

    // Calculate available slots
    const userRemainingSlots = MAX_TICKETS_PER_USER_PER_EVENT - userTicketCount;
    const eventRemainingSlots = eventCapacity - eventTicketCount;

    // Determine how many tickets can actually be issued
    const maxIssuable = Math.min(userRemainingSlots, eventRemainingSlots, quantity);

    if (maxIssuable <= 0) {
      return {
        issuedCount: 0,
        requestedCount: quantity,
        capReached: true,
        tickets: [],
      };
    }

    // Create tickets
    const tickets: TicketWithToken[] = [];
    for (let i = 0; i < maxIssuable; i++) {
      const code = generateTicketCode();
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      const ticket = await tx.ticket.create({
        data: {
          user_id: userId,
          event_id: eventId,
          code,
          code_hash: codeHash,
          status: TicketStatus.VALID,
        },
      });

      const token = generateQRToken(ticket.id, eventId);
      tickets.push({
        id: ticket.id,
        eventId: ticket.event_id,
        userId: ticket.user_id,
        code: ticket.code,
        status: ticket.status,
        createdAt: ticket.created_at,
        token,
      });
    }

    return {
      issuedCount: tickets.length,
      requestedCount: quantity,
      capReached: tickets.length < quantity,
      tickets,
    };
  });
};

/**
 * Get tickets for a user at an event
 * Optionally masks QR code for INVITED users
 */
export const getTicketsForUser = async (
  userId: number,
  eventId?: number
): Promise<TicketWithToken[]> => {
  const userStatus = await getUserStatus(userId);
  const isInvited = userStatus === UserStatus.INVITED;

  const where: Prisma.TicketWhereInput = { user_id: userId };
  if (eventId) {
    where.event_id = eventId;
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: { event: { include: { content: true } } },
    orderBy: { created_at: 'desc' },
  });

  return tickets.map((ticket) => {
    // For INVITED users, mask the QR token
    const token = isInvited ? null : generateQRToken(ticket.id, ticket.event_id);
    
    return {
      id: ticket.id,
      eventId: ticket.event_id,
      userId: ticket.user_id,
      code: isInvited ? '********' : ticket.code,
      status: ticket.status,
      createdAt: ticket.created_at,
      token,
    };
  });
};

/**
 * Get all tickets for an event (admin view)
 */
export const getTicketsForEvent = async (eventId: number) => {
  return prisma.ticket.findMany({
    where: { event_id: eventId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
};

/**
 * Void a ticket
 */
export const voidTicket = async (ticketId: number): Promise<void> => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  
  if (ticket.checked_in_at) {
    throw new Error('Cannot void a checked-in ticket');
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: TicketStatus.VOIDED,
      voided_at: new Date(),
    },
  });
};

/**
 * Validate a QR token and return payload
 */
export const validateTicketToken = (token: string): { ticketId: number; eventId: number } | null => {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  try {
    const payloadStr = Buffer.from(payloadB64, 'base64').toString();
    const expectedSignature = crypto.createHmac('sha256', QR_SECRET).update(payloadStr).digest('hex');

    if (signature !== expectedSignature) return null;

    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
};
