import { NextRequest, NextResponse } from 'next/server';
import { CookieUtil } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  try {
    // 204 No Content レスポンスを作成（ボディなし）
    const response = new NextResponse(null, { status: 204 });

    // Cookieからトークンを削除
    CookieUtil.clearTokens(response);

    return response;
  } catch (error) {
    console.error('ログアウトエラー:', error);

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
