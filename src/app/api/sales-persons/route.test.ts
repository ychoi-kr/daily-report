import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from './route';
import { verifyToken } from '@/lib/auth/verify';

// Mock PrismaClient
const mockPrismaClient = {
  salesPerson: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  $disconnect: vi.fn(),
};

// Mock bcryptjs
const mockBcrypt = {
  hash: vi.fn(),
};

// Mock modules
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

vi.mock('bcryptjs', () => mockBcrypt);

vi.mock('@/lib/auth/verify', () => ({
  verifyToken: vi.fn(),
}));

describe('/api/sales-persons', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await vi.clearAllTimers();
  });

  describe('GET /api/sales-persons', () => {
    it('認証されていない場合は401を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/sales-persons');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('営業担当者一覧を正常に取得できる', async () => {
      // Arrange
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      const mockSalesPersons = [
        {
          salesPersonId: 1,
          name: '山田太郎',
          email: 'yamada@example.com',
          department: '営業1課',
          isManager: false,
          isActive: true,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ];

      mockPrismaClient.salesPerson.count.mockResolvedValue(1);
      mockPrismaClient.salesPerson.findMany.mockResolvedValue(mockSalesPersons);

      const request = new NextRequest('http://localhost:3000/api/sales-persons');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        id: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: false,
        is_active: true,
      });
      expect(data.pagination).toMatchObject({
        total: 1,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });
    });

    it('検索パラメータで絞り込みができる', async () => {
      // Arrange
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      mockPrismaClient.salesPerson.count.mockResolvedValue(0);
      mockPrismaClient.salesPerson.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/sales-persons?search=山田&is_manager=true&page=2'
      );

      // Act
      await GET(request);

      // Assert
      expect(mockPrismaClient.salesPerson.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: '山田', mode: 'insensitive' } },
            { email: { contains: '山田', mode: 'insensitive' } },
            { department: { contains: '山田', mode: 'insensitive' } },
          ],
          isManager: true,
        },
      });

      expect(mockPrismaClient.salesPerson.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isManager: true,
        }),
        skip: 20, // page 2 with per_page 20
        take: 20,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('不正なクエリパラメータでバリデーションエラーが返る', async () => {
      // Arrange
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/sales-persons?page=invalid'
      );

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/sales-persons', () => {
    it('認証されていない場合は401を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/sales-persons', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('管理者でない場合は403を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      const request = new NextRequest('http://localhost:3000/api/sales-persons', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('管理者の場合、営業担当者を正常に作成できる', async () => {
      // Arrange
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      const requestData = {
        name: '新規太郎',
        email: 'shinki@example.com',
        password: 'Password123',
        department: '営業2課',
        is_manager: false,
        is_active: true,
      };

      const mockCreatedPerson = {
        salesPersonId: 2,
        name: '新規太郎',
        email: 'shinki@example.com',
        department: '営業2課',
        isManager: false,
        isActive: true,
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date('2025-01-02'),
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(null); // 重複なし
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockPrismaClient.salesPerson.create.mockResolvedValue(mockCreatedPerson);

      const request = new NextRequest('http://localhost:3000/api/sales-persons', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        id: 2,
        name: '新規太郎',
        email: 'shinki@example.com',
        department: '営業2課',
        is_manager: false,
        is_active: true,
      });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('Password123', 12);
    });

    it('重複するメールアドレスで409エラーが返る', async () => {
      // Arrange
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      const requestData = {
        name: '重複太郎',
        email: 'existing@example.com',
        password: 'Password123',
        department: '営業1課',
        is_manager: false,
        is_active: true,
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue({
        salesPersonId: 1,
      }); // 既存ユーザー

      const request = new NextRequest('http://localhost:3000/api/sales-persons', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.error.code).toBe('DUPLICATE_EMAIL');
      expect(data.error.message).toBe('このメールアドレスは既に使用されています');
    });

    it('不正なリクエストデータでバリデーションエラーが返る', async () => {
      // Arrange
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      const invalidData = {
        name: '', // 必須項目が空
        email: 'invalid-email', // 不正なメール形式
        password: '123', // 短すぎるパスワード
      };

      const request = new NextRequest('http://localhost:3000/api/sales-persons', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ])
      );
    });
  });
});