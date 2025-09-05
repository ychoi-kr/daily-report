import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { UpdateReportRequestSchema } from '@/lib/schemas/report';
import { z } from 'zod';

const prisma = new PrismaClient();

// GET /api/reports/[id] - 日報詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const reportId = parseInt(params.id, 10);

      if (isNaN(reportId) || reportId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_ID',
              message: '無効な日報IDです',
            },
          },
          { status: 400 }
        );
      }

      // 日報取得
      const report = await prisma.dailyReport.findUnique({
        where: {
          reportId,
        },
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
            orderBy: {
              visitTime: 'asc',
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
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!report) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: '日報が見つかりません',
            },
          },
          { status: 404 }
        );
      }

      // 権限チェック（管理者以外は自分の日報のみ閲覧可能）
      if (!req.user.isManager && report.salesPersonId !== req.user.id) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'この日報を閲覧する権限がありません',
            },
          },
          { status: 403 }
        );
      }

      // レスポンスデータの整形
      const responseData = {
        id: report.reportId,
        report_date: report.reportDate.toISOString().split('T')[0],
        sales_person: {
          id: report.salesPerson.salesPersonId,
          name: report.salesPerson.name,
          email: report.salesPerson.email,
        },
        problem: report.problem,
        plan: report.plan,
        visits: report.visitRecords.map((visit) => ({
          id: visit.visitId,
          customer: {
            id: visit.customer.customerId,
            company_name: visit.customer.companyName,
          },
          visit_time: visit.visitTime,
          visit_content: visit.visitContent,
        })),
        comments: report.managerComments.map((comment) => ({
          id: comment.commentId,
          manager: {
            id: comment.manager.salesPersonId,
            name: comment.manager.name,
          },
          comment: comment.comment,
          created_at: comment.createdAt.toISOString(),
        })),
        created_at: report.createdAt.toISOString(),
        updated_at: report.updatedAt.toISOString(),
      };

      return NextResponse.json(responseData, { status: 200 });
    } catch (error) {
      console.error('日報詳細取得エラー:', error);

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

// PUT /api/reports/[id] - 日報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const reportId = parseInt(params.id, 10);

      if (isNaN(reportId) || reportId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_ID',
              message: '無効な日報IDです',
            },
          },
          { status: 400 }
        );
      }

      // 既存の日報取得
      const existingReport = await prisma.dailyReport.findUnique({
        where: {
          reportId,
        },
        include: {
          visitRecords: true,
        },
      });

      if (!existingReport) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: '日報が見つかりません',
            },
          },
          { status: 404 }
        );
      }

      // 権限チェック（自分の日報のみ編集可能）
      if (existingReport.salesPersonId !== req.user.id) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'この日報を編集する権限がありません',
            },
          },
          { status: 403 }
        );
      }

      const body = await req.json();
      
      // バリデーション
      const validatedData = UpdateReportRequestSchema.parse(body);

      // トランザクション処理で更新
      const updatedReport = await prisma.$transaction(async (tx) => {
        // 日報本体の更新
        const report = await tx.dailyReport.update({
          where: {
            reportId,
          },
          data: {
            problem: validatedData.problem || existingReport.problem,
            plan: validatedData.plan || existingReport.plan,
          },
        });

        // 訪問記録の更新処理
        if (validatedData.visits !== undefined) {
          // 既存の訪問記録IDを取得
          const existingVisitIds = existingReport.visitRecords.map(v => v.visitId);
          const updateVisitIds = validatedData.visits
            .filter(v => v.id !== undefined)
            .map(v => v.id!);

          // 削除対象の訪問記録を特定
          const deleteVisitIds = existingVisitIds.filter(
            id => !updateVisitIds.includes(id)
          );

          // 削除
          if (deleteVisitIds.length > 0) {
            await tx.visitRecord.deleteMany({
              where: {
                visitId: {
                  in: deleteVisitIds,
                },
              },
            });
          }

          // 更新と新規作成
          for (const visit of validatedData.visits) {
            if (visit.id) {
              // 既存レコードの更新
              await tx.visitRecord.update({
                where: {
                  visitId: visit.id,
                },
                data: {
                  customerId: visit.customer_id,
                  visitContent: visit.visit_content,
                  visitTime: visit.visit_time || null,
                },
              });
            } else {
              // 新規レコードの作成
              await tx.visitRecord.create({
                data: {
                  reportId,
                  customerId: visit.customer_id,
                  visitContent: visit.visit_content,
                  visitTime: visit.visit_time || null,
                },
              });
            }
          }
        }

        return report;
      });

      // レスポンス
      return NextResponse.json(
        {
          id: updatedReport.reportId,
          report_date: updatedReport.reportDate.toISOString().split('T')[0],
          sales_person_id: updatedReport.salesPersonId,
          problem: updatedReport.problem,
          plan: updatedReport.plan,
          updated_at: updatedReport.updatedAt.toISOString(),
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('日報更新エラー:', error);

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

// DELETE /api/reports/[id] - 日報削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const reportId = parseInt(params.id, 10);

      if (isNaN(reportId) || reportId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_ID',
              message: '無効な日報IDです',
            },
          },
          { status: 400 }
        );
      }

      // 既存の日報取得
      const existingReport = await prisma.dailyReport.findUnique({
        where: {
          reportId,
        },
      });

      if (!existingReport) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: '日報が見つかりません',
            },
          },
          { status: 404 }
        );
      }

      // 権限チェック（自分の日報のみ削除可能）
      if (existingReport.salesPersonId !== req.user.id) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'この日報を削除する権限がありません',
            },
          },
          { status: 403 }
        );
      }

      // 日報削除（関連データは CASCADE で自動削除）
      await prisma.dailyReport.delete({
        where: {
          reportId,
        },
      });

      // 204 No Content
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      console.error('日報削除エラー:', error);

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