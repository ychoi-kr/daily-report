import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
  CustomerQuerySchema,
  CreateCustomerRequestSchema,
  type Customer,
  type CreateCustomerResponse,
} from '@/lib/schemas/customer';
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

// GET /api/customers - 顧客一覧取得
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
      search: searchParams.get('search') || undefined,
    };

    // バリデーション
    const validatedQuery = CustomerQuerySchema.parse(queryParams);

    // ダミーデータを返す（実際にはデータベースから取得）
    let dummyCustomers: Customer[] = [
      {
        id: 1,
        company_name: 'ABC商事',
        contact_person: '佐藤一郎',
        phone: '03-1234-5678',
        email: 'sato@abc.co.jp',
      },
      {
        id: 2,
        company_name: 'XYZ工業',
        contact_person: '鈴木二郎',
        phone: '06-2345-6789',
        email: 'suzuki@xyz.co.jp',
      },
      {
        id: 3,
        company_name: 'テック株式会社',
        contact_person: '田中三郎',
        phone: '045-3456-7890',
        email: 'tanaka@tech.co.jp',
      },
      {
        id: 4,
        company_name: 'グローバル商事',
        contact_person: '山田四郎',
        phone: '052-4567-8901',
        email: 'yamada@global.co.jp',
      },
      {
        id: 5,
        company_name: 'イノベーション工業',
        contact_person: '伊藤五郎',
        phone: '075-5678-9012',
        email: 'ito@innovation.co.jp',
      },
      {
        id: 6,
        company_name: 'フューチャーテック',
        contact_person: '高橋六郎',
        phone: '092-6789-0123',
        email: 'takahashi@future.co.jp',
      },
      {
        id: 7,
        company_name: 'ネクスト商社',
        contact_person: '渡辺七郎',
        phone: '011-7890-1234',
        email: 'watanabe@next.co.jp',
      },
      {
        id: 8,
        company_name: 'デジタルソリューション',
        contact_person: '小林八郎',
        phone: '082-8901-2345',
        email: 'kobayashi@digital.co.jp',
      },
      {
        id: 9,
        company_name: 'エンタープライズ株式会社',
        contact_person: '加藤九郎',
        phone: '022-9012-3456',
        email: 'kato@enterprise.co.jp',
      },
      {
        id: 10,
        company_name: 'クラウドシステム',
        contact_person: '吉田十郎',
        phone: '025-0123-4567',
        email: 'yoshida@cloud.co.jp',
      },
    ];

    // 検索フィルタリング
    if (validatedQuery.search) {
      const searchLower = validatedQuery.search.toLowerCase();
      dummyCustomers = dummyCustomers.filter(
        (customer) =>
          customer.company_name.toLowerCase().includes(searchLower) ||
          customer.contact_person.toLowerCase().includes(searchLower)
      );
    }

    // ページネーション情報を含めて返す
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedData = dummyCustomers.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        total: dummyCustomers.length,
        page,
        per_page: perPage,
        total_pages: Math.ceil(dummyCustomers.length / perPage),
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

    console.error('Customer fetch error:', error);
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

// POST /api/customers - 顧客作成（管理者のみ）
export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // リクエストのバリデーション
    const validatedData = CreateCustomerRequestSchema.parse(body);

    // 顧客を作成（実際にはデータベースに保存）
    const newCustomer: CreateCustomerResponse = {
      id: Math.floor(Math.random() * 1000) + 100,
      company_name: validatedData.company_name,
      contact_person: validatedData.contact_person,
      phone: validatedData.phone,
      email: validatedData.email,
      address: validatedData.address || '',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(newCustomer, { status: 201 });
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

    console.error('Customer creation error:', error);
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