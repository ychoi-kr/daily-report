import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getReports, POST as createReport } from '@/app/api/reports/route';
import { GET as getReport, PUT as updateReport, DELETE as deleteReport } from '@/app/api/reports/[id]/route';
import { GET as getComments, POST as createComment } from '@/app/api/reports/[id]/comments/route';
import { PrismaClient } from '@prisma/client';
import { JWTUtil } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Prisma Clientのモック
vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn();
  return { PrismaClient };
});

describe('Reports API', () => {
  let prisma: any;
  let mockUser: any;
  let mockManager: any;
  let mockToken: string;
  let mockManagerToken: string;

  beforeAll(() => {
    // Prismaモックのセットアップ
    prisma = {
      dailyReport: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      visitRecord: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      managerComment: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      salesPerson: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
      $disconnect: vi.fn(),
    };

    (PrismaClient as any).mockImplementation(() => prisma);

    // テストユーザー
    mockUser = {
      id: 1,
      name: 'テストユーザー',
      email: 'test@example.com',
      department: '営業部',
      isManager: false,
    };

    mockManager = {
      id: 2,
      name: 'テスト管理者',
      email: 'manager@example.com',
      department: '営業部',
      isManager: true,
    };

    // JWTトークン生成
    mockToken = JWTUtil.generateAccessToken(mockUser);
    mockManagerToken = JWTUtil.generateAccessToken(mockManager);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/reports', () => {
    it('日報一覧を正常に取得できる', async () => {
      const mockReports = [
        {
          reportId: 1,
          reportDate: new Date('2025-01-01'),
          salesPerson: {
            salesPersonId: 1,
            name: 'テストユーザー',
          },
          visitRecords: [{ visitId: 1 }, { visitId: 2 }],
          managerComments: [{ commentId: 1 }],
          createdAt: new Date('2025-01-01T09:00:00Z'),
        },
      ];

      prisma.dailyReport.findMany.mockResolvedValue(mockReports);
      prisma.dailyReport.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/reports', {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      });

      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe(1);
      expect(data.data[0].visit_count).toBe(2);
      expect(data.data[0].has_comments).toBe(true);
      expect(data.pagination.total).toBe(1);
    });

    it('ページネーションパラメータが正しく処理される', async () => {
      prisma.dailyReport.findMany.mockResolvedValue([]);
      prisma.dailyReport.count.mockResolvedValue(50);

      const request = new NextRequest('http://localhost:3000/api/reports?page=2&per_page=10', {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      });

      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pagination.page).toBe(2);
      expect(data.pagination.per_page).toBe(10);
      expect(data.pagination.total_pages).toBe(5);
    });

    it('認証なしでアクセスした場合エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports');

      const response = await getReports(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('AUTH_TOKEN_MISSING');
    });
  });

  describe('POST /api/reports', () => {
    it('日報を正常に作成できる', async () => {
      const reportDate = '2025-01-01';
      const createData = {
        report_date: reportDate,
        problem: 'テスト課題',
        plan: 'テスト計画',
        visits: [
          {
            customer_id: 1,
            visit_content: '訪問内容1',
            visit_time: '10:00',
          },
        ],
      };

      prisma.dailyReport.findUnique.mockResolvedValue(null); // 重複なし
      prisma.dailyReport.create.mockResolvedValue({
        reportId: 1,
        salesPersonId: 1,
        reportDate: new Date(reportDate),
        problem: createData.problem,
        plan: createData.plan,
        createdAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${mockToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      const response = await createReport(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe(1);
      expect(data.problem).toBe(createData.problem);
      expect(data.plan).toBe(createData.plan);
    });

    it('同じ日付の日報が既に存在する場合エラーを返す', async () => {
      const createData = {
        report_date: '2025-01-01',
        problem: 'テスト課題',
        plan: 'テスト計画',
        visits: [],
      };

      prisma.dailyReport.findUnique.mockResolvedValue({
        reportId: 1,
        salesPersonId: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${mockToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      const response = await createReport(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('DUPLICATE_REPORT');
    });

    it('バリデーションエラーを正しく返す', async () => {
      const invalidData = {
        report_date: 'invalid-date',
        problem: '',  // 空文字
        plan: 'テスト計画',
        visits: [],
      };

      const request = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${mockToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      const response = await createReport(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/reports/[id]', () => {
    it('日報詳細を正常に取得できる', async () => {
      const mockReport = {
        reportId: 1,
        salesPersonId: 1,
        reportDate: new Date('2025-01-01'),
        problem: 'テスト課題',
        plan: 'テスト計画',
        createdAt: new Date(),
        updatedAt: new Date(),
        salesPerson: {
          salesPersonId: 1,
          name: 'テストユーザー',
          email: 'test@example.com',
        },
        visitRecords: [
          {
            visitId: 1,
            visitContent: '訪問内容',
            visitTime: '10:00',
            customer: {
              customerId: 1,
              companyName: 'テスト会社',
            },
          },
        ],
        managerComments: [
          {
            commentId: 1,
            comment: 'テストコメント',
            createdAt: new Date(),
            manager: {
              salesPersonId: 2,
              name: 'テスト管理者',
            },
          },
        ],
      };

      prisma.dailyReport.findUnique.mockResolvedValue(mockReport);

      const request = new NextRequest('http://localhost:3000/api/reports/1', {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      });

      const response = await getReport(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(1);
      expect(data.problem).toBe('テスト課題');
      expect(data.visits).toHaveLength(1);
      expect(data.comments).toHaveLength(1);
    });

    it('存在しない日報IDの場合エラーを返す', async () => {
      prisma.dailyReport.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/reports/999', {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      });

      const response = await getReport(request, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('他人の日報を閲覧しようとした場合エラーを返す（一般ユーザー）', async () => {
      prisma.dailyReport.findUnique.mockResolvedValue({
        reportId: 1,
        salesPersonId: 999, // 別のユーザー
      });

      const request = new NextRequest('http://localhost:3000/api/reports/1', {
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      });

      const response = await getReport(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PUT /api/reports/[id]', () => {
    it('日報を正常に更新できる', async () => {
      const updateData = {
        problem: '更新された課題',
        plan: '更新された計画',
        visits: [
          {
            id: 1,
            customer_id: 1,
            visit_content: '更新された訪問内容',
            visit_time: '11:00',
          },
        ],
      };

      prisma.dailyReport.findUnique.mockResolvedValue({
        reportId: 1,
        salesPersonId: 1,
        visitRecords: [{ visitId: 1 }],
      });

      prisma.dailyReport.update.mockResolvedValue({
        reportId: 1,
        salesPersonId: 1,
        reportDate: new Date('2025-01-01'),
        problem: updateData.problem,
        plan: updateData.plan,
        updatedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/reports/1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${mockToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const response = await updateReport(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.problem).toBe(updateData.problem);
      expect(data.plan).toBe(updateData.plan);
    });

    it('他人の日報を更新しようとした場合エラーを返す', async () => {
      prisma.dailyReport.findUnique.mockResolvedValue({
        reportId: 1,
        salesPersonId: 999, // 別のユーザー
        visitRecords: [],
      });

      const request = new NextRequest('http://localhost:3000/api/reports/1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${mockToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ problem: 'test' }),
      });

      const response = await updateReport(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('DELETE /api/reports/[id]', () => {
    it('日報を正常に削除できる', async () => {
      prisma.dailyReport.findUnique.mockResolvedValue({
        reportId: 1,
        salesPersonId: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/reports/1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      });

      const response = await deleteReport(request, { params: { id: '1' } });

      expect(response.status).toBe(204);
      expect(prisma.dailyReport.delete).toHaveBeenCalledWith({
        where: { reportId: 1 },
      });
    });

    it('他人の日報を削除しようとした場合エラーを返す', async () => {
      prisma.dailyReport.findUnique.mockResolvedValue({
        reportId: 1,
        salesPersonId: 999, // 別のユーザー
      });

      const request = new NextRequest('http://localhost:3000/api/reports/1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${mockToken}`,
        },
      });

      const response = await deleteReport(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
      expect(prisma.dailyReport.delete).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/reports/[id]/comments', () => {
    it('管理者はコメントを追加できる', async () => {
      const commentData = {
        comment: 'テストコメント',
      };

      prisma.dailyReport.findUnique.mockResolvedValue({
        reportId: 1,
      });

      prisma.managerComment.create.mockResolvedValue({
        commentId: 1,
        reportId: 1,
        managerId: 2,
        comment: commentData.comment,
        createdAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${mockManagerToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      const response = await createComment(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.comment).toBe(commentData.comment);
    });

    it('一般ユーザーはコメントを追加できない', async () => {
      const commentData = {
        comment: 'テストコメント',
      };

      const request = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${mockToken}`, // 一般ユーザー
          'content-type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      const response = await createComment(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });
});