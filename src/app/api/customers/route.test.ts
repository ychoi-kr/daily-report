import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth/verify';

// モック設定
vi.mock('@prisma/client', () => {
  const mockPrismaClient = vi.fn(() => ({
    customer: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $disconnect: vi.fn(),
  }));
  return { PrismaClient: mockPrismaClient };
});

vi.mock('@/lib/auth/verify', () => ({
  verifyToken: vi.fn(),
}));

describe('/api/customers', () => {
  let prismaClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaClient = new PrismaClient();
  });

  describe('GET /api/customers', () => {
    it('認証されていない場合は401を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/customers');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('顧客一覧を正常に取得できる', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      const mockCustomers = [
        {
          customerId: 1,
          companyName: 'ABC商事',
          contactPerson: '佐藤一郎',
          phone: '03-1234-5678',
          email: 'sato@abc.co.jp',
          address: '東京都千代田区',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
        {
          customerId: 2,
          companyName: 'XYZ工業',
          contactPerson: '鈴木二郎',
          phone: '06-2345-6789',
          email: 'suzuki@xyz.co.jp',
          address: '大阪府大阪市',
          createdAt: new Date('2025-01-02'),
          updatedAt: new Date('2025-01-02'),
        },
      ];

      prismaClient.customer.count.mockResolvedValue(2);
      prismaClient.customer.findMany.mockResolvedValue(mockCustomers);

      const request = new NextRequest('http://localhost/api/customers');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toHaveLength(2);
      expect(data.data[0].company_name).toBe('ABC商事');
      expect(data.pagination).toEqual({
        total: 2,
        page: 1,
        per_page: 20,
        total_pages: 1,
      });
    });

    it('検索パラメータで絞り込みができる', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      prismaClient.customer.count.mockResolvedValue(1);
      prismaClient.customer.findMany.mockResolvedValue([
        {
          customerId: 1,
          companyName: 'ABC商事',
          contactPerson: '佐藤一郎',
          phone: '03-1234-5678',
          email: 'sato@abc.co.jp',
          address: '東京都千代田区',
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ]);

      const request = new NextRequest('http://localhost/api/customers?search=ABC');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { companyName: { contains: 'ABC', mode: 'insensitive' } },
              { contactPerson: { contains: 'ABC', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('ページネーションが正しく動作する', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      prismaClient.customer.count.mockResolvedValue(50);
      prismaClient.customer.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost/api/customers?page=2&per_page=10'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prismaClient.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      const data = await response.json();
      expect(data.pagination).toEqual({
        total: 50,
        page: 2,
        per_page: 10,
        total_pages: 5,
      });
    });
  });

  describe('POST /api/customers', () => {
    it('認証されていない場合は401を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/customers', {
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

      const request = new NextRequest('http://localhost/api/customers', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('管理者の場合、顧客を作成できる', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      const newCustomer = {
        customerId: 3,
        companyName: '新規顧客',
        contactPerson: '田中三郎',
        phone: '090-1234-5678',
        email: 'tanaka@new.co.jp',
        address: '福岡県福岡市',
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-03'),
      };

      prismaClient.customer.create.mockResolvedValue(newCustomer);

      const requestBody = {
        company_name: '新規顧客',
        contact_person: '田中三郎',
        phone: '090-1234-5678',
        email: 'tanaka@new.co.jp',
        address: '福岡県福岡市',
      };

      const request = new NextRequest('http://localhost/api/customers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.company_name).toBe('新規顧客');
      expect(data.contact_person).toBe('田中三郎');
      expect(data.id).toBe(3);
    });

    it('不正なデータの場合はバリデーションエラーを返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      const requestBody = {
        company_name: '',
        contact_person: '',
        phone: '',
        email: 'invalid-email',
      };

      const request = new NextRequest('http://localhost/api/customers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details).toBeDefined();
    });
  });
});