import { Request, Response } from 'express';
import * as qrService from '../services/qrService';

export const issueTickets = async (req: Request, res: Response) => {
  const { id } = req.params; // eventId
  const { userIds } = req.body;

  try {
    const results = [];
    for (const userId of userIds) {
      const result = await qrService.generateTicket(userId, parseInt(id));
      results.push(result);
    }
    res.json({ message: 'Tickets issued', count: results.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyTickets = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  try {
    const tickets = await qrService.getTicketsByUser(userId);
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventAttendees = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tickets = await qrService.getTicketsByEvent(parseInt(id));
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkIn = async (req: Request, res: Response) => {
  const { ticketToken, eventId } = req.body;

  try {
    const payload = qrService.validateTicketToken(ticketToken);
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
