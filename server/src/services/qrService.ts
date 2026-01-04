import { Ticket } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../config/prisma';

// Secret for signing QR codes. Should be in env.
const QR_SECRET = process.env.QR_SECRET || 'default-qr-secret';

export const generateTicket = async (userId: number, eventId: number) => {
  const existingTicket = await prisma.ticket.findFirst({
    where: { user_id: userId, event_id: eventId },
  });

  if (existingTicket) {
    // Regenerate token for existing ticket
    const payload = JSON.stringify({ ticketId: existingTicket.id, eventId });
    const signature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
    const token = `${Buffer.from(payload).toString('base64')}.${signature}`;
    return { ticket: existingTicket, token };
  }

  // Generate unique ticket code
  const code = `TKT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  const ticket = await prisma.ticket.create({
    data: {
      user_id: userId,
      event_id: eventId,
      code,
      code_hash: codeHash,
    },
  });

  const payload = JSON.stringify({ ticketId: ticket.id, eventId });
  const signature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
  const token = `${Buffer.from(payload).toString('base64')}.${signature}`;

  return { ticket, token };
};

export const validateTicketToken = (token: string) => {
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const payloadStr = Buffer.from(payloadB64, 'base64').toString();
  const expectedSignature = crypto.createHmac('sha256', QR_SECRET).update(payloadStr).digest('hex');

  if (signature !== expectedSignature) return null;

  return JSON.parse(payloadStr);
};

export const getTicketsByEvent = async (eventId: number) => {
  return prisma.ticket.findMany({
    where: { event_id: eventId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
};

export const checkInTicket = async (ticketId: number, eventId: number) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { user: true },
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  if (ticket.event_id !== eventId) {
    throw new Error('Invalid event for this ticket');
  }

  if (ticket.voided_at) {
    throw new Error('Ticket is voided');
  }

  if (ticket.checked_in_at) {
    throw new Error('ALREADY_CHECKED_IN');
  }

  const result = await prisma.ticket.updateMany({
    where: {
      id: ticketId,
      checked_in_at: null,
      voided_at: null,
    },
    data: {
      checked_in_at: new Date(),
    },
  });

  if (result.count === 0) {
    const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (updatedTicket?.checked_in_at) throw new Error('ALREADY_CHECKED_IN');
    if (updatedTicket?.voided_at) throw new Error('Ticket is voided');
    throw new Error('Check-in failed');
  }

  return ticket.user;
};

export const voidTicket = async (ticketId: number) => {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (ticket?.checked_in_at) {
        throw new Error("Cannot void checked-in ticket");
    }

    return prisma.ticket.update({
        where: { id: ticketId },
        data: { voided_at: new Date() }
    });
}

export const getTicketsByUser = async (userId: number) => {
    // We need to return the token as well, or generate it on the fly.
    // Since we don't store the full token, we regenerate it.
    const tickets = await prisma.ticket.findMany({
        where: { user_id: userId },
        include: { event: { include: { content: true } } }
    });

    return tickets.map(ticket => {
        const payload = JSON.stringify({ ticketId: ticket.id, eventId: ticket.event_id });
        const signature = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex');
        const token = `${Buffer.from(payload).toString('base64')}.${signature}`;
        return { ...ticket, token };
    });
}
