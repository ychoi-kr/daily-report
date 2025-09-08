import { NextRequest } from 'next/server';
import { JWTUtil } from './jwt';
import { cookies } from 'next/headers';

export interface AuthUser {
  id: number;
  email: string;
  is_manager: boolean;
}

/**
 * リクエストからトークンを検証してユーザー情報を取得
 */
export async function verifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Cookieからトークンを取得
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    // Authorizationヘッダーからトークンを取得（Bearer token形式）
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    // トークンがない場合
    const token = authToken || bearerToken;
    if (!token) {
      return null;
    }

    // トークンを検証
    const payload = JWTUtil.verifyAccessToken(token);
    if (!payload) {
      return null;
    }

    // ユーザー情報を返す
    return {
      id: payload.userId,
      email: payload.email,
      is_manager: payload.isManager,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}