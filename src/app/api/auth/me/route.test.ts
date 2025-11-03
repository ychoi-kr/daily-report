import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';
import { AuthenticatedRequest } from '@/lib/auth/middleware';

// モックの設定
vi.mock('@/lib/auth/middleware', () => ({
  requireAuth: vi.fn(
    (
      request: NextRequest,
      handler: (req: AuthenticatedRequest) => Promise<NextResponse>
    ) => {
      const mockRequest = {
        ...request,
        user: {
          userId: 1,
          email: 'yamada@example.com',
          name: '山田太郎',
          isManager: false,
        },
      };
      return handler(mockRequest as AuthenticatedRequest);
    }
  ),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    salesPerson: {
      findUnique: vi.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';

// 型定義
type MockedFindUnique = Mock<
  [
    {
      where: { salesPersonId: number };
      select: {
        salesPersonId: boolean;
        name: boolean;
        email: boolean;
        department: boolean;
        isManager: boolean;
      };
    },
  ],
  Promise<{
    salesPersonId: number;
    name: string;
    email: string;
    department: string;
    isManager: boolean;
  } | null>
>;

describe('Auth Me API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/auth/me', () => {
    it('認証済みユーザーの情報を取得できる', async () => {
      // モックデータの準備
      const mockUser = {
        salesPersonId: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        isManager: false,
      };

      (
        prisma.salesPerson.findUnique as unknown as MockedFindUnique
      ).mockResolvedValue(mockUser);

      // リクエストの作成
      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      // APIの実行
      const response = await GET(request);
      const data = await response.json();

      // 検証
      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: false,
      });

      expect(prisma.salesPerson.findUnique).toHaveBeenCalledWith({
        where: {
          salesPersonId: 1,
        },
        select: {
          salesPersonId: true,
          name: true,
          email: true,
          department: true,
          isManager: true,
        },
      });
    });

    it('管理者ユーザーの情報を正しく取得できる', async () => {
      // 管理者用のモックデータ
      const mockManagerUser = {
        salesPersonId: 2,
        name: '田中花子',
        email: 'tanaka@example.com',
        department: '営業2課',
        isManager: true,
      };

      (
        prisma.salesPerson.findUnique as unknown as MockedFindUnique
      ).mockResolvedValue(mockManagerUser);

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: 2,
        name: '田中花子',
        email: 'tanaka@example.com',
        department: '営業2課',
        is_manager: true,
      });
    });

    it('ユーザーが見つからない場合は404エラーを返す', async () => {
      (
        prisma.salesPerson.findUnique as unknown as MockedFindUnique
      ).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'ユーザーが見つかりません',
        },
      });

      expect(prisma.salesPerson.findUnique).toHaveBeenCalledWith({
        where: {
          salesPersonId: 1,
        },
        select: {
          salesPersonId: true,
          name: true,
          email: true,
          department: true,
          isManager: true,
        },
      });
    });

    it('データベースエラー発生時は500エラーを返す', async () => {
      const dbError = new Error('Database connection failed');
      (
        prisma.salesPerson.findUnique as unknown as MockedFindUnique
      ).mockRejectedValue(dbError);

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      });

      expect(prisma.salesPerson.findUnique).toHaveBeenCalled();
    });

    it('ユーザーIDが正しくrequireAuthから渡される', async () => {
      const mockUser = {
        salesPersonId: 123,
        name: 'テストユーザー',
        email: 'test@example.com',
        department: 'テスト部署',
        isManager: false,
      };

      (
        prisma.salesPerson.findUnique as unknown as MockedFindUnique
      ).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(123);
      expect(data.name).toBe('テストユーザー');
    });

    it('必要なフィールドのみをselect句で取得している', async () => {
      const mockUser = {
        salesPersonId: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        isManager: false,
      };

      (
        prisma.salesPerson.findUnique as unknown as MockedFindUnique
      ).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      await GET(request);

      // select句に必要なフィールドが含まれているか確認
      expect(prisma.salesPerson.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            salesPersonId: true,
            name: true,
            email: true,
            department: true,
            isManager: true,
          }),
        })
      );
    });

    it('レスポンスのフィールド名がsnake_caseに変換されている', async () => {
      const mockUser = {
        salesPersonId: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        isManager: false,
      };

      (
        prisma.salesPerson.findUnique as unknown as MockedFindUnique
      ).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      // camelCaseではなくsnake_caseでレスポンスが返されることを確認
      expect(data).toHaveProperty('is_manager');
      expect(data).not.toHaveProperty('isManager');
    });
  });
});
