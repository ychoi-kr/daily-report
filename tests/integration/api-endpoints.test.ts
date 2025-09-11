import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { JWTUtil } from '@/lib/auth';
import { createMockPrismaClient, testUsers, createMockData } from '../utils/prisma-mock';

// API ルートハンドラーをインポート
import { GET as getReports, POST as createReport } from '@/app/api/reports/route';
import { GET as getReport, PUT as updateReport, DELETE as deleteReport } from '@/app/api/reports/[id]/route';
import { POST as createComment } from '@/app/api/reports/[id]/comments/route';
import { GET as getCustomers, POST as createCustomer } from '@/app/api/customers/route';
import { GET as getSalesPersons, POST as createSalesPerson } from '@/app/api/sales-persons/route';

// Prismaクライアントをモック
const mockPrisma = createMockPrismaClient();
vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('API Endpoints Integration Tests', () => {
  let regularUserToken: string;
  let managerUserToken: string;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // JWTトークンを生成
    regularUserToken = JWTUtil.generateAccessToken(testUsers.regularUser);
    managerUserToken = JWTUtil.generateAccessToken(testUsers.managerUser);
  });

  describe('日報管理フロー（E2E）', () => {
    it('日報の作成→取得→更新→削除の一連のフローが正常に動作する', async () => {
      // 1. 日報作成のテストデータ準備
      const createData = {
        report_date: '2025-01-15',
        problem: 'テスト課題: 新規開拓が困難',
        plan: 'テスト計画: 既存顧客へのフォローアップ強化',
        visits: [
          {
            customer_id: 1,
            visit_content: 'システム導入の検討について打ち合わせ',
            visit_time: '10:30',
          },
          {
            customer_id: 2,
            visit_content: 'サービス更新の提案',
            visit_time: '14:00',
          },
        ],
      };

      // 2. 重複チェック（なし）
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);
      
      // 3. 作成処理
      const createdReport = {
        reportId: 1,
        salesPersonId: testUsers.regularUser.id,
        reportDate: new Date(createData.report_date),
        problem: createData.problem,
        plan: createData.plan,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockPrisma.dailyReport.create.mockResolvedValue(createdReport);
      mockPrisma.visitRecord.createMany.mockResolvedValue({ count: 2 });

      const createRequest = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${regularUserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      const createResponse = await createReport(createRequest);
      const createResult = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createResult.id).toBe(1);
      expect(createResult.problem).toBe(createData.problem);

      // 4. 作成した日報の取得
      const reportWithDetails = {
        ...createdReport,
        salesPerson: createMockData.salesPerson({
          salesPersonId: testUsers.regularUser.id,
          name: testUsers.regularUser.name,
          email: testUsers.regularUser.email,
        }),
        visitRecords: [
          {
            visitId: 1,
            visitContent: 'システム導入の検討について打ち合わせ',
            visitTime: '10:30',
            customer: createMockData.customer({ customerId: 1, companyName: 'A社' }),
          },
          {
            visitId: 2,
            visitContent: 'サービス更新の提案',
            visitTime: '14:00',
            customer: createMockData.customer({ customerId: 2, companyName: 'B社' }),
          },
        ],
        managerComments: [],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(reportWithDetails);

      const getRequest = new NextRequest('http://localhost:3000/api/reports/1', {
        headers: {
          authorization: `Bearer ${regularUserToken}`,
        },
      });

      const getResponse = await getReport(getRequest, { params: { id: '1' } });
      const getResult = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getResult.id).toBe(1);
      expect(getResult.visits).toHaveLength(2);
      expect(getResult.comments).toHaveLength(0);

      // 5. 日報の更新
      const updateData = {
        problem: '更新された課題: 新規開拓戦略の見直し',
        plan: '更新された計画: マーケティング強化',
        visits: [
          {
            id: 1,
            customer_id: 1,
            visit_content: '更新: システム導入の最終確認',
            visit_time: '11:00',
          },
        ],
      };

      const existingReportForUpdate = {
        reportId: 1,
        salesPersonId: testUsers.regularUser.id,
        visitRecords: [{ visitId: 1 }],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(existingReportForUpdate);
      mockPrisma.dailyReport.update.mockResolvedValue({
        ...createdReport,
        problem: updateData.problem,
        plan: updateData.plan,
        updatedAt: new Date(),
      });
      mockPrisma.visitRecord.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.visitRecord.createMany.mockResolvedValue({ count: 1 });

      const updateRequest = new NextRequest('http://localhost:3000/api/reports/1', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${regularUserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const updateResponse = await updateReport(updateRequest, { params: { id: '1' } });
      const updateResult = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateResult.problem).toBe(updateData.problem);
      expect(updateResult.plan).toBe(updateData.plan);

      // 6. 管理者によるコメント追加
      const commentData = {
        comment: '良い改善提案ですね。次回の会議で詳しく相談しましょう。',
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue({ reportId: 1 });
      mockPrisma.managerComment.create.mockResolvedValue({
        commentId: 1,
        reportId: 1,
        managerId: testUsers.managerUser.id,
        comment: commentData.comment,
        createdAt: new Date(),
      });

      const commentRequest = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${managerUserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      const commentResponse = await createComment(commentRequest, { params: { id: '1' } });
      const commentResult = await commentResponse.json();

      expect(commentResponse.status).toBe(201);
      expect(commentResult.comment).toBe(commentData.comment);

      // 7. 日報の削除
      mockPrisma.dailyReport.findUnique.mockResolvedValue({
        reportId: 1,
        salesPersonId: testUsers.regularUser.id,
      });
      mockPrisma.dailyReport.delete.mockResolvedValue(createdReport);

      const deleteRequest = new NextRequest('http://localhost:3000/api/reports/1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${regularUserToken}`,
        },
      });

      const deleteResponse = await deleteReport(deleteRequest, { params: { id: '1' } });

      expect(deleteResponse.status).toBe(204);
      expect(mockPrisma.dailyReport.delete).toHaveBeenCalledWith({
        where: { reportId: 1 },
      });
    });
  });

  describe('権限制御の統合テスト', () => {
    it('管理者と一般ユーザーの権限が正しく制御される', async () => {
      // 1. 一般ユーザーが他人の日報にアクセス（失敗）
      const otherUserReport = {
        reportId: 2,
        salesPersonId: 999, // 別のユーザーID
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(otherUserReport);

      const unauthorizedRequest = new NextRequest('http://localhost:3000/api/reports/2', {
        headers: {
          authorization: `Bearer ${regularUserToken}`,
        },
      });

      const unauthorizedResponse = await getReport(unauthorizedRequest, { params: { id: '2' } });
      expect(unauthorizedResponse.status).toBe(403);

      // 2. 管理者が他人の日報にアクセス（成功）
      const reportForManager = {
        ...otherUserReport,
        salesPerson: createMockData.salesPerson({ salesPersonId: 999 }),
        visitRecords: [],
        managerComments: [],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(reportForManager);

      const managerRequest = new NextRequest('http://localhost:3000/api/reports/2', {
        headers: {
          authorization: `Bearer ${managerUserToken}`,
        },
      });

      const managerResponse = await getReport(managerRequest, { params: { id: '2' } });
      expect(managerResponse.status).toBe(200);

      // 3. 一般ユーザーがコメント追加を試行（失敗）
      const commentAttempt = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${regularUserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ comment: 'テストコメント' }),
      });

      const commentAttemptResponse = await createComment(commentAttempt, { params: { id: '1' } });
      expect(commentAttemptResponse.status).toBe(403);
    });
  });

  describe('バリデーションの統合テスト', () => {
    it('不正なデータでリクエストした場合に適切なエラーを返す', async () => {
      // 1. 不正な日報作成データ
      const invalidReportData = {
        report_date: '2025/01/15', // 不正なフォーマット
        problem: '', // 空文字
        plan: 'x'.repeat(1001), // 文字数超過
        visits: [], // 必須項目不足
      };

      const invalidCreateRequest = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${regularUserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(invalidReportData),
      });

      const invalidCreateResponse = await createReport(invalidCreateRequest);
      const invalidCreateResult = await invalidCreateResponse.json();

      expect(invalidCreateResponse.status).toBe(400);
      expect(invalidCreateResult.error.code).toBe('VALIDATION_ERROR');
      expect(invalidCreateResult.error.details).toBeInstanceOf(Array);
      expect(invalidCreateResult.error.details.length).toBeGreaterThan(0);

      // 2. 不正なコメントデータ
      const invalidCommentData = {
        comment: 'x'.repeat(501), // 文字数超過
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue({ reportId: 1 });

      const invalidCommentRequest = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${managerUserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(invalidCommentData),
      });

      const invalidCommentResponse = await createComment(invalidCommentRequest, { params: { id: '1' } });
      const invalidCommentResult = await invalidCommentResponse.json();

      expect(invalidCommentResponse.status).toBe(400);
      expect(invalidCommentResult.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('エラーハンドリングの統合テスト', () => {
    it('存在しないリソースにアクセスした場合に404を返す', async () => {
      // 存在しない日報にアクセス
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);

      const notFoundRequest = new NextRequest('http://localhost:3000/api/reports/999', {
        headers: {
          authorization: `Bearer ${regularUserToken}`,
        },
      });

      const notFoundResponse = await getReport(notFoundRequest, { params: { id: '999' } });
      const notFoundResult = await notFoundResponse.json();

      expect(notFoundResponse.status).toBe(404);
      expect(notFoundResult.error.code).toBe('NOT_FOUND');
    });

    it('重複する日報を作成しようとした場合に409を返す', async () => {
      const duplicateData = {
        report_date: '2025-01-15',
        problem: 'テスト課題',
        plan: 'テスト計画',
        visits: [
          {
            customer_id: 1,
            visit_content: '訪問内容',
          },
        ],
      };

      // 既存の日報があることをモック
      mockPrisma.dailyReport.findUnique.mockResolvedValue({
        reportId: 1,
        salesPersonId: testUsers.regularUser.id,
      });

      const duplicateRequest = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${regularUserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(duplicateData),
      });

      const duplicateResponse = await createReport(duplicateRequest);
      const duplicateResult = await duplicateResponse.json();

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResult.error.code).toBe('DUPLICATE_REPORT');
    });

    it('認証なしでアクセスした場合に401を返す', async () => {
      const unauthenticatedRequest = new NextRequest('http://localhost:3000/api/reports');

      const unauthenticatedResponse = await getReports(unauthenticatedRequest);
      const unauthenticatedResult = await unauthenticatedResponse.json();

      expect(unauthenticatedResponse.status).toBe(401);
      expect(unauthenticatedResult.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('無効なJWTトークンでアクセスした場合に401を返す', async () => {
      const invalidTokenRequest = new NextRequest('http://localhost:3000/api/reports', {
        headers: {
          authorization: 'Bearer invalid-token-123',
        },
      });

      const invalidTokenResponse = await getReports(invalidTokenRequest);
      const invalidTokenResult = await invalidTokenResponse.json();

      expect(invalidTokenResponse.status).toBe(401);
      expect(invalidTokenResult.error.code).toBe('AUTH_TOKEN_INVALID');
    });
  });

  describe('ページネーションの統合テスト', () => {
    it('ページネーションパラメータが正しく処理される', async () => {
      const mockReports = Array.from({ length: 5 }, (_, i) => ({
        ...createMockData.dailyReport({ reportId: i + 1 }),
        salesPerson: createMockData.salesPerson({ salesPersonId: testUsers.regularUser.id }),
        visitRecords: [],
        managerComments: [],
      }));

      mockPrisma.dailyReport.findMany.mockResolvedValue(mockReports);
      mockPrisma.dailyReport.count.mockResolvedValue(25);

      const paginatedRequest = new NextRequest(
        'http://localhost:3000/api/reports?page=2&per_page=5&start_date=2025-01-01&end_date=2025-01-31',
        {
          headers: {
            authorization: `Bearer ${regularUserToken}`,
          },
        }
      );

      const paginatedResponse = await getReports(paginatedRequest);
      const paginatedResult = await paginatedResponse.json();

      expect(paginatedResponse.status).toBe(200);
      expect(paginatedResult.data).toHaveLength(5);
      expect(paginatedResult.pagination).toEqual({
        total: 25,
        page: 2,
        per_page: 5,
        total_pages: 5,
      });

      // データベースクエリのパラメータを確認
      expect(mockPrisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: expect.objectContaining({
            reportDate: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-01-31'),
            },
          }),
        })
      );
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量データでの一覧取得が適切に処理される', async () => {
      const largeDataSet = Array.from({ length: 100 }, (_, i) => ({
        ...createMockData.dailyReport({ reportId: i + 1 }),
        salesPerson: createMockData.salesPerson({ salesPersonId: testUsers.regularUser.id }),
        visitRecords: Array.from({ length: 3 }, (_, j) => ({ visitId: j + 1 })),
        managerComments: Array.from({ length: 2 }, (_, k) => ({ commentId: k + 1 })),
      }));

      mockPrisma.dailyReport.findMany.mockResolvedValue(largeDataSet.slice(0, 20));
      mockPrisma.dailyReport.count.mockResolvedValue(1000);

      const startTime = Date.now();
      
      const largeDataRequest = new NextRequest('http://localhost:3000/api/reports', {
        headers: {
          authorization: `Bearer ${regularUserToken}`,
        },
      });

      const largeDataResponse = await getReports(largeDataRequest);
      const largeDataResult = await largeDataResponse.json();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(largeDataResponse.status).toBe(200);
      expect(largeDataResult.data).toHaveLength(20);
      expect(largeDataResult.pagination.total).toBe(1000);
      
      // レスポンス時間の確認（モック環境では高速だが、実環境での目安）
      expect(responseTime).toBeLessThan(1000); // 1秒以内
    });
  });

  describe('並行処理テスト', () => {
    it('複数のリクエストが並行して処理される', async () => {
      // 複数の異なる日報データを準備
      const reportData1 = {
        report_date: '2025-01-15',
        problem: '課題1',
        plan: '計画1',
        visits: [{ customer_id: 1, visit_content: '内容1' }],
      };

      const reportData2 = {
        report_date: '2025-01-16',
        problem: '課題2',
        plan: '計画2',
        visits: [{ customer_id: 2, visit_content: '内容2' }],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);
      mockPrisma.dailyReport.create
        .mockResolvedValueOnce({ reportId: 1, ...reportData1 })
        .mockResolvedValueOnce({ reportId: 2, ...reportData2 });

      const request1 = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${regularUserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(reportData1),
      });

      const request2 = new NextRequest('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${regularUserToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(reportData2),
      });

      // 並行してリクエストを実行
      const [response1, response2] = await Promise.all([
        createReport(request1),
        createReport(request2),
      ]);

      const [result1, result2] = await Promise.all([
        response1.json(),
        response2.json(),
      ]);

      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);
      expect(result1.problem).toBe('課題1');
      expect(result2.problem).toBe('課題2');
    });
  });
});