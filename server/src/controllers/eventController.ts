import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Shared condition for filtering non-voided tickets to improve maintainability
const ACTIVE_TICKET_CONDITION = { voided_at: null } as const;

// API contract enforces fixed page size for attendee lists
const ATTENDEE_PAGE_SIZE = 20;

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    // Calculate total upcoming events
    const totalUpcoming = await prisma.event.count({
      where: {
        start_at: {
          gte: now
        },
        content: {
          is: {
            status: 'PUBLISHED'
          }
        }
      }
    });

    // Calculate total tickets issued for upcoming events
    const upcomingEvents = await prisma.event.findMany({
      where: {
        start_at: {
          gte: now
        },
        content: {
          is: {
            status: 'PUBLISHED'
          }
        }
      },
      select: {
        content_id: true
      }
    });

    const upcomingEventIds = upcomingEvents.map(e => e.content_id);
    
    let totalTicketsIssued: number;
    if (upcomingEventIds.length === 0) {
      totalTicketsIssued = 0;
    } else {
      totalTicketsIssued = await prisma.ticket.count({
        where: {
          event_id: {
            in: upcomingEventIds
          },
          ...ACTIVE_TICKET_CONDITION
        }
      });
    }

    // Calculate average check-in rate for last 3 past events
    const pastEvents = await prisma.event.findMany({
      where: {
        end_at: {
          lt: now
        },
        content: {
          is: {
            status: 'PUBLISHED'
          }
        }
      },
      orderBy: {
        end_at: 'desc'
      },
      take: 3,
      select: {
        content_id: true
      }
    });

    let avgCheckInRate = 0;
    if (pastEvents.length > 0) {
      const pastEventIds = pastEvents.map(e => e.content_id);
      
      const tickets = await prisma.ticket.groupBy({
        by: ['event_id'],
        where: {
          event_id: {
            in: pastEventIds
          },
          ...ACTIVE_TICKET_CONDITION
        },
        _count: {
          id: true
        }
      });

      const checkedInTickets = await prisma.ticket.groupBy({
        by: ['event_id'],
        where: {
          event_id: {
            in: pastEventIds
          },
          ...ACTIVE_TICKET_CONDITION,
          checked_in_at: {
            not: null
          }
        },
        _count: {
          id: true
        }
      });

      const totalIssued = tickets.reduce((sum, t) => sum + t._count.id, 0);
      const totalCheckedIn = checkedInTickets.reduce((sum, t) => sum + t._count.id, 0);
      
      if (totalIssued > 0) {
        avgCheckInRate = (totalCheckedIn / totalIssued) * 100;
      }
    }

    res.json({
      totalUpcoming,
      totalTicketsIssued,
      avgCheckInRate: Math.round(avgCheckInRate * 10) / 10 // Round to 1 decimal
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', status = 'upcoming', search = '' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 per page
    const offset = (pageNum - 1) * limitNum;

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    if (status !== 'upcoming' && status !== 'past') {
      return res.status(400).json({ error: 'Invalid status parameter' });
    }

    const now = new Date();
    
    // Prepare search filter
    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    
    const contentFilter: Prisma.ContentWhereInput = {
      status: 'PUBLISHED',
      ...(trimmedSearch && {
        title: {
          contains: trimmedSearch
        }
      })
    };
    
    // Build the where clause immutably
    const whereClause: Prisma.EventWhereInput = {
      ...(status === 'upcoming'
        ? { start_at: { gte: now } }
        : { end_at: { lt: now } }),
      content: {
        is: contentFilter
      }
    };

    // Get total count for pagination
    const total = await prisma.event.count({
      where: whereClause
    });

    // Fetch events with content
    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        content: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        _count: {
          select: {
            tickets: {
              where: ACTIVE_TICKET_CONDITION
            }
          }
        }
      },
      orderBy: status === 'upcoming' 
        ? { start_at: 'asc' } 
        : { start_at: 'desc' },
      skip: offset,
      take: limitNum
    });

    // Get ticket stats for each event using aggregation to avoid N+1 queries
    const eventIds = events.map(e => e.content_id);
    
    // Get issued ticket counts
    const issuedStats = await prisma.ticket.groupBy({
      by: ['event_id'],
      where: {
        event_id: { in: eventIds },
        ...ACTIVE_TICKET_CONDITION
      },
      _count: {
        id: true
      }
    });
    
    // Get checked-in ticket counts
    const checkedInStats = await prisma.ticket.groupBy({
      by: ['event_id'],
      where: {
        event_id: { in: eventIds },
        ...ACTIVE_TICKET_CONDITION,
        checked_in_at: {
          not: null
        }
      },
      _count: {
        id: true
      }
    });
    
    // Combine stats
    const ticketStats = eventIds.map(eventId => {
      const issued = issuedStats.find(s => s.event_id === eventId)?._count.id || 0;
      const checkedIn = checkedInStats.find(s => s.event_id === eventId)?._count.id || 0;
      return { eventId, issued, checkedIn };
    });

    // Build response data
    const data = events.map((event) => {
      const stats = ticketStats.find(s => s.eventId === event.content_id) || { issued: 0, checkedIn: 0 };
      return {
        id: event.content_id.toString(),
        title: event.content.title,
        startDate: event.start_at.toISOString(),
        endDate: event.end_at.toISOString(),
        location: event.location,
        status: event.content.status,
        ticketStats: {
          issued: stats.issued,
          checkedIn: stats.checkedIn
        }
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventDetail = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);

    if (isNaN(eventIdNum)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Fetch event with content
    const event = await prisma.event.findUnique({
      where: { content_id: eventIdNum },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            body: true,
            status: true,
            published_at: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Aggregate ticket statistics in a single query for efficiency
    const tickets = await prisma.ticket.findMany({
      where: { event_id: eventIdNum },
      select: {
        id: true,
        voided_at: true,
        checked_in_at: true
      }
    });

    const totalTickets = tickets.length;
    const { issuedTickets, checkedInTickets, voidedTickets } = tickets.reduce(
      (acc, t) => {
        if (t.voided_at) {
          acc.voidedTickets += 1;
        } else if (t.checked_in_at) {
          acc.checkedInTickets += 1;
        } else {
          acc.issuedTickets += 1;
        }
        return acc;
      },
      { issuedTickets: 0, checkedInTickets: 0, voidedTickets: 0 }
    );

    res.json({
      id: event.content_id,
      title: event.content.title,
      description: event.content.body,
      startDate: event.start_at.toISOString(),
      endDate: event.end_at.toISOString(),
      location: event.location,
      status: event.content.status,
      publishedAt: event.content.published_at?.toISOString() || null,
      ticketStats: {
        total: totalTickets,
        byStatus: {
          issued: issuedTickets,
          checkedIn: checkedInTickets,
          voided: voidedTickets
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventAttendees = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { page = '1', search = '' } = req.query;
    
    const eventIdNum = parseInt(eventId);
    const pageNum = parseInt(page as string);
    const limitNum = ATTENDEE_PAGE_SIZE;

    if (isNaN(eventIdNum) || isNaN(pageNum)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // NOTE: The current API contract/spec requires a fixed page size.
    // We intentionally enforce this here to guarantee that behavior.
    // See specs/002-event-detail-view/contracts/get-event-attendees.md for pagination requirements.
    if (pageNum < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters (page >= 1)' });
    }

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { content_id: eventIdNum }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Build user filter for search
    const userWhere: Prisma.UserWhereInput = {};
    if (search && (search as string).trim()) {
      const searchTerm = (search as string).trim();
      userWhere.OR = [
        { email: { contains: searchTerm } },
        { unit_id: { contains: searchTerm } }
      ];
    }

    // Get all tickets for this event with user data
    const tickets = await prisma.ticket.findMany({
      where: {
        event_id: eventIdNum,
        user: userWhere
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            unit_id: true
          }
        }
      }
    });

    // Group tickets by user and compute aggregates
    const userTicketMap = new Map<number, {
      user: { id: number; email: string; unit_id: string | null };
      tickets: Array<{ id: number; checked_in_at: Date | null; voided_at: Date | null }>;
    }>();

    tickets.forEach(ticket => {
      if (!userTicketMap.has(ticket.user_id)) {
        userTicketMap.set(ticket.user_id, {
          user: ticket.user,
          tickets: []
        });
      }
      userTicketMap.get(ticket.user_id)!.tickets.push({
        id: ticket.id,
        checked_in_at: ticket.checked_in_at,
        voided_at: ticket.voided_at
      });
    });

    // Convert to array and compute status summaries
    const attendeeList = Array.from(userTicketMap.values()).map(({ user, tickets }) => {
      const issued = tickets.filter(t => !t.voided_at && !t.checked_in_at).length;
      const checkedIn = tickets.filter(t => !t.voided_at && t.checked_in_at).length;
      const voided = tickets.filter(t => t.voided_at).length;

      const statusParts: string[] = [];
      if (issued > 0) statusParts.push(`${issued} Issued`);
      if (checkedIn > 0) statusParts.push(`${checkedIn} Checked In`);
      if (voided > 0) statusParts.push(`${voided} Voided`);

      let statusSummary = '';
      if (statusParts.length === 0) {
        // This should not happen if tickets are correctly categorized.
        // When this occurs, it usually indicates inconsistent status flags (for example,
        // missing checked_in_at and voided_at) or legacy/migrated records with unexpected values.
        // Review the tickets listed in the logs and correct their status fields as needed.
        console.error('Inconsistent ticket status counts for user', user.id, {
          ticketCount: tickets.length,
          ticketIds: tickets.map(t => t.id), // Only log IDs to avoid exposing sensitive data
          message: 'No tickets for this user matched expected categories (issued, checked in, voided).'
        });
        // Provide a visible fallback instead of leaving statusSummary blank in the UI.
        statusSummary = 'Unknown Status';
      } else {
        statusSummary = statusParts.join(', ');
      }

      return {
        userId: user.id,
        name: user.unit_id || user.email,
        email: user.email,
        ticketCount: tickets.length,
        statusSummary
      };
    });

    // Sort by name
    attendeeList.sort((a, b) => a.name.localeCompare(b.name));

    // Apply pagination
    const total = attendeeList.length;
    const totalPages = Math.ceil(total / limitNum);
    const offset = (pageNum - 1) * limitNum;
    const paginatedAttendees = attendeeList.slice(offset, offset + limitNum);

    res.json({
      attendees: paginatedAttendees,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

