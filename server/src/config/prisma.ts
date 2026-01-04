import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient instance to prevent connection pool exhaustion
// In development, we reuse the instance across hot reloads
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
