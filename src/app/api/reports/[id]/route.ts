import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  UpdateReportRequestSchema,
  type UpdateReportResponse,
  type DailyReportDetail,
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

// GET /api/reports/[id] - 日報詳細取得
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
    const dummyReport: DailyReportDetail = {
      id: reportId,
      report_date: '2025-09-04',
      sales_person: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      problem: '新規開拓の進捗が遅れている。競合他社の動向について情報収集が必要。',
      plan: 'ABC商事への見積もり作成。新規リスト50件に電話アプローチ。',
      visits: [
        {
          id: 1,
          customer: {
            id: 10,
            company_name: 'ABC商事',
          },
          visit_time: '10:00',
          visit_content: '新商品の提案を実施。次回見積もり提出予定。',
        },
        {
          id: 2,
          customer: {
            id: 11,
            company_name: 'XYZ工業',
          },
          visit_time: '14:00',
          visit_content: '既存システムの保守相談。',
        },
      ],
      comments: [],
      created_at: '2025-09-04T09:00:00Z',
      updated_at: '2025-09-04T17:30:00Z',
    };

    return NextResponse.json(dummyReport);
  } catch (error) {
    console.error('Report fetch error:', error);
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

// PUT /api/reports/[id] - 日報更新
export async function PUT(
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

    const body = await request.json();

    // リクエストのバリデーション
    const validatedData = UpdateReportRequestSchema.parse(body);

    // 権限チェック（実際にはデータベースで日報の作成者をチェック）
    // ここではダミーの実装

    // 日報を更新（実際にはデータベースで更新）
    const updatedReport: UpdateReportResponse = {
      id: reportId,
      report_date: '2025-09-04',
      sales_person_id: user.id,
      problem: validatedData.problem || '既存の問題',
      plan: validatedData.plan || '既存の計画',
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(updatedReport);
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

    console.error('Report update error:', error);
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

// DELETE /api/reports/[id] - 日報削除
export async function DELETE(
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

    // 権限チェック（実際にはデータベースで日報の作成者をチェック）
    // ここではダミーの実装

    // 日報を削除（実際にはデータベースから削除）
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Report deletion error:', error);
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