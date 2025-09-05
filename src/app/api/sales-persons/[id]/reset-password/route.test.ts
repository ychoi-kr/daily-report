import { NextRequest } from 'next/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

// Mock PrismaClient
const mockPrismaClient = {
  salesPerson: {
    findUnique: vi.fn(),
    update: vi.fn(),
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

describe('/api/sales-persons/[id]/reset-password', () => {
  const mockParams = { id: '1' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await vi.clearAllTimers();
  });

  describe('POST /api/sales-persons/[id]/reset-password', () => {
    it('パスワードを正常にリセットできる', async () => {
      // Arrange
      const requestData = {
        password: 'NewPassword123',
      };

      const existingSalesPerson = {
        salesPersonId: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        isActive: true,
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(existingSalesPerson);
      mockBcrypt.hash.mockResolvedValue('hashed_new_password');
      mockPrismaClient.salesPerson.update.mockResolvedValue({
        ...existingSalesPerson,
        updatedAt: new Date(),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/sales-persons/1/reset-password',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );

      // Act
      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('パスワードをリセットしました');
      expect(data.user).toMatchObject({
        id: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
      });

      expect(mockBcrypt.hash).toHaveBeenCalledWith('NewPassword123', 12);
      expect(mockPrismaClient.salesPerson.update).toHaveBeenCalledWith({
        where: { salesPersonId: 1 },
        data: {
          password: 'hashed_new_password',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('存在しないIDで404エラーが返る', async () => {
      // Arrange
      const requestData = {
        password: 'NewPassword123',
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/sales-persons/999/reset-password',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );

      // Act
      const response = await POST(request, { params: { id: '999' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
      expect(data.error.message).toBe('営業担当者が見つかりません');
    });

    it('無効なアカウントで403エラーが返る', async () => {
      // Arrange
      const requestData = {
        password: 'NewPassword123',
      };

      const inactiveSalesPerson = {
        salesPersonId: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        isActive: false, // 無効なアカウント
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(inactiveSalesPerson);

      const request = new NextRequest(
        'http://localhost:3000/api/sales-persons/1/reset-password',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );

      // Act
      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data.error.code).toBe('ACCOUNT_INACTIVE');
      expect(data.error.message).toBe('無効なアカウントのパスワードはリセットできません');
    });

    it('不正なID形式で400エラーが返る', async () => {
      // Arrange
      const requestData = {
        password: 'NewPassword123',
      };

      const request = new NextRequest(
        'http://localhost:3000/api/sales-persons/invalid/reset-password',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );

      // Act
      const response = await POST(request, { params: { id: 'invalid' } });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('Invalid ID format');
    });

    it('不正なパスワードでバリデーションエラーが返る', async () => {
      // Arrange
      const invalidPasswords = [
        { password: '' }, // 空文字
        { password: '123' }, // 短すぎる
        { password: 'password' }, // 大文字・数字なし
        { password: 'PASSWORD123' }, // 小文字なし
        { password: 'Password' }, // 数字なし
      ];

      const existingSalesPerson = {
        salesPersonId: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        isActive: true,
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(existingSalesPerson);

      for (const invalidData of invalidPasswords) {
        const request = new NextRequest(
          'http://localhost:3000/api/sales-persons/1/reset-password',
          {
            method: 'POST',
            body: JSON.stringify(invalidData),
          }
        );

        // Act
        const response = await POST(request, { params: mockParams });
        const data = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(data.error.code).toBe('VALIDATION_ERROR');
        expect(data.error.message).toBe('Invalid request data');
      }
    });

    it('パスワードの最大長制限が機能する', async () => {
      // Arrange
      const requestData = {
        password: 'A'.repeat(101) + 'b1', // 101文字を超える
      };

      const existingSalesPerson = {
        salesPersonId: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        isActive: true,
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(existingSalesPerson);

      const request = new NextRequest(
        'http://localhost:3000/api/sales-persons/1/reset-password',
        {
          method: 'POST',
          body: JSON.stringify(requestData),
        }
      );

      // Act
      const response = await POST(request, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('有効なパスワードの境界値テスト', async () => {
      // Arrange
      const validPasswords = [
        'Aa123456', // 最小8文字
        'A'.repeat(99) + 'a1', // 最大100文字
      ];

      const existingSalesPerson = {
        salesPersonId: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        isActive: true,
      };

      mockPrismaClient.salesPerson.findUnique.mockResolvedValue(existingSalesPerson);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockPrismaClient.salesPerson.update.mockResolvedValue(existingSalesPerson);

      for (const password of validPasswords) {
        const requestData = { password };

        const request = new NextRequest(
          'http://localhost:3000/api/sales-persons/1/reset-password',
          {
            method: 'POST',
            body: JSON.stringify(requestData),
          }
        );

        // Act
        const response = await POST(request, { params: mockParams });

        // Assert
        expect(response.status).toBe(200);
      }
    });
  });
});