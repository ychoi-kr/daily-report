import { NextRequest, NextResponse } from 'next/server';
import { JWTUtil, JWTPayload } from './jwt';
import { CookieUtil } from './cookies';

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code: string = 'AUTHENTICATION_ERROR'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * 認証が必要なAPIルートで使用するミドルウェア
 */
export async function requireAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // トークンを取得（Cookieまたは Authorization ヘッダーから）
    let token = CookieUtil.getAccessToken(request);

    // Cookieにない場合は Authorization ヘッダーをチェック
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_TOKEN_MISSING',
            message: '認証トークンが見つかりません',
          },
        },
        { status: 401 }
      );
    }

    const payload = JWTUtil.verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_TOKEN_INVALID',
            message: '無効な認証トークンです',
          },
        },
        { status: 401 }
      );
    }

    // リクエストにユーザー情報を追加
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = payload;

    return await handler(authenticatedRequest);
  } catch (error) {
    console.error('認証エラー:', error);

    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
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

/**
 * 管理者権限が必要なAPIルートで使用するミドルウェア
 */
export async function requireManager(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    if (!req.user.isManager) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'この操作を行う権限がありません',
          },
        },
        { status: 403 }
      );
    }

    return handler(req);
  });
}

/**
 * オプショナル認証（認証されていなくてもアクセス可能だが、認証されていればユーザー情報を追加）
 */
export async function optionalAuth(
  request: NextRequest,
  handler: (req: NextRequest & { user?: JWTPayload }) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // トークンを取得（Cookieまたは Authorization ヘッダーから）
    let token = CookieUtil.getAccessToken(request);

    // Cookieにない場合は Authorization ヘッダーをチェック
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const payload = JWTUtil.verifyAccessToken(token);
      if (payload) {
        (request as any).user = payload;
      }
    }

    return await handler(request as NextRequest & { user?: JWTPayload });
  } catch (error) {
    console.error('オプショナル認証エラー:', error);
    return await handler(request as NextRequest & { user?: JWTPayload });
  }
}

/**
 * ミドルウェアファクトリー：異なる認証レベルを簡単に適用できる
 */
export function createAuthMiddleware(
  authLevel: 'required' | 'manager' | 'optional' = 'required'
) {
  return (handler: (req: any) => Promise<NextResponse>) => {
    switch (authLevel) {
      case 'manager':
        return (request: NextRequest) => requireManager(request, handler);
      case 'optional':
        return (request: NextRequest) => optionalAuth(request, handler);
      case 'required':
      default:
        return (request: NextRequest) => requireAuth(request, handler);
    }
  };
}
