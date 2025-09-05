import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  CreateCommentRequestSchema,
  type CreateCommentResponse,
  type ManagerComment,
} from '@/lib/schemas/report';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 認証チェック
async function verifyAuth(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload;
  } catch {
    return null;
  }
}

// GET /api/reports/[id]/comments - コメント一覧取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'AUTH_UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }

  try {
    const reportId = parseInt(id, 10);
    if (isNaN(reportId) || reportId <= 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '無効なIDです' } },
        { status: 400 }
      );
    }

    // ダミーデータを返す（実際にはデータベースから取得）
    const dummyComments: ManagerComment[] = [
      {
        id: 1,
        manager: {
          id: 2,
          name: '田中部長',
        },
        comment: '新規開拓については明日相談しましょう。',
        created_at: '2025-09-04T18:00:00Z',
      },
    ];

    return NextResponse.json({ data: dummyComments });
  } catch (error) {
    console.error('Comments fetch error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/reports/[id]/comments - コメント作成（管理者のみ）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'AUTH_UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }

  // 管理者権限チェック
  if (!user.is_manager) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'この操作を行う権限がありません' } },
      { status: 403 }
    );
  }

  try {
    const reportId = parseInt(id, 10);
    if (isNaN(reportId) || reportId <= 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '無効なIDです' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    // リクエストのバリデーション
    const validatedData = CreateCommentRequestSchema.parse(body);

    // コメントを作成（実際にはデータベースに保存）
    const newComment: CreateCommentResponse = {
      id: Math.floor(Math.random() * 1000) + 1,
      report_id: reportId,
      manager_id: user.id,
      comment: validatedData.comment,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
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

    console.error('Comment creation error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}