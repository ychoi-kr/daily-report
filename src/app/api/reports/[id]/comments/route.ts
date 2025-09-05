import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireManager, AuthenticatedRequest } from '@/lib/auth/middleware';
import { CreateCommentRequestSchema } from '@/lib/schemas/report';
import { z } from 'zod';

const prisma = new PrismaClient();

// GET /api/reports/[id]/comments - コメント一覧取得
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

      // 日報の存在確認と権限チェック
      const report = await prisma.dailyReport.findUnique({
        where: {
          reportId,
        },
        select: {
          salesPersonId: true,
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
              message: 'このコメントを閲覧する権限がありません',
            },
          },
          { status: 403 }
        );
      }

      // コメント取得
      const comments = await prisma.managerComment.findMany({
        where: {
          reportId,
        },
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
      });

      // レスポンスデータの整形
      const data = comments.map((comment) => ({
        id: comment.commentId,
        manager: {
          id: comment.manager.salesPersonId,
          name: comment.manager.name,
        },
        comment: comment.comment,
        created_at: comment.createdAt.toISOString(),
      }));

      return NextResponse.json(
        {
          data,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('コメント一覧取得エラー:', error);

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

// POST /api/reports/[id]/comments - コメント追加（管理者のみ）
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return requireManager(request, async (req: AuthenticatedRequest) => {
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

      // 日報の存在確認
      const report = await prisma.dailyReport.findUnique({
        where: {
          reportId,
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

      const body = await req.json();
      
      // バリデーション
      const validatedData = CreateCommentRequestSchema.parse(body);

      // コメント作成
      const comment = await prisma.managerComment.create({
        data: {
          reportId,
          managerId: req.user.id,
          comment: validatedData.comment,
        },
      });

      // レスポンス
      return NextResponse.json(
        {
          id: comment.commentId,
          report_id: comment.reportId,
          manager_id: comment.managerId,
          comment: comment.comment,
          created_at: comment.createdAt.toISOString(),
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('コメント追加エラー:', error);

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