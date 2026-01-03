import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

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
          voided_at: null
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
          voided_at: null
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
          voided_at: null,
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
    
    // Build the where clause
    const whereClause: Prisma.EventWhereInput = {
      content: {
        is: {
          status: 'PUBLISHED'
        }
      }
    };
    
    // Filter by status (upcoming or past)
    if (status === 'upcoming') {
      whereClause.start_at = { gte: now };
    } else {
      whereClause.end_at = { lt: now };
    }

    // Add search filter if provided
    if (search && (search as string).trim()) {
      whereClause.content = {
        is: {
          status: 'PUBLISHED',
          title: {
            contains: (search as string).trim()
          }
        }
      };
    }

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
              where: {
                voided_at: null
              }
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
        voided_at: null
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
        voided_at: null,
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
