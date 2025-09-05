import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ReportQuerySchema } from '@/lib/schemas/report';
import { z } from 'zod';

const prisma = new PrismaClient();

// GET /api/reports - 日報一覧取得
export async function GET(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // クエリパラメータのパース
      const searchParams = req.nextUrl.searchParams;
      const queryParams = {
        start_date: searchParams.get('start_date') || undefined,
        end_date: searchParams.get('end_date') || undefined,
        sales_person_id: searchParams.get('sales_person_id') || undefined,
        page: searchParams.get('page') || '1',
        per_page: searchParams.get('per_page') || '20',
      };

      // バリデーション
      const query = ReportQuerySchema.parse(queryParams);

      // フィルタ条件の構築
      const where: any = {};

      // 日付範囲フィルタ
      if (query.start_date || query.end_date) {
        where.reportDate = {};
        if (query.start_date) {
          where.reportDate.gte = new Date(`${query.start_date}T00:00:00.000Z`);
        }
        if (query.end_date) {
          where.reportDate.lte = new Date(`${query.end_date}T23:59:59.999Z`);
        }
      }

      // 営業担当者フィルタ（管理者のみ他者の日報を検索可能）
      if (query.sales_person_id) {
        if (!req.user.isManager && query.sales_person_id !== req.user.id) {
          return NextResponse.json(
            {
              error: {
                code: 'FORBIDDEN',
                message: 'この操作を行う権限がありません',
              },
            },
            { status: 403 }
          );
        }
        where.salesPersonId = query.sales_person_id;
      } else if (!req.user.isManager) {
        // 一般ユーザーは自分の日報のみ取得
        where.salesPersonId = req.user.id;
      }

      // ページネーション計算
      const skip = (query.page - 1) * query.per_page;
      const take = query.per_page;

      // データ取得（並列実行）
      const [reports, totalCount] = await Promise.all([
        prisma.dailyReport.findMany({
          where,
          skip,
          take,
          orderBy: {
            reportDate: 'desc',
          },
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
        prisma.dailyReport.count({ where }),
      ]);

      // レスポンスデータの整形
      const data = reports.map((report) => ({
        id: report.reportId,
        report_date: report.reportDate.toISOString().split('T')[0],
        sales_person: {
          id: report.salesPerson.salesPersonId,
          name: report.salesPerson.name,
        },
        visit_count: report.visitRecords.length,
        has_comments: report.managerComments.length > 0,
        created_at: report.createdAt.toISOString(),
      }));

      // ページネーション情報
      const totalPages = Math.ceil(totalCount / query.per_page);
      const pagination = {
        total: totalCount,
        page: query.page,
        per_page: query.per_page,
        total_pages: totalPages,
      };

      return NextResponse.json(
        {
          data,
          pagination,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('日報一覧取得エラー:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: '入力値が不正です',
              details: error.issues,
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'サーバーエラーが発生しました',
          },
        },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  });
}

// POST /api/reports - 日報作成
export async function POST(request: NextRequest) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { CreateReportRequestSchema } = await import('@/lib/schemas/report');
      
      // バリデーション
      const validatedData = CreateReportRequestSchema.parse(body);

      // 日付をDateオブジェクトに変換
      const reportDate = new Date(`${validatedData.report_date}T00:00:00.000Z`);

      // 既存の日報チェック（同日の日報が存在しないか）
      const existingReport = await prisma.dailyReport.findUnique({
        where: {
          salesPersonId_reportDate: {
            salesPersonId: req.user.id,
            reportDate: reportDate,
          },
        },
      });

      if (existingReport) {
        return NextResponse.json(
          {
            error: {
              code: 'DUPLICATE_REPORT',
              message: '同じ日付の日報が既に存在します',
            },
          },
          { status: 409 }
        );
      }

      // トランザクション処理で日報と訪問記録を一括作成
      const report = await prisma.$transaction(async (tx) => {
        // 日報作成
        const newReport = await tx.dailyReport.create({
          data: {
            salesPersonId: req.user.id,
            reportDate: reportDate,
            problem: validatedData.problem,
            plan: validatedData.plan,
          },
        });

        // 訪問記録作成
        if (validatedData.visits && validatedData.visits.length > 0) {
          const visitData = validatedData.visits.map((visit) => ({
            reportId: newReport.reportId,
            customerId: visit.customer_id,
            visitContent: visit.visit_content,
            visitTime: visit.visit_time || null,
          }));

          await tx.visitRecord.createMany({
            data: visitData,
          });
        }

        return newReport;
      });

      // レスポンス
      return NextResponse.json(
        {
          id: report.reportId,
          report_date: report.reportDate.toISOString().split('T')[0],
          sales_person_id: report.salesPersonId,
          problem: report.problem,
          plan: report.plan,
          created_at: report.createdAt.toISOString(),
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('日報作成エラー:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: '入力値が不正です',
              details: error.issues,
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'サーバーエラーが発生しました',
          },
        },
        { status: 500 }
      );
    } finally {
      await prisma.$disconnect();
    }
  });
}