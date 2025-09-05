import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// モックの設定
vi.mock('@/lib/auth/middleware', () => ({
  requireAuth: vi.fn((request: NextRequest, handler: Function) => {
    const mockRequest = {
      ...request,
      user: {
        userId: 1,
        email: 'test@example.com',
        name: 'Test User',
        isManager: false,
      },
    };
    return handler(mockRequest);
  }),
  requireManager: vi.fn((request: NextRequest, handler: Function) => {
    const isManager = request.headers.get('x-test-manager') === 'true';
    
    if (!isManager) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'FORBIDDEN',
            message: 'この操作を行う権限がありません',
          },
        }),
        { status: 403 }
      );
    }
    
    const mockRequest = {
      ...request,
      user: {
        userId: 2,
        email: 'manager@example.com',
        name: 'Manager User',
        isManager: true,
      },
    };
    return handler(mockRequest);
  }),
}));

vi.mock('@/lib/db/comments', () => ({
  getCommentsByReportId: vi.fn(),
  checkReportExists: vi.fn(),
  createComment: vi.fn(),
  disconnectDatabase: vi.fn(),
}));

import {
  getCommentsByReportId,
  checkReportExists,
  createComment,
  disconnectDatabase,
} from '@/lib/db/comments';

describe('Comments API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/reports/[id]/comments', () => {
    it('指定された日報のコメント一覧を取得できる', async () => {
      // モックデータの準備
      const mockComments = [
        {
          commentId: 1,
          reportId: 1,
          managerId: 2,
          comment: 'よく頑張りました',
          createdAt: new Date('2025-01-01T10:00:00Z'),
          manager: {
            salesPersonId: 2,
            name: '田中部長',
          },
        },
        {
          commentId: 2,
          reportId: 1,
          managerId: 3,
          comment: '明日の計画について詳しく聞かせてください',
          createdAt: new Date('2025-01-01T11:00:00Z'),
          manager: {
            salesPersonId: 3,
            name: '佐藤課長',
          },
        },
      ];

      (checkReportExists as any).mockResolvedValue(true);
      (getCommentsByReportId as any).mockResolvedValue(mockComments);

      // リクエストの作成
      const request = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'GET',
      });

      // APIの実行
      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      // 検証
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toEqual({
        id: 1,
        report_id: 1,
        manager_id: 2,
        manager: {
          id: 2,
          name: '田中部長',
        },
        comment: 'よく頑張りました',
        created_at: '2025-01-01T10:00:00.000Z',
      });

      expect(checkReportExists).toHaveBeenCalledWith(1);
      expect(getCommentsByReportId).toHaveBeenCalledWith(1);
      expect(disconnectDatabase).toHaveBeenCalled();
    });

    it('存在しない日報IDの場合は404エラーを返す', async () => {
      (checkReportExists as any).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/reports/999/comments', {
        method: 'GET',
      });

      const response = await GET(request, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: {
          code: 'REPORT_NOT_FOUND',
          message: '指定された日報が見つかりません',
        },
      });

      expect(checkReportExists).toHaveBeenCalledWith(999);
      expect(getCommentsByReportId).not.toHaveBeenCalled();
      expect(disconnectDatabase).toHaveBeenCalled();
    });

    it('無効な日報IDの場合は400エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/invalid/comments', {
        method: 'GET',
      });

      const response = await GET(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: {
          code: 'INVALID_REPORT_ID',
          message: '無効な日報IDです',
        },
      });

      expect(checkReportExists).not.toHaveBeenCalled();
      expect(disconnectDatabase).toHaveBeenCalled();
    });

    it('コメントが0件の場合も正常に空配列を返す', async () => {
      (checkReportExists as any).mockResolvedValue(true);
      (getCommentsByReportId as any).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'GET',
      });

      const response = await GET(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        data: [],
      });

      expect(disconnectDatabase).toHaveBeenCalled();
    });
  });

  describe('POST /api/reports/[id]/comments', () => {
    it('管理者はコメントを追加できる', async () => {
      const mockNewComment = {
        commentId: 3,
        reportId: 1,
        managerId: 2,
        comment: '新規開拓について明日相談しましょう',
        createdAt: new Date('2025-01-01T12:00:00Z'),
        manager: {
          salesPersonId: 2,
          name: '田中部長',
        },
      };

      (checkReportExists as any).mockResolvedValue(true);
      (createComment as any).mockResolvedValue(mockNewComment);

      const request = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-manager': 'true',
        },
        body: JSON.stringify({
          comment: '新規開拓について明日相談しましょう',
        }),
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        id: 3,
        report_id: 1,
        manager_id: 2,
        manager: {
          id: 2,
          name: '田中部長',
        },
        comment: '新規開拓について明日相談しましょう',
        created_at: '2025-01-01T12:00:00.000Z',
      });

      expect(checkReportExists).toHaveBeenCalledWith(1);
      expect(createComment).toHaveBeenCalledWith(
        1,
        2,
        '新規開拓について明日相談しましょう'
      );
      expect(disconnectDatabase).toHaveBeenCalled();
    });

    it('一般ユーザーはコメントを追加できない', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-manager': 'false',
        },
        body: JSON.stringify({
          comment: 'コメントを追加',
        }),
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        error: {
          code: 'FORBIDDEN',
          message: 'この操作を行う権限がありません',
        },
      });

      expect(checkReportExists).not.toHaveBeenCalled();
      expect(createComment).not.toHaveBeenCalled();
    });

    it('空のコメントは追加できない', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-manager': 'true',
        },
        body: JSON.stringify({
          comment: '',
        }),
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('入力値が不正です');
      expect(data.error.details[0].message).toBe('コメントは必須項目です');

      expect(checkReportExists).not.toHaveBeenCalled();
      expect(createComment).not.toHaveBeenCalled();
      expect(disconnectDatabase).toHaveBeenCalled();
    });

    it('501文字以上のコメントは追加できない', async () => {
      const longComment = 'あ'.repeat(501);
      
      const request = new NextRequest('http://localhost:3000/api/reports/1/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-manager': 'true',
        },
        body: JSON.stringify({
          comment: longComment,
        }),
      });

      const response = await POST(request, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.message).toBe('入力値が不正です');
      expect(data.error.details[0].message).toBe('コメントは500文字以内で入力してください');

      expect(checkReportExists).not.toHaveBeenCalled();
      expect(createComment).not.toHaveBeenCalled();
      expect(disconnectDatabase).toHaveBeenCalled();
    });

    it('存在しない日報にはコメントを追加できない', async () => {
      (checkReportExists as any).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/reports/999/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-manager': 'true',
        },
        body: JSON.stringify({
          comment: 'コメントを追加',
        }),
      });

      const response = await POST(request, { params: { id: '999' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: {
          code: 'REPORT_NOT_FOUND',
          message: '指定された日報が見つかりません',
        },
      });

      expect(checkReportExists).toHaveBeenCalledWith(999);
      expect(createComment).not.toHaveBeenCalled();
      expect(disconnectDatabase).toHaveBeenCalled();
    });

    it('無効な日報IDの場合は400エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/reports/invalid/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-manager': 'true',
        },
        body: JSON.stringify({
          comment: 'コメントを追加',
        }),
      });

      const response = await POST(request, { params: { id: 'invalid' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: {
          code: 'INVALID_REPORT_ID',
          message: '無効な日報IDです',
        },
      });

      expect(checkReportExists).not.toHaveBeenCalled();
      expect(createComment).not.toHaveBeenCalled();
      expect(disconnectDatabase).toHaveBeenCalled();
    });
  });
});