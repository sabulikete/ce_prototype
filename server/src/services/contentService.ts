import { Content, Event, ContentType, ContentStatus, Visibility, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

interface CreateContentInput {
  type: ContentType;
  title: string;
  body: string;
  status?: ContentStatus;
  visibility?: Visibility;
  is_pinned?: boolean;
  published_at?: Date;
  event?: {
    start_at: Date;
    end_at: Date;
    location: string;
  };
}

interface UpdateContentInput {
  title?: string;
  body?: string;
  status?: ContentStatus;
  visibility?: Visibility;
  is_pinned?: boolean;
  published_at?: Date;
  event?: {
    start_at?: Date;
    end_at?: Date;
    location?: string;
  };
}

export const createContent = async (data: CreateContentInput) => {
  const { event, ...contentData } = data;

  return prisma.content.create({
    data: {
      ...contentData,
      event: event ? { create: event } : undefined,
    },
    include: { event: true },
  });
};

export const updateContent = async (id: number, data: UpdateContentInput) => {
  const { event, ...contentData } = data;

  return prisma.content.update({
    where: { id },
    data: {
      ...contentData,
      event: event ? { update: event } : undefined,
    },
    include: { event: true },
  });
};

export const deleteContent = async (id: number) => {
  // Soft delete by archiving
  return prisma.content.update({
    where: { id },
    data: { status: ContentStatus.ARCHIVED },
  });
};

export const getContentById = async (id: number, userRole?: string) => {
  const content = await prisma.content.findUnique({
    where: { id },
    include: { event: true },
  });

  if (!content) return null;

  // Visibility check
  if (userRole === 'ADMIN') return content;

  if (content.status !== ContentStatus.PUBLISHED) return null;

  if (content.visibility === Visibility.MEMBER && (!userRole || userRole === 'GUEST')) {
    return null;
  }

  return content;
};

export const listContent = async (
  type?: ContentType,
  limit: number = 10,
  offset: number = 0,
  userRole?: string
) => {
  const where: Prisma.ContentWhereInput = {};

  if (type) {
    where.type = type;
  }

  if (userRole === 'ADMIN') {
    // Admin sees everything
  } else {
    // Public/Member
    where.status = ContentStatus.PUBLISHED;
    
    if (!userRole || userRole === 'GUEST') {
      where.visibility = Visibility.PUBLIC;
    }
  }

  return prisma.content.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: [
      { is_pinned: 'desc' },
      { published_at: 'desc' },
      { created_at: 'desc' }
    ],
    include: { event: true },
  });
};

export const listEvents = async (userRole?: string) => {
    const where: Prisma.ContentWhereInput = {
        type: ContentType.EVENT
    };

    if (userRole !== 'ADMIN') {
        where.status = ContentStatus.PUBLISHED;
        if (!userRole || userRole === 'GUEST') {
            where.visibility = Visibility.PUBLIC;
        }
    }

    return prisma.content.findMany({
        where,
        include: { event: true },
        orderBy: {
            event: {
                start_at: 'asc'
            }
        }
    });
}
