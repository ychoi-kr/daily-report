import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, PUT, DELETE } from './route';

// Mock PrismaClient
const mockPrismaClient = {
  salesPerson: {
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  dailyReport: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  managerComment: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  $disconnect: vi.fn(),
};

// Mock modules
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrismaClient),
}));

describe('/api/sales-persons/[id]', () => {
  const mockParams = { id: '1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await vi.clearAllTimers();
  });

  describe('GET /api/sales-persons/[id]', () => {
    it('営業担当者の詳細を正常に取得できる', async () => {
      // Arrange
      const mockSalesPerson = {
        salesPersonId: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        isManager: false,
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(mockSalesPerson);

      const request = new NextRequest('http://localhost:3000/api/sales-persons/1');

      // Act
      const response = await GET(request, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        department: '営業1課',
        is_manager: false,
        is_active: true,
      });
      expect(mockPrismaClient.salesPerson.findUnique).toHaveBeenCalledWith({
        where: { salesPersonId: 1 },
        select: expect.any(Object),
      });
    });

    it('存在しないIDで404エラーが返る', async () => {
      // Arrange
      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/sales-persons/999');

      // Act
      const response = await GET(request, { params: { id: '999' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toBe('営業担当者が見つかりません');
    });

    it('不正なID形式で400エラーが返る', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/sales-persons/invalid');

      // Act
      const response = await GET(request, { params: { id: 'invalid' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid ID format');
    });
  });

  describe('PUT /api/sales-persons/[id]', () => {
    it('営業担当者を正常に更新できる', async () => {
      // Arrange
      const updateData = {
        name: '山田太郎（更新）',
        department: '営業2課',
        is_manager: true,
      };

      const existingSalesPerson = {
        salesPersonId: 1,
        email: 'yamada@example.com',
      };

      const updatedSalesPerson = {
        salesPersonId: 1,
        name: '山田太郎（更新）',
        email: 'yamada@example.com',
        department: '営業2課',
        isManager: true,
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02'),
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(existingSalesPerson);
      mockPrismaClient.salesPerson.update.mockResolvedValue(updatedSalesPerson);

      const request = new NextRequest('http://localhost:3000/api/sales-persons/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(request, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: 1,
        name: '山田太郎（更新）',
        department: '営業2課',
        is_manager: true,
      });
      expect(mockPrismaClient.salesPerson.update).toHaveBeenCalledWith({
        where: { salesPersonId: 1 },
        data: {
          name: '山田太郎（更新）',
          department: '営業2課',
          isManager: true,
        },
        select: expect.any(Object),
      });
    });

    it('メールアドレス変更時の重複チェックが動作する', async () => {
      // Arrange
      const updateData = {
        email: 'existing@example.com',
      };

      const existingSalesPerson = {
        salesPersonId: 1,
        email: 'yamada@example.com',
      };

      const duplicateUser = {
        salesPersonId: 2,
        email: 'existing@example.com',
      };

      mockPrismaClient.salesPerson.findUnique
        .mockResolvedValueOnce(existingSalesPerson) // 存在チェック
        .mockResolvedValueOnce(duplicateUser); // 重複チェック

      const request = new NextRequest('http://localhost:3000/api/sales-persons/1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Act
      const response = await PUT(request, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(409);
      expect(data.error.code).toBe('DUPLICATE_EMAIL');
    });
  });

  describe('DELETE /api/sales-persons/[id]', () => {
    it('関連データがない場合は物理削除される', async () => {
      // Arrange
      const existingSalesPerson = {
        salesPersonId: 1,
        name: '山田太郎',
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(existingSalesPerson);
      mockPrismaClient.dailyReport.findMany.mockResolvedValue([]); // 関連する日報なし
      mockPrismaClient.managerComment.findMany.mockResolvedValue([]); // 関連するコメントなし
      mockPrismaClient.salesPerson.delete.mockResolvedValue(existingSalesPerson);

      const request = new NextRequest('http://localhost:3000/api/sales-persons/1', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: mockParams });

      // Assert
      expect(response.status).toBe(204);
      expect(mockPrismaClient.salesPerson.delete).toHaveBeenCalledWith({
        where: { salesPersonId: 1 },
      });
    });

    it('関連データがある場合は論理削除される', async () => {
      // Arrange
      const existingSalesPerson = {
        salesPersonId: 1,
        name: '山田太郎',
      };

      const relatedReports = [{ reportId: 1 }]; // 関連する日報あり

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(existingSalesPerson);
      mockPrismaClient.dailyReport.findMany.mockResolvedValue(relatedReports);
      mockPrismaClient.managerComment.findMany.mockResolvedValue([]);
      mockPrismaClient.salesPerson.update.mockResolvedValue({
        ...existingSalesPerson,
        isActive: false,
      });

      const request = new NextRequest('http://localhost:3000/api/sales-persons/1', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: mockParams });

      // Assert
      expect(response.status).toBe(204);
      expect(mockPrismaClient.salesPerson.update).toHaveBeenCalledWith({
        where: { salesPersonId: 1 },
        data: { isActive: false },
      });
      expect(mockPrismaClient.salesPerson.delete).not.toHaveBeenCalled();
    });

    it('存在しないIDで404エラーが返る', async () => {
      // Arrange
      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/sales-persons/999', {
        method: 'DELETE',
      });

      // Act
      const response = await DELETE(request, { params: { id: '999' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toBe('営業担当者が見つかりません');
    });
  });
});