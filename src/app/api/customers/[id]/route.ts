import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { updateCustomerSchema } from '@/lib/validations/customer';
import type { ApiError } from '@/types/api';
import { verifyToken } from '@/lib/auth/verify';

const prisma = new PrismaClient();

/**
 * 顧客詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な顧客IDです',
        },
      };
      return NextResponse.json(apiError, { status: 400 });
    }

    // 顧客情報取得
    const customer = await prisma.customer.findUnique({
      where: { customerId },
    });

    if (!customer) {
      const apiError: ApiError = {
        error: {
          code: 'NOT_FOUND',
          message: '顧客が見つかりません',
        },
      };
      return NextResponse.json(apiError, { status: 404 });
    }

    // APIレスポンス形式に変換
    const transformedResponse = {
      id: customer.customerId,
      company_name: customer.companyName,
      contact_person: customer.contactPerson,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      created_at: customer.createdAt.toISOString(),
      updated_at: customer.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error('Error fetching customer:', error);

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
 * 顧客更新（管理者のみ）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な顧客IDです',
        },
      };
      return NextResponse.json(apiError, { status: 400 });
    }

    const body = await request.json();

    // リクエストボディのバリデーション
    const validatedData = updateCustomerSchema.parse(body);

    // 顧客の存在確認
    const existingCustomer = await prisma.customer.findUnique({
      where: { customerId },
    });

    if (!existingCustomer) {
      const apiError: ApiError = {
        error: {
          code: 'NOT_FOUND',
          message: '顧客が見つかりません',
        },
      };
      return NextResponse.json(apiError, { status: 404 });
    }

    // 更新データの構築
    const updateData: any = {};
    if (validatedData.company_name !== undefined) {
      updateData.companyName = validatedData.company_name;
    }
    if (validatedData.contact_person !== undefined) {
      updateData.contactPerson = validatedData.contact_person;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email;
    }
    if (validatedData.address !== undefined) {
      updateData.address = validatedData.address;
    }

    // 顧客情報更新
    const updatedCustomer = await prisma.customer.update({
      where: { customerId },
      data: updateData,
    });

    // APIレスポンス形式に変換
    const transformedResponse = {
      id: updatedCustomer.customerId,
      company_name: updatedCustomer.companyName,
      contact_person: updatedCustomer.contactPerson,
      phone: updatedCustomer.phone,
      email: updatedCustomer.email,
      address: updatedCustomer.address,
      created_at: updatedCustomer.createdAt.toISOString(),
      updated_at: updatedCustomer.updatedAt.toISOString(),
    };

    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error('Error updating customer:', error);

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

/**
 * 顧客削除（管理者のみ）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const customerId = parseInt(params.id);
    if (isNaN(customerId)) {
      const apiError: ApiError = {
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効な顧客IDです',
        },
      };
      return NextResponse.json(apiError, { status: 400 });
    }

    // 顧客の存在確認
    const existingCustomer = await prisma.customer.findUnique({
      where: { customerId },
    });

    if (!existingCustomer) {
      const apiError: ApiError = {
        error: {
          code: 'NOT_FOUND',
          message: '顧客が見つかりません',
        },
      };
      return NextResponse.json(apiError, { status: 404 });
    }

    // 訪問記録の参照チェック
    const visitRecordCount = await prisma.visitRecord.count({
      where: { customerId },
    });

    if (visitRecordCount > 0) {
      const apiError: ApiError = {
        error: {
          code: 'CONFLICT',
          message: 'この顧客は訪問記録で参照されているため削除できません',
          details: [
            {
              field: 'customer',
              message: `${visitRecordCount}件の訪問記録が存在します`,
            },
          ],
        },
      };
      return NextResponse.json(apiError, { status: 409 });
    }

    // 顧客削除
    await prisma.customer.delete({
      where: { customerId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting customer:', error);

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