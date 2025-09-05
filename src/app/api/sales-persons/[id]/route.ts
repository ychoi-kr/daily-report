import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { updateSalesPersonSchema } from '@/lib/validations/sales-person';
import type { ApiError, SalesPerson } from '@/types/api';

const prisma = new PrismaClient();

/**
 * 営業担当者詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid ID format',
        },
      };
      return NextResponse.json(apiError, { status: 400 });
    }

    const salesPerson = await prisma.salesPerson.findUnique({
      where: { salesPersonId: id },
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

    if (!salesPerson) {
      const apiError: ApiError = {
        error: {
          code: 'NOT_FOUND',
          message: '営業担当者が見つかりません',
        },
      };
      return NextResponse.json(apiError, { status: 404 });
    }

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

    return NextResponse.json(transformedResponse as SalesPerson);
  } catch (error) {
    console.error('Error fetching sales person:', error);

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
 * 営業担当者更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid ID format',
        },
      };
      return NextResponse.json(apiError, { status: 400 });
    }

    const body = await request.json();

    // リクエストボディのバリデーション
    const validatedData = updateSalesPersonSchema.parse(body);

    // 存在チェック
    const existingSalesPerson = await prisma.salesPerson.findUnique({
      where: { salesPersonId: id },
    });

    if (!existingSalesPerson) {
      const apiError: ApiError = {
        error: {
          code: 'NOT_FOUND',
          message: '営業担当者が見つかりません',
        },
      };
      return NextResponse.json(apiError, { status: 404 });
    }

    // メールアドレスの重複チェック（変更される場合）
    if (
      validatedData.email &&
      validatedData.email !== existingSalesPerson.email
    ) {
      const duplicateUser = await prisma.salesPerson.findUnique({
        where: { email: validatedData.email },
      });

      if (duplicateUser) {
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
    }

    // 更新データの準備
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined)
      updateData.email = validatedData.email;
    if (validatedData.department !== undefined)
      updateData.department = validatedData.department;
    if (validatedData.is_manager !== undefined)
      updateData.isManager = validatedData.is_manager;
    if (validatedData.is_active !== undefined)
      updateData.isActive = validatedData.is_active;

    // 営業担当者の更新
    const updatedSalesPerson = await prisma.salesPerson.update({
      where: { salesPersonId: id },
      data: updateData,
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
      id: updatedSalesPerson.salesPersonId,
      name: updatedSalesPerson.name,
      email: updatedSalesPerson.email,
      department: updatedSalesPerson.department,
      is_manager: updatedSalesPerson.isManager,
      is_active: updatedSalesPerson.isActive,
      created_at: updatedSalesPerson.createdAt.toISOString(),
      updated_at: updatedSalesPerson.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedResponse as SalesPerson);
  } catch (error) {
    console.error('Error updating sales person:', error);

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

/**
 * 営業担当者削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid ID format',
        },
      };
      return NextResponse.json(apiError, { status: 400 });
    }

    // 存在チェック
    const existingSalesPerson = await prisma.salesPerson.findUnique({
      where: { salesPersonId: id },
    });

    if (!existingSalesPerson) {
      const apiError: ApiError = {
        error: {
          code: 'NOT_FOUND',
          message: '営業担当者が見つかりません',
        },
      };
      return NextResponse.json(apiError, { status: 404 });
    }

    // 関連データの存在チェック（日報やコメントがある場合は論理削除）
    const hasReports = await prisma.dailyReport.findFirst({
      where: { salesPersonId: id },
    });

    const hasComments = await prisma.managerComment.findFirst({
      where: { managerId: id },
    });

    if (hasReports || hasComments) {
      // 関連データがある場合は論理削除（isActiveをfalseに設定）
      await prisma.salesPerson.update({
        where: { salesPersonId: id },
        data: { isActive: false },
      });
    } else {
      // 関連データがない場合は物理削除
      await prisma.salesPerson.delete({
        where: { salesPersonId: id },
      });
    }

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting sales person:', error);

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