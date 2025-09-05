import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  getCommentsByReportId,
  checkReportExists,
  createComment,
  isManager,
  disconnectDatabase,
} from './comments';

// Prismaクライアントのモック
vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    managerComment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    dailyReport: {
      findUnique: vi.fn(),
    },
    salesPerson: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  };

  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('Comments Database Operations', () => {
  let prisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getCommentsByReportId', () => {
    it('指定された日報IDのコメント一覧を取得できる', async () => {
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

      prisma.managerComment.findMany.mockResolvedValue(mockComments);

      const result = await getCommentsByReportId(1);

      expect(result).toEqual(mockComments);
      expect(prisma.managerComment.findMany).toHaveBeenCalledWith({
        where: { reportId: 1 },
        include: {
          manager: {
            select: {
              salesPersonId: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('コメントが存在しない場合は空配列を返す', async () => {
      prisma.managerComment.findMany.mockResolvedValue([]);

      const result = await getCommentsByReportId(999);

      expect(result).toEqual([]);
      expect(prisma.managerComment.findMany).toHaveBeenCalledWith({
        where: { reportId: 999 },
        include: {
          manager: {
            select: {
              salesPersonId: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('データベースエラーの場合はエラーをスローする', async () => {
      prisma.managerComment.findMany.mockRejectedValue(new Error('Database error'));

      await expect(getCommentsByReportId(1)).rejects.toThrow('コメントの取得に失敗しました');
    });
  });

  describe('checkReportExists', () => {
    it('日報が存在する場合はtrueを返す', async () => {
      prisma.dailyReport.findUnique.mockResolvedValue({ reportId: 1 });

      const result = await checkReportExists(1);

      expect(result).toBe(true);
      expect(prisma.dailyReport.findUnique).toHaveBeenCalledWith({
        where: { reportId: 1 },
        select: { reportId: true },
      });
    });

    it('日報が存在しない場合はfalseを返す', async () => {
      prisma.dailyReport.findUnique.mockResolvedValue(null);

      const result = await checkReportExists(999);

      expect(result).toBe(false);
      expect(prisma.dailyReport.findUnique).toHaveBeenCalledWith({
        where: { reportId: 999 },
        select: { reportId: true },
      });
    });

    it('データベースエラーの場合はfalseを返す', async () => {
      prisma.dailyReport.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await checkReportExists(1);

      expect(result).toBe(false);
    });
  });

  describe('createComment', () => {
    it('コメントを正常に作成できる', async () => {
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

      // 日報存在チェック用のモック
      prisma.dailyReport.findUnique.mockResolvedValue({ reportId: 1 });
      
      // コメント作成用のモック
      prisma.managerComment.create.mockResolvedValue(mockNewComment);

      const result = await createComment(1, 2, '新規開拓について明日相談しましょう');

      expect(result).toEqual(mockNewComment);
      expect(prisma.dailyReport.findUnique).toHaveBeenCalledWith({
        where: { reportId: 1 },
        select: { reportId: true },
      });
      expect(prisma.managerComment.create).toHaveBeenCalledWith({
        data: {
          reportId: 1,
          managerId: 2,
          comment: '新規開拓について明日相談しましょう',
        },
        include: {
          manager: {
            select: {
              salesPersonId: true,
              name: true,
            },
          },
        },
      });
    });

    it('日報が存在しない場合はエラーをスローする', async () => {
      prisma.dailyReport.findUnique.mockResolvedValue(null);

      await expect(createComment(999, 2, 'コメント')).rejects.toThrow('指定された日報が見つかりません');
      
      expect(prisma.dailyReport.findUnique).toHaveBeenCalledWith({
        where: { reportId: 999 },
        select: { reportId: true },
      });
      expect(prisma.managerComment.create).not.toHaveBeenCalled();
    });

    it('データベースエラーの場合は適切なエラーをスローする', async () => {
      prisma.dailyReport.findUnique.mockResolvedValue({ reportId: 1 });
      prisma.managerComment.create.mockRejectedValue(new Error('Database error'));

      await expect(createComment(1, 2, 'コメント')).rejects.toThrow('Database error');
    });
  });

  describe('isManager', () => {
    it('管理者の場合はtrueを返す', async () => {
      prisma.salesPerson.findUnique.mockResolvedValue({ isManager: true });

      const result = await isManager(2);

      expect(result).toBe(true);
      expect(prisma.salesPerson.findUnique).toHaveBeenCalledWith({
        where: { salesPersonId: 2 },
        select: { isManager: true },
      });
    });

    it('一般ユーザーの場合はfalseを返す', async () => {
      prisma.salesPerson.findUnique.mockResolvedValue({ isManager: false });

      const result = await isManager(1);

      expect(result).toBe(false);
      expect(prisma.salesPerson.findUnique).toHaveBeenCalledWith({
        where: { salesPersonId: 1 },
        select: { isManager: true },
      });
    });

    it('ユーザーが存在しない場合はfalseを返す', async () => {
      prisma.salesPerson.findUnique.mockResolvedValue(null);

      const result = await isManager(999);

      expect(result).toBe(false);
    });

    it('データベースエラーの場合はfalseを返す', async () => {
      prisma.salesPerson.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await isManager(1);

      expect(result).toBe(false);
    });
  });

  describe('disconnectDatabase', () => {
    it('データベース接続を正常に切断できる', async () => {
      await disconnectDatabase();

      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });
});