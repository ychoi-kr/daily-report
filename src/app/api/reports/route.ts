import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  CreateReportRequestSchema,
  CreateReportResponseSchema,
  ReportQuerySchema,
  type CreateReportResponse,
  type DailyReportListItem,
} from '@/lib/schemas/report';
import { PaginationSchema } from '@/lib/schemas/common';
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

// GET /api/reports - 日報一覧取得
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'AUTH_UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      sales_person_id: searchParams.get('sales_person_id') || undefined,
    };

    // バリデーション
    const validatedQuery = ReportQuerySchema.parse(queryParams);

    // ダミーデータを返す（実際にはデータベースから取得）
    const dummyData: DailyReportListItem[] = [
      {
        id: 1,
        report_date: '2025-09-04',
        sales_person: {
          id: user.id,
          name: user.name,
        },
        visit_count: 3,
        has_comments: true,
        created_at: '2025-09-04T09:00:00Z',
      },
      {
        id: 2,
        report_date: '2025-09-03',
        sales_person: {
          id: user.id,
          name: user.name,
        },
        visit_count: 5,
        has_comments: false,
        created_at: '2025-09-03T09:00:00Z',
      },
    ];

    // ページネーション情報を含めて返す
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    
    return NextResponse.json({
      data: dummyData,
      pagination: {
        total: dummyData.length,
        page,
        per_page: perPage,
        total_pages: Math.ceil(dummyData.length / perPage),
      },
    });
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

// POST /api/reports - 日報作成
export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { error: { code: 'AUTH_UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // リクエストのバリデーション
    const validatedData = CreateReportRequestSchema.parse(body);

    // 同一日付の日報が既に存在するかチェック（実際にはデータベースで確認）
    // ここではダミーの実装
    const isDuplicateDate = false; // 実際にはDBチェック

    if (isDuplicateDate) {
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

    // 日報を作成（実際にはデータベースに保存）
    const newReport: CreateReportResponse = {
      id: Math.floor(Math.random() * 1000) + 1,
      report_date: validatedData.report_date,
      sales_person_id: user.id,
      problem: validatedData.problem,
      plan: validatedData.plan,
      created_at: new Date().toISOString(),
    };

    // 訪問記録も保存する（実際にはトランザクション内で処理）
    // validatedData.visits を使って訪問記録を保存

    return NextResponse.json(newReport, { status: 201 });
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

    console.error('Report creation error:', error);
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