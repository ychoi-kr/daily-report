import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from './route';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth/verify';

// モック設定
vi.mock('@prisma/client', () => {
  const mockPrismaClient = vi.fn(() => ({
    customer: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    visitRecord: {
      count: vi.fn(),
    },
    $disconnect: vi.fn(),
  }));
  return { PrismaClient: mockPrismaClient };
});

vi.mock('@/lib/auth/verify', () => ({
  verifyToken: vi.fn(),
}));

describe('/api/customers/[id]', () => {
  let prismaClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prismaClient = new PrismaClient();
  });

  describe('GET /api/customers/[id]', () => {
    it('認証されていない場合は401を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/customers/1');
      const response = await GET(request, { params: { id: '1' } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('無効なIDの場合は400を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      const request = new NextRequest('http://localhost/api/customers/invalid');
      const response = await GET(request, { params: { id: 'invalid' } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('存在しない顧客の場合は404を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      prismaClient.customer.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/customers/999');
      const response = await GET(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('顧客詳細を正常に取得できる', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        is_manager: false,
      });

      const mockCustomer = {
        customerId: 1,
        companyName: 'ABC商事',
        contactPerson: '佐藤一郎',
        phone: '03-1234-5678',
        email: 'sato@abc.co.jp',
        address: '東京都千代田区',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      prismaClient.customer.findUnique.mockResolvedValue(mockCustomer);

      const request = new NextRequest('http://localhost/api/customers/1');
      const response = await GET(request, { params: { id: '1' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(1);
      expect(data.company_name).toBe('ABC商事');
      expect(data.contact_person).toBe('佐藤一郎');
      expect(data.address).toBe('東京都千代田区');
    });
  });

  describe('PUT /api/customers/[id]', () => {
    it('認証されていない場合は401を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/customers/1', {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      const response = await PUT(request, { params: { id: '1' } });

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

      const request = new NextRequest('http://localhost/api/customers/1', {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      const response = await PUT(request, { params: { id: '1' } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('管理者の場合、顧客情報を更新できる', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      const existingCustomer = {
        customerId: 1,
        companyName: 'ABC商事',
        contactPerson: '佐藤一郎',
        phone: '03-1234-5678',
        email: 'sato@abc.co.jp',
        address: '東京都千代田区',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      const updatedCustomer = {
        ...existingCustomer,
        companyName: 'ABC商事株式会社',
        contactPerson: '佐藤太郎',
        updatedAt: new Date('2025-01-03'),
      };

      prismaClient.customer.findUnique.mockResolvedValue(existingCustomer);
      prismaClient.customer.update.mockResolvedValue(updatedCustomer);

      const requestBody = {
        company_name: 'ABC商事株式会社',
        contact_person: '佐藤太郎',
      };

      const request = new NextRequest('http://localhost/api/customers/1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });
      const response = await PUT(request, { params: { id: '1' } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.company_name).toBe('ABC商事株式会社');
      expect(data.contact_person).toBe('佐藤太郎');
    });

    it('存在しない顧客の更新は404を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      prismaClient.customer.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/customers/999', {
        method: 'PUT',
        body: JSON.stringify({ company_name: 'Test' }),
      });
      const response = await PUT(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/customers/[id]', () => {
    it('認証されていない場合は401を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/customers/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: '1' } });

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

      const request = new NextRequest('http://localhost/api/customers/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: '1' } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('管理者の場合、顧客を削除できる', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      const existingCustomer = {
        customerId: 1,
        companyName: 'ABC商事',
        contactPerson: '佐藤一郎',
        phone: '03-1234-5678',
        email: 'sato@abc.co.jp',
        address: '東京都千代田区',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      prismaClient.customer.findUnique.mockResolvedValue(existingCustomer);
      prismaClient.visitRecord.count.mockResolvedValue(0);
      prismaClient.customer.delete.mockResolvedValue(existingCustomer);

      const request = new NextRequest('http://localhost/api/customers/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: '1' } });

      expect(response.status).toBe(204);
    });

    it('訪問記録が存在する場合は409を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      const existingCustomer = {
        customerId: 1,
        companyName: 'ABC商事',
        contactPerson: '佐藤一郎',
        phone: '03-1234-5678',
        email: 'sato@abc.co.jp',
        address: '東京都千代田区',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      prismaClient.customer.findUnique.mockResolvedValue(existingCustomer);
      prismaClient.visitRecord.count.mockResolvedValue(5);

      const request = new NextRequest('http://localhost/api/customers/1', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: '1' } });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error.code).toBe('CONFLICT');
      expect(data.error.details[0].message).toContain('5件の訪問記録が存在します');
    });

    it('存在しない顧客の削除は404を返す', async () => {
      vi.mocked(verifyToken).mockResolvedValue({
        id: 1,
        email: 'admin@example.com',
        is_manager: true,
      });

      prismaClient.customer.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/customers/999', {
        method: 'DELETE',
      });
      const response = await DELETE(request, { params: { id: '999' } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });
});