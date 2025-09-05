import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import type { ApiError } from '@/types/api';

const prisma = new PrismaClient();

// パスワードリセット用のスキーマ
const resetPasswordApiSchema = z.object({
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以内で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
      'パスワードは大文字・小文字・数字を含む必要があります'
    ),
});

/**
 * 営業担当者のパスワードリセット
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const salesPersonId = parseInt(params.id);

    if (isNaN(salesPersonId)) {
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
    const validatedData = resetPasswordApiSchema.parse(body);

    // 存在チェック
    const existingSalesPerson = await prisma.salesPerson.findUnique({
      where: { salesPersonId },
      select: {
        salesPersonId: true,
        name: true,
        email: true,
        isActive: true,
      },
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

    // アクティブなアカウントかチェック
    if (!existingSalesPerson.isActive) {
      const apiError: ApiError = {
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: '無効なアカウントのパスワードはリセットできません',
        },
      };
      return NextResponse.json(apiError, { status: 403 });
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // パスワードの更新
    await prisma.salesPerson.update({
      where: { salesPersonId },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    // レスポンス（パスワードは含まない）
    return NextResponse.json({
      message: 'パスワードをリセットしました',
      user: {
        id: existingSalesPerson.salesPersonId,
        name: existingSalesPerson.name,
        email: existingSalesPerson.email,
      },
    });
  } catch (error) {
    console.error('Error resetting password:', error);

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