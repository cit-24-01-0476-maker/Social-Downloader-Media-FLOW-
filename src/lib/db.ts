import { PrismaClient } from '@prisma/client';

// Global type for development hot-reloading
declare global {
  var prisma: PrismaClient | undefined;
}

// In-Memory Database Store for Graceful Fallback Mode
class InMemoryDatabase {
  private jobs: any[] = [];
  private users: any[] = [];
  private logs: any[] = [];
  private consents: any[] = [];
  private abuseFlags: any[] = [];

  constructor() {
    console.warn('[MediaFlow DB] ⚠️ Running in Mock In-Memory Database Mode. Config DATABASE_URL to connect to PostgreSQL.');
    // Seed some mock users and statistics
    this.users.push({
      id: 'admin-mock-id',
      name: 'System Admin',
      email: 'admin@mediaflow.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Helper to clone objects and simulate database return
  private clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  user = {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      const u = this.users.find(x => 
        (args.where.id && x.id === args.where.id) || 
        (args.where.email && x.email === args.where.email)
      );
      return u ? this.clone(u) : null;
    },
    findMany: async () => this.clone(this.users),
    create: async (args: { data: any }) => {
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data
      };
      this.users.push(newUser);
      return this.clone(newUser);
    }
  };

  downloadJob = {
    findUnique: async (args: { where: { id: string } }) => {
      const job = this.jobs.find(x => x.id === args.where.id);
      return job ? this.clone(job) : null;
    },
    findMany: async (args?: { orderBy?: { createdAt: 'desc' | 'asc' }; take?: number }) => {
      let result = [...this.jobs];
      if (args?.orderBy?.createdAt === 'desc') {
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      if (args?.take) {
        result = result.slice(0, args.take);
      }
      return this.clone(result);
    },
    create: async (args: { data: any }) => {
      const newJob = {
        id: Math.random().toString(36).substr(2, 9),
        status: 'PENDING',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data
      };
      this.jobs.push(newJob);
      return this.clone(newJob);
    },
    update: async (args: { where: { id: string }; data: any }) => {
      const index = this.jobs.findIndex(x => x.id === args.where.id);
      if (index === -1) throw new Error(`Job ${args.where.id} not found`);
      const updated = {
        ...this.jobs[index],
        ...args.data,
        updatedAt: new Date()
      };
      this.jobs[index] = updated;
      return this.clone(updated);
    },
    count: async () => this.jobs.length
  };

  platformRequestLog = {
    create: async (args: { data: any }) => {
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        ...args.data
      };
      this.logs.push(newLog);
      return this.clone(newLog);
    },
    findMany: async (args?: { take?: number; orderBy?: any }) => {
      let result = [...this.logs];
      if (args?.orderBy?.timestamp === 'desc') {
        result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }
      if (args?.take) {
        result = result.slice(0, args.take);
      }
      return this.clone(result);
    },
    count: async (args?: { where?: { success?: boolean } }) => {
      const targetSuccess = args?.where?.success;
      if (targetSuccess !== undefined) {
        return this.logs.filter(x => x.success === targetSuccess).length;
      }
      return this.logs.length;
    }
  };

  consentRecord = {
    create: async (args: { data: any }) => {
      const newConsent = {
        id: Math.random().toString(36).substr(2, 9),
        consentTime: new Date(),
        ...args.data
      };
      this.consents.push(newConsent);
      return this.clone(newConsent);
    }
  };

  abuseFlag = {
    create: async (args: { data: any }) => {
      const newFlag = {
        id: Math.random().toString(36).substr(2, 9),
        flaggedAt: new Date(),
        ...args.data
      };
      this.abuseFlags.push(newFlag);
      return this.clone(newFlag);
    },
    findMany: async () => this.clone(this.abuseFlags),
    count: async () => this.abuseFlags.length
  };
}

let db: PrismaClient | InMemoryDatabase;

// Check if PostgreSQL config exists, otherwise use Mock DB
const hasValidDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');

if (hasValidDatabaseUrl) {
  if (process.env.NODE_ENV === 'production') {
    db = new PrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient();
    }
    db = global.prisma;
  }
} else {
  // Graceful in-memory fallback
  if (!global.prisma) {
    (global as any).mockDb = (global as any).mockDb || new InMemoryDatabase();
  }
  db = (global as any).mockDb;
}

export { db };
