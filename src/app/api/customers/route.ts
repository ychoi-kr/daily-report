import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import {
  createCustomerSchema,
  searchCustomerSchema,
} from '@/lib/validations/customer';
import type { ApiError, PaginatedResponse, Customer } from '@/types/api';
import { verifyToken } from '@/lib/auth/verify';

const prisma = new PrismaClient();

/**
 * 顧客一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await verifyToken(request);
    if (!user) {
      const apiError: ApiError = {
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: '認証が必要です',
        },
      };
      return NextResponse.json(apiError, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // クエリパラメータのバリデーション
    const validatedParams = searchCustomerSchema.parse({
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      per_page: searchParams.get('per_page')
        ? parseInt(searchParams.get('per_page')!)
        : 20,
    });

    // 検索条件の構築
    const where: any = {};

    if (validatedParams.search) {
      where.OR = [
        { companyName: { contains: validatedParams.search, mode: 'insensitive' } },
        { contactPerson: { contains: validatedParams.search, mode: 'insensitive' } },
      ];
    }

    // 総件数取得
    const total = await prisma.customer.count({ where });

    // ページネーション計算
    const offset = (validatedParams.page - 1) * validatedParams.per_page;
    const totalPages = Math.ceil(total / validatedParams.per_page);

    // データ取得
    const customers = await prisma.customer.findMany({
      where,
      skip: offset,
      take: validatedParams.per_page,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // APIレスポンス形式に変換
    const transformedData = customers.map((customer) => ({
      id: customer.customerId,
      company_name: customer.companyName,
      contact_person: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
    }));

    const response: PaginatedResponse<Customer> = {
      data: transformedData as Customer[],
      pagination: {
        total,
        page: validatedParams.page,
        per_page: validatedParams.per_page,
        total_pages: totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);

    if (error instanceof z.ZodError) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      };
      return NextResponse.json(apiError, { status: 400 });
    }

    const apiError: ApiError = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    };
    return NextResponse.json(apiError, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * 顧客作成（管理者のみ）
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await verifyToken(request);
    if (!user) {
      const apiError: ApiError = {
        error: {
          code: 'AUTH_UNAUTHORIZED',
          message: '認証が必要です',
        },
      };
      return NextResponse.json(apiError, { status: 401 });
    }

    // 管理者権限チェック
    if (!user.is_manager) {
      const apiError: ApiError = {
        error: {
          code: 'FORBIDDEN',
          message: 'この操作を行う権限がありません',
        },
      };
      return NextResponse.json(apiError, { status: 403 });
    }

    const body = await request.json();

    // リクエストボディのバリデーション
    const validatedData = createCustomerSchema.parse(body);

    // 顧客の作成
    const customer = await prisma.customer.create({
      data: {
        companyName: validatedData.company_name,
        contactPerson: validatedData.contact_person,
        phone: validatedData.phone,
        email: validatedData.email,
        address: validatedData.address || '',
      },
    });

    // APIレスポンス形式に変換
    const transformedResponse = {
      id: customer.customerId,
      company_name: customer.companyName,
      contact_person: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      created_at: customer.createdAt.toISOString(),
    };

    return NextResponse.json(transformedResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);

    if (error instanceof z.ZodError) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      };
      return NextResponse.json(apiError, { status: 400 });
    }

    const apiError: ApiError = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    };
    return NextResponse.json(apiError, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}