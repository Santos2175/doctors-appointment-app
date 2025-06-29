import { PrismaClient } from './generated/prisma';

declare global {
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

// globalThis.prisma: This global variable ensures that the prisma client instance is reused across hot-reloads during development. Without this, each time our application reloads, a new instance would be created leading to connection issues of memory leaks
