import { Request, Response } from 'express';
import * as qrService from '../services/qrService';
import * as TicketService from '../services/TicketService';

/**
 * Issue tickets for an event (Admin endpoint)
 * POST /api/admin/events/:id/tickets
 * Body: { userIds: number[], quantity?: number }
 */
export const issueTickets = async (req: Request, res: Response) => {
  const { id } = req.params; // eventId
  const { userIds, quantity = 1 } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds array is required' });
  }

  if (quantity < 1 || quantity > 50) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 50' });
  }

  try {
    const eventId = parseInt(id);
    const results = [];
    
    for (const userId of userIds) {
      try {
        const result = await TicketService.issueTickets(userId, eventId, quantity);
        results.push({
          userId,
          ...result,
        });
      } catch (error: any) {
        results.push({
          userId,
          issuedCount: 0,
          requestedCount: quantity,
          capReached: false,
          error: error.message,
          tickets: [],
        });
      }
    }

    const totalIssued = results.reduce((sum, r) => sum + r.issuedCount, 0);
    res.status(201).json({
      message: 'Tickets issued',
      totalIssued,
      results,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get my tickets (Member endpoint)
 * GET /api/tickets/my-tickets
 */
export const getMyTickets = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const tickets = await TicketService.getTicketsForUser(userId);
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get event attendees/tickets (Admin endpoint)
 * GET /api/admin/events/:id/tickets
 */
export const getEventAttendees = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tickets = await TicketService.getTicketsForEvent(parseInt(id));
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check in a ticket (Staff endpoint)
 * POST /api/staff/check-in
 */
export const checkIn = async (req: Request, res: Response) => {
  const { ticketToken, eventId } = req.body;

  try {
    const payload = TicketService.validateTicketToken(ticketToken);
    if (!payload) {
      return res.status(400).json({ success: false, reason: 'INVALID_TOKEN' });
    }

    if (payload.eventId !== eventId) {
      return res.status(400).json({ success: false, reason: 'INVALID_EVENT' });
    }

    const user = await qrService.checkInTicket(payload.ticketId, eventId);
    
    res.json({ success: true, memberName: user.email });
  } catch (error: any) {
    console.error(error);
    if (error.message === 'ALREADY_CHECKED_IN' || error.message === 'Ticket is voided' || error.message === 'Ticket not found') {
      return res.status(400).json({ success: false, reason: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
