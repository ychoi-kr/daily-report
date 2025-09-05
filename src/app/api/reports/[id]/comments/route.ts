import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireManager } from '@/lib/auth/middleware';
import {
  getCommentsByReportId,
  checkReportExists,
  createComment,
  disconnectDatabase,
} from '@/lib/db/comments';
import {
  CreateCommentRequestSchema,
  CommentsListResponseSchema,
  CreateCommentResponseSchema,
} from '@/lib/schemas/comments';
import { ZodError } from 'zod';

/**
 * GET /api/reports/{id}/comments
 * 日報に対するコメント一覧を取得
 * 認証: 必須（全ユーザーが閲覧可能）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req) => {
    try {
      // パスパラメータからreportIdを取得
      const { id } = await params;
      const reportId = parseInt(id, 10);

      if (isNaN(reportId) || reportId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_REPORT_ID',
              message: '無効な日報IDです',
            },
          },
          { status: 400 }
        );
      }

      // 日報の存在確認
      const reportExists = await checkReportExists(reportId);
      if (!reportExists) {
        return NextResponse.json(
          {
            error: {
              code: 'REPORT_NOT_FOUND',
              message: '指定された日報が見つかりません',
            },
          },
          { status: 404 }
        );
      }

      // コメント一覧を取得
      const comments = await getCommentsByReportId(reportId);

      // レスポンス形式に変換
      const response = CommentsListResponseSchema.parse({
        data: comments.map((comment) => ({
          id: comment.commentId,
          report_id: comment.reportId,
          manager_id: comment.managerId,
          manager: {
            id: comment.manager.salesPersonId,
            name: comment.manager.name,
          },
          comment: comment.comment,
          created_at: comment.createdAt.toISOString(),
        })),
      });

      return NextResponse.json(response, { status: 200 });
    } catch (error) {
      console.error('GET /reports/[id]/comments エラー:', error);

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'レスポンスデータの検証に失敗しました',
              details: error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
              })),
            },
          },
          { status: 500 }
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
      await disconnectDatabase();
    }
  });
}

/**
 * POST /api/reports/{id}/comments
 * 日報にコメントを追加
 * 認証: 管理者のみ
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireManager(request, async (req) => {
    try {
      // パスパラメータからreportIdを取得
      const { id } = await params;
      const reportId = parseInt(id, 10);

      if (isNaN(reportId) || reportId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_REPORT_ID',
              message: '無効な日報IDです',
            },
          },
          { status: 400 }
        );
      }

      // リクエストボディを取得
      const body = await request.json();

      // リクエストの検証
      const validatedData = CreateCommentRequestSchema.parse(body);

      // 日報の存在確認
      const reportExists = await checkReportExists(reportId);
      if (!reportExists) {
        return NextResponse.json(
          {
            error: {
              code: 'REPORT_NOT_FOUND',
              message: '指定された日報が見つかりません',
            },
          },
          { status: 404 }
        );
      }

      // コメントを作成（管理者IDは認証情報から取得）
      const newComment = await createComment(
        reportId,
        req.user.userId,
        validatedData.comment
      );

      // レスポンス形式に変換
      const response = CreateCommentResponseSchema.parse({
        id: newComment.commentId,
        report_id: newComment.reportId,
        manager_id: newComment.managerId,
        manager: {
          id: newComment.manager.salesPersonId,
          name: newComment.manager.name,
        },
        comment: newComment.comment,
        created_at: newComment.createdAt.toISOString(),
      });

      // TODO: 通知機能の実装
      // ここで日報作成者への通知を送信する処理を追加
      // 例: メール通知、WebSocket通知、プッシュ通知など
      // await notifyReportOwner(reportId, newComment);

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      console.error('POST /reports/[id]/comments エラー:', error);

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: '入力値が不正です',
              details: error.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
              })),
            },
          },
          { status: 400 }
        );
      }

      if (error instanceof Error) {
        // カスタムエラーメッセージの場合
        if (error.message === '指定された日報が見つかりません') {
          return NextResponse.json(
            {
              error: {
                code: 'REPORT_NOT_FOUND',
                message: error.message,
              },
            },
            { status: 404 }
          );
        }
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
      await disconnectDatabase();
    }
  });
}