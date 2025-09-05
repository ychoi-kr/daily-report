import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  createSalesPersonSchema,
  searchSalesPersonSchema,
} from '@/lib/validations/sales-person';
import type { ApiError, PaginatedResponse, SalesPerson } from '@/types/api';

const prisma = new PrismaClient();

/**
 * 営業担当者一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータのバリデーション
    const validatedParams = searchSalesPersonSchema.parse({
      search: searchParams.get('search') || undefined,
      department: searchParams.get('department') || undefined,
      is_manager: searchParams.get('is_manager')
        ? searchParams.get('is_manager') === 'true'
        : undefined,
      is_active: searchParams.get('is_active')
        ? searchParams.get('is_active') === 'true'
        : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      per_page: searchParams.get('per_page')
        ? parseInt(searchParams.get('per_page')!)
        : 20,
    });

    // 検索条件の構築
    const where: any = {};

    if (validatedParams.search) {
      where.OR = [
        { name: { contains: validatedParams.search, mode: 'insensitive' } },
        { email: { contains: validatedParams.search, mode: 'insensitive' } },
        {
          department: { contains: validatedParams.search, mode: 'insensitive' },
        },
      ];
    }

    if (validatedParams.department) {
      where.department = {
        contains: validatedParams.department,
        mode: 'insensitive',
      };
    }

    if (validatedParams.is_manager !== undefined) {
      where.isManager = validatedParams.is_manager;
    }

    if (validatedParams.is_active !== undefined) {
      where.isActive = validatedParams.is_active;
    }

    // 総件数取得
    const total = await prisma.salesPerson.count({ where });

    // ページネーション計算
    const offset = (validatedParams.page - 1) * validatedParams.per_page;
    const totalPages = Math.ceil(total / validatedParams.per_page);

    // データ取得（パスワードは除外）
    const salesPersons = await prisma.salesPerson.findMany({
      where,
      skip: offset,
      take: validatedParams.per_page,
      select: {
        salesPersonId: true,
        name: true,
        email: true,
        department: true,
        isManager: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // APIレスポンス形式に変換
    const transformedData = salesPersons.map((person) => ({
      id: person.salesPersonId,
      name: person.name,
      email: person.email,
      department: person.department,
      is_manager: person.isManager,
      is_active: person.isActive,
      created_at: person.createdAt.toISOString(),
      updated_at: person.updatedAt.toISOString(),
    }));

    const response: PaginatedResponse<SalesPerson> = {
      data: transformedData as SalesPerson[],
      pagination: {
        total,
        page: validatedParams.page,
        per_page: validatedParams.per_page,
        total_pages: totalPages,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sales persons:', error);

    if (error instanceof z.ZodError) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors.map((e) => ({
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
 * 営業担当者作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // リクエストボディのバリデーション
    const validatedData = createSalesPersonSchema.parse(body);

    // メールアドレスの重複チェック
    const existingUser = await prisma.salesPerson.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      const apiError: ApiError = {
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'このメールアドレスは既に使用されています',
          details: [
            {
              field: 'email',
              message: 'このメールアドレスは既に使用されています',
            },
          ],
        },
      };
      return NextResponse.json(apiError, { status: 409 });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // 営業担当者の作成
    const salesPerson = await prisma.salesPerson.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        department: validatedData.department,
        isManager: validatedData.is_manager,
        isActive: validatedData.is_active,
      },
      select: {
        salesPersonId: true,
        name: true,
        email: true,
        department: true,
        isManager: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // APIレスポンス形式に変換
    const transformedResponse = {
      id: salesPerson.salesPersonId,
      name: salesPerson.name,
      email: salesPerson.email,
      department: salesPerson.department,
      is_manager: salesPerson.isManager,
      is_active: salesPerson.isActive,
      created_at: salesPerson.createdAt.toISOString(),
      updated_at: salesPerson.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating sales person:', error);

    if (error instanceof z.ZodError) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors.map((e) => ({
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