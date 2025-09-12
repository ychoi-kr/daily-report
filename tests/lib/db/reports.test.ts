import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPrismaClient, createMockData, testUsers } from '../../utils/prisma-mock';

// データベース操作をモック
const mockPrisma = createMockPrismaClient();
vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

// テスト対象のデータベース関数をここに実装
export class ReportsService {
  static async getReports(userId: number, options: {
    page?: number;
    perPage?: number;
    startDate?: Date;
    endDate?: Date;
    isManager?: boolean;
  } = {}) {
    const { page = 1, perPage = 20, startDate, endDate, isManager = false } = options;
    const offset = (page - 1) * perPage;

    const where: any = {};
    
    // 管理者でない場合は自分の日報のみ
    if (!isManager) {
      where.salesPersonId = userId;
    }

    // 日付範囲フィルタ
    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) where.reportDate.gte = startDate;
      if (endDate) where.reportDate.lte = endDate;
    }

    const [reports, total] = await Promise.all([
      mockPrisma.dailyReport.findMany({
        where,
        orderBy: { reportDate: 'desc' },
        skip: offset,
        take: perPage,
        include: {
          salesPerson: {
            select: {
              salesPersonId: true,
              name: true,
            },
          },
          visitRecords: {
            select: {
              visitId: true,
            },
          },
          managerComments: {
            select: {
              commentId: true,
            },
          },
        },
      }),
      mockPrisma.dailyReport.count({ where }),
    ]);

    return {
      reports: reports.map((report: any) => ({
        id: report.reportId,
        report_date: report.reportDate,
        sales_person: {
          id: report.salesPerson.salesPersonId,
          name: report.salesPerson.name,
        },
        visit_count: report.visitRecords.length,
        has_comments: report.managerComments.length > 0,
        created_at: report.createdAt,
      })),
      pagination: {
        total,
        page,
        per_page: perPage,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  static async getReportById(reportId: number, userId: number, isManager: boolean = false) {
    const report = await mockPrisma.dailyReport.findUnique({
      where: { reportId },
      include: {
        salesPerson: {
          select: {
            salesPersonId: true,
            name: true,
            email: true,
          },
        },
        visitRecords: {
          include: {
            customer: {
              select: {
                customerId: true,
                companyName: true,
              },
            },
          },
        },
        managerComments: {
          include: {
            manager: {
              select: {
                salesPersonId: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) return null;

    // アクセス権限チェック
    if (!isManager && report.salesPersonId !== userId) {
      throw new Error('FORBIDDEN');
    }

    return {
      id: report.reportId,
      sales_person: {
        id: report.salesPerson.salesPersonId,
        name: report.salesPerson.name,
        email: report.salesPerson.email,
      },
      report_date: report.reportDate,
      problem: report.problem,
      plan: report.plan,
      visits: report.visitRecords.map((visit: any) => ({
        id: visit.visitId,
        customer: {
          id: visit.customer.customerId,
          company_name: visit.customer.companyName,
        },
        visit_content: visit.visitContent,
        visit_time: visit.visitTime,
      })),
      comments: report.managerComments.map((comment: any) => ({
        id: comment.commentId,
        manager: {
          id: comment.manager.salesPersonId,
          name: comment.manager.name,
        },
        comment: comment.comment,
        created_at: comment.createdAt,
      })),
      created_at: report.createdAt,
      updated_at: report.updatedAt,
    };
  }

  static async createReport(data: {
    userId: number;
    reportDate: Date;
    problem: string;
    plan: string;
    visits: Array<{
      customerId: number;
      visitContent: string;
      visitTime?: string;
    }>;
  }) {
    // 重複チェック
    const existingReport = await mockPrisma.dailyReport.findUnique({
      where: {
        salesPersonId_reportDate: {
          salesPersonId: data.userId,
          reportDate: data.reportDate,
        },
      },
    });

    if (existingReport) {
      throw new Error('DUPLICATE_REPORT');
    }

    // トランザクション内で作成
    return mockPrisma.$transaction(async (tx: any) => {
      const report = await tx.dailyReport.create({
        data: {
          salesPersonId: data.userId,
          reportDate: data.reportDate,
          problem: data.problem,
          plan: data.plan,
        },
      });

      if (data.visits.length > 0) {
        await tx.visitRecord.createMany({
          data: data.visits.map((visit) => ({
            reportId: report.reportId,
            customerId: visit.customerId,
            visitContent: visit.visitContent,
            visitTime: visit.visitTime,
          })),
        });
      }

      return report;
    });
  }

  static async updateReport(reportId: number, userId: number, data: {
    problem?: string;
    plan?: string;
    visits?: Array<{
      id?: number;
      customerId: number;
      visitContent: string;
      visitTime?: string;
    }>;
  }) {
    // 存在チェック
    const existingReport = await mockPrisma.dailyReport.findUnique({
      where: { reportId },
      include: { visitRecords: true },
    });

    if (!existingReport) {
      throw new Error('NOT_FOUND');
    }

    // アクセス権限チェック
    if (existingReport.salesPersonId !== userId) {
      throw new Error('FORBIDDEN');
    }

    return mockPrisma.$transaction(async (tx: any) => {
      const report = await tx.dailyReport.update({
        where: { reportId },
        data: {
          problem: data.problem,
          plan: data.plan,
          updatedAt: new Date(),
        },
      });

      if (data.visits) {
        // 既存の訪問記録を削除
        await tx.visitRecord.deleteMany({
          where: { reportId },
        });

        // 新しい訪問記録を追加
        if (data.visits.length > 0) {
          await tx.visitRecord.createMany({
            data: data.visits.map((visit) => ({
              reportId,
              customerId: visit.customerId,
              visitContent: visit.visitContent,
              visitTime: visit.visitTime,
            })),
          });
        }
      }

      return report;
    });
  }

  static async deleteReport(reportId: number, userId: number) {
    const existingReport = await mockPrisma.dailyReport.findUnique({
      where: { reportId },
    });

    if (!existingReport) {
      throw new Error('NOT_FOUND');
    }

    // アクセス権限チェック
    if (existingReport.salesPersonId !== userId) {
      throw new Error('FORBIDDEN');
    }

    return mockPrisma.dailyReport.delete({
      where: { reportId },
    });
  }
}

describe('ReportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReports', () => {
    it('一般ユーザーは自分の日報のみ取得できる', async () => {
      const mockReports = [
        {
          ...createMockData.dailyReport({ reportId: 1, salesPersonId: 1 }),
          salesPerson: createMockData.salesPerson({ salesPersonId: 1 }),
          visitRecords: [{ visitId: 1 }, { visitId: 2 }],
          managerComments: [{ commentId: 1 }],
        },
      ];

      mockPrisma.dailyReport.findMany.mockResolvedValue(mockReports);
      mockPrisma.dailyReport.count.mockResolvedValue(1);

      const result = await ReportsService.getReports(1, { isManager: false });

      expect(mockPrisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { salesPersonId: 1 },
        })
      );
      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].visit_count).toBe(2);
      expect(result.reports[0].has_comments).toBe(true);
    });

    it('管理者は全ての日報を取得できる', async () => {
      const mockReports = [
        {
          ...createMockData.dailyReport({ reportId: 1, salesPersonId: 1 }),
          salesPerson: createMockData.salesPerson({ salesPersonId: 1 }),
          visitRecords: [],
          managerComments: [],
        },
        {
          ...createMockData.dailyReport({ reportId: 2, salesPersonId: 2 }),
          salesPerson: createMockData.salesPerson({ salesPersonId: 2 }),
          visitRecords: [],
          managerComments: [],
        },
      ];

      mockPrisma.dailyReport.findMany.mockResolvedValue(mockReports);
      mockPrisma.dailyReport.count.mockResolvedValue(2);

      const result = await ReportsService.getReports(1, { isManager: true });

      expect(mockPrisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
      expect(result.reports).toHaveLength(2);
    });

    it('日付範囲でフィルタリングできる', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      mockPrisma.dailyReport.findMany.mockResolvedValue([]);
      mockPrisma.dailyReport.count.mockResolvedValue(0);

      await ReportsService.getReports(1, { startDate, endDate });

      expect(mockPrisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            salesPersonId: 1,
            reportDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });

    it('ページネーションが正しく動作する', async () => {
      mockPrisma.dailyReport.findMany.mockResolvedValue([]);
      mockPrisma.dailyReport.count.mockResolvedValue(50);

      const result = await ReportsService.getReports(1, { page: 2, perPage: 10 });

      expect(mockPrisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(result.pagination).toEqual({
        total: 50,
        page: 2,
        per_page: 10,
        total_pages: 5,
      });
    });
  });

  describe('getReportById', () => {
    it('存在する日報を正しく取得できる', async () => {
      const mockReport = {
        ...createMockData.dailyReport({ reportId: 1, salesPersonId: 1 }),
        salesPerson: createMockData.salesPerson({ salesPersonId: 1 }),
        visitRecords: [
          {
            visitId: 1,
            visitContent: '訪問内容1',
            visitTime: '10:00',
            customer: createMockData.customer({ customerId: 1 }),
          },
        ],
        managerComments: [
          {
            ...createMockData.managerComment({ commentId: 1 }),
            manager: createMockData.salesPerson({ salesPersonId: 2, name: '管理者' }),
          },
        ],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(mockReport);

      const result = await ReportsService.getReportById(1, 1);

      expect(result).toBeDefined();
      expect(result!.id).toBe(1);
      expect(result!.visits).toHaveLength(1);
      expect(result!.comments).toHaveLength(1);
    });

    it('存在しない日報に対してnullを返す', async () => {
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);

      const result = await ReportsService.getReportById(999, 1);

      expect(result).toBeNull();
    });

    it('他人の日報にアクセスしようとするとエラーを投げる', async () => {
      const mockReport = {
        ...createMockData.dailyReport({ reportId: 1, salesPersonId: 2 }), // 別のユーザーの日報
        salesPerson: createMockData.salesPerson({ salesPersonId: 2 }),
        visitRecords: [],
        managerComments: [],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(mockReport);

      await expect(ReportsService.getReportById(1, 1, false)).rejects.toThrow('FORBIDDEN');
    });

    it('管理者は他人の日報にアクセスできる', async () => {
      const mockReport = {
        ...createMockData.dailyReport({ reportId: 1, salesPersonId: 2 }),
        salesPerson: createMockData.salesPerson({ salesPersonId: 2 }),
        visitRecords: [],
        managerComments: [],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(mockReport);

      const result = await ReportsService.getReportById(1, 1, true);

      expect(result).toBeDefined();
      expect(result!.sales_person.id).toBe(2);
    });
  });

  describe('createReport', () => {
    it('新しい日報を正常に作成できる', async () => {
      const reportData = {
        userId: 1,
        reportDate: new Date('2025-01-01'),
        problem: 'テスト課題',
        plan: 'テスト計画',
        visits: [
          {
            customerId: 1,
            visitContent: '訪問内容',
            visitTime: '10:00',
          },
        ],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(null); // 重複なし
      mockPrisma.dailyReport.create.mockResolvedValue({
        reportId: 1,
        salesPersonId: 1,
        reportDate: reportData.reportDate,
        problem: reportData.problem,
        plan: reportData.plan,
      });

      const result = await ReportsService.createReport(reportData);

      expect(result.reportId).toBe(1);
      expect(result.problem).toBe('テスト課題');
      expect(mockPrisma.visitRecord.createMany).toHaveBeenCalledWith({
        data: [
          {
            reportId: 1,
            customerId: 1,
            visitContent: '訪問内容',
            visitTime: '10:00',
          },
        ],
      });
    });

    it('同じ日付の日報が既に存在する場合エラーを投げる', async () => {
      const reportData = {
        userId: 1,
        reportDate: new Date('2025-01-01'),
        problem: 'テスト課題',
        plan: 'テスト計画',
        visits: [],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue({ reportId: 1 });

      await expect(ReportsService.createReport(reportData)).rejects.toThrow('DUPLICATE_REPORT');
    });

    it('訪問記録なしで日報を作成できる', async () => {
      const reportData = {
        userId: 1,
        reportDate: new Date('2025-01-01'),
        problem: 'テスト課題',
        plan: 'テスト計画',
        visits: [],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);
      mockPrisma.dailyReport.create.mockResolvedValue({
        reportId: 1,
        salesPersonId: 1,
        reportDate: reportData.reportDate,
        problem: reportData.problem,
        plan: reportData.plan,
      });

      const result = await ReportsService.createReport(reportData);

      expect(result.reportId).toBe(1);
      expect(mockPrisma.visitRecord.createMany).not.toHaveBeenCalled();
    });
  });

  describe('updateReport', () => {
    it('既存の日報を正常に更新できる', async () => {
      const existingReport = {
        reportId: 1,
        salesPersonId: 1,
        visitRecords: [{ visitId: 1 }],
      };

      const updateData = {
        problem: '更新された課題',
        plan: '更新された計画',
        visits: [
          {
            customerId: 1,
            visitContent: '更新された訪問内容',
            visitTime: '11:00',
          },
        ],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(existingReport);
      mockPrisma.dailyReport.update.mockResolvedValue({
        ...existingReport,
        ...updateData,
        updatedAt: new Date(),
      });

      const result = await ReportsService.updateReport(1, 1, updateData);

      expect(result.problem).toBe('更新された課題');
      expect(mockPrisma.visitRecord.deleteMany).toHaveBeenCalledWith({
        where: { reportId: 1 },
      });
      expect(mockPrisma.visitRecord.createMany).toHaveBeenCalled();
    });

    it('存在しない日報の更新でエラーを投げる', async () => {
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);

      await expect(ReportsService.updateReport(999, 1, { problem: 'test' }))
        .rejects.toThrow('NOT_FOUND');
    });

    it('他人の日報の更新でエラーを投げる', async () => {
      const existingReport = {
        reportId: 1,
        salesPersonId: 2, // 別のユーザー
        visitRecords: [],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(existingReport);

      await expect(ReportsService.updateReport(1, 1, { problem: 'test' }))
        .rejects.toThrow('FORBIDDEN');
    });
  });

  describe('deleteReport', () => {
    it('既存の日報を正常に削除できる', async () => {
      const existingReport = {
        reportId: 1,
        salesPersonId: 1,
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(existingReport);
      mockPrisma.dailyReport.delete.mockResolvedValue(existingReport);

      await ReportsService.deleteReport(1, 1);

      expect(mockPrisma.dailyReport.delete).toHaveBeenCalledWith({
        where: { reportId: 1 },
      });
    });

    it('存在しない日報の削除でエラーを投げる', async () => {
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);

      await expect(ReportsService.deleteReport(999, 1)).rejects.toThrow('NOT_FOUND');
    });

    it('他人の日報の削除でエラーを投げる', async () => {
      const existingReport = {
        reportId: 1,
        salesPersonId: 2, // 別のユーザー
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(existingReport);

      await expect(ReportsService.deleteReport(1, 1)).rejects.toThrow('FORBIDDEN');
    });
  });
});