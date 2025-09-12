import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPrismaClient, testUsers, createMockData } from '../utils/prisma-mock';
import { JWTUtil } from '@/lib/auth';

// 実際のワークフロー統合テスト
const mockPrisma = createMockPrismaClient();
vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

// 営業日報システムの実際の業務フローをテストするサービスクラス
class DailyReportWorkflow {
  static async executeFullWorkflow(userId: number, date: string) {
    const workflow = {
      steps: [] as string[],
      data: {} as any,
      errors: [] as string[],
    };

    try {
      // ステップ1: ユーザー認証確認
      workflow.steps.push('AUTHENTICATE');
      const user = await mockPrisma.salesPerson.findUnique({
        where: { salesPersonId: userId },
      });
      
      if (!user) {
        workflow.errors.push('ユーザーが見つかりません');
        return workflow;
      }
      
      workflow.data.user = user;

      // ステップ2: 既存の日報確認（重複防止）
      workflow.steps.push('CHECK_EXISTING');
      const existingReport = await mockPrisma.dailyReport.findUnique({
        where: {
          salesPersonId_reportDate: {
            salesPersonId: userId,
            reportDate: new Date(date),
          },
        },
      });
      
      if (existingReport) {
        workflow.errors.push('同じ日付の日報が既に存在します');
        return workflow;
      }

      // ステップ3: 顧客リストの取得
      workflow.steps.push('FETCH_CUSTOMERS');
      const customers = await mockPrisma.customer.findMany();
      workflow.data.customers = customers;

      // ステップ4: 日報作成
      workflow.steps.push('CREATE_REPORT');
      const reportData = {
        salesPersonId: userId,
        reportDate: new Date(date),
        problem: '新規開拓が困難な状況です。競合他社の動向を調査する必要があります。',
        plan: '既存顧客へのフォローアップを強化し、紹介による新規開拓を進めます。',
      };

      const report = await mockPrisma.dailyReport.create({
        data: reportData,
      });
      
      workflow.data.report = report;

      // ステップ5: 訪問記録作成
      workflow.steps.push('CREATE_VISITS');
      const visitData = [
        {
          reportId: report.reportId,
          customerId: customers[0]?.customerId || 1,
          visitContent: 'システム導入に関する詳細説明を実施。次回見積もり提出予定。',
          visitTime: '10:00',
        },
        {
          reportId: report.reportId,
          customerId: customers[1]?.customerId || 2,
          visitContent: 'サービス更新の提案を行い、検討期間をいただく。',
          visitTime: '14:30',
        },
      ];

      await mockPrisma.visitRecord.createMany({
        data: visitData,
      });
      
      workflow.data.visits = visitData;

      // ステップ6: 管理者による確認（別の処理として）
      if (user.isManager) {
        workflow.steps.push('MANAGER_REVIEW');
        
        // 部下の日報を確認する処理をシミュレート
        const subordinateReports = await mockPrisma.dailyReport.findMany({
          where: {
            salesPerson: {
              isManager: false,
            },
          },
          include: {
            salesPerson: {
              select: {
                salesPersonId: true,
                name: true,
              },
            },
          },
        });
        
        workflow.data.subordinateReports = subordinateReports;
      }

      // ステップ7: 通知処理（仮実装）
      workflow.steps.push('SEND_NOTIFICATION');
      workflow.data.notifications = [
        {
          type: 'REPORT_CREATED',
          userId: userId,
          message: '日報が正常に作成されました',
        },
      ];

      workflow.steps.push('COMPLETE');
      return workflow;

    } catch (error) {
      workflow.errors.push(`ワークフローエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return workflow;
    }
  }

  static async executeManagerCommentFlow(managerId: number, reportId: number, comment: string) {
    const workflow = {
      steps: [] as string[],
      data: {} as any,
      errors: [] as string[],
    };

    try {
      // ステップ1: 管理者権限確認
      workflow.steps.push('VERIFY_MANAGER');
      const manager = await mockPrisma.salesPerson.findUnique({
        where: { salesPersonId: managerId },
      });

      if (!manager || !manager.isManager) {
        workflow.errors.push('管理者権限が必要です');
        return workflow;
      }

      // ステップ2: 日報の存在確認
      workflow.steps.push('VERIFY_REPORT');
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
        },
      });

      if (!report) {
        workflow.errors.push('日報が見つかりません');
        return workflow;
      }

      workflow.data.report = report;

      // ステップ3: コメント作成
      workflow.steps.push('CREATE_COMMENT');
      const managerComment = await mockPrisma.managerComment.create({
        data: {
          reportId,
          managerId,
          comment,
        },
      });

      workflow.data.comment = managerComment;

      // ステップ4: 通知送信（営業担当者へ）
      workflow.steps.push('NOTIFY_REPORTER');
      workflow.data.notification = {
        type: 'COMMENT_RECEIVED',
        recipientId: report.salesPersonId,
        message: `${manager.name}さんからコメントが届きました`,
        commentId: managerComment.commentId,
      };

      workflow.steps.push('COMPLETE');
      return workflow;

    } catch (error) {
      workflow.errors.push(`コメントワークフローエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return workflow;
    }
  }

  static async executeReportUpdateFlow(userId: number, reportId: number, updateData: any) {
    const workflow = {
      steps: [] as string[],
      data: {} as any,
      errors: [] as string[],
    };

    try {
      // ステップ1: 権限確認
      workflow.steps.push('VERIFY_OWNERSHIP');
      const report = await mockPrisma.dailyReport.findUnique({
        where: { reportId },
        include: {
          visitRecords: true,
        },
      });

      if (!report) {
        workflow.errors.push('日報が見つかりません');
        return workflow;
      }

      if (report.salesPersonId !== userId) {
        workflow.errors.push('他人の日報は編集できません');
        return workflow;
      }

      // ステップ2: 更新期限確認（例：作成から24時間以内）
      workflow.steps.push('CHECK_UPDATE_DEADLINE');
      const now = new Date();
      const createdAt = new Date(report.createdAt);
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        workflow.errors.push('作成から24時間経過した日報は編集できません');
        return workflow;
      }

      // ステップ3: バックアップ作成（変更履歴）
      workflow.steps.push('CREATE_BACKUP');
      workflow.data.backup = {
        reportId: report.reportId,
        originalProblem: report.problem,
        originalPlan: report.plan,
        originalVisits: report.visitRecords,
        backupTimestamp: now,
      };

      // ステップ4: 日報更新
      workflow.steps.push('UPDATE_REPORT');
      const updatedReport = await mockPrisma.dailyReport.update({
        where: { reportId },
        data: {
          problem: updateData.problem || report.problem,
          plan: updateData.plan || report.plan,
          updatedAt: now,
        },
      });

      workflow.data.updatedReport = updatedReport;

      // ステップ5: 訪問記録更新
      if (updateData.visits) {
        workflow.steps.push('UPDATE_VISITS');
        
        // 既存の訪問記録を削除
        await mockPrisma.visitRecord.deleteMany({
          where: { reportId },
        });

        // 新しい訪問記録を作成
        if (updateData.visits.length > 0) {
          await mockPrisma.visitRecord.createMany({
            data: updateData.visits.map((visit: any) => ({
              reportId,
              customerId: visit.customer_id,
              visitContent: visit.visit_content,
              visitTime: visit.visit_time,
            })),
          });
        }

        workflow.data.updatedVisits = updateData.visits;
      }

      // ステップ6: 変更通知
      workflow.steps.push('NOTIFY_CHANGES');
      workflow.data.notification = {
        type: 'REPORT_UPDATED',
        userId,
        message: '日報が更新されました',
        changes: {
          problemChanged: updateData.problem !== report.problem,
          planChanged: updateData.plan !== report.plan,
          visitsChanged: !!updateData.visits,
        },
      };

      workflow.steps.push('COMPLETE');
      return workflow;

    } catch (error) {
      workflow.errors.push(`更新ワークフローエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return workflow;
    }
  }

  static async executeMonthlySummaryFlow(userId: number, year: number, month: number) {
    const workflow = {
      steps: [] as string[],
      data: {} as any,
      errors: [] as string[],
    };

    try {
      // ステップ1: 期間設定
      workflow.steps.push('SET_PERIOD');
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      workflow.data.period = {
        start: startDate,
        end: endDate,
        totalDays: endDate.getDate(),
      };

      // ステップ2: 該当月の日報取得
      workflow.steps.push('FETCH_REPORTS');
      const reports = await mockPrisma.dailyReport.findMany({
        where: {
          salesPersonId: userId,
          reportDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
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
            select: {
              commentId: true,
              comment: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          reportDate: 'asc',
        },
      });

      workflow.data.reports = reports;

      // ステップ3: 統計情報計算
      workflow.steps.push('CALCULATE_STATISTICS');
      const statistics = {
        totalReports: reports.length,
        totalVisits: reports.reduce((sum, report) => sum + report.visitRecords.length, 0),
        totalComments: reports.reduce((sum, report) => sum + report.managerComments.length, 0),
        averageVisitsPerDay: reports.length > 0 ? reports.reduce((sum, report) => sum + report.visitRecords.length, 0) / reports.length : 0,
        workingDaysWithReports: reports.length,
        workingDaysRatio: reports.length / workflow.data.period.totalDays,
        uniqueCustomers: new Set(reports.flatMap(report => report.visitRecords.map(visit => visit.customer.customerId))).size,
        mostVisitedCustomers: this.calculateMostVisitedCustomers(reports),
        commonIssues: this.extractCommonIssues(reports),
        achievementTrends: this.calculateAchievementTrends(reports),
      };

      workflow.data.statistics = statistics;

      // ステップ4: レポート生成
      workflow.steps.push('GENERATE_SUMMARY');
      const summary = {
        userId,
        period: `${year}年${month}月`,
        generated_at: new Date(),
        summary: {
          overview: `${month}月の活動実績：日報${statistics.totalReports}件、顧客訪問${statistics.totalVisits}件`,
          performance: {
            reportingRate: `${(statistics.workingDaysRatio * 100).toFixed(1)}%`,
            averageVisits: statistics.averageVisitsPerDay.toFixed(1) + '件/日',
            customerEngagement: `${statistics.uniqueCustomers}社との接触`,
          },
          highlights: [
            statistics.totalVisits > 50 ? '積極的な営業活動を実施' : '訪問頻度の向上が必要',
            statistics.totalComments > 10 ? '管理者との連携が活発' : 'コミュニケーション強化の余地あり',
          ],
          recommendations: this.generateRecommendations(statistics),
        },
      };

      workflow.data.summary = summary;

      workflow.steps.push('COMPLETE');
      return workflow;

    } catch (error) {
      workflow.errors.push(`月次サマリーワークフローエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return workflow;
    }
  }

  private static calculateMostVisitedCustomers(reports: any[]) {
    const customerVisits = new Map();
    
    reports.forEach(report => {
      report.visitRecords.forEach((visit: any) => {
        const customerId = visit.customer.customerId;
        const customerName = visit.customer.companyName;
        const current = customerVisits.get(customerId) || { name: customerName, count: 0 };
        current.count++;
        customerVisits.set(customerId, current);
      });
    });

    return Array.from(customerVisits.entries())
      .map(([id, data]) => ({ customerId: id, companyName: data.name, visitCount: data.count }))
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 5);
  }

  private static extractCommonIssues(reports: any[]) {
    const issueKeywords = ['競合', '価格', '決裁', '納期', '仕様', '予算', '承認'];
    const issueCounts = new Map();

    reports.forEach(report => {
      const problemText = report.problem.toLowerCase();
      issueKeywords.forEach(keyword => {
        if (problemText.includes(keyword)) {
          issueCounts.set(keyword, (issueCounts.get(keyword) || 0) + 1);
        }
      });
    });

    return Array.from(issueCounts.entries())
      .map(([keyword, count]) => ({ issue: keyword, frequency: count }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);
  }

  private static calculateAchievementTrends(reports: any[]) {
    // 簡単なトレンド分析（時系列での活動量変化）
    const weeklyData = [];
    let currentWeek = 1;
    let weekStart = 0;

    while (weekStart < reports.length) {
      const weekEnd = Math.min(weekStart + 7, reports.length);
      const weekReports = reports.slice(weekStart, weekEnd);
      const weekVisits = weekReports.reduce((sum, report) => sum + report.visitRecords.length, 0);
      
      weeklyData.push({
        week: currentWeek,
        reports: weekReports.length,
        visits: weekVisits,
        averageVisitsPerReport: weekReports.length > 0 ? weekVisits / weekReports.length : 0,
      });

      currentWeek++;
      weekStart = weekEnd;
    }

    return weeklyData;
  }

  private static generateRecommendations(statistics: any) {
    const recommendations = [];

    if (statistics.workingDaysRatio < 0.8) {
      recommendations.push('日報の提出率向上を目指しましょう（目標：90%以上）');
    }

    if (statistics.averageVisitsPerDay < 2) {
      recommendations.push('1日あたりの訪問件数を増やすことを検討してください（目標：2-3件/日）');
    }

    if (statistics.totalComments < 5) {
      recommendations.push('管理者とのコミュニケーションを増やし、相談や報告を積極的に行いましょう');
    }

    if (statistics.uniqueCustomers < 10) {
      recommendations.push('訪問する顧客の幅を広げ、新規開拓を強化しましょう');
    }

    return recommendations.length > 0 ? recommendations : ['現在の活動レベルを維持し、継続的な改善に取り組みましょう'];
  }
}

describe('Daily Report Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('完全な日報作成ワークフロー', () => {
    it('営業担当者が日報を作成する一連のフローが正常に実行される', async () => {
      // モックデータの設定
      const mockUser = createMockData.salesPerson({ 
        salesPersonId: testUsers.regularUser.id,
        isManager: false 
      });
      
      const mockCustomers = [
        createMockData.customer({ customerId: 1, companyName: 'A株式会社' }),
        createMockData.customer({ customerId: 2, companyName: 'B商事' }),
      ];

      const mockReport = createMockData.dailyReport({
        reportId: 1,
        salesPersonId: testUsers.regularUser.id,
        reportDate: new Date('2025-01-15'),
      });

      // モックの設定
      mockPrisma.salesPerson.findUnique.mockResolvedValue(mockUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null); // 重複なし
      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers);
      mockPrisma.dailyReport.create.mockResolvedValue(mockReport);
      mockPrisma.visitRecord.createMany.mockResolvedValue({ count: 2 });

      // ワークフロー実行
      const result = await DailyReportWorkflow.executeFullWorkflow(
        testUsers.regularUser.id,
        '2025-01-15'
      );

      // 結果検証
      expect(result.errors).toHaveLength(0);
      expect(result.steps).toEqual([
        'AUTHENTICATE',
        'CHECK_EXISTING',
        'FETCH_CUSTOMERS',
        'CREATE_REPORT',
        'CREATE_VISITS',
        'SEND_NOTIFICATION',
        'COMPLETE',
      ]);

      expect(result.data.user).toEqual(mockUser);
      expect(result.data.customers).toEqual(mockCustomers);
      expect(result.data.report).toEqual(mockReport);
      expect(result.data.visits).toHaveLength(2);
      expect(result.data.notifications).toHaveLength(1);

      // モックの呼び出し確認
      expect(mockPrisma.salesPerson.findUnique).toHaveBeenCalledWith({
        where: { salesPersonId: testUsers.regularUser.id },
      });
      expect(mockPrisma.dailyReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          salesPersonId: testUsers.regularUser.id,
          reportDate: new Date('2025-01-15'),
          problem: expect.any(String),
          plan: expect.any(String),
        }),
      });
    });

    it('管理者ユーザーの場合は部下の日報確認処理も実行される', async () => {
      const mockManager = createMockData.salesPerson({
        salesPersonId: testUsers.managerUser.id,
        isManager: true,
      });

      const mockSubordinateReports = [
        {
          ...createMockData.dailyReport({ reportId: 2, salesPersonId: 3 }),
          salesPerson: createMockData.salesPerson({ salesPersonId: 3, name: '部下A' }),
        },
        {
          ...createMockData.dailyReport({ reportId: 3, salesPersonId: 4 }),
          salesPerson: createMockData.salesPerson({ salesPersonId: 4, name: '部下B' }),
        },
      ];

      mockPrisma.salesPerson.findUnique.mockResolvedValue(mockManager);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);
      mockPrisma.customer.findMany.mockResolvedValue([]);
      mockPrisma.dailyReport.create.mockResolvedValue(createMockData.dailyReport());
      mockPrisma.visitRecord.createMany.mockResolvedValue({ count: 0 });
      mockPrisma.dailyReport.findMany.mockResolvedValue(mockSubordinateReports);

      const result = await DailyReportWorkflow.executeFullWorkflow(
        testUsers.managerUser.id,
        '2025-01-15'
      );

      expect(result.errors).toHaveLength(0);
      expect(result.steps).toContain('MANAGER_REVIEW');
      expect(result.data.subordinateReports).toHaveLength(2);
    });

    it('重複する日報が存在する場合はエラーで終了する', async () => {
      const existingReport = createMockData.dailyReport({
        reportId: 1,
        salesPersonId: testUsers.regularUser.id,
      });

      mockPrisma.salesPerson.findUnique.mockResolvedValue(createMockData.salesPerson());
      mockPrisma.dailyReport.findUnique.mockResolvedValue(existingReport);

      const result = await DailyReportWorkflow.executeFullWorkflow(
        testUsers.regularUser.id,
        '2025-01-15'
      );

      expect(result.errors).toContain('同じ日付の日報が既に存在します');
      expect(result.steps).not.toContain('CREATE_REPORT');
    });
  });

  describe('管理者コメントワークフロー', () => {
    it('管理者が部下の日報にコメントする流れが正常に実行される', async () => {
      const mockManager = createMockData.salesPerson({
        salesPersonId: testUsers.managerUser.id,
        isManager: true,
        name: '田中管理者',
      });

      const mockReport = {
        ...createMockData.dailyReport({ reportId: 1, salesPersonId: 3 }),
        salesPerson: createMockData.salesPerson({ 
          salesPersonId: 3, 
          name: '山田営業', 
          email: 'yamada@example.com' 
        }),
      };

      const mockComment = createMockData.managerComment({
        commentId: 1,
        reportId: 1,
        managerId: testUsers.managerUser.id,
        comment: '良い取り組みですね。次回のフォローアップも期待しています。',
      });

      mockPrisma.salesPerson.findUnique.mockResolvedValue(mockManager);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(mockReport);
      mockPrisma.managerComment.create.mockResolvedValue(mockComment);

      const result = await DailyReportWorkflow.executeManagerCommentFlow(
        testUsers.managerUser.id,
        1,
        '良い取り組みですね。次回のフォローアップも期待しています。'
      );

      expect(result.errors).toHaveLength(0);
      expect(result.steps).toEqual([
        'VERIFY_MANAGER',
        'VERIFY_REPORT',
        'CREATE_COMMENT',
        'NOTIFY_REPORTER',
        'COMPLETE',
      ]);

      expect(result.data.comment).toEqual(mockComment);
      expect(result.data.notification).toEqual(
        expect.objectContaining({
          type: 'COMMENT_RECEIVED',
          recipientId: 3,
          message: '田中管理者さんからコメントが届きました',
          commentId: 1,
        })
      );
    });

    it('一般ユーザーがコメントしようとするとエラーになる', async () => {
      const mockRegularUser = createMockData.salesPerson({
        salesPersonId: testUsers.regularUser.id,
        isManager: false,
      });

      mockPrisma.salesPerson.findUnique.mockResolvedValue(mockRegularUser);

      const result = await DailyReportWorkflow.executeManagerCommentFlow(
        testUsers.regularUser.id,
        1,
        'テストコメント'
      );

      expect(result.errors).toContain('管理者権限が必要です');
      expect(result.steps).not.toContain('CREATE_COMMENT');
    });
  });

  describe('日報更新ワークフロー', () => {
    it('期限内の日報更新が正常に実行される', async () => {
      const now = new Date();
      const recentReport = {
        ...createMockData.dailyReport({
          reportId: 1,
          salesPersonId: testUsers.regularUser.id,
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2時間前
        }),
        visitRecords: [
          { visitId: 1, customerId: 1, visitContent: '元の内容' },
        ],
      };

      const updatedReport = {
        ...recentReport,
        problem: '更新された課題内容',
        plan: '更新された計画内容',
        updatedAt: now,
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(recentReport);
      mockPrisma.dailyReport.update.mockResolvedValue(updatedReport);
      mockPrisma.visitRecord.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.visitRecord.createMany.mockResolvedValue({ count: 2 });

      const updateData = {
        problem: '更新された課題内容',
        plan: '更新された計画内容',
        visits: [
          { customer_id: 1, visit_content: '更新された訪問内容1' },
          { customer_id: 2, visit_content: '新しい訪問内容2' },
        ],
      };

      const result = await DailyReportWorkflow.executeReportUpdateFlow(
        testUsers.regularUser.id,
        1,
        updateData
      );

      expect(result.errors).toHaveLength(0);
      expect(result.steps).toEqual([
        'VERIFY_OWNERSHIP',
        'CHECK_UPDATE_DEADLINE',
        'CREATE_BACKUP',
        'UPDATE_REPORT',
        'UPDATE_VISITS',
        'NOTIFY_CHANGES',
        'COMPLETE',
      ]);

      expect(result.data.backup).toEqual(
        expect.objectContaining({
          reportId: 1,
          originalProblem: recentReport.problem,
          originalPlan: recentReport.plan,
        })
      );

      expect(result.data.notification.changes).toEqual({
        problemChanged: true,
        planChanged: true,
        visitsChanged: true,
      });
    });

    it('24時間経過後の日報更新は期限切れエラーになる', async () => {
      const now = new Date();
      const oldReport = {
        ...createMockData.dailyReport({
          reportId: 1,
          salesPersonId: testUsers.regularUser.id,
          createdAt: new Date(now.getTime() - 25 * 60 * 60 * 1000), // 25時間前
        }),
        visitRecords: [],
      };

      mockPrisma.dailyReport.findUnique.mockResolvedValue(oldReport);

      const result = await DailyReportWorkflow.executeReportUpdateFlow(
        testUsers.regularUser.id,
        1,
        { problem: '更新テスト' }
      );

      expect(result.errors).toContain('作成から24時間経過した日報は編集できません');
      expect(result.steps).not.toContain('UPDATE_REPORT');
    });
  });

  describe('月次サマリーワークフロー', () => {
    it('月間の活動サマリーが正常に生成される', async () => {
      const mockReports = Array.from({ length: 15 }, (_, i) => ({
        ...createMockData.dailyReport({
          reportId: i + 1,
          salesPersonId: testUsers.regularUser.id,
          reportDate: new Date(2025, 0, i + 1), // 2025年1月
          problem: `課題${i + 1}: ${i % 3 === 0 ? '競合対策' : i % 3 === 1 ? '価格交渉' : '仕様調整'}`,
        }),
        visitRecords: Array.from({ length: i % 3 + 1 }, (_, j) => ({
          visitId: i * 10 + j,
          customer: createMockData.customer({
            customerId: (j % 5) + 1,
            companyName: `顧客${(j % 5) + 1}`,
          }),
        })),
        managerComments: i % 4 === 0 ? [{ commentId: i, comment: `コメント${i}` }] : [],
      }));

      mockPrisma.dailyReport.findMany.mockResolvedValue(mockReports);

      const result = await DailyReportWorkflow.executeMonthlySummaryFlow(
        testUsers.regularUser.id,
        2025,
        1
      );

      expect(result.errors).toHaveLength(0);
      expect(result.steps).toEqual([
        'SET_PERIOD',
        'FETCH_REPORTS',
        'CALCULATE_STATISTICS',
        'GENERATE_SUMMARY',
        'COMPLETE',
      ]);

      const statistics = result.data.statistics;
      expect(statistics.totalReports).toBe(15);
      expect(statistics.totalVisits).toBeGreaterThan(15); // 各日報に1-3件の訪問
      expect(statistics.uniqueCustomers).toBeLessThanOrEqual(5);
      expect(statistics.mostVisitedCustomers).toHaveLength(5);
      expect(statistics.commonIssues.length).toBeGreaterThan(0);

      const summary = result.data.summary;
      expect(summary.period).toBe('2025年1月');
      expect(summary.summary.overview).toContain('1月の活動実績');
      expect(summary.summary.performance.reportingRate).toMatch(/\d+\.\d+%/);
      expect(summary.summary.recommendations.length).toBeGreaterThan(0);
    });

    it('活動が少ない月では改善提案が生成される', async () => {
      // 少ない活動データ
      const mockReports = Array.from({ length: 3 }, (_, i) => ({
        ...createMockData.dailyReport({
          reportId: i + 1,
          salesPersonId: testUsers.regularUser.id,
        }),
        visitRecords: [{ // 1件ずつのみ
          visitId: i,
          customer: createMockData.customer({ customerId: 1 }),
        }],
        managerComments: [], // コメントなし
      }));

      mockPrisma.dailyReport.findMany.mockResolvedValue(mockReports);

      const result = await DailyReportWorkflow.executeMonthlySummaryFlow(
        testUsers.regularUser.id,
        2025,
        1
      );

      const recommendations = result.data.summary.summary.recommendations;
      expect(recommendations.some((r: string) => r.includes('日報の提出率向上'))).toBe(true);
      expect(recommendations.some((r: string) => r.includes('訪問件数を増やす'))).toBe(true);
      expect(recommendations.some((r: string) => r.includes('コミュニケーションを増やし'))).toBe(true);
    });
  });

  describe('エラー処理とリカバリー', () => {
    it('データベースエラーが発生した場合に適切にエラーハンドリングされる', async () => {
      mockPrisma.salesPerson.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const result = await DailyReportWorkflow.executeFullWorkflow(
        testUsers.regularUser.id,
        '2025-01-15'
      );

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('ワークフローエラー: Database connection failed');
      expect(result.steps).toContain('AUTHENTICATE');
    });

    it('部分的な処理失敗でも完了したステップは記録される', async () => {
      mockPrisma.salesPerson.findUnique.mockResolvedValue(createMockData.salesPerson());
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);
      mockPrisma.customer.findMany.mockResolvedValue([]);
      mockPrisma.dailyReport.create.mockRejectedValue(new Error('Insert failed'));

      const result = await DailyReportWorkflow.executeFullWorkflow(
        testUsers.regularUser.id,
        '2025-01-15'
      );

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.steps).toContain('AUTHENTICATE');
      expect(result.steps).toContain('CHECK_EXISTING');
      expect(result.steps).toContain('FETCH_CUSTOMERS');
      expect(result.steps).not.toContain('CREATE_VISITS'); // 日報作成に失敗したため後続処理は実行されない
    });
  });

  describe('パフォーマンステスト', () => {
    it('大量データでの月次サマリー処理が適切な時間内で完了する', async () => {
      // 大量の日報データを生成（30日分×平均3件訪問）
      const largeDataSet = Array.from({ length: 30 }, (_, i) => ({
        ...createMockData.dailyReport({
          reportId: i + 1,
          salesPersonId: testUsers.regularUser.id,
          reportDate: new Date(2025, 0, i + 1),
        }),
        visitRecords: Array.from({ length: 3 }, (_, j) => ({
          visitId: i * 3 + j,
          customer: createMockData.customer({
            customerId: (j % 10) + 1,
            companyName: `大手企業${(j % 10) + 1}`,
          }),
        })),
        managerComments: i % 5 === 0 ? [{ commentId: i }] : [],
      }));

      mockPrisma.dailyReport.findMany.mockResolvedValue(largeDataSet);

      const startTime = Date.now();
      const result = await DailyReportWorkflow.executeMonthlySummaryFlow(
        testUsers.regularUser.id,
        2025,
        1
      );
      const endTime = Date.now();

      expect(result.errors).toHaveLength(0);
      expect(result.data.statistics.totalReports).toBe(30);
      expect(result.data.statistics.totalVisits).toBe(90);
      
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(1000); // 1秒以内で処理完了
    });
  });
});