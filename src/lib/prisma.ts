import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

function createPrismaClient() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    max: process.env.NODE_ENV === "production" ? 10 : 15,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    keepAlive: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  const client = new PrismaClient({ adapter });
  globalForPrisma.pgPool = pool;
  return client;
}

/** Dev HMR keeps a cached PrismaClient — recreate when schema adds new models. */
function isStalePrismaClient(client: PrismaClient): boolean {
  return !("blogLike" in client) || !("blogComment" in client);
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && (process.env.NODE_ENV === "production" || !isStalePrismaClient(cached))) {
    return cached;
  }

  if (cached && globalForPrisma.pgPool) {
    void globalForPrisma.pgPool.end().catch(() => undefined);
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();
