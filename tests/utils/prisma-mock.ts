import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Prismaモックファクトリー
export function createMockPrismaClient() {
  const mockPrisma = {
    // Daily Report モデル
    dailyReport: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },

    // Visit Record モデル
    visitRecord: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },

    // Manager Comment モデル
    managerComment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },

    // Sales Person モデル
    salesPerson: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },

    // Customer モデル
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },

    // トランザクション
    $transaction: vi.fn((callback: any) => {
      if (typeof callback === 'function') {
        return callback(mockPrisma);
      }
      return Promise.resolve();
    }),

    // 接続管理
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),

    // その他のPrismaメソッド
    $use: vi.fn(),
    $on: vi.fn(),
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    $queryRawUnsafe: vi.fn(),
  };

  return mockPrisma;
}

// Prismaクライアントを全体的にモック
export function mockPrismaClient() {
  const mockPrisma = createMockPrismaClient();
  
  vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrisma),
  }));

  return mockPrisma;
}

// グローバルレベルでのPrismaモック設定
export function setupGlobalPrismaMock() {
  const mockPrisma = createMockPrismaClient();
  
  vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrisma),
  }));

  return mockPrisma;
}

// データベースのモックファクトリー関数
export const createMockData = {
  // Sales Person
  salesPerson: (overrides: any = {}) => ({
    salesPersonId: 1,
    name: 'テストユーザー',
    email: 'test@example.com',
    password: 'hashedpassword',
    department: '営業部',
    isManager: false,
    createdAt: new Date('2025-01-01T09:00:00Z'),
    updatedAt: new Date('2025-01-01T09:00:00Z'),
    ...overrides,
  }),

  // Customer
  customer: (overrides: any = {}) => ({
    customerId: 1,
    companyName: 'テスト株式会社',
    contactPerson: '山田太郎',
    phone: '03-1234-5678',
    email: 'contact@test.com',
    address: '東京都渋谷区',
    createdAt: new Date('2025-01-01T09:00:00Z'),
    updatedAt: new Date('2025-01-01T09:00:00Z'),
    ...overrides,
  }),

  // Daily Report
  dailyReport: (overrides: any = {}) => ({
    reportId: 1,
    salesPersonId: 1,
    reportDate: new Date('2025-01-01'),
    problem: 'テスト課題',
    plan: 'テスト計画',
    createdAt: new Date('2025-01-01T09:00:00Z'),
    updatedAt: new Date('2025-01-01T09:00:00Z'),
    ...overrides,
  }),

  // Visit Record
  visitRecord: (overrides: any = {}) => ({
    visitId: 1,
    reportId: 1,
    customerId: 1,
    visitContent: 'テスト訪問内容',
    visitTime: '10:00',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    ...overrides,
  }),

  // Manager Comment
  managerComment: (overrides: any = {}) => ({
    commentId: 1,
    reportId: 1,
    managerId: 2,
    comment: 'テストコメント',
    createdAt: new Date('2025-01-01T18:00:00Z'),
    ...overrides,
  }),
};

// テスト用のユーザーデータ
export const testUsers = {
  regularUser: {
    id: 1,
    name: 'テストユーザー',
    email: 'test@example.com',
    department: '営業部',
    is_manager: false,
  },
  managerUser: {
    id: 2,
    name: 'テスト管理者',
    email: 'manager@example.com',
    department: '営業部',
    is_manager: true,
  },
};